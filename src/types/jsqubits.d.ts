declare module "jsqubits" {
    interface QuantumState {
        hadamard(qubit: number): QuantumState;
        measure(qubit: number): { result: number; newState: QuantumState };
    }

    export default function jsqubits(state: string): QuantumState;
}
