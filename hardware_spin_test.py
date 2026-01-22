from qiskit import QuantumCircuit, transpile
from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2 as Sampler

service = QiskitRuntimeService(
    channel="ibm_quantum_platform"
)

backend_name = "ibm_fez" 
print(f"Getting backend: {backend_name}")
backend = service.backend(backend_name)

qc = QuantumCircuit(6)
qc.h(range(6))
qc.measure_all()

print("Transpiling circuit for backend...")
isa_circuit = transpile(qc, backend=backend)

print("Submitting job...")

sampler = Sampler(mode=backend)
job = sampler.run([(isa_circuit, None, 1)]) 

print(f"Job ID: {job.job_id()}")
print("Waiting for result...")
result = job.result()

counts = result[0].data.meas.get_counts()
bitstring = list(counts.keys())[0]

print("Raw counts:", counts)
bitstring = list(counts.keys())[0]

decimal = int(bitstring, 2)

print("Raw quantum bits:", bitstring)
print("Decimal value:", decimal)

if decimal <= 36:
    print("Roulette number:", decimal)
else:
    print("Rejected (>36), reroll needed")
