# Module 1: Foundational Physics & Core QDS Engine (Revision 2)

**Project:** Quantum-Inspired Cyber Threat Detection Framework (SIH26141)
**Sub-system:** Core Framework / Simulation & Analysis Stack
**Primary Technologies:** Python, Qiskit, `qiskit-aer`

> **Revision note (rev. 2):** This supersedes the original Module 1 context. Three changes:
> (1) the teleportation gate sequence is now pinned to an exact, numbered 6-step circuit
> (§2), matching the diagram used across the rest of the project's documentation; (2) the
> protocol direction has moved from an arbitrator-mediated (KGC) design to a
> **non-arbitrated, two-party** design — Alice and Bob verify the signature directly, with no
> third-party Key Generation Center (§4 for why); (3) **this revision adds §3, the QKD
> handshake that establishes the shared secret the rest of the protocol depends on** — this
> was referenced but never actually specified in the previous revision.

## 1. Overview
This module establishes the foundational mathematical model and physics engine for the
teleportation-based Quantum Digital Signature (QDS) protocol. It operates strictly as a local,
noiseless quantum circuit simulation to validate the core quantum mechanics before network
routing, channel noise, or cyber attacks are introduced in subsequent modules.

## 2. The Gate Sequence (pinned, exact)

To transfer the signature state from Alice to Bob, the following six operations are applied,
in this order, to three qubits: `q_msg` (Alice's prepared signature qubit), `q_A` (Alice's
half of the entangled pair), and `q_B` (Bob's half of the entangled pair — this is the qubit
that ends up holding Alice's reconstructed signature).

| # | Gate | Applied to | Purpose | Why |
|---|---|---|---|---|
| 1 | **Hadamard (H)** | `q_A` | Entanglement generation | Puts `q_A` into an equal superposition of `\|0⟩` and `\|1⟩`. Mandatory first step in creating a shared quantum channel. |
| 2 | **CNOT** | control `q_A`, target `q_B` | Entanglement generation | Links `q_A` and `q_B` into the Bell state `\|Φ⁺⟩ = (1/√2)(\|00⟩ + \|11⟩)`. Guarantees that whatever happens to Alice's half of the channel instantaneously correlates with Bob's half. |
| 3 | **CNOT** | control `q_msg`, target `q_A` | Teleportation process | Entangles the actual message/signature with the quantum communication channel, injecting the signature's information into the shared system. |
| 4 | **Hadamard (H)** | `q_msg` | Teleportation process | Rotates the message qubit into the X-basis before measurement. Ensures that when Alice measures her qubits, she extracts no usable information about the actual signature state (upholding the No-Cloning Theorem) while forcing the remaining quantum information into `q_B`. |
| 5 | **Projective measurement** | `q_msg` and `q_A`, computational (Z) basis | Wave-function collapse | Alice measures both qubits, yielding two classical bits `(m₁, m₂)`. This destroys the original signature on Alice's end and completes the teleportation transfer, leaving `q_B` in a scrambled version of the original signature. |
| 6 | **Pauli-X / Pauli-Z correction** | `q_B`, conditioned on `(m₁, m₂)` | Correction | Bob receives the two classical bits over a standard (classical) network. He applies Pauli-X to `q_B` if `m₂ = 1` (Alice's Bell-half outcome), then Pauli-Z if `m₁ = 1` (Alice's message-qubit outcome). These deterministic unitary corrections unscramble `q_B`, perfectly reconstructing Alice's initial signature state — without Bob ever measuring or knowing the state himself. |

Steps 1–2 are grouped as **Entanglement Generation**; steps 3–5 as the **Teleportation
Process**; step 6 as **Correction**. This grouping is used consistently throughout the rest of
the project's documentation.

## 3. QKD Handshake (Key Establishment) — precedes every signature

**This was missing from the previous revision of this document and is added here.** Before
Alice can prepare a signature Bob can later verify, the two of them need a shared secret seed
`s`, established directly between them with no third party. This is what §5's "quantum public
key" (`expected_bits` + `basis_schedule`) is derived from — without this handshake, that
derivation has nothing to draw on.

This module runs a direct, two-party BB84-style exchange, using the same qubit-preparation and
measurement primitives as the signature circuit itself (it is not a separate subsystem):

1. **Alice prepares a stream of qubits**, each carrying one random classical bit in one of two
   random bases:
   - bit `= 1` → apply `qc.x()` before sending (else leave as `|0⟩`)
   - basis `= X` → apply `qc.h()` after the bit-encoding step (else leave in the Z basis)
2. **Bob measures each qubit** in his own randomly and independently chosen basis (`qc.h()`
   then `qc.measure()` for an X-basis measurement; `qc.measure()` alone for Z).
3. **Basis reconciliation (public, classical):** Alice and Bob publicly compare *which* basis
   they each used per qubit — never the bit values themselves. Qubits where their bases
   disagree are discarded; on average, half survive.
4. **QBER estimation:** a random subset of the surviving, basis-matched bits is compared
   publicly to estimate the channel's error rate. If an eavesdropper measured any qubits in
   transit, this shows up as excess disagreement here (this is the same QBER-based reasoning
   Module 3 later applies to the signature itself, just run once up front for key
   establishment).
5. **Accept or abort:** if the estimated QBER is below the security threshold (standard BB84
   abort bound, ≈ 11%), the remaining, unrevealed bits become the shared secret `s`. Otherwise
   the exchange is aborted and retried from step 1.

`s` is then used, together with the (public) content of the message being signed, to derive
`expected_bits` and `basis_schedule` for that specific signature — see §5 of the full protocol
specification documents (§4.2, "Handshake").

## 4. Why no KGC in this revision
The original context described teleportation as the transport mechanism but left signing and
verification unspecified. An earlier design iteration added a Key Generation Center (KGC) that
held secret keys and ran the verification step on Alice and Bob's behalf. This revision drops
that role:

- The KGC's job — checking whether the reconstructed state matches what Alice actually signed
  — can be done by **Bob himself**, using projective measurements against a set of expected
  outcomes (Alice's "quantum public key") and a deterministic statistical bound (Module 3),
  with no third party needed to decrypt anything.
- Non-repudiation, which the KGC used to provide by storing a proof record, is instead
  provided by the **classical correction bits** `(m₁, m₂)` from step 6 above, logged
  immutably per-qubit alongside an authenticated user session (Module 4/5 — see the full
  protocol specification documents for the detailed argument and its caveats).

See `QDS_Protocol_Specification_Research.md` and `QDS_Protocol_Specification_Qiskit.md` for
the full, detailed treatment of verification and non-repudiation without an arbitrator.

## 5. Objectives & Scope
- **Key Establishment:** Running the direct, two-party QKD handshake (§3) to produce the
  shared secret `s`, prior to any signature being prepared.
- **Signature Initialization:** Mapping binary signature data into parameterized quantum
  states for transmission, and deriving `expected_bits`/`basis_schedule` from `s` and the
  (public) message content.
- **Entanglement Generation:** Establishing the shared Bell-state (`\|Φ⁺⟩`) communication
  channel between Alice and Bob (gate-sequence steps 1–2).
- **Quantum Teleportation:** Executing the wave-function collapse via CNOT and Hadamard
  operations followed by projective measurements on Alice's side (gate-sequence steps 3–5).
- **State Reconstruction:** Applying the Pauli-X / Pauli-Z correction on Bob's end, based on
  the classical measurement outcomes, to reconstruct the signature state (gate-sequence
  step 6).

## 6. Expected Deliverables
1. **`qkd_handshake.py`** (or a module within `qds_engine.py`) — implementation of the §3 BB84
   exchange: qubit preparation, basis reconciliation, QBER-based accept/abort, and shared-secret
   extraction.
2. **`qds_engine.py`** — modular Python/Qiskit implementation of the pinned 6-step circuit,
   plus signature initialization and the Z/X dual-basis measurement pass used for verification
   (Module 3 consumes its output).
3. **State Verification Tests** — automated assertions confirming the reconstructed state on
   `q_B` matches the state originally prepared on `q_msg`, across all measurement branches, and
   that the handshake correctly aborts when its simulated QBER exceeds the security threshold.
4. **Local Execution Blueprint** — functional `qiskit-aer` simulation routines returning
   statevectors and computational-basis measurement counts for downstream consumption.

## 7. Integration Touchpoints
- **Inputs:** Raw signature strings or binary hashes requiring quantum encoding; no
  pre-existing shared secret is assumed — the handshake in §3 is what produces one.
- **Outputs:** The shared secret `s` and derived `expected_bits`/`basis_schedule` (consumed
  internally by this module's own verification step, §5's "Quantum Teleportation" +
  "State Reconstruction"); simulated quantum bit error rates (QBER) and bitstrings, consumed by
  the QuNetSim routing layer (Module 2) and the SciPy statistical analysis engine (Module 3).
