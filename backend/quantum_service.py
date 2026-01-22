import os
import threading
import time
import queue
from typing import List, Optional
from qiskit import QuantumCircuit, transpile
from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2 as Sampler
from dotenv import load_dotenv

load_dotenv()

class QuantumEntropyService:
    def __init__(self):
        self.token = os.getenv("token")
        self.use_simulator = os.getenv("USE_SIMULATOR", "false").lower() == "true"
        self.backend_name = os.getenv("IBM_BACKEND", "ibm_fez")
        self.batch_size = 32
        self.threshold = 10
        self.entropy_queue = queue.Queue()
        self.is_refilling = False
        self.lock = threading.Lock()
        
        try:
            self.service = QiskitRuntimeService(channel="ibm_quantum_platform", token=self.token)
            self.backend = self.service.backend(self.backend_name if not self.use_simulator else "ibmq_qasm_simulator")
            
            # Pre-warm the queue immediately on startup
            print("Pre-warming entropy queue...")
            threading.Thread(target=self._refill_queue, daemon=True).start()
        except Exception as e:
            print(f"Error initializing Qiskit: {e}")
            self.use_simulator = True
            print("Falling back to local simulation logic or simulator backend if possible.")

    def get_spin(self) -> dict:
        # 1. Trigger refill in background if below threshold
        if self.entropy_queue.qsize() < self.threshold and not self.is_refilling:
            threading.Thread(target=self._refill_queue, daemon=True).start()
            
        # 2. Try to get from queue
        try:
            return self.entropy_queue.get_nowait()
        except queue.Empty:
            # Cold start or hardware delay fallback
            print("Queue empty, providing simulator fallback for this spin.")
            import random
            val = random.randint(0, 36)
            return {
                "bitstring": bin(val)[2:].zfill(6),
                "value": val,
                "source": "simulator-fallback",
                "jobId": "simulated-fallback-job"
            }

    def _refill_queue(self):
        with self.lock:
            if self.is_refilling:
                return
            self.is_refilling = True
        
        try:
            print(f"Refilling entropy queue (target: {self.batch_size} shots)...")
            qc = QuantumCircuit(6)
            qc.h(range(6))
            qc.measure_all()
            
            # Hardware execution
            isa_circuit = transpile(qc, backend=self.backend)
            sampler = Sampler(mode=self.backend)
            job = sampler.run([(isa_circuit, None, self.batch_size)])
            current_job_id = job.job_id() # Capture ID
            result = job.result()
            
            counts = result[0].data.meas.get_counts()
            
            valid_count = 0
            for bitstring, count in counts.items():
                decimal = int(bitstring, 2)
                if decimal <= 36:
                    for _ in range(count):
                        self.entropy_queue.put({
                            "bitstring": bitstring,
                            "value": decimal,
                            "source": "hardware" if not self.use_simulator else "simulator",
                            "jobId": current_job_id 
                        })
                        valid_count += 1
            
            print(f"Refill complete. Added {valid_count} valid numbers.")
            
        except Exception as e:
            print(f"Refill failed: {e}")
        finally:
            with self.lock:
                self.is_refilling = False

quantum_service = QuantumEntropyService()
