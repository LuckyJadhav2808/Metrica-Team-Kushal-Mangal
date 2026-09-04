# Stitch Prompt — Dashboard UI Generation

Copy-paste the block below into Stitch as a single prompt.

---

Design a web application UI for a government Legal Metrology compliance platform
called "Digital Instrument Trust Platform" — a system that gives every weighing and
measuring instrument a permanent digital identity and tracks its verification
lifecycle, certificates, and compliance risk.

**Visual style:** institutional, credible, and calm — like a modern government
regulatory dashboard, not a consumer startup app. Clean sans-serif typography
(Inter/IBM Plex Sans style), primary colour a deep institutional blue (#1A4D8F),
neutral light-grey backgrounds (#F4F6F8), white cards with subtle borders, generous
whitespace, 8px spacing rhythm. Status must always use a colour + explicit text label
together (green = valid/low risk, yellow = attention/medium risk, red = expired/high
risk/action required) — never colour alone.

Generate the following four screens as a connected set, sharing the same design
system, sidebar navigation pattern, and component library:

**1. Instrument Owner Dashboard** (desktop web)
Left sidebar navigation (My Instruments, Applications, Certificates, Alerts).
Main area: a grid of "Instrument Cards" (thumbnail, serial number, status badge,
last verified date). Top summary strip with counts (Active Certificates, Pending
Applications, Expiring Soon). A prominent "Apply for Verification" primary button.
Include one Instrument Card showing a "Compliance Readiness" progress bar at 75%
with a note on missing documents.

**2. LMO/GATC Field Verification Screen** (mobile-first, tablet-friendly)
Optimized for a field officer on a tablet. Top: instrument identity header (Digital
Instrument ID, photo, serial number) with a "Verify Serial Number" camera/OCR capture
button. Middle: an adaptive checklist of verification items with checkboxes and
short text fields, grouped by category. Bottom: evidence upload thumbnails row, and
two large clear buttons "PASS" (green) and "FAIL" (red). Include a persistent thin
banner at the very top reading "Offline Mode — will sync" to show offline-first support.

**3. Administrator Command Center Dashboard** (desktop web, data-dense)
Left sidebar (Pending Applications, Assignment, Priority Flags, Complaints, Heatmap,
Officer Workload). Main area: a sortable table of cases with columns for Instrument
ID, Owner, Status, Risk Level (RED/YELLOW/GREEN chip with text), Expiry Date, and an
"Assign" action button. Above the table, a row of KPI stat cards (Pending Assignments,
High Priority Cases, Expiring This Week, Open Complaints). Include a small expandable
"Why flagged?" panel on one high-risk row listing 2-3 plain-language reasons
(e.g., "Certificate expired", "3 complaints received", "Serial number mismatch").

**4. Public QR Verification Page** (mobile, single screen, no navigation)
Extremely minimal. Centered card on a light background: large status badge at top
("VERIFIED" in green, or "ATTENTION REQUIRED" in yellow, or "EXPIRED" in red — show
the green "VERIFIED" version), Digital Instrument ID, "Valid Until" date, instrument
type/basic details, and a secondary button "Report an Issue" at the bottom. No sidebar,
no clutter — this is what a consumer sees immediately after scanning a QR code on
a shop's weighing scale.

Keep all four screens visually consistent — same typography scale, same button
styles, same status badge component — so they read as one connected product, not
four separate designs.

---

**Tip:** if Stitch limits you to one screen per generation, run this prompt once per
screen (split at the numbered headers above) while keeping the shared style
paragraph at the top each time, so the visual language stays consistent across all four.
