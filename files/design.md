# Design System & UI Guidelines
## Online Verification & Intelligent Lifecycle Management System

Companion to `prd.md` and `app-flow.md`. Defines the visual language for a
government-facing trust platform — needs to read as credible, official, and calm,
not like a consumer startup app.

---

## 1. Design Principles

1. **Trust over decoration.** This is a compliance/regulatory tool. Clean, dense
   information layouts beat flashy visuals.
2. **Status is always readable without colour.** Every RED/YELLOW/GREEN indicator
   ships with an explicit text label (accessibility + no false confidence in colour alone).
3. **Role-appropriate density.** Owner screens are simple and guided. Admin/LMO
   screens are data-dense, built for daily operational use.
4. **Explainable, never a black box.** Any AI-assisted flag (risk score, OCR mismatch,
   anomaly) shows *why* right next to the flag — never just a bare label.
5. **Officer/human decision is always the final, explicit action** — never
   auto-submitted on the officer's behalf.

## 2. Colour System

**Base palette**
| Token | Hex (suggested) | Use |
|---|---|---|
| `--color-primary` | #1A4D8F | primary actions, headers, links (institutional blue) |
| `--color-primary-dark` | #0F3363 | hover/active states, admin nav |
| `--color-neutral-900` | #12161C | primary text |
| `--color-neutral-600` | #5B6472 | secondary text |
| `--color-neutral-100` | #F4F6F8 | page background |
| `--color-surface` | #FFFFFF | card/panel background |
| `--color-border` | #E2E6EA | dividers, card borders |

**Status colours (trust/risk/priority — used consistently everywhere)**
| Token | Hex | Meaning |
|---|---|---|
| `--color-status-green` | #1E8E5A | Valid / Low Risk / Verified / Low Priority |
| `--color-status-yellow` | #B8860B | Nearing expiry / Medium Risk / Requires Attention |
| `--color-status-red` | #C4362B | Expired / High Risk / Suspicious / High Priority |
| `--color-status-neutral` | #6B7280 | Pending / Not yet verified / Draft |

Rule: status colour is always paired with a text label and, where space allows, an icon —
never colour alone (WCAG + the platform's own anti-black-box principle).

## 3. Typography

- **Typeface:** a clean, highly legible sans-serif — e.g., Inter, IBM Plex Sans, or
  Noto Sans (good multi-script support, useful if Hindi/regional language support
  is added later).
- **Scale:**
  - H1 (page titles): 28–32px / semibold
  - H2 (section headers): 20–22px / semibold
  - H3 (card titles): 16–18px / semibold
  - Body: 14–15px / regular
  - Caption/meta: 12–13px / regular, `--color-neutral-600`
- Numbers (scores, IDs, dates) use tabular figures for clean alignment in tables/dashboards.

## 4. Layout & Grid

- 12-column responsive grid, 24px gutters on desktop, 16px on mobile.
- Dashboards: left sidebar nav (collapsible on tablet, bottom nav on mobile for field
  officer app) + main content area with card-based modules.
- Max content width ~1440px on large admin screens (data-dense views benefit from width).
- Consistent 8px spacing scale (8/16/24/32/48).

## 5. Core Components

- **Status Badge** — pill-shaped, colour + icon + text (`● VERIFIED`, `● HIGH RISK`, `● EXPIRING SOON`).
- **Instrument Card** — serial number, status badge, owner, last verified date, risk indicator, thumbnail photo.
- **Digital Instrument ID Header** — persistent header block shown on any instrument detail page: permanent ID, status badge, current certificate validity — this is the anchor of the "digital twin" story and should look distinct/consistent everywhere.
- **Lifecycle Timeline** — vertical timeline component (registration → verification →
  certificate → complaint → re-verification), each node coloured by event type, used
  for Instrument Health Timeline / Anomaly Timeline / Chain of Custody views.
- **Explanation Panel** — expandable panel under any risk/anomaly badge listing
  contributing factors as a short bullet list (never a bare "Fraud Detected").
- **Compliance Readiness Meter** — horizontal progress bar + percentage + list of
  missing items, shown before application submission.
- **Adaptive Checklist** — dynamically rendered form/checklist that changes fields
  based on instrument type/category (field verification screen).
- **"Compare with Previous" Diff View** — two-column previous vs. current, changed
  fields highlighted.
- **Priority Queue List** — sortable/filterable table with RED/YELLOW/GREEN chips,
  used on the Admin dashboard.
- **QR Public Verification Card** — single-purpose, minimal card design (no clutter),
  optimized for a phone screen right after a QR scan: big status badge, instrument ID,
  validity date, "Report Suspicion" button.

## 6. Per-Role Dashboard Design Intent

| Dashboard | Visual tone | Key modules |
|---|---|---|
| **Owner** | Friendly, guided, minimal jargon | My Instruments, Apply, Certificates, Alerts |
| **Manufacturer** | Simple, form-heavy | Register Model/Instrument, Batch, Lifecycle Status |
| **LMO/GATC (field)** | Mobile-first, high contrast, large tap targets, offline indicator | Assigned Cases, Adaptive Checklist, Evidence Upload, PASS/FAIL |
| **Admin** | Dense, command-center feel, filters everywhere | Pendency, Assignment, Priority Flags, Heatmap, Complaints, Officer Workload |
| **Public QR page** | Extremely minimal, single screen, no navigation | Status badge, validity, "Report Suspicion" |

## 7. Accessibility

- Minimum contrast ratio 4.5:1 for body text, 3:1 for large text/icons.
- Never rely on colour alone (status badges always carry text).
- Touch targets ≥44px on mobile/field-officer views.
- Support offline state indication clearly (e.g., a persistent "Offline — will sync"
  banner on the LMO app, not just a small icon).

## 8. Tone of Voice (UI copy)

- Plain, precise, non-alarmist. E.g., "HIGH RISK — Review Required" not "⚠️ Danger!!".
- Explanation copy always factual: "3 complaints received, certificate expired" —
  never speculative ("possible fraud ring").
- Officer-facing copy is procedural/checklist style; owner-facing copy is
  plain-language and reassuring; public-facing copy is minimal and neutral.
