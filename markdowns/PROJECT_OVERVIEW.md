# Quantum-Inspired Cyber Threat Detection Framework (SIH26141)
## Project Overview & Architecture Specification

**Status:** Design specification, incorporating gap-closure revisions.
**Scope of this document:** Full 5-module system. Detailed protocol design for Module 1; architectural, data-model, and statistical-design specs for Modules 2–5.
**Companion code:** none yet — this document is the design reference the code will be built against.

---

## 1. Purpose and Motivation

Classical public-key signature schemes (RSA, ECDSA) rely on hardness assumptions — integer
factorization and discrete logarithms — that Shor's algorithm breaks efficiently on a
sufficiently large quantum computer. Quantum Digital Signatures (QDS) instead derive their
security from the laws of quantum mechanics (no-cloning, measurement disturbance,
non-orthogonality of quantum states), giving information-theoretic rather than
computational security.

This project builds a **Security Operations Center (SOC) testbed**: a software system that

1. simulates a teleportation-based QDS protocol between a signer and a verifier,
2. routes the resulting qubits through a simulated noisy/adversarial network,
3. applies **deterministic, non-ML statistical analysis** to the measurement outcomes to
   decide whether a signature is genuine, tampered with, or forged, and
4. surfaces all of this to a human analyst through a real-time web dashboard.

The explicit constraint that detection must be **deterministic, not AI/ML-based** matters: it
means Module 3 must reduce to closed-form probability bounds derived from quantum measurement
statistics (the same style of argument used in QKD security proofs), not a trained classifier.

---

## 2. Research Foundations

Three papers anchor the design. Each contributes a distinct piece; none of them, alone, is
what this project builds — the architecture below is a deliberate composition of ideas from
all three, closing gaps that appear when any one of them is read in isolation.

### 2.1 Gottesman–Chuang and the general AQS lineage (background)
Establishes the general shape of an **Arbitrated Quantum Signature (AQS)**: a signer, a
verifier, and a trusted arbitrator who resolves disputes. Nearly all later AQS work
(Zeng & Keitel, Li & Shi, Zhang et al., and the two papers below) inherits this three-party
structure. **Contribution to this project:** the arbitrator role itself — currently the
weakest-specified part of the 5-module architecture (see §6.4).

### 2.2 "Secure and Efficient Quantum Signature Scheme Based on the Controlled Unitary
Operations Encryption" (Ghosh, Roy, Bagchi, Chakrabarty, Das — arXiv:2507.10233)
Gives the **signing/encryption mechanics**:
- A Key Generation Center (KGC) issues each signer a secret bitstring `K`, converted to a
  permutation `K′` (positions of the 0-bits, then the 1-bits).
- The signer picks `n` random phase angles `λ₁…λₙ ∈ [0, π]`.
- **Encryption:** a chain of controlled-phase gates `CU(0,0,λⱼ)` couples qubit `j` (control)
  to qubit `K′ⱼ` (target), turning the message `|P⟩` into ciphertext `|C⟩`.
- **Signing:** a further single-qubit phase gate `U(0,0,λⱼ)` is applied to each qubit of
  `|C⟩`, producing the signature `|S⟩`.
- **Verification:** the KGC reverses both layers using its copy of `K′` and `λ`, then compares
  the result to `|P⟩` via a **swap test**.
- **Dispute resolution:** the KGC stores `(λ, hash)` per signature as durable proof — the
  feature most earlier AQS schemes lack.

**Contribution to this project:** the entire encrypt → sign → verify → store-proof pipeline,
and the worked numerical example used to validate our implementation plan (§5.5).

**Known limitation carried over, not hidden:** every gate in this scheme — `CU(0,0,λ)` and
`U(0,0,λ)` — is diagonal in the computational basis. Diagonal matrices always commute, which
means a Z-type (or any diagonal) operator applied identically to both `|P⟩` and `|S⟩` survives
decryption undetected, regardless of the attacker's ignorance of `K` or `λ`. We verified this
numerically (§5.6) rather than taking the paper's Pauli-resistance claim (§5.4 of the paper) at
face value. This is documented as an open security question, not silently patched — see §8.1
for mitigation options.

