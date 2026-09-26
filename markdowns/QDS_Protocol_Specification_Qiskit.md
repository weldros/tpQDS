# Quantum-Inspired Cyber Threat Detection Framework (SIH26141)
## Protocol & Architecture Specification — Qiskit / qiskit-aer Implementation Format

**Revision:** 2 (non-arbitrated protocol; per-module detail; authentication layer added;
stress-test plan added)
**Format of this document:** implementation-oriented. Wherever the companion research
document (`QDS_Protocol_Specification_Research.md`) uses a mathematical equation, this
document gives the corresponding Qiskit / `qiskit-aer` function call. No code files are
attached to this document — these are function-name-level references for the implementation
to follow, not a working module.

---

## Abstract

This project builds a Security Operations Center (SOC) testbed around a **teleportation-based
Quantum Digital Signature (QDS) protocol**, implemented end to end in Qiskit and `qiskit-aer`.
A user authenticates through a React front end and submits signature data via FastAPI; a
Qiskit physics engine (Module 1) builds a `QuantumCircuit` that encodes the data with
`qc.ry()` and `qc.p()`, then transfers it from Alice to Bob using a pinned six-gate
teleportation sequence — `qc.h()` and `qc.cx()` to build the shared Bell pair, a second
`qc.cx()`/`qc.h()` pair to inject the signature into the channel, `qc.measure()` on Alice's
qubits, and classically-conditioned `qc.x()` / `qc.z()` corrections on Bob's qubit (via
Qiskit's `if_test` construct). The protocol is **non-arbitrated**: there is no Key Generation
Center running as a separate service holding secret keys. Instead, unforgeability follows from
the no-cloning theorem, verification is done directly by Bob by re-measuring the reconstructed
qubit in a pre-agreed basis and comparing the outcome bitstring to an expected value he
computes independently, and non-repudiation comes from logging the classical correction bits
`qc.measure()` produces against an authenticated user session in PostgreSQL.

Teleported qubits and their classical correction bits are then routed through a simulated,
attacker-capable QuNetSim network (Module 2) that can inject `qiskit_aer.noise` models
(`T1`/`T2` relaxation and dephasing, two-qubit depolarizing error on the CNOTs) and run
intercept-resend attacks at a configurable rate. A deterministic SciPy/NumPy engine (Module 3)
computes QBER from the measurement outcomes and bounds forgery probability with closed-form
concentration inequalities — `scipy.stats.binom.cdf` and a Chernoff-Hoeffding tail bound —
explicitly avoiding any trained/ML model. FastAPI + PostgreSQL (Module 4) persists every run
behind JWT-based authentication and role-based authorization, and a React dashboard (Module 5)
streams live verification and threat telemetry over authenticated WebSockets. This document
specifies the full implementation surface — module by module, function by function — plus a
concrete stress-testing plan covering circuit depth scaling, NISQ noise injection, network
saturation, statistical threshold tuning, and full-stack load, so the design can be validated
before it is built.

---

## 1. Motivation

Same motivation as the research-format document: classical schemes (RSA, ECDSA) are
Shor-vulnerable; this project targets information-theoretic security via a teleportation-based
QDS, implemented concretely on `qiskit`/`qiskit-aer`, and validated by simulation before any
real-hardware execution is attempted.

---

## 2. Prior Art and What Was Not Adopted

- **Gottesman & Chuang (2001)**: non-arbitrated QDS using a quantum one-way function and a
  swap test — conceptual ancestor of "no KGC," though this project's verification step (§4.5)
  uses direct projective measurement rather than `qiskit`'s `cswap`-based swap-test circuit.
- **AQS schemes with a KGC** (Li & Shi 2015; Zhang et al. 2017; Ghosh et al., arXiv:2507.10233
  — chained `CU(0,0,λ)`/controlled-phase-gate encryption, implemented in the source paper with
  `qc.cp()` and `qc.p()`): an earlier iteration of this project implemented this pattern
  directly in Qiskit. **This revision removes it.** The `qc.cp()`-based encryption layer and
  the KGC role that decrypted it are both dropped from Module 1.
