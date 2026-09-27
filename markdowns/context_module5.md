# Module 5: Real-Time SOC Observability UI

**Project:** Quantum-Inspired Cyber Threat Detection Framework (SIH26141)
**Sub-system:** Analyst-Facing Web Application
**Primary Technologies:** React, WebSockets, JWT-based session handling

> **Derived from:** `QDS_Protocol_Specification_Research.md` §9 and
> `QDS_Protocol_Specification_Qiskit.md` §9. This document is the Module 5 equivalent of
> `context_updated.md` (Module 1).

## 1. Overview
This module is the only part of the system a human ever looks at directly. It turns Module 3's
deterministic verdicts, Module 2's attack/noise telemetry, and Module 4's persisted records
into something a SOC analyst can act on in real time. Everything here sits behind the same
authentication boundary Module 4 owns (§3) — there is no unauthenticated view of any
signature, verification, or threat data, since this dashboard is the visible surface of a
system whose non-repudiation claims depend on knowing exactly who is looking at, and who
triggered, every event it displays.

## 2. Core Responsibilities
- Consume live, authenticated WebSocket streams from Module 4 to render quantum channel
  telemetry, verification verdicts, and threat alerts as they occur — not on a polling delay.
- Host a **Signature Verification Dashboard**: verification accuracy metrics over time, QBER
  trend charts, and per-signature basis/expected-outcome comparisons (Module 1 §4.5 /
  Module 3 §2).
- Display **real-time Threat Detection Logs**, sourced exclusively from Module 3's deterministic
  evaluations — every alert shown must carry the forgery-probability score and the threshold it
  was evaluated against (Module 3 §2.3), never a bare "flagged" label with no statistical
  backing, since the whole point of Module 3 is that its verdicts are justified, not opaque.

## 3. Authentication & Session Model
- **Login flow:** a login form posts credentials to Module 4's `POST /token` endpoint; the
  returned access token is held in memory, and the refresh token is stored in a secure,
  `httpOnly` cookie rather than `localStorage` — this reduces the blast radius of an XSS attack
  against the longer-lived credential.
- **Protected routing:** every dashboard route is wrapped in a guard that checks token validity
  before rendering; an expired or missing token redirects to login rather than rendering a
  partially-populated or stale view.
- **Session expiry handling:** expiry or revocation is surfaced explicitly in the UI (forced
  re-authentication), distinct from a dropped network connection — an analyst should never
  mistake a silently-stale, no-longer-updating dashboard for a live one, since a threat alert
  that stopped updating five minutes ago is worse than no dashboard at all.
- **WebSocket reconnection:** on disconnect, the client reconnects using the current valid
  token; if the token itself has expired, the UI shows "session expired," not "connection
  lost" — these require different actions from the analyst (re-login vs. wait/retry).

## 4. Role-Based Views
| Role | What they see |
|---|---|
| `signer` | Their own signature history and status |
| `verifier` | Their own verification history and status |
| `analyst` | Aggregate threat logs and telemetry across all sessions (read-only; cannot initiate signing/verification actions) |
| `admin` | Everything `analyst` sees, plus user management and QuNetSim scenario/noise-configuration controls |

Views are driven by the `role` claim decoded from the current JWT (or a `/me` lookup on load),
matching the role table Module 4 enforces server-side (§3.2 of the Module 4 context) — the UI
role check is a usability feature, not the actual security boundary, which lives in Module 4's
endpoint guards.

## 5. Telemetry & Visualization Surfaces
- **Live channel telemetry:** state-vector/measurement-outcome visualizations streamed as
  Module 1/2 produce them, so an analyst can watch a signature move through
  entanglement-generation → teleportation → correction in something close to real time.
- **QBER trend view:** the observed QBER, the calibrated baseline `q₀`, and the active
  threshold from Module 3, plotted together, so a spike is visually obvious against its own
  baseline rather than against a single fixed line.
- **Threat alert feed:** one entry per Module 3 verdict of `REJECT`, each showing the
  associated Module 2 attack/noise configuration if known (from the `attack_events` table),
  the forgery-probability score, and a link to the full audit record (Module 4 §4).

## 6. Objectives & Scope
- Provide a single authenticated web surface for every signer/verifier/analyst/admin
  interaction with the system — no direct access to Modules 1–4 outside this UI or Module 4's
  API directly.
- Make Module 3's statistical justification for every verdict visible, not just its conclusion.
- Fail safely and visibly on session expiry, rather than silently degrading into a stale view.

## 7. Expected Deliverables
1. A React application implementing the login flow, protected routing, and role-based views
   described in §3–§4.
2. A WebSocket client layer implementing the reconnection/session-expiry handling in §3.
3. Dashboard components for the three telemetry surfaces in §5 (live channel telemetry, QBER
   trend view, threat alert feed).
4. Manual/automated checks corresponding to the full-stack stress test in
   `QDS_Protocol_Specification_Qiskit.md` §10.4 — specifically, verifying WebSocket stream
   integrity and no desynchronization from Module 4's PostgreSQL-backed state under load.

## 8. Integration Touchpoints
- **Inputs:** authenticated REST responses and WebSocket telemetry from Module 4 (which in turn
  aggregates Modules 1–3's output).
- **Outputs:** signing/verification action requests submitted back to Module 4 on behalf of the
  authenticated user; no direct calls to Modules 1–3 bypass Module 4's orchestration/auth layer.