### 2.3 "A Verifiable Arbitrated Quantum Signature Scheme Based on Controlled Quantum
Teleportation" (Lu, Li, Yu, Han — Entropy 2022, 24(1):111)
Gives the **transport mechanics with an embedded arbitrator**: instead of a plain two-party
Bell pair, the quantum channel is a multi-qubit entangled state (a five-qubit channel in the
published scheme) shared across signer, verifier, *and* arbitrator. The arbitrator is not a
passive third party who checks results after the fact — it actively participates in the
teleportation itself, using mutually-unbiased-basis measurements, and the receiver cannot
complete state reconstruction without the arbitrator's cooperation.

**Contribution to this project:** the argument for why Module 1's transport layer should be
*controlled* teleportation rather than a bare Bell pair, if the system wants the arbitrator to
be structurally necessary (not just a convention the software happens to follow). We treat a
full merge of this into the n-qubit signing pipeline as a **Phase 2 extension** (§8.2) rather
than a Phase 1 requirement, because it substantially increases circuit complexity for a
property (structural necessity of the arbitrator) that an actively-verifying, key-holding KGC
already provides in practice.

---

## 3. System Architecture

### 3.1 High-level pipeline

```
 React UI  →  FastAPI backend  →  Qiskit physics engine (Module 1)
                                        │
                                        │  encrypted + signed qubits
                                        ▼
                              QuNetSim network layer (Module 2)
                              (noise model + Red Team interception)
                                        │
                                        │  measurement outcomes, QBER
                                        ▼
                        SciPy/NumPy statistical engine (Module 3)
                        (deterministic accept/reject, forgery bound)
                                        │
                                        ▼
                              FastAPI + PostgreSQL (Module 4)
                              (persistence, audit trail, WebSocket push)
                                        │
                                        ▼
                              React SOC dashboard (Module 5)
```

### 3.2 Parties in the protocol

| Party | Role | Holds |
|---|---|---|
| **Alice (Signer)** | Prepares the message, encrypts + signs it | secret key `K`, derived permutation `K′`, per-signature `λ` values |
| **Bob (Verifier)** | Receives the signature, forwards it for verification | secret key `K_B` |
| **KGC (Arbitrator)** | Trusted third party; generates keys, verifies signatures, resolves disputes | all signers' `K` and `λ` records, `K_B`, proof archive |
| **Eve (simulated attacker)** | Module 2's Red Team role | nothing legitimate — must succeed without any key material |

This table is the fix for the biggest gap identified in review: the original 5-module
description had Alice and Bob but no arbitrator anywhere in the pipeline. The KGC is now a
first-class party with explicit state and explicit responsibilities in every phase below.

---

## 4. Protocol Design (Module 1 core)

### 4.1 Phase 1 — Initialization
- KGC publishes a public hash function `H : {0,1}* → {0,1}ⁿ`.
- Alice prepares her message. Two representations exist side by side:
  - **Classical signature data** (what arrives from the React UI / FastAPI): an arbitrary
    string or byte payload.
  - **Quantum-encoded message `|P⟩`**: an n-qubit state built by hashing the classical payload
    down to a fixed-size digest (e.g. 256 bits → 128 qubits at 2 bits/qubit, or a
    project-configurable digest length) and mapping each 2-bit chunk to Bloch-sphere angles
    `(θ, φ)`. This closes the "no message-to-qubit scaling strategy" gap: the protocol never
    tries to teleport a full-size document qubit-by-qubit — it signs a digest, exactly as a
    classical digital signature signs a hash rather than the raw document.

### 4.2 Phase 2 — Key generation
- KGC generates a fresh `n`-bit secret `K` for Alice and `n`-bit secret `K_B` for Bob, using a
  **QKD sub-protocol** (BB84 is the natural default — see §4.2.1). This closes the "no QKD
  layer" gap: key distribution is now an explicit step with an explicit protocol, not an
  assumed side channel.
- Alice derives `K′` from `K`: the positions of the 0-bits, in order, followed by the
  positions of the 1-bits, in order (0-indexed). Example: `K = 1010` → zeros at positions
  `{1, 3}`, ones at positions `{0, 2}` → `K′ = (1, 3, 0, 2)`.
- Bob derives `K′_B` from `K_B` the same way (used only if Bob is ever promoted to a
  signing role in a multi-signer configuration).

#### 4.2.1 QKD sub-protocol (new — addresses the missing key-distribution layer)
Module 2's noisy network is the natural place to run BB84 between KGC↔Alice and KGC↔Bob before
any signature traffic flows:
1. KGC sends a stream of random qubits, each randomly in the Z or X basis.
2. Alice/Bob measure each qubit in a randomly chosen basis.
3. Basis choices are reconciled publicly; qubits measured in mismatched bases are discarded.
4. A random subset of the remaining bits is compared publicly to estimate the QBER.
5. If QBER is below the security threshold (§6.2), the remaining bits become `K` (or `K_B`);
   otherwise the key exchange is aborted and retried.