- **Controlled teleportation with an embedded arbitrator** (Lu et al., *Entropy* 2022): would
  require a GHZ-state channel (`qc.h()` + two `qc.cx()` calls from one qubit to build a 3-qubit
  GHZ state, rather than the 2-qubit Bell pair this project uses) with a third party's
  measurement outcome required before Bob's correction can be computed. Considered, not
  implemented — see §11 future scope.

---

## 3. System Architecture

Same five-stage pipeline as the research document (React → FastAPI → Qiskit engine → QuNetSim
→ SciPy engine → FastAPI/PostgreSQL → React dashboard), with the same party table (Alice,
Bob, simulated Eve — no KGC).

---

## 4. Protocol Design — Qiskit Implementation

### 4.1 Signature encoding
```python
# Module 1 — signature initialization
qc = QuantumCircuit(1, name="sig_init")
qc.ry(theta, 0)   # theta in {pi/4, 3*pi/4}, selected by bit0 of a message-digest chunk
qc.p(phi, 0)      # phi   in {pi/4, 3*pi/4}, selected by bit1 of the same chunk
```
`theta`/`phi` are derived from a SHA-256 digest of the classical message, 2 bits per qubit —
this mapping is public/fixed, not secret.

### 4.2 Phase 1 — Handshake ("quantum public key")
Implemented as a direct Alice↔Bob BB84 exchange (§4.6) producing a shared seed `s`. From `s`,
both sides derive, independently:
```python
expected_bits = sha256(message_bytes).digest()   # both Alice and Bob compute this; message is public
basis_schedule = ["Z", "X"] * n                   # fixed protocol convention, per qubit-pair of bits
```
No Qiskit circuitry is needed for this step beyond the BB84 exchange in §4.6 — it is a
classical derivation from a shared secret plus public message content.

### 4.3 Phase 2 — Signature preparation
`|P⟩` is built as in §4.1, one `QuantumCircuit` register qubit per 2-bit chunk. No encryption
circuit (no `qc.cp()` chain) is applied — this is the point of departure from the earlier,
now-superseded design.

### 4.4 Phase 3 — Teleportation: the pinned six-gate circuit

This is the circuit every qubit of `|P⟩` goes through, one Bell pair per qubit, built as a
single joint circuit across all qubits of a signature so correlations between them (if any
exist in a future revision) survive transport:

```python
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister

msg   = QuantumRegister(1, "msg")     # Alice's prepared signature qubit
alice = QuantumRegister(1, "alice")   # Alice's half of the Bell pair
bob   = QuantumRegister(1, "bob")     # Bob's half of the Bell pair -> becomes the reconstructed signature
crz   = ClassicalRegister(1, "crz")   # Alice's measurement of msg   -> drives the Z correction
crx   = ClassicalRegister(1, "crx")   # Alice's measurement of alice -> drives the X correction

qc = QuantumCircuit(msg, alice, bob, crz, crx)

# --- Signature initialization (§4.1) ---
qc.ry(theta, msg[0])
qc.p(phi, msg[0])
qc.barrier()

# --- Step 1+2: Entanglement Generation ---
qc.h(alice[0])                     # Step 1 — Hadamard on Alice's entangled qubit
qc.cx(alice[0], bob[0])            # Step 2 — CNOT(control=alice, target=bob): builds |Phi+>
qc.barrier()

# --- Step 3+4: Teleportation Process ---
qc.cx(msg[0], alice[0])            # Step 3 — CNOT(control=msg, target=alice): injects signature into channel
qc.h(msg[0])                       # Step 4 — Hadamard on msg: rotates to X-basis pre-measurement
qc.barrier()

# --- Step 5: Projective Measurement ---
qc.measure(msg[0], crz[0])         # Step 5 — Alice measures msg   -> classical bit m1
qc.measure(alice[0], crx[0])       # Step 5 — Alice measures alice -> classical bit m2
qc.barrier()

# --- Step 6: Correction (classically conditioned) ---
with qc.if_test((crx, 1)):
    qc.x(bob[0])                   # Step 6 — Pauli-X on Bob's qubit if m2 == 1
with qc.if_test((crz, 1)):
    qc.z(bob[0])                   # Step 6 — Pauli-Z on Bob's qubit if m1 == 1
```

