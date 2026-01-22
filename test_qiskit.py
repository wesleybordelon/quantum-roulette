# from qiskit_ibm_runtime import QiskitRuntimeService

# service = QiskitRuntimeService()
# print(service.backends())

from qiskit_ibm_runtime import QiskitRuntimeService

print("Starting Qiskit test...")

service = QiskitRuntimeService()

print("Service initialized successfully")

backends = service.backends()

print("Available backends:")
for backend in backends:
    print("-", backend.name)
