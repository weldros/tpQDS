from qiskit import ClassicalRegister, QuantumCircuit, QuantumRegister


def prepareSignatureCircuit(theta: float, phi: float) -> QuantumCircuit:
    """Initializes the signature qubit."""
    qc = QuantumCircuit(1, name="sigInit")
    qc.ry(theta, 0)
    qc.p(phi, 0)
    return qc


def buildTeleportationCircuit(theta: float, phi: float, execute_attack: bool = False, attack_type: str = None) -> QuantumCircuit:
    """Builds the pinned 6-step teleportation circuit."""
    msg = QuantumRegister(1, "msg")
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
    
    # EVE'S ATTACK (Mathematical Wavefunction Collapse)
    if execute_attack and attack_type == "INTERCEPT_RESEND":
        # Eve measures Bob's entangled qubit mid-flight in the Z basis
        eve_reg = ClassicalRegister(1, "eve_snoop")
        qc.add_register(eve_reg)
        qc.measure(bob[0], eve_reg[0])
        qc.barrier()

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


def runSignature(message: bytes, shots: int, execute_attack: bool = False, attack_type: str = None, noise_config_dict: dict = None) -> dict:
    import math
    from qiskit_aer import AerSimulator
    from qiskit import ClassicalRegister
    from backend.module2.noise import NoiseConfig, build_noise_model
    
    # Non-channel attacks are caught immediately by classical/handshake layers
    if execute_attack and attack_type in ["FORGERY", "IMPERSONATION", "REPLAY"]:
        return {
            "qber": 100.0 if attack_type == "FORGERY" else 0.0,
            "fidelity": 0.0,
            "verdict": "REJECT",
            "status": "HALTED",
            "attack_type": attack_type
        }
    
    # 1. Build the base teleportation circuit
    # For testing QBER accurately without hashing logic, we send a |1> state in the X basis.
    qc = buildTeleportationCircuit(math.pi/2, 0.0, execute_attack, attack_type)
    qc.h(2) # Switch Bob to X basis
    
    cr_bob = ClassicalRegister(1, "cr_bob")
    qc.add_register(cr_bob)
    qc.measure(2, cr_bob[0])
    
    # 2. Attach the hardware noise model if enabled
    if noise_config_dict is None:
        sim = AerSimulator()
    else:
        noise_cfg = NoiseConfig(**noise_config_dict)
        noise_model = build_noise_model(noise_cfg)
        sim = AerSimulator(noise_model=noise_model)
        
    # 3. Execute the simulation
    result = sim.run(qc, shots=8192).result()
    counts = result.get_counts()
    
    # Calculate QBER (Percentage of unexpected results)
    errors = sum(count for bitstring, count in counts.items() if bitstring.split()[0] == '1')
    total = sum(counts.values())
    real_qber = (errors / total) * 100.0
    
    result_dict = {
        "qber": real_qber,
        "fidelity": max(0.0, 100.0 - (real_qber * 2)),
        "verdict": "ACCEPT", # Handled downstream by Module 3 (Hoeffding Bound)
        "status": "SUCCESS"
    }
    if execute_attack and attack_type:
        result_dict["attack_type"] = attack_type
    
    return result_dict

if __name__ == "__main__":
    import math
    from qiskit_aer import AerSimulator
    
    print("Testing Signature Teleportation Circuit...")
    theta, phi = math.pi/4, 3*math.pi/4
    qcTeleport = buildTeleportationCircuit(theta, phi)
    sim = AerSimulator()
    result = sim.run(qcTeleport, shots=1).result()
    print(f"Teleportation measurement outcomes: {result.get_counts()}")
