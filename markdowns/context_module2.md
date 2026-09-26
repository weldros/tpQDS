# Module 2: Network Topology & Cyber Attack Simulation

**Project:** Quantum-Inspired Cyber Threat Detection Framework (SIH26141)
**Sub-system:** Network Simulation & Adversarial Testing Stack
**Primary Technologies:** Python, QuNetSim, `qiskit-aer` (noise models, via Module 1)

> **Derived from:** `QDS_Protocol_Specification_Research.md` §6 and
> `QDS_Protocol_Specification_Qiskit.md` §6/§10.2. This document is the Module 2 equivalent of
> `context_updated.md` (Module 1) — the standalone context a developer building this module
> needs, without having to re-derive it from the full protocol specification.

## 1. Overview
This module places Module 1's teleportation circuit — the pinned six-step Bell-pair/CNOT/
Hadamard/measurement/correction sequence — inside a simulated quantum network that is neither
noiseless nor trustworthy. Where Module 1 validates the protocol's physics in isolation, this
module answers the harder question: *does the protocol still work, and does it still detect
attacks, once the channel between Alice and Bob is realistic?* It is the "Red Team" layer of
the SOC testbed, and its output is what Module 3 actually has to make deterministic sense of.

There is no arbitrator/KGC anywhere in this design (see §3 of the protocol specification for
why) — Module 2's attacker model is accordingly an **external eavesdropper (Eve)** on the
channel, not a dishonest Bob. This distinction matters for which attacks are meaningful to
simulate here (§4).

## 2. The Network Topology
- **Hosts:** Alice (signer), Bob (verifier), and Eve (Red Team / interceptor), modeled as
  QuNetSim `Host` objects on a `QuantumNetwork`.
- **Channel:** the entangled Bell pairs and the classical correction-bit stream `(m₁, m₂)`
  produced by Module 1's teleportation circuit both traverse this network — the classical
  bits are just as much an attack surface as the qubits (see §4).
- **Relay policy (binding, not optional):** any intermediate node this topology ever grows to
  include between Alice and Bob **must** be a genuine quantum repeater performing entanglement
  swapping (Bell State Measurement on its own ancilla qubits only), never a "trusted node"
  that measures and re-prepares the payload. A trusted node would reintroduce exactly the
  centralized point of compromise the non-arbitrated protocol was designed to avoid — whoever
  controls that node would see the plaintext signature. This is a hard architectural
  constraint, not a future nice-to-have (see the Future Scope section of both specification
  documents, §11/§12, for the full argument and the entanglement-swapping mechanics).

## 3. Noise Injection Model
Module 2 is responsible for deciding *what noise a given simulation run experiences*; Module 1
is responsible for actually running the noisy circuit (via a `qiskit_aer.noise.NoiseModel`
passed to its `AerSimulator`). The noise sources this module must be able to configure:

| Noise source | Physical meaning | Mechanism |
|---|---|---|
| `T1` relaxation | Qubit decaying from `\|1⟩` to `\|0⟩` over time | Thermal relaxation error on idle/gate time |
| `T2` dephasing | Loss of phase coherence between `\|0⟩` and `\|1⟩` | Dephasing error, typically faster than `T1` |
| Two-qubit depolarizing error | CNOT gates are noisier than single-qubit gates | Depolarizing channel applied after each `qc.cx()` in the teleportation circuit |
| Interception (Eve) | Not decoherence — an active measurement | Eve's own projective measurement on a fraction of in-transit qubits, followed by re-preparation and forwarding |

The first three are "honest" noise sources Module 3 must learn to tolerate (§6); the fourth is
the attack Module 3 must learn to catch. Distinguishing the two from measurement statistics
alone is an explicitly open problem (see the Limitations sections of both specification
documents) — Module 2's job is to make each source configurable and independently toggleable
so that Module 3 can be benchmarked against them separately.

## 4. Attack Scenarios to Simulate
Framed against the actual threat model (external Eve; there is no dishonest-verifier scenario
to defend against here, since Bob has nothing to gain by lying to himself):

| Scenario | What Eve does | What should happen |
|---|---|---|
| **Signature forgery** | Attempts to produce a `q_B` state that passes Bob's verification without ever legitimately receiving Alice's teleported qubits | Fails — no-cloning prevents copying an unknown state; QBER against `expected_bits` spikes |
| **Impersonation** | Attempts to initiate a signing session as Alice without knowledge of the shared seed `s` | Fails at the BB84 handshake stage (Module 1 §4.6) — no valid basis/key agreement is reached |
| **Replay** | Resubmits a previously captured, legitimate `(m₁, m₂)` correction-bit set against a new/different message | Caught classically by Module 4's per-signer sequence-number check, independent of the quantum layer |
| **Channel tampering** | Applies unauthorized operations to the entangled channel in transit (intercept-resend at a configurable rate) | Introduces detectable error into the reconstructed state; QBER rises in proportion to interception rate |

**Interception rate as a first-class parameter:** the Red Team node should support intercept-
resend at configurable rates (e.g. 5%, 25%, 75% of traffic) so that Module 3 can be validated
against a range of attacker strengths, not just "attack present / absent" — see the stress-test
plan in `QDS_Protocol_Specification_Qiskit.md` §10.2 for the exact benchmark procedure this
supports.

## 5. Objectives & Scope
- Model a configurable-noise quantum network topology between Alice and Bob using QuNetSim.
- Route Module 1's teleported qubits and classical correction bits through this topology
  before they reach Bob, so Module 3 always evaluates realistically-degraded data.
- Implement a Red Team host capable of intercept-resend attacks at a tunable rate, replay of
  captured classical bits, and independent tampering with the quantum vs. classical channel.
- Stress the network layer itself under load (EPR-pair generation rate under rapid consecutive
  teleportation requests — see the stress-test plan) to surface routing/queueing bottlenecks
  before they are mistaken for cryptographic failures downstream.

## 6. Expected Deliverables
1. A QuNetSim network topology script (`network_topology.py` or similar) instantiating Alice,
   Bob, and an Eve/Red-Team host, with configurable noise parameters.
2. A Red Team interception module supporting configurable intercept-resend rates, replay, and
   independent quantum/classical channel tampering.
3. A bridge layer connecting QuNetSim's routing simulation to Module 1's `AerSimulator` calls,
   so that a given network configuration maps deterministically to a `qiskit_aer.noise.NoiseModel`.
4. Benchmark scripts implementing the stress tests in `QDS_Protocol_Specification_Qiskit.md`
   §10.2 (EPR source depletion, intercept-resend rate accuracy logging).

## 7. Integration Touchpoints
- **Inputs:** teleported qubits and `(m₁, m₂)` classical correction-bit streams from Module 1,
  per signature, per trial.
- **Outputs:** possibly-degraded/attacked qubits and classical bits delivered to Bob's side of
  Module 1's verification circuit; a log of which attack/noise configuration was active for a
  given run, consumed by Module 3 (for calibration, §3 of the Module 3 context) and Module 4
  (for the `attack_events` audit table).
