# Quantum-Inspired Cyber Threat Detection Framework (SIH26141)
## Protocol & Architecture Specification — Research Format

**Revision:** 2 (non-arbitrated protocol; per-module detail; authentication layer added)
**Format of this document:** formal/research-paper style, using mathematical and physics
notation. A companion document, `QDS_Protocol_Specification_Qiskit.md`, restates the same
design using Qiskit/qiskit-aer function calls in place of equations, and additionally
specifies the stress-testing plan.

---

## Abstract

Classical digital signature schemes — RSA, ECDSA — derive their security from computational
hardness assumptions that a sufficiently large quantum computer, running Shor's algorithm,
breaks efficiently. This project designs and specifies a **Security Operations Center (SOC)
testbed** built around a **teleportation-based Quantum Digital Signature (QDS) protocol**,
whose security instead derives directly from the laws of quantum mechanics: the no-cloning
theorem, the unavoidable disturbance caused by measurement, and the statistical structure of
quantum bit-error rates.

End to end, the system works as follows. A user authenticates through a React front end and
submits classical signature data via a FastAPI backend. A Qiskit/`qiskit-aer` physics engine
(Module 1) encodes that data into a parameterized quantum state and transfers it from a sender
("Alice") to a receiver ("Bob") using a pinned, six-step quantum teleportation circuit —
Hadamard and CNOT gates to generate a shared Bell-state channel, a second CNOT/Hadamard pair
to inject the signature into that channel, projective measurement on Alice's side, and
classically-communicated Pauli-X/Pauli-Z corrections on Bob's side. Unlike the arbitrated
quantum signature (AQS) schemes that motivated the early design iterations of this project,
this protocol is **deliberately non-arbitrated**: there is no trusted Key Generation Center
holding secret keys on the parties' behalf. Instead, unforgeability rests on the no-cloning
theorem (an attacker cannot copy an unknown quantum state to guess it undetected),
verification is performed directly by Bob via projective measurement against a
pre-distributed "quantum public key" (a set of expected measurement bases and outcomes) fed
into a deterministic statistical engine, and non-repudiation is established through the
classical correction bits every teleportation run necessarily produces, immutably logged
against an authenticated user session.

The teleported qubits are then routed through a simulated, attacker-capable quantum network
(Module 2, built on QuNetSim), which injects realistic hardware noise and can run
intercept-resend and other attacks. A deterministic statistical engine (Module 3, built on
SciPy/NumPy — explicitly **not** a machine-learned classifier) computes the resulting quantum
bit error rate (QBER) and bounds the probability that an observed error rate could have arisen
from honest channel noise alone, using closed-form concentration inequalities (Hoeffding /
Chernoff bounds, and the binomial cumulative distribution function). A FastAPI + PostgreSQL
backend (Module 4) persists every signature, verification, and classical receipt behind a
full authentication and authorization layer, and a React SOC dashboard (Module 5) surfaces
live telemetry, verification verdicts, and threat alerts to an analyst in real time, again
behind the same authenticated session boundary.

This document specifies that full design: the protocol mathematics, each module in detail,
the argument for and limits of non-repudiation without an arbitrator, the resource-scaling
limitations inherent to simulating multi-qubit teleportation locally, and the future work
required to remove those limitations without reintroducing a centralized trust bottleneck.

---

## 1. Motivation

RSA and ECDSA rely on integer factorization and discrete logarithm hardness, both broken in
polynomial time by Shor's algorithm on a large enough quantum computer. Post-quantum
cryptography (lattice- and hash-based schemes such as CRYSTALS-Dilithium, Falcon, SPHINCS+)
addresses this by choosing new hardness assumptions believed to resist quantum attack, but
remains *computationally* secure, not *information-theoretically* secure. Quantum Digital
Signatures (QDS) instead derive security guarantees directly from physical law. This project
builds a testbed to simulate, attack, statistically evaluate, and visualize a QDS protocol
end to end, without relying on any AI/ML heuristic for its threat-detection logic.

---

## 2. Prior Art and Design Lineage

Three bodies of work informed this design; understanding why each was *not* adopted wholesale
is as important as what was:

**Gottesman & Chuang (2001)** established the general concept of a quantum digital signature
using a quantum one-way function and the swap test, without an arbitrator.

**Arbitrated Quantum Signature (AQS) schemes** (Zeng & Keitel 2002; Li & Shi 2015 — chained
CNOT encryption; Zhang et al. 2017 — key-controlled chained CNOT; Ghosh, Roy, Bagchi,
Chakrabarty & Das, arXiv:2507.10233 — chained controlled-unitary encryption) all introduce a
trusted third-party Key Generation Center (KGC) that holds secret keys, performs
decryption/verification, and stores dispute-resolution records. An earlier iteration of this
project's design adopted this pattern directly, including the arXiv:2507.10233 paper's
CU-chain encryption and swap-test verification. **This revision removes the KGC entirely.**
The reason is architectural, not purely theoretical: every AQS scheme's security bottlenecks
on the same assumption — that the KGC is honest and physically secure — which the
arXiv:2507.10233 paper's own conclusion names as its principal limitation. A testbed whose
purpose is to *simulate and detect attacks* is better served by a protocol whose trust model
does not depend on an unmodeled, always-honest third party.

