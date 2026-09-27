import math

from qiskit.quantum_info import Statevector, state_fidelity
from qiskit_aer import AerSimulator

from ..module1.qdsEngine import buildTeleportationCircuit, prepareSignatureCircuit
from ..module1.qkdHandshake import runQkdHandshake


def testTeleportationFidelity():
    # Construct base expected state
    theta, phi = math.pi / 4, 3 * math.pi / 4
    qcInit = prepareSignatureCircuit(theta, phi)
    expectedState = Statevector.from_instruction(qcInit)

    # Execute full teleportation circuit
    qcTeleport = buildTeleportationCircuit(theta, phi)
    qcTeleport.save_statevector()

    sim = AerSimulator(method="statevector")
    result = sim.run(qcTeleport).result()

    # Get statevector from the result (which is a mixed state representing the branches)
    # Actually, in statevector simulator with if_test and measurements, it will yield
    # one specific branch. To test all branches, we would either disable measurements
    # and corrections (which is just teleportation mathematically) or use shots.
    # We can check fidelity using `qiskit.quantum_info.state_fidelity` directly on the density matrix.

    # Let's run multiple shots to cover branches, but Aer statevector simulator
    # will collapse the state.
    # For a perfect verification, the fidelity of the bob qubit in any branch is 1.0.

    # Run with 10 shots to likely hit different branches
    for _ in range(10):
        res = sim.run(qcTeleport, shots=1).result()
        sv = res.get_statevector(qcTeleport)

        # sv is a 3-qubit state vector. We need to trace out msg and alice.
        # Bob is qubit 2 (index 2). msg is 0, alice is 1.
        from qiskit.quantum_info import partial_trace

        bobDensityMatrix = partial_trace(sv, [0, 1])

        fidelity = state_fidelity(expectedState, bobDensityMatrix)
        assert math.isclose(fidelity, 1.0, abs_tol=1e-5)


def testQkdHandshakeAbortsOnHighQber(monkeypatch):
    import numpy as np

    from ..module1 import qkdHandshake as qkd

    # Monkeypatch to force random bits/bases to be consistent for a test,
    # but modify bobResults to simulate an eavesdropper/high noise.
    original_run = qkd.AerSimulator.run

    class DummyResult:
        def get_counts(self):
            # Always return a flipped bit to guarantee mismatch
            return {"0": 1}  # Dummy count

    class DummyJob:
        def result(self):
            return DummyResult()

    def mock_run(self, qc, shots):
        return DummyJob()

    monkeypatch.setattr(qkd.AerSimulator, "run", mock_run)

    # Also force aliceBits to be all 1s so that a returned '0' from DummyResult causes 100% QBER
    monkeypatch.setattr(np, "random", np.random)
    monkeypatch.setattr(np.random, "randint", lambda low, size: np.ones(size))

    result = runQkdHandshake(nQubits=10, threshold=0.11)

    # Should abort due to high QBER
    assert result is None
