import logging
import os
import queue
import threading
import time
from secrets import randbelow

from qiskit import QuantumCircuit, transpile
from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2

log = logging.getLogger("uvicorn.error")
BATCH_SIZE = 32
LOW_WATER_MARK = 10
RETRY_SECONDS = 60
RESULT_TIMEOUT = 120


def connect_backend():
    api_key = os.environ["IBM_QUANTUM_API_KEY"]
    instance = os.environ.get("IBM_QUANTUM_INSTANCE") or None
    options = {"token": api_key, "instance": instance, "channel": "ibm_quantum_platform"}
    if instance is None:
        options["plans_preference"] = ["open"]
    service = QiskitRuntimeService(**options)
    backend_name = os.environ.get("IBM_QUANTUM_BACKEND")
    if backend_name:
        backend = service.backend(backend_name)
        if backend.num_qubits < 6 or backend.configuration().simulator:
            raise ValueError("The selected backend must be a hardware device with six qubits")
        return backend
    return service.least_busy(min_num_qubits=6, operational=True, simulator=False)


class QuantumEntropyService:
    def __init__(self):
        self.configured = bool(os.environ.get("IBM_QUANTUM_API_KEY"))
        self.backend = None
        self.spins = queue.Queue()
        self.lock = threading.Lock()
        self.connecting = False
        self.refilling = False
        self.next_connect_at = 0
        self.next_refill_at = 0
        self.pending_job = None

    def ensure_connection(self):
        with self.lock:
            if not self.configured or self.backend is not None or self.connecting:
                return
            if time.monotonic() < self.next_connect_at:
                return
            self.connecting = True
        threading.Thread(target=self._connect, daemon=True).start()

    def _connect(self):
        try:
            self.backend = connect_backend()
            log.info("IBM Quantum backend selected: %s", self.backend.name)
        except Exception as error:
            log.warning("IBM Quantum backend unavailable (%s)", type(error).__name__)
        finally:
            with self.lock:
                self.next_connect_at = time.monotonic() + RETRY_SECONDS
                self.connecting = False

    def get_spin(self):
        self.ensure_connection()
        try:
            spin = self.spins.get_nowait()
        except queue.Empty:
            value = randbelow(37)
            spin = {"value": value, "bitstring": f"{value:06b}", "source": "pseudo-fallback"}

        with self.lock:
            should_refill = (
                self.backend is not None
                and self.spins.qsize() < LOW_WATER_MARK
                and not self.refilling
                and time.monotonic() >= self.next_refill_at
            )
            if should_refill:
                self.refilling = True
        if should_refill:
            threading.Thread(target=self._refill, daemon=True).start()
        return spin

    def _refill(self):
        try:
            if self.pending_job is None:
                circuit = QuantumCircuit(6)
                circuit.h(range(6))
                circuit.measure_all()
                isa_circuit = transpile(circuit, backend=self.backend, optimization_level=1, num_processes=1)
                self.pending_job = SamplerV2(mode=self.backend).run([isa_circuit], shots=BATCH_SIZE)
                log.info("Submitted IBM Quantum job %s", self.pending_job.job_id())

            job = self.pending_job
            bitstrings = job.result(timeout=RESULT_TIMEOUT)[0].data.meas.get_bitstrings()
            self.pending_job = None
            for bitstring in bitstrings:
                value = int(bitstring, 2)
                if value <= 36:
                    self.spins.put({
                        "value": value,
                        "bitstring": bitstring,
                        "source": "hardware",
                        "jobId": job.job_id(),
                    })
        except Exception as error:
            log.warning("IBM Quantum batch unavailable (%s)", type(error).__name__)
            self._recover_job()
        finally:
            with self.lock:
                self.next_refill_at = time.monotonic() + RETRY_SECONDS
                self.refilling = False

    def _recover_job(self):
        if self.pending_job is not None:
            try:
                if not self.pending_job.in_final_state():
                    return
            except Exception:
                # Keep retrying the existing job if its state could not be confirmed.
                return
        self.pending_job = None
        with self.lock:
            self.backend = None
            self.next_connect_at = time.monotonic() + RETRY_SECONDS