This is the exact circuit validated in this project's numerical checks (NumPy equivalent of
the above gate sequence, all four `(m1, m2)` measurement branches, fidelity 1.0 in every
branch; also confirmed jointly-consistent when two correlated qubits are teleported within one
combined circuit, all 16 branches, fidelity 1.0 in every branch).

### 4.5 Phase 4 — Verification: direct measurement, no swap test, no KGC

```python
# After the corrected `bob` qubit is delivered by Module 2's QuNetSim routing,
# Bob measures in the basis_schedule entry for this qubit:
if basis_schedule[i] == "X":
    qc_verify.h(bob[0])            # rotate to X-basis before measuring in Z
qc_verify.measure(bob[0], out[0])
```
Run over `m` repeated trials via `AerSimulator().run(circuits, shots=m)`, giving a `counts`
dictionary. QBER is computed classically:
```python
mismatches = sum(1 for trial_bit, expected in zip(observed_bits, expected_bits) if trial_bit != expected)
qber = mismatches / len(expected_bits)
```
This entirely replaces the earlier design's `cswap`-based swap-test circuit and KGC-side
`qc.cp()`-inverse decryption — no such circuits exist in this revision's Module 1.

### 4.6 Phase 5 — QKD sub-protocol (BB84, direct Alice↔Bob, no KGC)
```python
# Alice: random bits, random bases
qc_bb84 = QuantumCircuit(1, 1)
if bit == 1:
    qc_bb84.x(0)
if basis == "X":
    qc_bb84.h(0)
# ... transmit qubit through Module 2's QuNetSim channel ...
# Bob: random basis choice
if bob_basis == "X":
    qc_bb84.h(0)
qc_bb84.measure(0, 0)
```
Bases are reconciled classically over the FastAPI/WebSocket channel (Module 4); mismatched-
basis results are discarded; a public sample of the remainder estimates channel QBER
(compared against the standard BB84 abort threshold, ≈ 11%, using the same
`scipy.stats.binom.cdf`-based bound Module 3 uses elsewhere — see §7).

### 4.7 Non-forgery, verification, and non-repudiation without an arbitrator

Same three-pillar argument as the research document, restated at the implementation level:

- **Unforgeability**: no `qiskit` circuit lets an attacker copy an unmeasured qubit
  (`qiskit`'s statevector/gate model has no "clone" operation — this is a hardware/physics
  constraint the simulator itself respects, not just a design choice). Any attempt by Eve to
  measure the channel before Bob's legitimate correction runs (§4.4, Step 6) collapses the
  state and introduces detectable error into the `crz`/`crx` outcomes and the subsequent QBER
  computed in §4.5.
- **Verification**: `qc.measure()` outcomes compared against `expected_bits` (§4.2), scored by
  Module 3's `scipy.stats.binom.cdf`/Hoeffding-bound logic (§7) — no `cswap` swap test, no
  external verifying service.
- **Non-repudiation**: the `crz`/`crx` classical bits produced by `qc.measure()` in §4.4 Step 5
  are what gets logged to PostgreSQL (Module 4, `correction_bits` table), tied to the
  authenticated FastAPI request/session that triggered `qc.run()`. See §9.2 for the caveat that
  this depends on the authentication layer's own correctness — restated here because it is a
  genuine engineering requirement on Module 4, not just a documentation note.

---

## 5. Module 1 — Core Physics & QDS Engine (Qiskit implementation detail)

**Stack:** `qiskit`, `qiskit-aer` (`AerSimulator`, `qiskit_aer.noise` for later noisy runs).

**Key functions/objects this module must expose:**
- `run_qkd_handshake(n_qubits, threshold=0.11) -> bytes | None` — §4.6's BB84 exchange between
  Alice and Bob, returning the shared secret `s` on success or `None` on abort (QBER over
  threshold). This must run, and succeed, before `prepare_signature_circuit` is called for a
  given signature — there is no default/fallback secret.
