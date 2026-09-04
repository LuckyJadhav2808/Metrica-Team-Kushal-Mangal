# Dashboard Specification
## What appears on each role's dashboard, module by module

Companion to `prd.md`, `app-flow.md`, `schema.md`, and `design.md`. This is the doc
you hand to whoever is building or designing each screen — it says exactly what
goes where, per role, so nothing gets mixed up between dashboards.

---

## 1. Owner / Business Dashboard

**Purpose:** let an instrument owner manage their own instruments and applications — nothing else.

**Top summary strip (KPI cards)**
- Total Instruments
- Active Certificates
- Pending Applications
- Expiring Soon (next 30 days)

**Main modules**
| Module | Contents | Actions |
|---|---|---|
| My Instruments | Grid/list of owned instruments — thumbnail, Digital Instrument ID, serial number, status badge, last verified date | View detail, Apply for Re-verification |
| Instrument Detail | Digital Instrument ID header, specs, ownership history, verification history, certificates, compliance status | Download certificate, Report repair/modification |
| Apply for Verification | Form: select instrument → confirm specs → upload documents/photos | Submit application |
| Compliance Readiness Meter | Progress bar (%) + list of missing items before submission | Fix & resubmit |
| Applications | List of all applications with status (DRAFT → SUBMITTED → ... → VERIFIED/FAILED) | View status, resume draft |
| Certificates | Repository of all issued certificates | Download, print, view QR |
| Expiry Alerts | List of certificates expiring soon / re-verification due | Apply for re-verification directly |
| Verification History | Read-only timeline per instrument | View evidence, view officer remarks |
| Upload Documents | Central document manager (invoices, ID proof, etc.) | Upload, replace |

**Explicitly NOT on this dashboard:** other owners' instruments, risk/anomaly internals, officer workload, admin assignment tools.

---

## 2. Manufacturer Dashboard

**Purpose:** create initial instrument identity only — not verification.

**Top summary strip**
- Registered Models
- Instruments Registered
- Unclaimed Instruments
- Claimed Instruments

**Main modules**
| Module | Contents | Actions |
|---|---|---|
| Register Model | Model name, category, default capacity/spec template | Save model |
| Register Instrument / Batch | Select model → add serial number(s) → specs | Generate Digital Instrument ID(s) |
| Add Serial Numbers | Bulk entry for batch registration | Add, validate uniqueness |
| Registered Instruments | List with status (MANUFACTURED/UNCLAIMED, OWNED, etc.) | View lifecycle status |
| Lifecycle Status View | Read-only — where each unit currently is in its lifecycle | — |

**Explicitly NOT on this dashboard:** verification actions, PASS/FAIL, certificates — a manufacturer registration is *identity only*, never legal verification (per PRD Section 8 guardrails).

---

## 3. LMO / GATC Dashboard (field officer)

**Purpose:** perform verification in the field, ideally on a tablet, with offline support.

**Top summary strip**
- Assigned Cases (today)
- Upcoming Verifications (this week)
- Cases Requiring Sync (offline queue)

**Main modules**
| Module | Contents | Actions |
|---|---|---|
| Assigned Applications | List of cases assigned to this officer, sorted by scheduled date/priority | Open case |
| Instrument History | Full read-only history for the instrument under verification | Reference before inspecting |
| Field Verification (Adaptive Checklist) | Checklist that changes fields based on instrument type/category/capacity | Fill in observations |
| Serial Number / Identity Check | Camera capture → OCR extraction → compare to registered record | Confirm/override OCR result |
| Record Observations | Structured fields per checklist item | Save draft |
| Evidence Upload | Photos/documents tied to this verification | Upload, tag |
| "Compare with Previous Record" | Side-by-side previous vs. current (ownership, location, specs, photos) — shown only for re-verification | View diff |
| Submit PASS / FAIL | Two large clear buttons; officer decision is final | Submit result |
| Offline Mode Indicator | Persistent banner when offline; queued items awaiting sync | Manual sync trigger when back online |