**Controlled quantum teleportation with an embedded arbitrator** (Lu, Li, Yu, Han, *Entropy*
2022, 24(1):111) offered an alternative where the arbitrator is structurally necessary,
embedded directly in a multi-party entangled channel. This was considered and set aside for
the same reason: it still requires an arbitrator, just one that participates physically
instead of administratively. The protocol adopted here instead removes the need for *any*
third verifying party.

The six-step teleportation circuit specified in §4 is standard two-party quantum teleportation
(Bennett et al. 1993); nothing here claims novelty in the physics of teleportation itself. The
contribution of this project is the software system built around it: the network-attack
simulation, the deterministic statistical detection engine, and the full-stack SOC testbed
that exercises and visualizes the protocol under attack.

---

## 3. System Architecture

```
 React UI (authenticated)
        │
        ▼
 FastAPI backend (authenticated, authorized)  ───────────────┐
        │                                                     │
        ▼                                                     │
 Qiskit / qiskit-aer physics engine  (Module 1)                │
        │  teleported qubits, classical correction bits        │
        ▼                                                     │
 QuNetSim network layer  (Module 2)                            │
   noise injection + Red Team interception                     │
        │  measurement outcomes, QBER                          │
        ▼                                                     │
 SciPy / NumPy statistical engine  (Module 3)                   │
   deterministic accept/reject, forgery-probability bound       │
        │                                                     │
        ▼                                                     │
 FastAPI + PostgreSQL  (Module 4)  ◄────────────────────────────┘
   persistence, audit trail, WebSocket push, auth/authz
        │
        ▼
 React SOC dashboard  (Module 5, authenticated, role-based views)
```

### 3.1 Parties
| Party | Role | Holds |
|---|---|---|
| **Alice (Signer)** | Prepares and teleports the signature state | Her private message data; the shared secret seed used to derive the "quantum public key" with Bob |
| **Bob (Verifier)** | Receives the teleported state, verifies it directly | The same shared seed; the classical correction bits from Alice; the expected-outcome vector he derives independently from the (public) message content |
| **Eve (simulated attacker)** | Module 2's Red Team role | Nothing legitimate — must succeed with no key material and without being able to clone an unknown state |

No KGC. No arbitrator. Verification and dispute evidence are both produced by Alice and Bob
directly, backed by Module 4's authenticated, immutable logging.

---

## 4. Protocol Design

### 4.1 Notation
An `n`-qubit message/signature is `|P⟩ = ⊗ᵢ₌₁ⁿ |pᵢ⟩`, with each qubit
`|pᵢ⟩ = cos(θᵢ/2)|0⟩ + e^{iφᵢ}sin(θᵢ/2)|1⟩` built from a 2-bit chunk of the SHA-256 digest of
the classical message data (`bit₀ → θᵢ ∈ {π/4, 3π/4}`, `bit₁ → φᵢ ∈ {π/4, 3π/4}`). This
mapping is fixed and public — it is not the secret part of the protocol.

### 4.2 Phase 1 — Handshake (the "quantum public key")
Alice and Bob share a secret seed `s`, established via a direct QKD exchange (BB84-style,
§4.6) before any signature traffic flows. From `s` both derive, independently and
identically, a basis/outcome commitment for the signature about to be sent. Concretely: since
each qubit already encodes 2 classical bits (one Z-basis-readable, one X-basis-readable, per
§4.1), Bob's "public key" for this signature is the pair

```
E = (expected_bits, basis_schedule)
```

where `basis_schedule` is fixed by protocol convention (bit₀ via Z, bit₁ via X — see §4.1),
and `expected_bits = H(message)`, computed by Bob independently from the same classical
message content Alice is signing (the message itself is not secret; only `s` and the
resulting teleportation outcome need to be). This is what "quantum public key" refers to
throughout this specification: not a secret Bob lacks, but the *expected* measurement
statistics he checks the teleported state against.

### 4.3 Phase 2 — Signature preparation
Alice prepares `|P⟩` per §4.1 from her message. No further encryption or signing
transformation is applied — the earlier design's chained controlled-unitary encryption layer
(§2) is not used here.

### 4.4 Phase 3 — Teleportation (the pinned six-step circuit)
For each qubit `|pᵢ⟩` of `|P⟩`, teleported to a corresponding qubit `q_B^{(i)}` held by Bob,
using an independent Bell pair `(q_A^{(i)}, q_B^{(i)})`:

**Step 1 — Entanglement generation (a).** `H` on `q_A`:
```
H|0⟩_A = (1/√2)(|0⟩_A + |1⟩_A)
```

**Step 2 — Entanglement generation (b).** `CNOT(control = q_A, target = q_B)`:
```
(1/√2)(|00⟩_{AB} + |11⟩_{AB}) = |Φ⁺⟩_{AB}
```

**Step 3 — Teleportation process (a).** `CNOT(control = q_msg, target = q_A)`, applied to the
joint state `|p_i⟩_{msg} ⊗ |Φ⁺⟩_{AB}`:
```
(1/√2)[ cos(θ/2)|0⟩_{msg}(|00⟩+|11⟩)_{AB} + e^{iφ}sin(θ/2)|1⟩_{msg}(|01⟩+|10⟩)_{AB} ]
```

