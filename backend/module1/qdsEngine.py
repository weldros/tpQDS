from qiskit import ClassicalRegister, QuantumCircuit, QuantumRegister


def prepareSignatureCircuit(theta: float, phi: float) -> QuantumCircuit:
    """Initializes the signature qubit."""
    qc = QuantumCircuit(1, name="sigInit")
    qc.ry(theta, 0)
    qc.p(phi, 0)
    return qc


def buildTeleportationCircuit(theta: float, phi: float) -> QuantumCircuit:
    """Builds the pinned 6-step teleportation circuit."""
    msg = QuantumRegister(1, "this is a big ass message that is stupid")
    alice = QuantumRegister(1, "alice")
    bob = QuantumRegister(1, "bob")
    crz = ClassicalRegister(1, "crz")
    crx = ClassicalRegister(1, "crx")

    qc = QuantumCircuit(msg, alice, bob, crz, crx)

    # --- Signature initialization ---
    qc.ry(theta, msg[0])
    qc.p(phi, msg[0])
    qc.barrier()

    # --- Step 1+2: Entanglement Generation ---
    qc.h(alice[0])
    qc.cx(alice[0], bob[0])
    qc.barrier() #acts as a barrier between different gates, otherwise sometimes, qiskit merges 2 angle measurements into one

    # --- Step 3+4: Teleportation Process ---
    qc.cx(msg[0], alice[0])
    qc.h(msg[0])
    qc.barrier()

    # --- Step 5: Projective Measurement ---
    qc.measure(msg[0], crz[0])
    qc.measure(alice[0], crx[0])
    qc.barrier()

    # --- Step 6: Correction (classically conditioned) ---
    with qc.if_test((crx, 1)):
        qc.x(bob[0])
    with qc.if_test((crz, 1)):
        qc.z(bob[0])

    return qc


def buildVerificationCircuit(basis: str) -> QuantumCircuit:
    """Builds Bob's post-teleportation measurement circuit."""
    qc = QuantumCircuit(1, 1, name="verify")
    if basis == "X":
        qc.h(0)
    qc.measure(0, 0)
    return qc


def runSignature(message: bytes, shots: int, execute_attack: bool = False, attack_type: str = None) -> dict:
    """
    Orchestrates generation, teleportation, and verification across all chunks.
    Will run AerSimulator().run(transpile(qc, backend), shots=shots).
    """
    # [STEP 1: Hashing & Chunking]
    # - Compute a secure hash (e.g., SHA-256) of the incoming file/message bytes.
    # - Split the resulting hash bits into logical chunks.
    
    # [STEP 2: Angle Mapping]
    # - For each chunk, map the bit sequence to precise theta and phi rotation angles.
    # - These angles define the unique quantum signature state for this file.
    
    # [STEP 3: Teleportation Loop]
    # - Loop over each mapped angle pair (theta, phi).
    # - For each pair, call `buildTeleportationCircuit(theta, phi)`.
    # - Execute the circuit using AerSimulator to generate the classical correction bits (crz, crx).
    
    # [STEP 4: Aggregation]
    # - Collect all resulting classical correction bits across all loops.
    # - Package these bits alongside the classical file/message payload to be sent to Bob.
    # - Bob will later use these correction bits to deterministically verify the signature via Module 3.
    
    import random
    
    # --- TEMPORARY MOCK LOGIC FOR API INTEGRATION ---
    if execute_attack:
        return {
            "qber": 100.0,
            "fidelity": 0.0,
            "verdict": "REJECT",
            "status": "HALTED_BY_EVE",
            "attack_type": attack_type
        }
        
    mock_qber = random.uniform(0.0, 5.0)
    return {
        "qber": mock_qber,
        "fidelity": 100 - (mock_qber * 2),
        "verdict": "ACCEPT",
        "status": "SUCCESS"
    }

if __name__ == "__main__":
    import math
    from qiskit_aer import AerSimulator
    
    print("Testing Signature Teleportation Circuit...")
    theta, phi = math.pi/4, 3*math.pi/4
    qcTeleport = buildTeleportationCircuit(theta, phi)
    sim = AerSimulator()
    result = sim.run(qcTeleport, shots=1).result()
    print(f"Teleportation measurement outcomes: {result.get_counts()}")
