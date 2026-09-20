"""
qds_engine.py -- Module 1: Foundational Physics & Core QDS Engine
Project : Quantum-Inspired Cyber Threat Detection Framework (SIH26141)

Noiseless, local Qiskit/Aer simulation of a teleportation-based Quantum
Digital Signature (QDS) transfer between Alice (sender) and Bob (receiver).

Pipeline (per signature qubit)
------------------------------
  1. Signature initialisation : 2 signature bits -> (theta, phi) -> |psi>
  2. Entanglement generation  : Bell pair |Phi+> shared by Alice and Bob
  3. Teleportation            : CNOT + H + projective measurement (Alice)
  4. State reconstruction     : classically-controlled X / Z on Bob's qubit
  5. Read-out                 : state vector + Z/X-basis counts -> bitstring, QBER

Design notes
------------
* Each signature qubit is teleported in its own 3-qubit circuit
  (msg, alice, bob).  This keeps the state vector at 2^3 amplitudes no matter
  how long the signature is; a 256-bit hash would otherwise need 384 qubits.
* Encoding: 2 bits per qubit.  bit0 selects theta in {pi/4, 3pi/4},
  bit1 selects phi in {pi/4, 3pi/4}.  |psi> = cos(t/2)|0> + e^{i p} sin(t/2)|1>.
  This gives <Z> = +-0.707 (bit0) and <X> = +-0.5 (bit1), so both bits can be
  recovered from Z-basis and X-basis measurement statistics.
* Requires: qiskit >= 1.0 (tested target 1.3.x) and qiskit-aer.
"""

from __future__ import annotations

import hashlib
import math
from collections.abc import Sequence
from dataclasses import dataclass, field

import numpy as np
import qiskit_aer.library  # noqa: F401  (registers QuantumCircuit.save_statevector)
from qiskit import ClassicalRegister, QuantumCircuit, QuantumRegister, transpile
from qiskit.quantum_info import (
    DensityMatrix,
    Statevector,
    partial_trace,
    state_fidelity,
)
from qiskit_aer import AerSimulator

# --------------------------------------------------------------------------- #
# Constants
# --------------------------------------------------------------------------- #
THETA_MAP = (math.pi / 4, 3 * math.pi / 4)  # selected by bit0 of each pair
PHI_MAP = (math.pi / 4, 3 * math.pi / 4)  # selected by bit1 of each pair
BITS_PER_QUBIT = 2
FIDELITY_TOL = 1e-9  # noiseless acceptance threshold

# Qubit / clbit layout inside every teleportation circuit
MSG, ALICE, BOB = 0, 1, 2


# --------------------------------------------------------------------------- #
# 1. Signature initialisation (classical bits -> parameterised quantum states)
# --------------------------------------------------------------------------- #
def signature_to_bits(signature: str | bytes, n_bits: int = 16) -> str:
    """
    Turn raw input into a bitstring of even length.

    * A str made only of '0'/'1' is treated as an already-binary signature.
    * Anything else (str or bytes) is hashed with SHA-256 and truncated to
      `n_bits` (max 256).  This mirrors the paper's public hash H: {0,1}* -> {0,1}^n.
    """
    if isinstance(signature, str) and signature and set(signature) <= {"0", "1"}:
        bits = signature
    else:
        raw = (
            signature.encode("utf-8")
            if isinstance(signature, str)
            else bytes(signature)
        )
        if not 1 <= n_bits <= 256:
            raise ValueError("n_bits must be in [1, 256]")
        digest = hashlib.sha256(raw).digest()
        bits = "".join(f"{byte:08b}" for byte in digest)[:n_bits]
    if len(bits) % BITS_PER_QUBIT:
        bits += "0"  # pad to a whole number of qubits
    return bits


def bits_to_params(bits: str) -> list[tuple[float, float]]:
    """Map every bit pair to Bloch-sphere angles (theta, phi)."""
    if len(bits) % BITS_PER_QUBIT:
        raise ValueError("bitstring length must be even")
    return [
        (THETA_MAP[int(bits[i])], PHI_MAP[int(bits[i + 1])])
        for i in range(0, len(bits), BITS_PER_QUBIT)
    ]