**Step 4 — Teleportation process (b).** `H` on `q_msg`, rotating the message qubit into the
X-basis prior to measurement (this is the step that, by the no-cloning theorem, guarantees
Alice extracts no usable classical information about the state she is about to destroy).

**Step 5 — Projective measurement.** Alice measures `q_msg → m₁` and `q_A → m₂` in the
computational (Z) basis. This collapses the joint state into one of four equally-likely
branches, each leaving `q_B` in one of the four states `{|p_i⟩, X|p_i⟩, Z|p_i⟩, XZ|p_i⟩}`
(up to global phase) depending on `(m₁, m₂)`.

**Step 6 — Correction.** Alice transmits `(m₁, m₂)` to Bob over a classical channel. Bob
applies:
```
q_B ← Z^{m₁} X^{m₂} |q_B⟩
```
reconstructing `|p_i⟩` on `q_B` exactly. This was verified numerically (NumPy, all four
measurement branches, fidelity 1.0 in every branch) and confirmed jointly-consistent across
multiple simultaneously-teleported, correlated qubits (all 16 branches of a 2-qubit joint
teleportation, fidelity 1.0 in every branch) — see the companion Qiskit specification for the
exact validation methodology.

### 4.5 Phase 4 — Verification (no arbitrator)
Once Bob holds the reconstructed `|P⟩` on his register, he measures each qubit in the basis
`basis_schedule` prescribed by `E` (§4.2), over `m` repeated preparation/teleportation/measure
cycles to build up statistics (a single-shot measurement of a single qubit is not enough to
estimate a state; Module 1 runs the signature through multiple independent teleportation
trials to gather the sample Module 3 needs). He compares the observed bit values against
`expected_bits`:
```
k = number of measured bits disagreeing with expected_bits, out of m total
QBER = k / m
```
This `QBER` is passed to Module 3 (§6), which returns a deterministic accept/reject verdict
based on a concentration-inequality bound, not a swap test and not a KGC decryption.

### 4.6 Phase 5 — QKD sub-protocol (key exchange for §4.2)
Direct Alice↔Bob BB84:
1. Alice sends a stream of qubits, each randomly prepared in the Z or X basis.
2. Bob measures each in a randomly chosen basis.
3. Bases are reconciled publicly; qubits measured in mismatched bases are discarded.
4. A random subset of the remaining bits is compared publicly to estimate the channel QBER.
5. If QBER is below the security threshold (standard BB84 abort threshold ≈ 11%; Module 3's
   threshold derivation in §6.2 applies here too), the remaining bits become the shared seed
   `s`; otherwise the exchange is aborted and retried.

### 4.7 Non-forgery, verification, and non-repudiation without an arbitrator

The viability of a QDS protocol without an arbitrator rests on replacing the centralized trust
of a third party with the physical properties of quantum mechanics themselves.

**Unforgeability (the no-cloning barrier).** The signature is a parameterized quantum state
unknown to any party but Alice at the moment of preparation. By the no-cloning theorem
[Wootters & Zurek 1982; Dieks 1982], neither Bob nor an intercepting Eve can duplicate this
state. To forge a signature, an attacker must guess the exact gate sequence and initial
parameters Alice used, *and* guess correction bits that would reconstruct a state consistent
with `E`. Any attempt to measure or otherwise extract information from the entangled channel
before Bob's legitimate reconstruction collapses the wave-function prematurely, introducing
errors that Module 3's statistical bound is specifically designed to catch — the errors are
not reversible after the fact, because the measurement that would reveal them has already
occurred.

**Verification (projective measurement, not arbitration).** As specified in §4.5, Bob verifies
mathematically, without a KGC: he measures the reconstructed state in the bases `E` prescribes
and computes QBER directly against `expected_bits`. A forged or tampered state produces
measurement statistics that deviate from `expected_bits` in a way Module 3's deterministic
threshold (§6) flags with a bounded false-accept probability. No party needs to decrypt
anything, and no party needs to trust a third party to adjudicate.

**Non-repudiation (the classical receipt).** Quantum teleportation cannot function on
entanglement alone — Alice must measure her qubits and transmit the resulting classical bits
`(m₁, m₂)` per qubit for Bob to apply the correct Pauli corrections. These bits are:
1. Mathematically tied to the specific, unrepeatable wave-function collapse that happened on
   Alice's side (they are literally the outcome of measuring the signature Alice prepared, not
   independently reproducible without having performed that exact measurement).
2. Logged immutably in PostgreSQL (Module 4) alongside the authenticated identity of the user
   session that initiated the signing request.
Because the specific correction bits correlate with the collapsed quantum state and with
Bob's subsequently-observed measurement outcomes, and because the submitting identity is
authenticated (Module 4/5, §7.2/§8.2), the combination functions as a cryptographic-adjacent
receipt: Alice cannot plausibly claim she never initiated that specific wave-function
collapse, since the classical logs and the physical measurement statistics agree with each
other in a way she could not have produced without actually running the protocol.