This reuses Module 1's teleportation/measurement primitives and Module 3's statistical bound
machinery — it is not a separate subsystem, just an earlier use of the same tools.

### 4.3 Phase 3 — Encryption
Alice picks `n` random angles `λ₁ᵢ, …, λⁿᵢ ∈ [0, π]` and sends them to the KGC over an
authenticated channel. She applies a chain of controlled-phase gates:

```
|C⟩ = CU(0,0,λⁿᵢ)(pₙ, p_{K′ₙ}) ⋯ CU(0,0,λ¹ᵢ)(p₁, p_{K′₁}) |P⟩
```

Each `CU(0,0,λ)` gate is exactly a standard controlled-phase gate: if the control qubit is
`|1⟩`, the target qubit's `|1⟩` component picks up phase `e^{iλ}`; otherwise nothing happens.
Because this matrix is diagonal, **the order in which the chain is applied does not affect the
result** — we verified this numerically (§5.5) — but the implementation still applies gates in
the paper's stated order for traceability and to match the published worked example exactly.

### 4.4 Phase 4 — Signature generation
A further single-qubit phase gate is applied to every qubit individually, using each qubit's
own `λ`:

```
|S⟩ = ⊗ⱼ U(0,0,λʲᵢ) |Cⱼ⟩
```

Alice computes `h = H(K)` and now holds the triple `{|P⟩, |S⟩, h}` to send onward.

### 4.5 Phase 5 — Transport (teleportation)
This is where Module 1's physics engine — as originally scoped in `context.md` — does its
work, and where it now carries something cryptographically meaningful instead of an arbitrary
demo state:

- **`|S⟩` is teleported to Bob**, one qubit at a time, each qubit sharing its own Bell pair
  with Bob. All `n` teleportations are simulated within a single joint circuit so that the
  phase correlations `|S⟩` acquired during encryption (§4.3) are preserved across the
  transport step — teleporting an entangled/correlated multi-qubit state qubit-by-qubit via
  independent Bell pairs is standard and exact, and we verified this numerically for a
  representative case (§5.7): every one of the 16 possible measurement-outcome branches
  reproduced the original correlated state with fidelity 1.
- **Bob's reference copy of `|P⟩`** is *not* teleported a second time. Since `|P⟩`'s content is
  public (it is the message being signed, described by known classical angles `(θ,φ)`, not a
  secret unknown state), Bob reconstructs it locally from the same classical description Alice
  used. This is not a no-cloning violation — no-cloning forbids copying an *unknown* quantum
  state, and `|P⟩`'s preparation instructions are, by protocol design, public. This
  simplification halves the teleportation circuit size without weakening the protocol, because
  only `|S⟩`'s integrity — not `|P⟩`'s — carries the cryptographic content.
- Each teleportation step still goes through the QuNetSim noisy/adversarial channel
  (Module 2), so hardware noise and any interception attempt both leave a mark on the
  transported `|S⟩` exactly as they would on a real quantum channel.

### 4.6 Phase 6 — Verification
- Bob computes `h_B = H(h ⊕ K_B)` and forwards `{|P⟩ (local copy), teleported |S⟩, h_B}` to
  the KGC.
- KGC recomputes `h* = H(H(K) ⊕ K_B)`. If `h* ≠ h_B`, reject immediately — no quantum
  processing needed, this is a cheap classical check that catches tampering with the hash
  handshake itself.
- Otherwise, KGC reverses both signing layers using its stored `λ` and `K′`:
  ```
  |P′⟩ = CU†(0,0,λ¹ᵢ)(p₁,p_{K′₁}) ⋯ CU†(0,0,λⁿᵢ)(pₙ,p_{K′ₙ})  ·  ⊗ⱼ U†(0,0,λʲᵢ)  |S⟩
  ```
- KGC compares `|P′⟩` against Bob's `|P⟩` via a **swap test**: an ancilla qubit in `|0⟩`,
  Hadamard, controlled-SWAP between every corresponding qubit pair of the two `n`-qubit
  registers, a second Hadamard, then measure the ancilla. Over `m` repeated shots,
  `P(ancilla = 0) → ½ + ½·fidelity`, so `fidelity = 2·P(0) − 1`. We confirmed this formula
  numerically against a directly-computed fidelity (§5.8).
