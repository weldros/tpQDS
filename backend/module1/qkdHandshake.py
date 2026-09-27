import numpy as np
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator


def runQkdHandshake(nQubits: int, threshold: float = 0.11) -> bytes | None:
    """
    Executes a direct BB84 exchange between Alice and Bob to produce a shared secret.
    Returns the shared secret as bytes on success, or None if QBER exceeds the threshold.
    """
    # 1. Alice prepares random bits and bases
    aliceBits = np.random.randint(2, size=nQubits)
    aliceBases = np.random.choice(["Z", "X"], size=nQubits)

    # 2. Bob randomly chooses measurement bases
    bobBases = np.random.choice(["Z", "X"], size=nQubits)

    simulator = AerSimulator()
    bobResults = []

    for i in range(nQubits):
        qc = QuantumCircuit(1, 1)
        # Alice encodes
        if aliceBits[i] == 1:
            qc.x(0)
        if aliceBases[i] == "X":
            qc.h(0)

        # Bob measures
        if bobBases[i] == "X":
            qc.h(0)
        qc.measure(0, 0)

        result = simulator.run(qc, shots=1).result()
        counts = result.get_counts()
        bobResults.append(int(list(counts.keys())[0]))

    # 3. Basis reconciliation
    matchedIndices = [i for i in range(nQubits) if aliceBases[i] == bobBases[i]]

    # 4. QBER estimation
    np.random.shuffle(matchedIndices)
    split = len(matchedIndices) // 2
    testIndices = matchedIndices[:split]
    secretIndices = matchedIndices[split:]

    mismatches = sum(1 for i in testIndices if aliceBits[i] != bobResults[i])
    qber = mismatches / max(1, len(testIndices))

    # 5. Accept or abort
    if qber > threshold:
        return None

    # Derive and return the shared secret
    sharedSecretBits = [str(aliceBits[i]) for i in secretIndices]
    sharedSecretInt = int("".join(sharedSecretBits), 2) if sharedSecretBits else 0
    return sharedSecretInt.to_bytes((len(sharedSecretBits) + 7) // 8, byteorder="big")


if __name__ == "__main__":
    print("Running QKD Handshake (BB84)...")
    secret = runQkdHandshake(nQubits=16)
    if secret:
        print(f"Success! Shared Secret: {secret.hex()}")
    else:
        print("Aborted! QBER exceeded threshold.")