**Honest caveat.** This non-repudiation argument is evidentiary, not a formal
information-theoretic guarantee in the way unforgeability (§ above) is. It is only as strong
as the security of the classical layer binding an identity to a submission event — i.e., it
is only as strong as Module 4/5's authentication and audit-logging implementation (§7.2, §8.2).
An attacker who can forge log entries, hijack an authenticated session, or otherwise break the
classical authentication layer defeats non-repudiation without touching the quantum channel at
all. This is precisely why proper end-to-end authentication and authorization (§7.2) is not a
cosmetic addition to Modules 4–5 but a load-bearing part of the protocol's security claims —
see §9 for this documented as a limitation, not hidden.

---

## 5. Module 1 — Core Physics & QDS Engine (detailed)

**Technologies:** Python, Qiskit, `qiskit-aer`.

**Responsibilities:**
- **QKD handshake (§4.6):** run the direct, two-party BB84 exchange with no third party,
  producing the shared secret `s` that §4.2's "quantum public key" derivation depends on. This
  was previously described only at the protocol level; it is Module 1's circuit-building and
  measurement primitives that actually implement it, and it must run — and succeed — before
  any signature can be prepared.
- Signature initialization: map classical signature data to the parameterized `|P⟩` register
  per §4.1, deriving `expected_bits`/`basis_schedule` from `s` and the message content.
- Entanglement generation and teleportation: execute the pinned six-step circuit (§4.4) per
  qubit, within a single joint circuit per signature so that any correlations between message
  qubits are preserved through transport (validated numerically — see companion Qiskit
  document, §5.7 equivalent).
- Dual-basis measurement pass: after reconstruction, measure Bob's register in both Z and X
  bases across repeated trials to produce the sample Module 3 consumes.
- Emit: teleported statevectors/counts, the classical correction-bit stream `(m₁,m₂)` per
  qubit per trial, and QBER summary statistics.

**Deliverables:**
1. A QKD handshake implementation (§4.6) — qubit preparation, basis reconciliation, QBER-based
   accept/abort, shared-secret extraction.
2. `qds_engine.py` — the six-step circuit, signature initialization, dual-basis measurement.
3. State-verification tests — assert reconstructed-state fidelity 1.0 in the noiseless case
   across all measurement branches, and that the handshake correctly aborts above its QBER
   threshold.
4. A local execution blueprint returning statevectors and counts for Modules 2/3.

**Explicitly out of scope for Module 1:** any encryption/signing transformation beyond state
preparation (§2 — the CU-chain approach from arXiv:2507.10233 is not used); any KGC role.

---

## 6. Module 2 — Network Topology & Cyber Attack Simulation (detailed)

**Technologies:** Python, QuNetSim.

**Responsibilities:**
- Model a quantum network topology with configurable, realistic noise (decoherence, gate
  error) between Alice and Bob.
- Operate a Red Team ("Eve") node capable of intercept-resend attacks at a configurable
  interception rate, replay of previously-captured classical correction bits, and tampering
  with either the quantum channel or the classical correction-bit channel independently (this
  distinction matters — §4.4 step 6's classical bits are just as attackable as the qubits
  themselves, and the two failure modes should be simulated separately).
- Route Module 1's teleported qubits and classical bits through this simulated network before
  they reach Bob, so that Module 3 always evaluates real, possibly-degraded data rather than
  idealized output.

**Threat scenarios to simulate**, framed against the non-arbitrated protocol's actual trust
model (external Eve, not a dishonest verifier — see §9 for the corresponding limitation this
implies):
- **Signature forgery** — Eve attempts to produce a `q_B` state that passes Bob's verification
  without ever legitimately receiving Alice's teleported qubits.
- **Impersonation** — Eve attempts to initiate a signing session as Alice without the shared
  seed `s`.
- **Replay** — Eve resubmits a previously-captured, legitimate set of correction bits against
  a new/different message.
