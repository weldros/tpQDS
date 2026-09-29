# Quantum-Inspired Cyber Threat Detection Framework (tpQKD)

A deterministic, quantum-teleportation-based digital signature framework designed to authenticate communications and detect active cyber threats without relying on Artificial Intelligence or Machine Learning models. 

## Overview
This framework simulates a Quantum Digital Signature (QDS) protocol running over a noisy, adversarial quantum network. It consists of three primary modules:
1. **Module 1 (Cryptographic Engine):** Implements the BB84 QKD handshake and the quantum teleportation of deterministic signature wavefunctions using IBM's Qiskit. 
2. **Module 2 (Physical Network Topology):** A QuNetSim-based physical layer simulation that introduces authentic hardware decoherence (T1/T2 relaxation, depolarizing channels) and houses the "Red Team" adversary capable of 4 distinct attack vectors (Forgery, Impersonation, Replay, Intercept-Resend).
3. **Module 3 (Statistical Detection Engine):** A rigorous, closed-form statistical engine utilizing Hoeffding concentration bounds and exact binomial tail probabilities to separate environmental noise from malicious tampering with cryptographic certainty.

## Architecture
- **Backend:** Python, FastAPI, IBM Qiskit, QuNetSim, SciPy (for statistical bounds)
- **Frontend:** React, Tailwind CSS, Vite, WebSocket (for live telemetry)
- **Database:** SQLite (local artifact storage)

## Prerequisites
- Node.js (v18+)
- Python (3.10+)

## Quick Start
You can launch both the backend simulation engine and the frontend React dashboard simultaneously using the provided startup script.

```bash
chmod +x start.sh
./start.sh
```

This script will automatically:
1. Create a Python virtual environment and install backend dependencies.
2. Install frontend `npm` dependencies.
3. Boot the FastAPI backend server on port `8000`.
4. Boot the Vite frontend server on port `5173`.