- Accept if the estimated fidelity clears the threshold derived in Module 3 (§6); otherwise
  reject.

### 4.7 Phase 7 — Dispute resolution (non-repudiation)
On acceptance, KGC stores `{(λ¹ᵢ,…,λⁿᵢ), h_B}` in its proof archive (Module 4/PostgreSQL, see
§7). This record lets the KGC later prove Alice generated a specific signature and Bob
verified it, even after the quantum states themselves are gone (which they are, immediately,
because verification consumes them) — this is the feature that distinguishes this design from
most earlier AQS schemes, which cannot resolve "the signature was lost" disputes at all.

---

## 5. Validation performed against the published paper

Before committing to the above design, the following were checked numerically (NumPy, not
Qiskit — Qiskit was unavailable in the validation environment, so the linear-algebra
equivalent of every gate was checked directly):

1. **Paper's worked example reproduced exactly.** For the 4-qubit state
   `|P¹⟩ = (⅟√3|0⟩ + i√(⅔)|1⟩)^⊗4`, the amplitude of `|0110⟩` computed as `−0.22222` and its
   probability as `0.04938` — matching the paper's Table/Figure values to 5 decimal places.
2. **Encrypt → sign → decrypt round trip.** Using the paper's own `K′ = (1,3,0,2)` and
   `λ = (π/3, π/4, π/6, π/8)`, applying the full CU-chain + U-layer encryption then reversing
   it recovered the original state with fidelity `1.0000000000000009` (i.e. exact, to floating
   point precision).
3. **Order-independence of the CU chain**, confirmed by applying the four controlled-phase
   gates in a different order and finding the resulting ciphertext identical (difference
   `~1.4×10⁻¹⁶`) — expected, since all gates involved are diagonal and diagonal matrices always
   commute.
4. **The diagonal-gate forgery is real, not just theoretical.** Applying a Z gate (phase `π`)
   to qubit 0 of *both* `|P⟩` and `|S⟩`, with no knowledge of `K`, `K′`, or any `λ`, produced a
   forged pair that still verifies with fidelity `1.0000000000000009`. This is the same
   structural weakness Gao et al. identified in QOTP-based schemes, and it survives the switch
   from CNOT/QOTP to controlled-phase gates because the new gates are still diagonal.
5. **Joint multi-qubit teleportation preserves inter-qubit correlation.** A 2-qubit state
   entangled by one controlled-phase gate was teleported qubit-by-qubit within a single joint
   6-qubit circuit (2 message + 2 Alice-side ancilla + 2 Bob-side ancilla). All 16 possible
   combinations of the 4 classical measurement outcomes, after the standard Pauli corrections,
   reproduced the original state with fidelity 1.0 in every branch.
6. **Swap-test fidelity formula confirmed.** For two arbitrary single-qubit states, the
   simulated swap-test ancilla measurement gave `P(0)` matching `½ + ½·(directly computed
   fidelity)` to 9 decimal places.

These checks give reasonable confidence that the protocol design in §4 is internally
consistent and matches the source paper's actual mathematics — and give concrete, reproducible
evidence for the vulnerability documented in §8.1, rather than leaving it as an unverified
claim.

---

## 6. Module 3 — Deterministic Threat Detection Engine (statistical design)

