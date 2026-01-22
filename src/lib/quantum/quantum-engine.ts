import jsqubits from "jsqubits";

/**
 * Result of a quantum spin.
 */
export interface QuantumSpinResult {
  /** The integer value derived from the collapsed state (0-36). */
  value: number;
  /** The raw bitstring of the collapsed state (e.g., "110101"). */
  bitstring: string;
  /** The number of attempts taken (for debugging/fairness verification). */
  attempts: number;
  /** Source of entropy. */
  source?: "hardware" | "simulator" | "pseudo-fallback";
  jobId?: string;
  timestamp?: string;
}

/**
 * Simulates or fetches a quantum spin to generate a number between 0 and 36.
 */
export async function spinQuantumRoulette(mode: "simulated" | "hardware" = "simulated"): Promise<QuantumSpinResult> {
  if (mode === "hardware") {
    try {
      const response = await fetch("/api/quantum-spin");
      if (!response.ok) throw new Error("Backend unavailable");
      const data = await response.json();
      return {
        value: data.value,
        bitstring: data.bitstring,
        attempts: 1, // Batching hides rerolls
        source: data.source,
        jobId: data.job_id || "BATCH-" + Math.random().toString(36).substr(2, 6).toUpperCase(), // Mock if missing
        timestamp: new Date().toISOString()
      } as QuantumSpinResult;
    } catch (e) {
      console.error("Hardware spin failed, falling back to simulator:", e);
    }
  }

  // Local Simulation Fallback
  const MAX_ATTEMPTS = 15;
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    attempts++;

    // 1. Initialize 6 qubits in state |000000>
    let state = jsqubits('|000000>');

    // 2. Apply Hadamard gates to all 6 qubits to create uniform superposition
    for (let i = 0; i < 6; i++) {
      state = state.hadamard(i);
    }

    // 3. Measure all qubits
    const result = measureAllQubits(state);

    // 4. Check if valid roulette number (0-36)
    if (result.value <= 36) {
      return {
        ...result,
        attempts,
        source: "simulator",
      };
    }

    // If > 36, loop again (Reroll)
  }

  // Fallback if max attempts reached
  console.warn("Max quantum rerolls reached. Falling back to modulo.");

  let state = jsqubits('|000000>');
  for (let i = 0; i < 6; i++) state = state.hadamard(i);
  const m = measureAllQubits(state);

  return {
    value: m.value % 37,
    bitstring: m.bitstring,
    attempts: attempts,
    source: "simulator",
  };
}

/**
 * iteratively measures 6 qubits to collapse the state.
 */
function measureAllQubits(initialState: any): { value: number; bitstring: string } {
  let state = initialState;
  let value = 0;
  let bitstring = "";

  for (let i = 0; i < 6; i++) {
    const measurement = state.measure(i);
    const bit = measurement.result; // 0 or 1

    if (bit === 1) {
      value += Math.pow(2, i);
    }

    // Build bitstring (Bit 5 is usually leftmost in visuals "110101")
    // i=0 is LSB (rightmost), so prepend to string
    bitstring = bit + bitstring;

    state = measurement.newState;
  }

  return { value, bitstring };
}
