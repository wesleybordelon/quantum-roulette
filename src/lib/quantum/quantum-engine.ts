import jsqubits from "jsqubits";

export type SpinMode = "simulated" | "hardware";
export type SpinSource = "hardware" | "simulator" | "pseudo-fallback";

export interface QuantumSpinResult {
    value: number;
    bitstring: string;
    attempts?: number;
    source: SpinSource;
    jobId?: string;
}

export const SOURCE_LABELS: Record<SpinSource, string> = {
    hardware: "IBM Quantum hardware",
    simulator: "Local simulation",
    "pseudo-fallback": "Local fallback",
};

function measureCircuit(): string {
    let state = jsqubits("|000000>");
    for (let qubit = 0; qubit < 6; qubit++) state = state.hadamard(qubit);

    let bits = "";
    for (let qubit = 0; qubit < 6; qubit++) {
        const measurement = state.measure(qubit);
        bits = measurement.result + bits;
        state = measurement.newState;
    }
    return bits;
}

export function samplePocket(measure = measureCircuit): QuantumSpinResult {
    for (let attempts = 1; ; attempts++) {
        const bitstring = measure();
        const value = Number.parseInt(bitstring, 2);
        if (value <= 36) return { value, bitstring, attempts, source: "simulator" };
    }
}

function decodeHardwareResult(data: unknown): QuantumSpinResult {
    if (!data || typeof data !== "object") throw new Error("Invalid quantum response");
    const { value, bitstring, source, jobId } = data as Record<string, unknown>;
    if (
        typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 36
        || typeof bitstring !== "string" || !/^[01]{6}$/.test(bitstring)
        || Number.parseInt(bitstring, 2) !== value
    ) {
        throw new Error("Invalid quantum response");
    }
    if (source === "hardware" && typeof jobId === "string" && jobId.length > 0) {
        return { value, bitstring, source, jobId };
    }
    if (source === "pseudo-fallback") return { value, bitstring, source };
    throw new Error("Quantum response did not identify its source");
}

export async function spinQuantumRoulette(
    mode: SpinMode = "simulated",
    accessCode = "",
): Promise<QuantumSpinResult> {
    if (mode === "simulated") return samplePocket();

    try {
        const response = await fetch("/api/quantum-spin", {
            method: "POST",
            headers: { "X-Quantum-Access": accessCode },
            cache: "no-store",
            signal: AbortSignal.timeout(6000),
        });
        if (response.status === 401) throw new Error("Check your hardware access code.");
        if (!response.ok) throw new Error("Hardware access is unavailable. Try again or switch to simulation.");
        return decodeHardwareResult(await response.json());
    } catch (error) {
        if (error instanceof Error && error.name === "TimeoutError") {
            throw new Error("Hardware access timed out. Try again or switch to simulation.");
        }
        throw error;
    }
}
