# Module 3: Deterministic Threat Detection Engine

**Project:** Quantum-Inspired Cyber Threat Detection Framework (SIH26141)
**Sub-system:** Statistical Verification & Threat-Scoring Stack
**Primary Technologies:** Python, NumPy, SciPy (`scipy.stats.binom`) — explicitly **no**
AI/ML libraries or trained models of any kind.

> **Derived from:** `QDS_Protocol_Specification_Research.md` §7 and
> `QDS_Protocol_Specification_Qiskit.md` §7/§10.3. This document is the Module 3 equivalent of
> `context_updated.md` (Module 1).

## 1. Overview
This module is where the SOC testbed's central design constraint lives: every verdict on a
signature — genuine, tampered, forged — must reduce to a **closed-form, deterministic
probability bound**, never a learned classifier. It receives the raw measurement outcomes
Module 1 produces after a signature has (possibly) passed through Module 2's noisy/adversarial
network, and it is the only module that gets to say "accept" or "reject."

Because there is no arbitrator (KGC) in this protocol, this module is not a supporting cast
member to some other verification mechanism — it *is* the verification mechanism. Bob's
"projective measurement against a quantum public key" (Module 1 §4.5) only becomes a verdict
once Module 3 has scored it.

## 2. The Statistical Detection Model

### 2.1 The problem this module exists to solve
Hardware noise (Module 2's `T1`/`T2`/depolarizing sources) and an active attacker (Module 2's
Red Team) both raise the observed error rate between what Bob measures and what he expected
(§4.2 of the protocol specifications' `expected_bits`). This module must tell the two apart
using only a pre-derivable bound, with a known false-positive rate fixed in advance.

### 2.2 Inputs this module consumes
- `m`: number of measurement trials (comparisons Bob has made against `expected_bits`).
- `k`: number of mismatches observed, out of `m`.
- `q₀`: the calibrated baseline QBER for the current channel/noise configuration (honest,
  no-attacker conditions) — see §3.

### 2.3 The two bounds this module implements
| Function | Formula | Use |
|---|---|---|
| **Exact binomial tail** | `1 − binom.cdf(k − 1, m, q₀)` | The probability of observing `k` or more mismatches by chance alone, under the null hypothesis that the channel is honest with baseline error `q₀`. This is the "exact forgery probability" reported to the analyst. |
| **Hoeffding concentration bound** | `threshold = q₀ + √(ln(1/α) / 2m)`, for a target false-positive rate `α` (e.g. `10⁻⁶`) | A pre-computable accept/reject threshold, solved once per `(m, q₀, α)` configuration rather than evaluated per-observation. |

Both are implemented; the module reports whichever is tighter for the given sample size, along
with the raw observed QBER, so the verdict is always accompanied by its own justification —
not just a pass/fail flag.

### 2.4 Verdict logic
```
observed QBER = k / m
if observed QBER > threshold:
    verdict = REJECT  (report the exact tail probability as the forgery-probability score)
else:
    verdict = ACCEPT
```

## 3. Calibration Procedure (establishing `q₀`)
`q₀` is not a single global constant — it must be calibrated **per Module 2 noise
configuration**, since a channel with heavier `T1`/`T2` decay or more `qc.cx()` depolarizing
error will legitimately produce a higher honest-condition QBER than a clean channel.

1. Run signing/verification cycles with Module 2's Red Team disabled, across the full range of
   noise configurations Module 2 exposes.
2. Record the resulting QBER distribution for each configuration.
3. Store `q₀` (and its variance) per configuration, indexed the same way Module 2 indexes its
   noise-model presets, so a given production run can look up the correct baseline rather than
   comparing against a single, possibly-wrong global figure.

## 4. Distinguishing "Attack" from "Hardware Noise" (open problem, documented not solved)
The bound in §2 only establishes that an observed error rate is anomalous relative to the
calibrated `q₀` — not *why*. This module currently has no closed-form way to separate an
intercept-resend attack from an unusually noisy but honest channel, beyond recalibrating `q₀`
per configuration. Two directions flagged for future work (see both specification documents'
"Future Scope" sections):
- Whether intercept-resend and pure decoherence noise leave statistically distinguishable
  *patterns* across the Z/X-basis comparisons already being collected (not just different QBER
  magnitudes).
- Whether such a pattern-level test can itself be expressed in closed form, consistent with
  the no-ML constraint.

## 5. Evaluation Methodology
Before this module is considered validated (see the stress-test plan in
`QDS_Protocol_Specification_Qiskit.md` §10.3 for the exact procedure):
- **False-positive rate** under pure-noise runs (Red Team disabled), across the calibrated
  noise range — should track the configured `α` within sampling error.
- **Detection rate** under each Module 2 attack scenario (forgery, impersonation, replay,
  tampering) at varying attacker sophistication (e.g. 5% / 25% / 75% interception).
- **Sample-size sensitivity** — how large `m` needs to be before the Hoeffding bound is
  practically tight enough to be useful (too small `m` gives a threshold so loose it never
  rejects anything; too large `m` costs latency and qubits).
- **Classical-bit tampering sensitivity** — with artificial bit-flips injected directly into
  the `(m₁, m₂)` correction-bit stream (bypassing the quantum channel entirely), the exact
  binomial score must drop below the configured threshold (e.g. `p < 10⁻⁶`) essentially
  immediately, confirming the module reacts to classical-layer tampering, not just quantum
  channel degradation.

## 6. Objectives & Scope
- Implement the exact-binomial and Hoeffding-bound scoring functions described in §2.
- Implement the per-configuration calibration store described in §3.
- Produce, for every verification, a full record: observed QBER, `m`, `k`, `q₀` used, the
  threshold applied, the resulting forgery-probability score, and the final verdict — not a
  bare boolean.
- Explicitly exclude any machine-learned or heuristic-trained component from the verdict path.

## 7. Expected Deliverables
1. `threat_detection.py` (or similar) implementing `forgery_probability()` and
   `hoeffding_threshold()` per the formulas in §2.3, plus the calibration lookup from §3.
2. A calibration dataset/script that runs the honest-condition sweep described in §3 and
   persists `q₀` per Module 2 noise configuration.
3. A benchmark suite implementing the evaluation methodology in §5 (false-positive rate,
   detection rate, sample-size sensitivity, classical-bit tampering sensitivity).

## 8. Integration Touchpoints
- **Inputs:** measurement outcomes and the active noise/attack configuration from Module 2
  (via Module 1's execution); `expected_bits`/`basis_schedule` from Module 1's handshake phase.
- **Outputs:** the full verdict record (§6) to Module 4 for persistence in the `verifications`
  table, and to Module 5 via the live telemetry WebSocket stream for real-time analyst display.