This was the least specified part of the original architecture ("calculate exact forgery
probabilities based on deterministic threshold bounds" — no formula given). Proposed design:

### 6.1 The core problem
Hardware noise and an eavesdropper/forger both raise the observed error rate between the
expected and received states. A purely deterministic detector must distinguish "this error
rate is consistent with the channel's known noise floor" from "this error rate is too high to
be explained by noise alone," using only a closed-form probability bound — no learned model.

### 6.2 Proposed statistical test
This mirrors the standard QKD security-proof structure (e.g. BB84's eavesdropping bound):

1. **Calibrate a noise floor.** Run signature/verification cycles with no simulated attacker,
   across a range of QuNetSim noise settings, to establish an expected QBER (or swap-test
   infidelity) `q₀` and its variance under honest conditions.
2. **Observe.** For a given verification, record the number of mismatched measurement outcomes
   `k` out of `m` total comparisons (either from the QBER measurement pass in Module 1, or from
   repeated swap-test shots in §4.6).
3. **Bound the false-accept / false-reject probability with a Hoeffding or Chernoff bound.**
   Treating each of the `m` comparisons as an independent Bernoulli trial with success
   probability `q₀` under the null hypothesis (honest channel), the probability of observing
   `k/m` or more errors purely by chance is bounded by:
   ```
   P(observed error rate ≥ q₀ + ε) ≤ exp(−2mε²)      (Hoeffding)
   ```
   Fix an acceptable false-positive rate (e.g. `10⁻⁶`), solve for `ε` given the sample size
   `m`, and set the accept/reject threshold at `q₀ + ε`. This gives an exact, closed-form,
   pre-computable threshold — satisfying the "deterministic, not ML" requirement precisely,
   and giving Module 3 the formula it was missing.
4. **Report a forgery *probability*, not just a verdict.** Rather than a bare accept/reject,
   Module 3 can report the Hoeffding-bound tail probability itself as the "exact forgery
   probability" the architecture doc calls for — a number an analyst can act on with a known
   statistical guarantee, instead of an opaque threshold crossing.

### 6.3 Distinguishing "attack" from "hardware noise"
Module 2 introduces both simultaneously, which the original spec did not address. The
Hoeffding-bound approach in §6.2 only tells you *that* the observed error rate is
statistically anomalous relative to the calibrated noise floor — not *why*. Two mitigations:
- **Noise floor recalibration per configured QuNetSim noise model**, so `q₀` always reflects
  "this channel, with no attacker" rather than a single global constant.
- **Pattern signals Module 2 can also expose directly** (e.g. an interception attempt changes
  *which* qubits/bases are affected in a structured way, whereas thermal/decoherence noise is
  closer to uniform) — flagged here as a design question for Module 2/3 collaboration, not yet
  resolved.

### 6.4 Evaluation methodology (previously unspecified)
Before Module 3 is considered complete, it should be benchmarked on:
- **False-positive rate** under pure-noise runs (no attacker) across the calibrated noise
  range — should track the configured bound (e.g. `10⁻⁶`) within sampling error.
- **Detection rate** under each Module 2 attack type (forgery, impersonation, replay, channel
  tampering) at varying attacker sophistication.
- **Sample-size sensitivity**: how large `m` (signature length / repeated shots) needs to be
  before the Hoeffding bound is tight enough to be practically useful.

---

## 7. Module 4 — Backend Orchestration & Data Persistence

### 7.1 Responsibilities (expanded from the original spec)
- REST/WebSocket orchestration between the React UI, the Qiskit engine, and QuNetSim.
- **KGC state persistence** (new — this is what makes the non-repudiation feature in §4.7
  durable across restarts): the proof archive `{signer_id, λ values, h_B, timestamp, verdict}`
  per signature, plus the `K`/`K_B` records needed to re-verify or arbitrate later disputes.
- **QKD session records** (new, tied to §4.2.1): basis reconciliation logs and estimated QBER
  per key-exchange session, kept separately from signature records since keys may be reused
  across multiple signatures.
- Audit/forensic logs of Module 3's verdicts and the Hoeffding-bound statistics behind each
  one, not just a pass/fail flag.
- Session/nonce tracking for replay-attack resistance at the classical layer (new — the
  original spec listed "replay attacks" as a Module 2 threat to simulate but had no classical
  bookkeeping to make replay meaningfully detectable; a monotonically increasing signature
  sequence number per signer, checked here, closes that gap).

### 7.2 Indicative data model
```
signers        (id, public_label, created_at)
kgc_keys       (signer_id, K, K_prime, issued_at, qkd_session_id)
qkd_sessions   (id, party_a, party_b, basis_log, estimated_qber, accepted, timestamp)
signatures     (id, signer_id, sequence_no, P_digest, lambdas, h, teleport_run_id, status)
verifications  (signature_id, h_star, h_b_received, swap_test_shots, fidelity_estimate,
                hoeffding_bound, threshold_used, verdict, verified_at)
attack_events  (id, module2_scenario, target_signature_id, injected_by, detected, notes)
```

---

## 8. Open Design Questions and Future Work

### 8.1 The diagonal-gate forgery (Module 1 signing layer)
Confirmed numerically in §5.4/§5.6: any diagonal single-qubit gate applied identically to both
`|P⟩` and `|S⟩` survives verification with no knowledge of the secret key. Options, not yet
decided:
- Restrict Bob to only ever holding `|S⟩` (never `|P⟩` directly), removing his ability to apply
  a matched gate to both — partial mitigation, changes the protocol's message-space guarantees.
- Adopt the general `U(θ,φ,λ)` gate (θ ≠ 0) instead of the paper's simplified `U(0,0,λ)`,
  reintroducing amplitude rotation so gates no longer commute freely — increases circuit depth
  and decomposition cost (§ efficiency tables in the source paper).
- Treat this as a property Module 3's statistical layer should specifically test for (an
  explicit "matched-diagonal-gate" attack scenario in Module 2), since the encryption layer
  cannot rule it out by itself.

### 8.2 GHZ-based controlled teleportation (Module 1 transport layer)
The MDPI paper's structurally-embedded arbitrator (§2.3) is not merged into the main n-qubit
signing pipeline in this design — doing so credibly requires teleporting through a
multi-party entangled channel for every message qubit, which multiplies circuit size
significantly for a benefit (structural necessity of the arbitrator) that an actively-verifying
KGC already delivers operationally. Flagged as a Phase 2 extension, to be built as a smaller
standalone primitive first (a single-qubit, 4-party GHZ-based controlled teleportation
building block) before deciding whether to generalize it to the full protocol.

### 8.3 Scalability
Each teleported qubit needs 3 simulated qubits (message + 2 ancillas) at minimum, and the
encryption/verification circuits need the full `n`-qubit register simulated jointly (not
split per-qubit) because the CU chain entangles qubits together. This is tractable for
digest sizes in the tens of qubits (matching the paper's own 4-qubit demonstration) but will
not scale to, e.g., a 256-bit digest without either qubit-budget trade-offs (shorter digests,
accepting a smaller signature space) or a genuinely distributed/hardware backend rather than
local statevector simulation.

---

## 9. Glossary

| Term | Meaning |
|---|---|
| **AQS** | Arbitrated Quantum Signature — a signature scheme with a trusted third-party arbitrator |
| **KGC** | Key Generation Center — this project's arbitrator; generates keys, verifies signatures, resolves disputes |
| **QBER** | Quantum Bit Error Rate — fraction of mismatched measurement outcomes, used as the core statistical signal |
| **QOTP** | Quantum One-Time Pad — random per-qubit Pauli encryption, the older/weaker technique this project's signing layer replaces |
| **Swap test** | A circuit that estimates the fidelity between two quantum states without full state tomography |
| **CU / CP gate** | Controlled-phase gate; `CU(0,0,λ)` in this project's notation is a standard controlled-phase gate with angle `λ` |
| **Hoeffding bound** | A concentration inequality bounding how far a sample average can deviate from its expectation; used here to set deterministic accept/reject thresholds |

---

## 10. References

1. Ghosh, D., Roy, S., Bagchi, P., Chakrabarty, I., Das, A.K. — *Secure and Efficient Quantum
   Signature Scheme Based on the Controlled Unitary Operations Encryption*, arXiv:2507.10233
   (2025).
2. Lu, D., Li, Z., Yu, J., Han, Z. — *A Verifiable Arbitrated Quantum Signature Scheme Based on
   Controlled Quantum Teleportation*, Entropy 24(1):111 (2022).
3. Zhang, L., Sun, H.-W., Zhang, K.-J., Jia, H.-Y. — *An improved arbitrated quantum signature
   protocol based on the key-controlled chained CNOT encryption*, Quantum Inf Process 16, 70
   (2017).
4. Li, F.-G., Shi, J.-H. — *An arbitrated quantum signature protocol based on the chained CNOT
   operations encryption*, Quantum Inf Process 14(6), 2171–2181 (2015).
5. Gao, F., Qin, S.-J., Guo, F.-Z., Wen, Q.-Y. — *Cryptanalysis of the arbitrated quantum
   signature protocols*, Phys. Rev. A 84, 022344 (2011).
6. Gottesman, D., Chuang, I. — *Quantum digital signatures*, arXiv:quant-ph/0105032 (2001).
7. Buhrman, H., Cleve, R., Watrous, J., Wolf, R. — *Quantum Fingerprinting*, Phys. Rev. Lett.
   87, 167902 (2001). [swap test]
8. Bennett, C.H., Brassard, G. — BB84 QKD protocol (original 1984 conference paper;
   foundational reference for the QKD sub-protocol in §4.2.1).

---

*This document supersedes the informal project-context notes and the original 5-module
description by making explicit: the arbitrator's active role in every protocol phase, the QKD
sub-protocol needed for key distribution, the statistical formula behind Module 3's
"deterministic threshold bounds," and the known limitations of the signing layer inherited
from the source paper. No implementation code is included here by request; this is the
design reference the implementation will be built and tested against.*
