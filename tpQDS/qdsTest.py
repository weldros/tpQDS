"""State-verification tests for qds_engine.py  (run: pytest -q  or  python test_qds_engine.py)"""

import itertools

import numpy as np
from qdsEngine import (
    FIDELITY_TOL,
    PHI_MAP,
    THETA_MAP,
    QDSEngine,
    bell_pair_fidelity,
    bits_to_params,
    bloch_decode,
    ideal_state,
    signature_to_bits,
)
from qiskit.quantum_info import state_fidelity

ENGINE = QDSEngine(shots=2048)
ALL_SYMBOLS = list(itertools.product(THETA_MAP, PHI_MAP))


def test_bell_pair_is_phi_plus():
    assert abs(bell_pair_fidelity() - 1.0) < FIDELITY_TOL


def test_signature_to_bits():
    assert signature_to_bits("1011") == "1011"
    assert signature_to_bits("101") == "1010"  # padded to even length
    assert len(signature_to_bits("hello", n_bits=16)) == 16
    assert signature_to_bits(b"hello", 16) == signature_to_bits("hello", 16)


def test_encoding_decoding_roundtrip_exact():
    for bits in ("00", "01", "10", "11"):
        ((t, p),) = bits_to_params(bits)
        assert bloch_decode(ideal_state(t, p)) == bits


def test_teleportation_fidelity_all_symbols_all_measurement_branches():
    # different seeds hit different (m1, m2) outcomes of Alice's measurement
    for t, p in ALL_SYMBOLS:
        for seed in range(25):
            _, f = ENGINE.teleport_state(t, p, seed=seed)
            assert abs(f - 1.0) < FIDELITY_TOL, (t, p, seed, f)


def test_reconstructed_state_matches_initial_state():
    for t, p in ALL_SYMBOLS:
        dm, f = ENGINE.teleport_state(t, p, seed=7)
        assert abs(np.trace(np.asarray(dm.data)) - 1.0) < FIDELITY_TOL
        assert abs(state_fidelity(dm, ideal_state(t, p)) - f) < FIDELITY_TOL
        assert bloch_decode(dm) == bloch_decode(ideal_state(t, p))


def test_full_protocol_zero_qber_and_accept():
    for sig in ("alice-msg-1", "0110100111010010", b"\x00\xff\x10"):
        r = ENGINE.run(sig, n_bits=16)
        assert r.bits_recovered == r.bits_sent
        assert r.qber == 0.0
        assert r.accepted
        assert min(r.fidelities) > 1 - FIDELITY_TOL


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("PASS", name)