- `prepare_signature_circuit(theta, phi) -> QuantumCircuit` — §4.1.
- `build_teleportation_circuit(theta, phi) -> QuantumCircuit` — the pinned §4.4 circuit,
  returning a circuit with `msg`, `alice`, `bob` registers and `crz`/`crx` classical registers.
- `build_verification_circuit(basis: str) -> QuantumCircuit` — §4.5's post-correction
  measurement, parameterized by `basis_schedule[i]`.
- `run_signature(message: bytes, shots: int) -> QDSResult` — orchestrates the above across all
  qubits of a signature, using `AerSimulator().run(transpile(qc, backend), shots=shots)`, and
  returns statevectors/counts, the `crz`/`crx` stream, and computed QBER.

**Deliverables:**
1. `qkd_handshake.py` (or an internal module of `qds_engine.py`) implementing
   `run_qkd_handshake` per §4.6.
2. `qds_engine.py` implementing the above.
3. `pytest`-style state-verification tests asserting fidelity 1.0 in the noiseless case across
   all `(m1, m2)` branches (`qiskit.quantum_info.state_fidelity`), plus a test that
   `run_qkd_handshake` returns `None` when simulated QBER is pushed above threshold.
4. A local execution blueprint (`AerSimulator(method="statevector")` for fidelity checks;
   `AerSimulator()` default for shot-based counts).

---

## 6. Module 2 — Network Topology & Cyber Attack Simulation (implementation detail)

**Stack:** Python, QuNetSim.

- Configure a `QuantumNetwork` topology (QuNetSim) with Alice and Bob as hosts, routing
  Module 1's teleported qubits and their `crz`/`crx` classical payload through it.
- Attach `qiskit_aer.noise.NoiseModel` instances to the backend used by Module 1's
  `AerSimulator` calls when this module wants to simulate a degraded channel — this is the
  bridge point between QuNetSim's routing simulation and `qiskit-aer`'s execution.
- Implement a Red Team host node that can:
  - Intercept and measure a configurable percentage of in-transit qubits before forwarding
    (intercept-resend), using its own `AerSimulator` measurement call on the intercepted qubit.
  - Replay previously-logged `crz`/`crx` values against a different signature session.
  - Tamper with either the quantum payload or the classical `crz`/`crx` bits independently.

---

## 7. Module 3 — Deterministic Threat Detection Engine (implementation detail)

**Stack:** NumPy, SciPy (`scipy.stats.binom`, or a direct Hoeffding-bound implementation —
no `sklearn`, no trained model of any kind).

```python
from scipy.stats import binom

def forgery_probability(k_mismatches: int, m_trials: int, q0: float) -> float:
    """P(observing >= k mismatches out of m trials | honest channel with baseline QBER q0)."""
    return 1 - binom.cdf(k_mismatches - 1, m_trials, q0)

def hoeffding_threshold(m_trials: int, q0: float, false_positive_rate: float = 1e-6) -> float:
    """Solve exp(-2*m*eps^2) = false_positive_rate for eps; threshold = q0 + eps."""
    import math
    eps = math.sqrt(math.log(1 / false_positive_rate) / (2 * m_trials))
    return q0 + eps
```

`forgery_probability` implements the exact-binomial version of the bound (using
`scipy.stats.binom.cdf` directly, as specified in the stress-test plan below); `hoeffding_threshold`
implements the closed-form concentration-inequality version. Module 3 computes both and
reports whichever is tighter for the given `m_trials`, alongside the observed QBER, to Module 4
for persistence and Module 5 for display.

---

## 8. Module 4 — Backend Orchestration & Data Persistence (implementation detail)

**Stack:** FastAPI, PostgreSQL, WebSockets.

Same data model as the research document §8.3, implemented via an ORM (e.g. SQLAlchemy) with
FastAPI route handlers per table. Key implementation points:

- `POST /signatures` — authenticated (`Depends(get_current_user)`), role-checked
  (`signer` only), triggers Module 1's `run_signature()`.
