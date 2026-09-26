# Module 4: Backend Orchestration & Data Persistence

**Project:** Quantum-Inspired Cyber Threat Detection Framework (SIH26141)
**Sub-system:** API, Persistence, and Identity Stack
**Primary Technologies:** Python, FastAPI, PostgreSQL, WebSockets, JWT-based auth

> **Derived from:** `QDS_Protocol_Specification_Research.md` §8 and
> `QDS_Protocol_Specification_Qiskit.md` §8. This document is the Module 4 equivalent of
> `context_updated.md` (Module 1).

## 1. Overview
This module is the classical spine of the system: every other module either calls into it or
is orchestrated by it. It routes requests between the React UI, the Qiskit physics engine
(Module 1), and QuNetSim (Module 2); it persists every signature, verification, and attack
event; and — new in this revision — it owns the **authentication and authorization boundary**
the whole protocol's non-repudiation claim actually depends on (§3).

Because this project's QDS protocol is **non-arbitrated** (no KGC), the responsibilities a KGC
would normally hold — proof storage, identity binding, dispute evidence — all land here
instead. This module is not just infrastructure; it is where the protocol's classical-layer
security guarantees are made real or broken.

## 2. Core Responsibilities
- REST/WebSocket orchestration between the React UI, the Qiskit engine, and QuNetSim.
- Persist every signature attempt: the classical correction-bit stream `(m₁, m₂)` per qubit
  per trial, the computed QBER, the calibration baseline and threshold Module 3 used, the
  resulting forgery-probability score, and the final verdict.
- Persist QKD session records (Module 1 §4.6): basis-reconciliation logs and estimated channel
  QBER per key-exchange session between Alice and Bob.
- Maintain a monotonically increasing sequence number per signer, so replay attacks (Module 2
  §4) are classically detectable independent of anything the quantum layer catches.
- Record full audit/forensic logs of every Module 3 verdict with its complete statistical
  justification — never a bare pass/fail flag with no supporting record.

## 3. User Authentication & Authorization

This is the load-bearing addition in this revision. The protocol's non-repudiation argument
(§4.7 of both specification documents) only holds if the identity attached to a signing or
verifying action is genuinely the party who performed it — which is an authentication
guarantee, not a quantum one.

### 3.1 Authentication
- Registration/login with `argon2` (or `bcrypt`) password hashing — plaintext or reversibly
  encrypted password storage is not acceptable here, given what rides on this layer.
- Session issuance via short-lived JWT access tokens plus longer-lived, **revocable** refresh
  tokens. Revocability matters specifically because a compromised session should not remain a
  valid non-repudiation anchor indefinitely — an unrevocable token would mean a stolen session
  could go on "proving" actions the real user never took.
- WebSocket connections authenticate at handshake time (token passed as a query parameter or
  `Sec-WebSocket-Protocol` header), validated **before** `websocket.accept()` is called — the
  live telemetry stream (Module 5) is not a public read.

### 3.2 Authorization (role-based access control)
| Role | Capabilities |
|---|---|
| `signer` | Initiate signing sessions as "Alice"; view own signature history |
| `verifier` | Receive and verify teleported signatures as "Bob"; view own verification history |
| `analyst` | Read-only access to SOC dashboard threat logs and telemetry across all sessions (not signing/verification actions themselves) |
| `admin` | User management, QuNetSim scenario configuration, full audit-log access |

- Every endpoint is protected by a dependency-injected guard checking both authentication
  (valid, unexpired, non-revoked token) and authorization (the caller's role permits the
  requested action).
- **Hard requirement, not a style preference:** the user field on every persisted signature or
  verification record must be populated from the authenticated principal server-side, never
  from a client-supplied field in the request body. This is the specific implementation detail
  that makes the non-repudiation argument (§4.7 of the protocol specs) hold in practice — a
  client-supplied identity field would let anyone attribute an action to anyone else.

## 4. Indicative Data Model
```
users            (id, username, password_hash, role, created_at)
sessions         (id, user_id, token_id, issued_at, expires_at, revoked_at)
qkd_sessions     (id, alice_user_id, bob_user_id, basis_log, estimated_qber, accepted, timestamp)
signatures       (id, alice_user_id, sequence_no, message_digest, basis_schedule, expected_bits,
                  created_at)
verifications    (signature_id, bob_user_id, observed_qber, m_trials, k_mismatches,
                  hoeffding_bound, threshold_used, verdict, verified_at)
correction_bits  (signature_id, trial_no, qubit_index, m1, m2, logged_at)   -- the non-repudiation receipt
attack_events    (id, module2_scenario, target_signature_id, injected_by, detected, notes)
```
The `correction_bits` table is the direct implementation of §4.7's "classical receipt" — it is
what a dispute would actually be resolved against, in the absence of any arbitrator.

## 5. Indicative API Surface
| Endpoint | Auth required | Role | Purpose |
|---|---|---|---|
| `POST /register`, `POST /token` | No / No | — | Account creation, login (issues JWT pair) |
| `POST /signatures` | Yes | `signer` | Triggers Module 1's signature/teleportation run |
| `POST /verifications` | Yes | `verifier` | Triggers Module 1's verification measurement + Module 3's scoring |
| `GET /signatures/{id}`, `GET /verifications/{id}` | Yes | owner or `analyst`/`admin` | Retrieve a specific record |
| `GET /ws/telemetry` | Yes (token at handshake) | `analyst`/`admin` (broad view); `signer`/`verifier` (own records only) | Live streaming for Module 5 |
| `GET /audit/attack-events` | Yes | `admin` | Full attack-event log |

## 6. Objectives & Scope
- Provide a single, authenticated orchestration point between the UI and every simulation
  module, so no module is ever reachable except through an authenticated, authorized request.
- Persist a complete, queryable record of every signature, verification, QKD session, and
  attack event — sufficient to reconstruct and audit any past dispute.
- Own the authentication/authorization boundary described in §3, treating it as a security
  requirement of the protocol itself, not an unrelated web-app feature.

## 7. Expected Deliverables
1. A FastAPI application implementing the endpoints in §5, with dependency-injected auth guards
   on every protected route.
2. A PostgreSQL schema implementing §4, with the `correction_bits` table specifically reviewed
   for append-only/immutability guarantees (no update or delete path exposed once a record is
   written).
3. A background-task-based bridge to Modules 1–3, so long-running physics-engine calls do not
   block the FastAPI event loop (see the full-stack stress-test plan in
   `QDS_Protocol_Specification_Qiskit.md` §10.4).
4. WebSocket handling for Module 5's live telemetry, authenticated at handshake time.

## 8. Integration Touchpoints
- **Inputs:** signing/verification requests from Module 5 (via the authenticated React UI);
  execution results from Modules 1–3.
- **Outputs:** persisted records (§4) queryable by Module 5; live telemetry pushed over
  WebSocket to Module 5; the authenticated-identity binding every other module's security
  argument (§4.7 of the protocol specs) ultimately rests on.