- **Channel tampering** — Eve applies unauthorized operations to the entangled channel itself
  during transit (intercept-resend, and NISQ-noise-adjacent degradation, distinguished per
  §9's known open problem of noise-vs-attack disambiguation).

**Relay-node caveat (see §10 for the fuller argument):** any intermediate relay node QuNetSim
models between Alice and Bob must be a genuine quantum repeater performing entanglement
swapping, never a "trusted node" that measures and reconstitutes the state — a trusted node
reintroduces exactly the centralized-trust vulnerability this protocol was redesigned to avoid.

---

## 7. Module 3 — Deterministic Threat Detection Engine (detailed)

**Technologies:** Python, NumPy, SciPy. Explicitly **not** AI/ML — every verdict must reduce
to a closed-form probability bound.

### 7.1 The core statistical problem
Hardware noise and an active attacker both raise QBER. A deterministic detector must
distinguish "this error rate is consistent with the calibrated noise floor" from "this error
rate is too high to be explained by noise alone," using only a pre-derivable bound.

### 7.2 Proposed test (Hoeffding bound)
1. **Calibrate.** Run signing/verification cycles with no simulated attacker, across the
   range of QuNetSim noise settings Module 2 exposes, to establish an expected QBER `q₀` under
   honest conditions, per noise configuration.
2. **Observe.** For a given verification, `k` mismatches out of `m` total basis-comparisons
   (§4.5).
3. **Bound.** Treating each comparison as an independent Bernoulli trial with success
   probability `q₀` under the null hypothesis (honest channel, no forgery), Hoeffding's
   inequality gives:
   ```
   P(observed error rate ≥ q₀ + ε) ≤ exp(−2mε²)
   ```
   Fix an acceptable false-positive rate (e.g. `10⁻⁶`), solve for `ε` at the given sample size
   `m`, and set the accept/reject threshold at `q₀ + ε`. This is the exact, closed-form,
   pre-computable threshold this module was missing in the original architecture description.
4. **Report a probability, not just a verdict.** The tail bound itself is reportable to the
   analyst as the "forgery probability" — a number with a known statistical guarantee, not an
   opaque pass/fail.

### 7.3 Distinguishing attack from hardware noise
The bound in §7.2 only says the observed rate is anomalous relative to the calibrated floor,
not *why*. Mitigations, both still open design questions:
- Recalibrate `q₀` per configured noise model rather than using one global constant.
- Exploit structural signals Module 2 can expose (an intercept-resend attack affects specific
  bases/qubits in a structured way; thermal/decoherence noise is closer to uniform across the
  register) — flagged as a Module 2/3 collaboration item, not yet resolved (§9).

### 7.4 Evaluation methodology
Before Module 3 is considered complete:
- **False-positive rate** under pure-noise runs (no attacker), across the calibrated noise
  range — should track the configured bound within sampling error.
- **Detection rate** under each Module 2 attack scenario at varying attacker sophistication
  (e.g., interception rate 5% / 25% / 75%).
- **Sample-size sensitivity** — how large `m` needs to be before the bound is practically
  tight. See the companion Qiskit document's stress-test plan for the concrete benchmarking
  procedure.

---

## 8. Module 4 — Backend Orchestration & Data Persistence (detailed)

**Technologies:** Python, FastAPI, PostgreSQL.

### 8.1 Core responsibilities
- REST/WebSocket orchestration between the React UI, the Qiskit engine, and QuNetSim.
- Persist every signature attempt: the classical correction-bit stream, the QBER computed
  against `E`, the Hoeffding-bound statistics and threshold used, and the verdict.
- Persist QKD session records (§4.6): basis reconciliation logs and estimated channel QBER per
  key-exchange session.
- Record audit/forensic logs of every Module 3 verdict with its full statistical justification,
  not just a pass/fail flag.
- Maintain a monotonically increasing sequence number per signer to make replay attacks
  (§6) classically detectable, independent of the quantum-layer defenses.

### 8.2 User Authentication & Authorization

This is new in this revision. Because §4.7's non-repudiation argument depends on binding an
authenticated identity to each signing/verification event, this is not an optional web-layer
convenience — it is part of the protocol's security boundary.

**Authentication:**
- Standard username/password registration with `argon2` or `bcrypt` password hashing (never
  plaintext or reversibly-encrypted storage).
- Session management via short-lived JWT access tokens plus longer-lived, revocable refresh
  tokens (`OAuth2PasswordBearer`-pattern flow, native to FastAPI), or an equivalent
  server-side session store — either is acceptable, but the choice must support **revocation**,
  since a compromised session should not remain a valid non-repudiation anchor indefinitely.
- WebSocket connections authenticate at handshake time (token passed as a query parameter or
  subprotocol header, validated before the connection is upgraded), since Module 5's live
  telemetry stream is not a public read.

**Authorization (role-based access control):**
| Role | Capabilities |
|---|---|
| `signer` | Initiate signing sessions as "Alice"; view own signature history |
| `verifier` | Receive and verify teleported signatures as "Bob"; view own verification history |
| `analyst` | Read-only access to the SOC dashboard's threat logs and telemetry across all sessions (not signing/verification actions themselves) |
| `admin` | User management, QuNetSim scenario configuration, full audit-log access |

- Every FastAPI endpoint is protected by a dependency-injected auth guard checking both
  authentication (valid, non-expired token) and authorization (role permits the requested
  action).
- The identity bound to a signing request (§8.1's persisted record) must be the authenticated
  principal, not a client-supplied field — this is the specific detail that makes §4.7's
  non-repudiation argument hold classically as well as physically.

### 8.3 Indicative data model
```
users            (id, username, password_hash, role, created_at)
sessions         (id, user_id, token_id, issued_at, expires_at, revoked_at)
qkd_sessions     (id, alice_user_id, bob_user_id, basis_log, estimated_qber, accepted, timestamp)
signatures       (id, alice_user_id, sequence_no, message_digest, basis_schedule, expected_bits,
                  created_at)
verifications    (signature_id, bob_user_id, observed_qber, m_trials, k_mismatches,
                  hoeffding_bound, threshold_used, verdict, verified_at)
correction_bits  (signature_id, trial_no, qubit_index, m1, m2, logged_at)   -- the receipt (§4.7)
attack_events    (id, module2_scenario, target_signature_id, injected_by, detected, notes)
```

---

## 9. Module 5 — Real-Time SOC Observability UI (detailed)

**Technologies:** React.

### 9.1 Core responsibilities
- Consume live, authenticated WebSocket streams from FastAPI to render quantum channel
  telemetry, verification verdicts, and threat alerts as they occur.
- Host a Signature Verification Dashboard: verification accuracy metrics, QBER trend over
  time, and per-signature basis/outcome comparisons.
- Display real-time Threat Detection Logs, sourced exclusively from Module 3's deterministic
  evaluations (§7), with the reported forgery-probability bound shown alongside each alert.

### 9.2 Authentication & role-based views (new in this revision)
- Login screen backed by Module 4's auth endpoints; session persisted via the JWT/refresh-token
  pair, attached to every subsequent API and WebSocket call.
- Protected routing: unauthenticated users cannot reach any dashboard view; route guards check
  both authentication and the role table in §8.2.
- Role-scoped views: a `signer`/`verifier` sees their own signature/verification history; an
  `analyst` sees the aggregate threat-log and telemetry views across sessions; an `admin` sees
  user management and QuNetSim scenario controls in addition to everything above.
- Session expiry is surfaced in the UI (forced re-authentication on token expiry/revocation)
  rather than silently failing API calls, since a stale-but-still-displayed dashboard would
  misrepresent the live security state to an analyst relying on it.

---

## 10. Limitations

**10.1 Legacy note — the diagonal-gate forgery of the earlier (superseded) design.** An
earlier iteration of this project adopted the arXiv:2507.10233 CU-chain encryption/KGC design.
That design's `CU(0,0,λ)` and `U(0,0,λ)` gates are diagonal in the computational basis, and
diagonal matrices commute — meaning a Z-type gate applied identically to both the plaintext
and the signature survives KGC decryption undetected, with no key knowledge required. This was
confirmed numerically, not just asserted (fidelity 1.0 for a forged pair with no key material,
against the paper's own worked example). This specific weakness does not apply to the
non-arbitrated design in §4, which uses no CU-chain layer — but it is retained here as a
documented reason the earlier design was abandoned, not silently dropped from the record.

**10.2 The Bell-pair vs. structurally-embedded-arbitrator gap.** The teleportation circuit in
§4.4 is standard two-party (Alice/Bob) teleportation, not the multi-party GHZ-channel
controlled teleportation of Lu et al. (2022). This is a deliberate simplification (§2), not an
oversight — but it means the protocol's security rests entirely on §4.7's arguments, with no
structural, physics-level requirement that a third party participate. See §11 for the future
work this motivates around genuine quantum relays.

**10.3 Classical non-repudiation depends on classical authentication security.** As stated
plainly in §4.7's "Honest caveat," the non-repudiation guarantee is only as strong as Module
4/5's authentication and audit-logging implementation. This is a real limitation of the
non-arbitrated design relative to an arbitrated one: an arbitrated scheme's non-repudiation
rests on the KGC's physical security (a single, well-understood trust anchor); this scheme's
rests on the correctness of a full authentication/authorization stack (a larger attack
surface, though one this project can now actually simulate attacks against via Module 2/3,
which an opaque KGC could not offer).

**10.4 Multi-qubit resource scaling.** Splitting a message into an `n`-qubit state before
teleportation significantly amplifies resource overhead, constraining both physical hardware
and the local simulation environment:
- **Qubit and entanglement scaling.** Teleporting an `n`-qubit state requires `n` separate,
  maximally-entangled Bell pairs. Total circuit width expands to `3n` qubits (`n` for the
  message, `n` for Alice's entangled half, `n` for Bob's receiving half).
- **Local simulation memory limits.** `qiskit-aer` statevector simulation scales
  exponentially, tracking `2^{3n}` complex amplitudes. On a self-hosted, repurposed laptop
  (e.g. running Arch Linux as the FastAPI/Qiskit backend host), `n = 5` (15 total qubits) is
  lightweight, but `n = 10` (30 qubits) demands roughly 16 GB of memory for the physics engine
  alone — a real risk of out-of-memory crashes on typical development hardware.
- **Gate complexity and NISQ errors.** Gate complexity scales linearly, `O(n)`: `n` CNOTs and
  `n` Hadamards for the Bell-basis rotation, plus up to `n` Pauli-X and Pauli-Z corrections.
  Deeper, wider circuits need more two-qubit CNOT gates, which have substantially higher error
  rates than single-qubit gates — this added noise can itself trigger false-positive threat
  alerts in Module 3's evaluation engine, compounding the noise-vs-attack disambiguation
  problem in §7.3.
- **Classical network routing.** An `n`-qubit signature's wave-function collapse generates
  `2n` classical bits (not just 2). Module 2's routing layer and Module 5's WebSocket relays
  must sequence and transmit all `2n` bits correctly for Bob to apply the exact Pauli tensor
  products needed to reconstruct the multi-qubit state.
- **Interim mitigation.** To validate the framework without entangling a large multi-qubit
  register at once: chunk the signature classically in Python, encode each chunk into a
  single parameterized qubit, and teleport chunks sequentially through a single, rapidly-reset
  Bell-state channel loop, rather than allocating `3n` qubits simultaneously.

**10.5 Noise-vs-attack disambiguation remains open.** Restated from §7.3: Module 2 introduces
noise and attacks through the same channel, and no closed-form method for fully separating the
two is specified yet, beyond per-configuration noise-floor calibration.

---

## 11. Future Scope (resolving §10's limitations)

Evaluating Superdense Coding (SDC) for Classical Transmission. While Superdense Coding could theoretically be utilized to transmit classical key bits during the Phase 1 handshake (sending two classical bits via one quantum payload), it is explicitly excluded from the current architecture. Implementing SDC requires generating prerequisite Bell pairs purely for classical data, which unnecessarily doubles the entanglement overhead and exacerbates the memory constraints outlined in §10.4. Furthermore, routing foundational symmetric keys through the noisy quantum channel invites T1/T2 decoherence errors into the keys, and detecting an eavesdropper on an SDC channel requires complex Quantum Secure Direct Communication (QSDC) protocols (e.g., the Ping-Pong protocol) that conflict with Module 3's deterministic Hoeffding bounds. Future iterations may re-evaluate SDC integration only if quantum memory costs decrease and noise-resilient QSDC threat models can be mapped directly to closed-form statistical thresholds.
(also it is resource heavy)(very unlikely to be implemented as we would need to physically transmit the qubit and if not we would need to convert it to classical bit and then transmit it but thats defeats the point of using SDC)

**Resolving §10.2 and part of §10.4 — genuine quantum relays, not trusted nodes.** The
viability of any relay node in a teleportation-based QDS network depends entirely on whether
it is a classical "trusted node" or a true quantum repeater using entanglement swapping.

- *Trusted nodes* measure the incoming quantum state, convert it to classical data, and
  generate a new quantum state for the next hop. Highly viable operationally (this is how
  early commercial QKD networks work today, since it requires no quantum memory) — but it
  **fundamentally breaks the information-theoretic security this framework is built for**:
  whoever compromises the relay node gains full access to the signature data, reintroducing
  exactly the centralized vulnerability §10.3 already flags as a real limitation, now at every
  hop instead of at one KGC.
- *Quantum relays* never measure the payload. They receive entangled photons from two nodes
  and perform a Bell State Measurement (entanglement swapping), instantly entangling the
  sender and receiver at opposite ends of the chain without the relay learning the
  transmission's contents.
- **Simulation viability:** high. QuNetSim is explicitly designed to model quantum routing;
  an intermediate host node executing BSMs to simulate a quantum repeater is a natural
  Module 2 extension.
- **Real-world viability:** maturing rapidly, though historically hard due to synchronizing
  photon arrival times with cryogenic quantum memory. Recent hardware work has demonstrated
  entanglement swapping across five-node topologies spanning 40 km of standard optical fiber;
  the main remaining obstacle is filtering Raman noise generated when quantum signals share
  fiber with classical data.
- **Conclusion for this project:** to remain consistent with the framework's own stated
  security goals, any future multi-hop network topology in Module 2 must use quantum relays
  (entanglement swapping) exclusively, never trusted-node relaying.

**Resolving §10.4 (qubit/memory scaling) beyond the interim chunking mitigation.** Investigate
whether the chunked-teleportation-loop approach in §10.4 can be formalized into Module 1 as a
first-class execution mode (rather than an ad hoc workaround), with Module 3's statistical
model extended to properly aggregate QBER across sequential chunks rather than a single joint
`n`-qubit register.

**Resolving §10.3 (classical trust dependency of non-repudiation).** Explore
cryptographically-stronger receipt storage — an append-only, hash-chained (Merkle-log-style)
structure for the `correction_bits`/`verifications` tables in §8.3 — so that non-repudiation
degrades gracefully even if a single database write is compromised, rather than depending
entirely on PostgreSQL's own integrity and the correctness of the authentication layer alone.

**Resolving §10.5 (noise-vs-attack disambiguation).** A dedicated research task, not yet
scoped in detail: characterize whether intercept-resend and pure decoherence noise produce
statistically distinguishable *patterns* (not just different QBER magnitudes) across the
Z/X-basis comparisons Module 3 already collects, and whether that distinction can itself be
expressed as a closed-form deterministic test consistent with the project's no-ML constraint.

**Resolving §10.1 (documented, not actively pursued).** The diagonal-gate weakness applied to
a design this revision no longer uses. No further action needed unless a future revision
reintroduces phase-gate-based encryption, in which case the general `U(θ,φ,λ)` gate (rather
than the restricted `U(0,0,λ)`) should be used specifically to avoid reintroducing this issue.

---

## 12. Glossary

| Term | Meaning | Reference |
|---|---|---|
| **AQS** | Arbitrated Quantum Signature — a signature scheme with a trusted third-party arbitrator; the design pattern this project's non-arbitrated protocol deliberately departs from | [Gottesman & Chuang, arXiv:quant-ph/0105032](https://arxiv.org/abs/quant-ph/0105032) |
| **KGC** | Key Generation Center — the trusted-third-party role used in earlier AQS-style design iterations of this project and now removed (§2, §10.3) | [Trusted third party — Wikipedia](https://en.wikipedia.org/wiki/Trusted_third_party) |
| **QBER** | Quantum Bit Error Rate — the fraction of mismatched measurement outcomes; the core statistical signal Module 3 evaluates | [Quantum key distribution — Wikipedia](https://en.wikipedia.org/wiki/Quantum_key_distribution) |
| **QOTP** | Quantum One-Time Pad — random per-qubit Pauli encryption; the classical one-time pad's quantum analog, and the older technique the AQS literature's chained-encryption approaches (§2) were designed to replace | [One-time pad — Wikipedia](https://en.wikipedia.org/wiki/One-time_pad) |
| **Swap test** | A circuit estimating the fidelity between two quantum states without full tomography, using a controlled-SWAP and an ancilla qubit; used in earlier (KGC-based) design iterations for verification, not used in the current non-arbitrated design (§4.5 uses direct projective measurement instead) | [Buhrman, Cleve, Watrous, de Wolf — Quantum Fingerprinting, arXiv:quant-ph/0102001](https://arxiv.org/abs/quant-ph/0102001) |
| **CU / CP gate** | Controlled-phase gate; used in the earlier CU-chain encryption layer (§10.1), not used in the current protocol | [Quantum logic gate — Wikipedia](https://en.wikipedia.org/wiki/Quantum_logic_gate) |
| **Hoeffding bound** | A concentration inequality bounding how far a sample average can deviate from its expectation; the core formula behind Module 3's deterministic accept/reject threshold (§7.2) | [Hoeffding's inequality — Wikipedia](https://en.wikipedia.org/wiki/Hoeffding%27s_inequality) |
| **No-cloning theorem** | The theorem stating that an arbitrary, unknown quantum state cannot be copied exactly; the physical basis for this protocol's unforgeability claim (§4.7) | [No-cloning theorem — Wikipedia](https://en.wikipedia.org/wiki/No-cloning_theorem) |
| **Non-repudiation** | The property that a party cannot successfully deny having performed an action (here: signing or verifying); established here through classical correction-bit logging bound to authenticated identity (§4.7, §8.2), not through an arbitrator's stored proof | [Non-repudiation — Wikipedia](https://en.wikipedia.org/wiki/Non-repudiation) |

---

## 13. References

1. Bennett, C.H., Brassard, G., Crépeau, C., Jozsa, R., Peres, A., Wootters, W.K. — *Teleporting
   an unknown quantum state via dual classical and Einstein-Podolsky-Rosen channels*, Phys.
   Rev. Lett. 70(13), 1895 (1993).
2. Gottesman, D., Chuang, I. — *Quantum digital signatures*, arXiv:quant-ph/0105032 (2001).
3. Zeng, G., Keitel, C.H. — *Arbitrated quantum-signature scheme*, Phys. Rev. A 65, 042312
   (2002).
4. Li, F.-G., Shi, J.-H. — *An arbitrated quantum signature protocol based on the chained CNOT
   operations encryption*, Quantum Inf Process 14(6), 2171–2181 (2015).
5. Zhang, L., Sun, H.-W., Zhang, K.-J., Jia, H.-Y. — *An improved arbitrated quantum signature
   protocol based on the key-controlled chained CNOT encryption*, Quantum Inf Process 16, 70
   (2017).
6. Ghosh, D., Roy, S., Bagchi, P., Chakrabarty, I., Das, A.K. — *Secure and Efficient Quantum
   Signature Scheme Based on the Controlled Unitary Operations Encryption*, arXiv:2507.10233
   (2025). [Design considered and superseded — §2, §10.1]
7. Lu, D., Li, Z., Yu, J., Han, Z. — *A Verifiable Arbitrated Quantum Signature Scheme Based on
   Controlled Quantum Teleportation*, Entropy 24(1):111 (2022). [Design considered and
   simplified away from — §2, §10.2]
8. Gao, F., Qin, S.-J., Guo, F.-Z., Wen, Q.-Y. — *Cryptanalysis of the arbitrated quantum
   signature protocols*, Phys. Rev. A 84, 022344 (2011).
9. Buhrman, H., Cleve, R., Watrous, J., de Wolf, R. — *Quantum Fingerprinting*, Phys. Rev.
   Lett. 87, 167902 (2001). arXiv:quant-ph/0102001.
10. Wootters, W.K., Zurek, W.H. — *A single quantum cannot be cloned*, Nature 299, 802–803
    (1982).
11. Hoeffding, W. — *Probability Inequalities for Sums of Bounded Random Variables*, J. Amer.
    Statist. Assoc. 58, 13–30 (1963).
12. Bennett, C.H., Brassard, G. — *Quantum cryptography: Public key distribution and coin
    tossing* (BB84), Proc. IEEE Int. Conf. on Computers, Systems and Signal Processing (1984).
13. Shor, P.W. — *Polynomial-time algorithms for prime factorization and discrete logarithms
    on a quantum computer*, SIAM Review 41(2), 303–332 (1999).

---

*This document supersedes the earlier `PROJECT_OVERVIEW.md` protocol design (§4) by replacing
the KGC-arbitrated CU-chain signing scheme with the non-arbitrated protocol above, pins the
exact teleportation gate sequence, separates each of the five modules into its own detailed
section, adds the authentication/authorization layer to Modules 4–5, and documents limitations
and future scope honestly, including where earlier design choices were abandoned and why. A
companion document restates this same specification using Qiskit/qiskit-aer function calls and
includes the stress-testing plan.*
