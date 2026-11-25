# 🎰 Quantum Roulette V2

A high-fidelity, retro-neon Casino Roulette game powered by **Quantum Circuit Simulation**.

## 🌌 The Quantum Core
Unlike traditional games that use pseudo-random number generators (PRNG), this application utilizes a **6-qubit quantum circuit** to determine the winning number.

- **Engine**: Powered by `jsqubits`.
- **Fairness Protocol**: The circuit generates $2^6$ (64) possible states from $|000000\rangle$ to $|111111\rangle$. Since roulette only has 37 numbers (0-36), we use **Rejection Sampling**. If the collapsed state is $> 36$, it is instantly rejected and the circuit re-simulates. 
- **Transparency**: Every spin displays the measured bitstring and the number of rejection attempts required to reach a fair outcome.

## 🚀 Features
- **Comprehensive Betting**: Supports Straight numbers, Outside bets (Red/Black, Even/Odd, Dozens), and **Column (2:1)** bets.
- **Dynamic Highlighting**: Visual feedback on the board when hovering over outside bets.
- **Session History**: A session log of the last 500 outcomes with color-coding.
- **Cyberpunk UI**: Built with a sleek neon aesthetic using **Orbitron** typography and TailwindCSS v4.
- **Mobile Optimized**: Responsive design with horizontal scrolling for the betting board and touch-friendly chip selectors.
- **Audio Experience**: Synthesized retro sound effects for spins, wins, and chip placement.

## 🛠 Tech Stack
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **State Management**: Custom React Hooks (`useGameEngine`, `useQuantumSpin`)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Quantum Logic**: `jsqubits` (Local) & `qiskit-ibm-runtime` (Hardware Bridge research)
- **Icons**: Lucide React

## 🚥 Getting Started

### Prerequisites
- Node.js 20+
- npm

### Installation
```bash
npm install
```

### Development
Start the development server:
```bash
npm run dev
```

### Network Access (Mobile Testing)
The dev server is configured to listen on `0.0.0.0`. To test on a mobile device on the same Wi-Fi:
1. Find your LAN IP (e.g., `192.168.x.x`).
2. Visit `http://<YOUR_IP>:3000`.
## Hardware access

Run the API with the project’s Python dependencies installed:

    python -m uvicorn backend.main:app --host 127.0.0.1 --port 8100

Set the server-side variables using your service manager or shell:

- `IBM_QUANTUM_API_KEY` authenticates to IBM. The app looks for an Open plan instance by default.
- `IBM_QUANTUM_INSTANCE` optionally selects a specific instance by CRN.
- `QUANTUM_ACCESS_CODE` is the separate password players enter when using Hardware mode.

The browser sends an authenticated spin request to the same site. IBM results are served in shot order. While a batch is pending, locally generated results are labeled as fallback spins.

The Pi deployment uses a separate frontend and API service with a root-owned release. Rebuild from a Git archive with `deploy/pi-hole/install.sh`. The installer keeps existing IBM settings and rolls back the services if the new release fails its HTTP checks.

    npm test
    npm run lint
    python -m unittest discover -s tests -p 'test_*.py'

`python -m backend.check_credentials` verifies IBM access without submitting a job. Running `hardware_spin_test.py` explicitly submits one shot.

## 📁 Project Structure
- `/src/lib/quantum`: Core logic for the quantum simulator.
- `/src/hooks`: Game state orchestration and audio management.
- `/src/components/betting`: The interactive roulette board components.
- `/src/components`: Reusable UI elements like the Wheel and Circuit Simulator.

---
*Developed with a focus on Quantum Fairness and Visual Excellence.*