- `POST /verifications` — authenticated, role-checked (`verifier` only), triggers Module 1's
  `build_verification_circuit()` + Module 3's `forgery_probability()`/`hoeffding_threshold()`.
- `GET /ws/telemetry` — authenticated WebSocket (token validated at handshake before upgrade),
  streaming live Module 2/3 output to Module 5.

### 8.1 User Authentication & Authorization (new in this revision)
```python
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# JWT access + refresh token issuance on /token (password grant)
# Role check dependency, e.g.:
def require_role(*roles):
    def checker(user = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=403)
        return user
    return checker
```
- Roles: `signer`, `verifier`, `analyst`, `admin` (table in §9.2 of the research document).
- Every signature/verification record's owning-user field is set from the authenticated
  `user.id`, never from a client-supplied field — this is what makes §4.7's non-repudiation
  argument hold at the implementation level, not just the design level.
- WebSocket auth: token passed as a query parameter or `Sec-WebSocket-Protocol` header,
  validated in the FastAPI WebSocket route before calling `await websocket.accept()`.

---

## 9. Module 5 — Real-Time SOC Observability UI (implementation detail)

**Stack:** React.

- Login form → `POST /token` → store access/refresh tokens (memory + secure httpOnly cookie
  for the refresh token, not `localStorage`, to reduce XSS exposure to the long-lived token).
- Protected route wrapper checking token validity before rendering any dashboard view;
  redirect to login on 401 from any API/WebSocket call.
- Role-scoped views per §8.2 of the research document's role table, driven by the `role` claim
  in the decoded JWT (or a `/me` endpoint call on load).
- WebSocket client reconnects with the current valid token on drop, and surfaces
  "session expired" distinctly from "connection lost" so an analyst does not mistake a stale
  authenticated view for a live one.

---

## 10. Stress-Testing Plan

This section is specific to this implementation-format document. All four categories should
be scripted as repeatable benchmarks, not one-off manual checks, before this design is
considered validated.