def prepare_state_circuit(theta: float, phi: float) -> QuantumCircuit:
    """1-qubit circuit producing cos(t/2)|0> + e^{i p} sin(t/2)|1>."""
    qc = QuantumCircuit(1, name="sig_init")
    qc.ry(theta, 0)
    qc.p(phi, 0)
    return qc


def ideal_state(theta: float, phi: float) -> Statevector:
    return Statevector.from_instruction(prepare_state_circuit(theta, phi))


# --------------------------------------------------------------------------- #
# 2-4. Entanglement, teleportation, reconstruction
# --------------------------------------------------------------------------- #
def build_teleportation_circuit(
    theta: float,
    phi: float,
    measure_basis: str | None = None,
    save_state: bool = False,
) -> QuantumCircuit:
    """
    Full teleportation circuit for ONE signature qubit.

    measure_basis : None | 'Z' | 'X'  -> also measure Bob's qubit in that basis
                    into classical register `out` (used for shot-based QBER).
    save_state    : append save_statevector() (used for fidelity checks).
    """
    if measure_basis not in (None, "Z", "X"):
        raise ValueError("measure_basis must be None, 'Z' or 'X'")

    msg = QuantumRegister(1, "msg")
    alice = QuantumRegister(1, "alice")
    bob = QuantumRegister(1, "bob")
    crz = ClassicalRegister(1, "crz")  # Alice's outcome on msg   -> Z correction
    crx = ClassicalRegister(1, "crx")  # Alice's outcome on alice -> X correction
    regs = [msg, alice, bob, crz, crx]
    out = None
    if measure_basis:
        out = ClassicalRegister(1, "out")
        regs.append(out)

    qc = QuantumCircuit(*regs, name="qds_teleport")

    # (1) Signature initialisation
    qc.ry(theta, msg[0])
    qc.p(phi, msg[0])
    qc.barrier()

    # (2) Entanglement generation: |Phi+> = (|00> + |11>)/sqrt(2) on (alice, bob)
    qc.h(alice[0])
    qc.cx(alice[0], bob[0])
    qc.barrier()

    # (3) Alice's Bell-basis measurement (wave-function collapse)
    qc.cx(msg[0], alice[0])
    qc.h(msg[0])
    qc.measure(msg[0], crz[0])
    qc.measure(alice[0], crx[0])
    qc.barrier()

    # (4) Bob's Pauli corrections, conditioned on the classical bits
    with qc.if_test((crx, 1)):
        qc.x(bob[0])
    with qc.if_test((crz, 1)):
        qc.z(bob[0])
    qc.barrier()

    # (5) Optional read-out
    if save_state:
        qc.save_statevector()
    if measure_basis == "X":
        qc.h(bob[0])
    if measure_basis:
        qc.measure(bob[0], out[0])
    return qc


def bell_pair_circuit() -> QuantumCircuit:
    qc = QuantumCircuit(2, name="bell")
    qc.h(0)
    qc.cx(0, 1)
    return qc


def bell_pair_fidelity() -> float:
    """Fidelity of the generated pair with |Phi+> (should be exactly 1)."""
    target = Statevector([1 / math.sqrt(2), 0, 0, 1 / math.sqrt(2)])
    return float(
        state_fidelity(Statevector.from_instruction(bell_pair_circuit()), target)
    )


# --------------------------------------------------------------------------- #
# Read-out helpers
# --------------------------------------------------------------------------- #
def bloch_decode(state: Statevector | DensityMatrix) -> str:
    """Exact 2-bit decode of a (reconstructed) qubit from <Z> and <X>."""
    rho = np.asarray(DensityMatrix(state).data)
    exp_z = float(np.real(rho[0, 0] - rho[1, 1]))
    exp_x = float(2 * np.real(rho[0, 1]))
    return f"{0 if exp_z > 0 else 1}{0 if exp_x > 0 else 1}"


def _p0_from_counts(counts: dict[str, int]) -> float:
    """P(out = 0) from Aer counts; `out` is the last-added register (first token)."""
    zeros = total = 0
    for key, n in counts.items():
        out_bit = key.split()[0][-1]
        total += n
        if out_bit == "0":
            zeros += n
    return zeros / total