**Explicitly NOT on this dashboard:** assignment tools (admin-only), other officers' workload, risk-score internals beyond what's relevant to this case.

---

## 4. Administrator Dashboard (command center)

**Purpose:** monitor, assign, and prioritize across the entire system — the only dense, data-heavy dashboard.

**Top summary strip (KPI cards)**
- Pending Assignments
- High Priority Cases (RED)
- Expiring This Week
- Open Complaints
- Officer Workload (avg. cases/officer)

**Main modules**
| Module | Contents | Actions |
|---|---|---|
| Pending Applications | Queue of applications awaiting assignment | Open, view readiness score |
| Assign LMO/GATC | Assignment screen — shows officer location/workload/expertise as *recommendations only* | Confirm assignment (admin decision is final) |
| Reassign Cases | List of in-progress cases | Reassign with reason |
| Pendency Monitoring | Applications stuck at each stage, with age/duration | Escalate |
| Expiring Instruments | Instruments nearing/at certificate expiry | Trigger reminder, prioritize |
| High-Risk Cases / Priority Flags | Sortable table: Instrument ID, Owner, Status, Risk Level (RED/YELLOW/GREEN chip + text), Expiry Date | Assign, escalate |
| "Why Flagged?" Explanation Panel | Expandable panel per flagged case listing plain-language contributing factors | Read-only, informs action |
| Complaints | List of consumer/owner complaints, clustered by pattern | Review, mark resolved/dismissed |
| Compliance Heatmap | Geographic view of expired/pending/failed/high-risk concentration | Filter by jurisdiction |
| Anomaly Timeline | Chronological view of anomalies across the system (not just one instrument) | Investigate |
| Officer Workload | Table of LMO/GATC officers with current case counts | Rebalance assignments |
| User Management | Manage Owners, Manufacturers, LMOs, GATCs — approve/deactivate | Add, edit, deactivate |
| Command Center Summary | Combined view pulling together risk, pendency, complaints, and workload for a single-glance status | — |

**Explicitly NOT on this dashboard:** nothing is hidden from admin — this is the one role with full visibility (per role permissions), but always privacy-filtered per `schema.md`/`design.md` rules (no raw personal scanner data, etc.).

---

## 5. Public QR Verification Page

**Purpose:** single-purpose, no login, no navigation — shown immediately after a QR scan.

**Contents (in order, top to bottom)**
1. Large status badge — colour + explicit text (e.g., "VERIFIED", "ATTENTION REQUIRED", "EXPIRED")
2. Digital Instrument ID (public-safe identifier, not internal DB id)
3. Instrument basic details (type/category — no owner PII)
4. Certificate validity ("Valid Until: XX/XX/XXXX")
5. Last verification date
6. Trust/compliance indicator (colour-coded, text-labeled)
7. "Report an Issue" button → opens Suspicion Reporting form

**Suspicion Reporting form (secondary screen)**
- Category (Incorrect Measurement / Suspicious Certificate / Possible Tampering / Other)
- Description (free text)
- Optional photo
- Submit (goes to Complaint entity, clustered before it affects priority)

**Explicitly NOT on this page:** owner name/contact, business details, internal risk score number, verification officer identity, any admin/LMO data.

---

## 6. Cross-Dashboard Rules (apply to all)

- Every status shown anywhere carries a text label, never colour alone.
- Any AI-assisted output (OCR result, risk score, anomaly flag) is shown with its
  reasoning, never as a bare unexplained verdict.
- No dashboard shows another role's private data — enforced by the privacy-aware
  role-based views described in `prd.md` and `schema.md`.
- Only the Admin dashboard performs assignment; only the LMO/GATC dashboard submits
  PASS/FAIL; only the Owner dashboard submits applications. Roles don't overlap on
  write actions, only on read visibility where relevant (e.g., Owner and Admin both
  see the same certificate, but only Admin sees the risk explanation panel).
