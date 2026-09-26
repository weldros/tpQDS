import math
from qiskit_aer import AerSimulator
from tpQDS.module1.qkdHandshake import runQkdHandshake
from tpQDS.module1.qdsEngine import buildTeleportationCircuit

def main():
    print("=== QDS Protocol (Module 1) Execution ===")
    
    # 1. Run QKD Handshake
    print("\n[Phase 1] Running QKD Handshake (BB84)...")
    # Using 16 qubits for demonstration
    secret = runQkdHandshake(nQubits=16, threshold=0.11)
    if secret:
        print(f"  -> Success! Shared Secret Established: {secret.hex()}")
    else:
        print("  -> Aborted! QBER exceeded threshold.")
        return

    # 2. Signature Initialization and Teleportation
    print("\n[Phase 2] Initializing and Teleporting Signature...")
    # Example mapping: using fixed angles for demonstration
    theta, phi = math.pi/4, 3*math.pi/4
    
    print(f"  -> Initializing signature with theta={theta:.2f}, phi={phi:.2f}")
    qcTeleport = buildTeleportationCircuit(theta, phi)
    
    print("  -> Running teleportation circuit simulation...")
    sim = AerSimulator()
    # Execute the circuit. The state collapses, and we get the classical correction bits (crz, crx).
    result = sim.run(qcTeleport, shots=1).result()
    counts = result.get_counts()
    print(f"  -> Measurement outcomes (crz, crx): {counts}")
    
    print("\n=== Protocol Complete ===")

if __name__ == "__main__":
    main()