### 10.1 Qiskit Physics Engine & Wave-Function Fidelity
- **Depth scaling limits:** incrementally increase the number of parameterized signature
  qubits `n` in a test loop. Track memory consumption of the `qiskit-aer` statevector
  simulator — scaling beyond roughly 20–30 total qubits will rapidly exhaust RAM on a
  dedicated development laptop (see §11.4's `2^{3n}` scaling figure).
- **NISQ noise injection:** use `qiskit_aer.noise` to append custom noise models mimicking
  standard hardware limitations — specifically `T1` relaxation time, `T2` dephasing time, and
  two-qubit CNOT depolarizing error. Verify that the Pauli-X and Pauli-Z corrections in §4.4
  Step 6 still correctly reassemble the core signature despite slight amplitude degradation
  (i.e., fidelity degrades gracefully rather than collapsing discontinuously).

### 10.2 QuNetSim Channel Degradation & Interception
- **EPR source depletion:** configure a `QuantumNetwork` topology and bombard the channel with
  rapid, consecutive teleportation requests. Stress the `QuantumNetwork` component to measure
  how quickly simulated entanglement generation bottlenecks the message routing queue.
- **Red Team intercept-resend rates:** program the interceptor node to execute projective
  measurements on varying percentages of traffic (e.g. 5%, 25%, 75%). Track how accurately the
  system logs the exact percentage of wave-function collapse before sending the degraded
  qubits onward to Bob.

### 10.3 SciPy Deterministic Threshold Tuning
- **False-positive boundary testing:** feed the SciPy math engine hundreds of slightly noisy,
  but legitimate, teleported bitstrings generated under heavy QuNetSim depolarization. Verify
  that the Chernoff-Hoeffding bounds (§7's `hoeffding_threshold`) correctly classify them as
  natural noise rather than forgery, confirming the deterministic replacement for AI/ML
  heuristic models.
- **QBER spike sensitivity:** introduce artificial bit-flip errors at the classical layer by
  tampering with the two classical Pauli correction bits (`crz`/`crx`). Assert that
  `scipy.stats.binom.cdf` (§7's `forgery_probability`) instantly drops the probability score
  below the defined threshold (`p < 10⁻⁶`), triggering an immediate threat alert.

### 10.4 Full-Stack Load & Asynchronous Telemetry
- **FastAPI worker saturation:** execute a classical benchmarking tool such as `wrk` or
  Locust to blast the FastAPI endpoints with concurrent signature-generation requests. Ensure
  background tasks handle the heavy physics-engine routing without blocking the main API event
  loop.
- **WebSocket stream integrity:** while under heavy API load, monitor the React dashboard's
  live telemetry. Ensure WebSocket connections remain stable and that visualized state vectors
  and threat logs do not desynchronize from the backend PostgreSQL database.

---

## 11. Limitations

Same substance as the research document's §10, restated where implementation-specific:

**11.1 Legacy note.** The earlier `qc.cp()`-chain encryption/KGC design's diagonal-gate
forgery (confirmed by direct NumPy/Qiskit-equivalent linear algebra: a `qc.z()` applied to
both the plaintext and the signature circuit survives decryption with fidelity 1.0, no key
required) does not apply to this revision, which contains no `qc.cp()` chain. Documented, not
silently dropped.

**11.2 Bell pair vs. GHZ-channel gap.** §4.4 implements a 2-qubit Bell pair
(`qc.h()`+`qc.cx()`), not a 3-party GHZ channel. Deliberate simplification — see §12.

**11.3 Classical non-repudiation depends on classical auth correctness.** Restated as an
implementation requirement in §8.1: the owning-user field on every persisted record must come
from the authenticated principal, never a client-supplied value.

**11.4 Multi-qubit resource scaling.**
- **Qubit and entanglement scaling:** an `n`-qubit signature needs `n` Bell pairs — total
  circuit width `3n` qubits (`n` message + `n` Alice-side + `n` Bob-side).
- **Local simulation memory limits:** `qiskit-aer` statevector simulation tracks `2^{3n}`
  complex amplitudes. On a self-hosted, repurposed laptop (e.g. Arch Linux running the
  FastAPI/Qiskit backend), `n = 5` (15 qubits) is lightweight; `n = 10` (30 qubits) demands
  roughly 16 GB of memory for the physics engine alone, risking out-of-memory crashes.
- **Gate complexity and NISQ errors:** `O(n)` — `n` `qc.cx()` and `n` `qc.h()` calls for the
  Bell-basis rotation, plus up to `n` `qc.x()`/`qc.z()` corrections. More two-qubit `qc.cx()`
  gates mean more error, which can itself trigger false-positive alerts in Module 3.
- **Classical network routing:** an `n`-qubit signature's collapse produces `2n` classical
  bits (not 2) that Module 2's routing and Module 5's WebSocket relay must sequence correctly.
- **Interim mitigation:** chunk the signature in Python, encode each chunk into a single
  qubit, and teleport chunks sequentially through one rapidly-reset Bell-pair circuit rather
  than allocating `3n` qubits simultaneously.

**11.5 Noise-vs-attack disambiguation remains open** (§10.1's benchmarks characterize this but
do not yet resolve it).

---

## 12. Future Scope (resolving §11's limitations)

Same substance as the research document's §11, restated with implementation notes:

- **Genuine quantum relays, not trusted nodes (resolves §11.2 and part of §11.4).** A trusted
  relay node that runs `qc.measure()` on the payload and re-prepares a fresh state for the
  next hop reintroduces exactly the centralized-trust problem §11.3 already flags — whoever
  compromises that node gets the plaintext signature. A genuine quantum relay instead performs
  a Bell State Measurement (`qc.cx()` + `qc.h()` + `qc.measure()` on its *own* entangled
  qubits only, never on the payload qubit itself) to achieve entanglement swapping. QuNetSim
  is well suited to modeling this as an intermediate host node; implementing it is the
  recommended next Module 2 extension. Real hardware for this is maturing (recent
  demonstrations of 5-node, 40 km entanglement-swapping topologies exist), with Raman noise
  from sharing fiber with classical signals the main open hardware obstacle. Any future
  multi-hop Module 2 topology must use this approach exclusively.
- **Formalize chunked teleportation (resolves §11.4).** Promote the interim chunking
  mitigation into a first-class `run_signature_chunked()` execution mode in Module 1, with
  Module 3 extended to aggregate QBER correctly across sequential chunks.
- **Hash-chained receipt storage (resolves §11.3).** Make the `correction_bits`/
  `verifications` tables append-only and hash-chained (each row's hash includes the previous
  row's hash, Merkle-log style), so non-repudiation degrades gracefully under a single
  compromised write rather than depending entirely on PostgreSQL integrity plus the
  authentication layer alone.
- **Noise-vs-attack pattern characterization (resolves §11.5).** Use the §10.2/§10.3
  stress-test data to determine whether intercept-resend and pure decoherence noise produce
  statistically distinguishable *patterns* across the Z/X-basis comparisons already collected,
  expressible as a further closed-form (non-ML) test.
- **§11.1 — documented, not pursued** unless a future revision reintroduces phase-gate-based
  encryption, in which case use the general `qc.u(theta, phi, lam, qubit)` gate rather than the
  restricted `qc.p(lam, qubit)` form specifically to avoid reintroducing the diagonal-gate
  weakness.

---

## 13. Glossary

Same terms and links as the research document's §12 — repeated here for a self-contained
implementation reference:

| Term | Meaning | Reference |
|---|---|---|
| **AQS** | Arbitrated Quantum Signature — the design pattern (KGC-mediated) this project's protocol deliberately departs from | [Gottesman & Chuang, arXiv:quant-ph/0105032](https://arxiv.org/abs/quant-ph/0105032) |
| **KGC** | Key Generation Center — removed in this revision (§2) | [Trusted third party — Wikipedia](https://en.wikipedia.org/wiki/Trusted_third_party) |
| **QBER** | Quantum Bit Error Rate — computed in §4.5, evaluated in §7 | [Quantum key distribution — Wikipedia](https://en.wikipedia.org/wiki/Quantum_key_distribution) |
| **QOTP** | Quantum One-Time Pad — the older per-qubit Pauli-encryption technique this design's lineage moved away from | [One-time pad — Wikipedia](https://en.wikipedia.org/wiki/One-time_pad) |
| **Swap test** | `cswap`-ancilla fidelity-estimation circuit; used in earlier design iterations, not in §4.5's direct-measurement verification | [Buhrman, Cleve, Watrous, de Wolf — Quantum Fingerprinting, arXiv:quant-ph/0102001](https://arxiv.org/abs/quant-ph/0102001) |
| **CU / CP gate** | `qc.cp()` controlled-phase gate; used in the earlier, now-removed encryption layer | [Quantum logic gate — Wikipedia](https://en.wikipedia.org/wiki/Quantum_logic_gate) |
| **Hoeffding bound** | `hoeffding_threshold()` (§7) — the closed-form basis for Module 3's deterministic verdicts | [Hoeffding's inequality — Wikipedia](https://en.wikipedia.org/wiki/Hoeffding%27s_inequality) |
| **No-cloning theorem** | No `qiskit` operation can copy an unknown qubit's state; the physical basis for §4.7's unforgeability claim | [No-cloning theorem — Wikipedia](https://en.wikipedia.org/wiki/No-cloning_theorem) |
| **Non-repudiation** | Established via `crz`/`crx` correction-bit logging bound to an authenticated user (§4.7, §8.1), not an arbitrator | [Non-repudiation — Wikipedia](https://en.wikipedia.org/wiki/Non-repudiation) |

---

## 14. References

Same reference list as the companion research document (`QDS_Protocol_Specification_Research.md`
§13) — not duplicated here to avoid drift between the two documents; consult that document's
§13 as the canonical reference list for both.

---

*This document is the Qiskit/qiskit-aer implementation counterpart to
`QDS_Protocol_Specification_Research.md`. Where the two documents differ only in notation
(equations vs. function calls), they describe the same design. Where this document adds
content not in the research document — the stress-testing plan (§10) — that content is
implementation-validation material, not a protocol change.*
