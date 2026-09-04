# Product Requirements Document (PRD)
## Online Verification & Intelligent Lifecycle Management System for Weighing and Measuring Instruments

**Problem Statement ID:** 26036
**Organization:** Ministry of Consumer Affairs, Food & Public Distribution
**Department:** Department of Consumer Affairs (DoCA)
**Category:** Software
**Doc version:** 1.0

---

## 1. Purpose

Define what we are building, for whom, and why, so that engineering, design, and the pitch stay in sync. This PRD is the source of truth — `app-flow.md`, `schema.md`, and `design.md` are all derived from it.

## 2. Problem Statement

Verification of weighing and measuring instruments today is manual and fragmented:

- Stakeholder registration, applications, scheduling, and assignment happen through disconnected/physical processes.
- Instrument, verification, and certificate records live in isolated systems.
- There is no single view of an instrument's full history.
- Certificate expiry, re-verification due dates, and enforcement pendency are hard to monitor.
- Certificates can be copied or misused with no live way to check authenticity.
- High-risk instruments aren't prioritized — everything is treated the same.

## 3. Product Vision

> Instead of treating a verification certificate as an isolated document, we give every instrument a **permanent Digital Instrument ID** and track its complete lifecycle — registration, ownership, verification, certification, complaints, risk, and re-verification — in one connected system, with a live QR-based trust check anyone can use.

**Core principle:** the *certificate* expires, gets renewed, or gets revoked. The *instrument identity* never does.

## 4. Goals & Non-Goals

**Goals (MVP / hackathon build):**
- Digitize the full verification lifecycle end-to-end for all five stakeholder roles.
- Give every instrument one permanent Digital Instrument ID.
- Issue QR-enabled certificates whose validity is checked live, not just printed.
- Give administrators a way to see pendency, expiry, and priority in one place.
- Ship 5–8 USP features that demonstrate the "digital twin + trust" story, not all 70.

**Non-goals (explicitly out of scope for MVP):**
- Fully automatic AI-driven assignment (assignment stays human/admin-controlled).
- Legally binding fraud determination — the system flags/explains anomalies, it does not adjudicate.
- Full offline sync and conflict resolution (Phase 3, only if time permits).
- Deep predictive ML models — start with rule-based risk/priority scoring.

## 5. Target Users / Roles

| Role | Primary Need |
|---|---|
| **Instrument Owner / Business** | Register instruments, apply for (re-)verification, track status, download certificates |
| **Manufacturer** | Create the initial digital identity of instruments they manufacture |
| **LMO (Legal Metrology Officer)** | Perform field verification, record results, work offline in the field |
| **GATC (Govt. Approved Test Centre)** | Same as LMO, centre-based |
| **Administrator / Department** | Assign cases, monitor pendency/risk/compliance, manage users |
| **Public / Consumer** | Scan QR to check instrument trust status, report suspicion |

Full role permissions are detailed in `app-flow.md`.

## 6. Functional Requirements (from Problem Statement)

Grouped from the official Basic Requirements (BR-01–BR-42):

**Access & Identity**
- Online registration for all stakeholder types, profile management, role-based secure login.

**Instrument & Applications**
- Instrument registration with specifications, photo upload, document upload.
- Online application for verification and re-verification.
- Workflow management, scheduling, assignment to LMO/GATC.

**Verification Execution**
- Digital entry of inspection observations, PASS/FAIL recording, mobile support for field officers.

**Certificates**
- Digital, QR-enabled certificate generation and authentication.
- Certificate and instrument repositories with search.
- Export/print facility.

**Compliance Monitoring**
- Certificate validity and re-verification due tracking.
- Automated expiry/renewal reminders.
- Pendency and enforcement monitoring.

**Dashboards & Reporting**
- Dedicated dashboards for Owner, LMO, GATC, and Admin.
- Search across records, exportable reports.

**Documentation**
- Technical architecture, security framework, and deployment methodology docs (delivered separately, referenced by this PRD).

## 7. USP Features — Prioritized

We are **not** building all 70 USPs. The hackathon MVP focuses on 8 that form one connected story:

1. **Instrument Digital Twin** — permanent ID + full lifecycle history.
2. **Dynamic QR Trust Verification** — QR hits a live server check, not a static payload.
3. **OCR Serial Number Identity Validation** — photo of serial number compared against registered record.
4. **Compliance Risk + Trust Score** — rule-based score from expiry, failures, complaints, anomalies.
5. **Admin Priority Flagging** — RED/YELLOW/GREEN case prioritization for the admin queue.
6. **"What Changed?" Re-verification Analysis** — side-by-side previous vs. current record on re-verification.
7. **Digital Chain of Custody + Audit Trail** — immutable event log, controlled corrections only.
8. **Public Consumer QR Verification + Complaint Reporting** — public-facing trust page + suspicion reports.

**Phase 2 (strong, if time allows):** duplicate registration detection, compliance readiness score, digital instrument passport, QR colour/trust status.

**Phase 3 (stretch, only if time permits):** offline-first field verification + conflict detection, certificate cloning detection, document consistency check, compliance heatmap, network-based fraud detection, AI inspection summary, zero-trust verification, full command center.

Full checklist tracking of all 70 USPs is preserved in the original master doc for reference but is **not** an MVP commitment.

## 8. Key Design Decisions (guardrails)

- **Assignment is admin-controlled**, not auto-assigned by AI. The system may *recommend*, the human decides.
- **The officer makes the final PASS/FAIL call.** AI assistance during field verification only surfaces missing checks/inconsistencies — it never overrides a human decision.
- **Corrections never overwrite history.** Original records are preserved; corrections are new audited events.
- **Repair/modification does not automatically trigger re-verification** — the system flags it for review; the actual requirement follows applicable Legal Metrology rules.
- **Colour is never the only trust signal.** Every RED/YELLOW/GREEN status always ships with an explicit text label, for accessibility and to avoid "black box" flags (see USP-53, Fraud-Suspicion Explanation Panel).
- **Public view is privacy-restricted** — consumers see certificate/trust status only, never full owner/business data.

## 9. Success Metrics (for demo / evaluation)

- End-to-end flow (registration → verification → certificate → QR scan → risk change → priority flag → re-verification) runs without manual data entry gaps.
- QR scan reflects a status change (e.g., after a complaint) within the same demo session — proving it's *live*, not static.
- Admin dashboard surfaces at least one correctly prioritized high-risk case driven by real data (expiry + complaint + failure).
- Every AI-assisted decision (OCR, risk score, anomaly flag) is explainable in one line, not a black box.

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Over-scoping (trying to build all 70 USPs) | Hard MVP cut to 8 features (Section 7); everything else documented but deprioritized |
| OCR misreads serial numbers | Always shown to officer for confirmation, never auto-applied |
| Risk/priority score looks like a "black box" | Every flag ships with a explanation panel (contributing factors listed) |
| Certificate photocopy/reuse | QR always does a live server lookup, never trusts embedded static data |
| Scope creep during build | Phase 1/2/3 priority list in Section 7 is the single source of truth for what to cut first |

## 11. Related Documents

- `app-flow.md` — screen-by-screen flow per role and system state machines
- `schema.md` — database entities and relationships
- `design.md` — visual design system and UI guidelines
- Stitch prompt (provided separately) — for generating dashboard UI mockups
