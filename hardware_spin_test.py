"""Explicitly submit one IBM Quantum shot for an operator smoke test."""

from qiskit import QuantumCircuit, transpile
from qiskit_ibm_runtime import SamplerV2

from backend.quantum_service import connect_backend


def main():
    backend = connect_backend()
    circuit = QuantumCircuit(6)
    circuit.h(range(6))
    circuit.measure_all()
    isa_circuit = transpile(circuit, backend=backend, optimization_level=1, num_processes=1)
    job = SamplerV2(mode=backend).run([isa_circuit], shots=1)
    print(f"Submitted {job.job_id()} on {backend.name}")
    bitstring = job.result(timeout=120)[0].data.meas.get_bitstrings()[0]
    value = int(bitstring, 2)
    print(f"{bitstring}: {value}" if value <= 36 else f"{bitstring}: rejected")


if __name__ == "__main__":
    main()