# --------------------------------------------------------------------------- #
# Engine + result container
# --------------------------------------------------------------------------- #
@dataclass
class QDSResult:
    bits_sent: str
    bits_recovered: str
    params: list[tuple[float, float]]
    fidelities: list[float]  # per-qubit, Bob vs. initial state
    bob_density_matrices: list[np.ndarray]  # reduced 2x2 density matrices
    counts_z: list[dict[str, int]]  # raw Aer counts, Z-basis read-out
    counts_x: list[dict[str, int]]  # raw Aer counts, X-basis read-out
    bit_errors: int
    qber: float
    accepted: bool
    shots: int
    meta: dict = field(default_factory=dict)

    def summary(self) -> str:
        return (
            f"sent      : {self.bits_sent}\n"
            f"recovered : {self.bits_recovered}\n"
            f"min F     : {min(self.fidelities):.12f}\n"
            f"QBER      : {self.qber:.4f}  ({self.bit_errors}/{len(self.bits_sent)} bits)\n"
            f"verdict   : {'ACCEPT' if self.accepted else 'REJECT'}"
        )


class QDSEngine:
    """Local, noiseless QDS simulator. Later modules can pass a noisy backend."""

    def __init__(
        self,
        backend: AerSimulator | None = None,
        shots: int = 1024,
        seed: int | None = 1234,
    ):
        self.backend = backend or AerSimulator(method="statevector")
        self.shots = shots
        self.seed = seed

    # -- fidelity path (state vector, one shot) ---------------------------- #
    def teleport_state(
        self, theta: float, phi: float, seed: int | None = None
    ) -> tuple[DensityMatrix, float]:
        """Teleport one qubit; return Bob's reduced state and its fidelity with the input."""
        qc = build_teleportation_circuit(theta, phi, save_state=True)
        tqc = transpile(qc, self.backend)
        res = self.backend.run(
            tqc, shots=1, seed_simulator=self.seed if seed is None else seed
        ).result()
        full = res.get_statevector()
        bob_dm = partial_trace(full, [MSG, ALICE])  # Alice's qubits are collapsed
        fidelity = float(state_fidelity(bob_dm, ideal_state(theta, phi)))
        return bob_dm, fidelity

    # -- shot path (computational-basis counts) ---------------------------- #
    def measure_counts(
        self, params: Sequence[tuple[float, float]], basis: str
    ) -> list[dict[str, int]]:
        circuits = [
            transpile(
                build_teleportation_circuit(t, p, measure_basis=basis), self.backend
            )
            for t, p in params
        ]
        res = self.backend.run(
            circuits, shots=self.shots, seed_simulator=self.seed
        ).result()
        return [res.get_counts(i) for i in range(len(circuits))]

    # -- full protocol ------------------------------------------------------ #
    def run(self, signature: str | bytes, n_bits: int = 16) -> QDSResult:
        bits = signature_to_bits(signature, n_bits)
        params = bits_to_params(bits)

        fidelities, dms = [], []
        for t, p in params:
            dm, f = self.teleport_state(t, p)
            dms.append(np.asarray(dm.data))
            fidelities.append(f)

        counts_z = self.measure_counts(params, "Z")
        counts_x = self.measure_counts(params, "X")

        recovered = ""
        for cz, cx in zip(counts_z, counts_x):
            bit0 = 0 if _p0_from_counts(cz) > 0.5 else 1  # theta  <- Z statistics
            bit1 = 0 if _p0_from_counts(cx) > 0.5 else 1  # phi    <- X statistics
            recovered += f"{bit0}{bit1}"

        errors = sum(a != b for a, b in zip(bits, recovered))
        qber = errors / len(bits)
        accepted = min(fidelities) >= 1 - FIDELITY_TOL and errors == 0

        return QDSResult(
            bits_sent=bits,
            bits_recovered=recovered,
            params=params,
            fidelities=fidelities,
            bob_density_matrices=dms,
            counts_z=counts_z,
            counts_x=counts_x,
            bit_errors=errors,
            qber=qber,
            accepted=accepted,
            shots=self.shots,
            meta={"n_qubits_teleported": len(params), "noise": "none"},
        )


if __name__ == "__main__":
    engine = QDSEngine()
    print(f"Bell pair fidelity: {bell_pair_fidelity():.12f}")
    result = engine.run("alice-signature-demo", n_bits=16)
    print(result.summary())
