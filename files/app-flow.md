# App Flow
## Online Verification & Intelligent Lifecycle Management System

Companion to `prd.md`. Describes navigation, screens, and state machines per role.

---

## 1. Entry Points / Instrument Onboarding

Three ways an instrument enters the system:

**A. Manufacturer-registered**
```
Manufacturer → Registers instrument → Adds serial number + specs
→ System generates Digital Instrument ID → Status: MANUFACTURED / UNCLAIMED
→ Buyer purchases → Buyer claims instrument → Ownership activated
→ Verification application
```

**B. Instrument already exists in the database**
```
Buyer/Owner → Scans QR or enters serial number → System finds instrument
→ Owner verifies purchase/ownership → Instrument linked to owner
→ Apply for verification
```

**C. Instrument not found (fresh registration by owner)**
```
Owner → Register New Instrument → Enter manufacturer, model, serial number,
capacity, purchase details, location → Upload invoice, instrument photos,
serial number image → Duplicate checks run → Digital Instrument ID created
→ Status: REGISTERED / VERIFICATION PENDING
```

---

## 2. Role: Instrument Owner / Business

**Screens:** Login/Register → Owner Dashboard → My Instruments → Instrument Detail
→ Apply for Verification (form) → Application Status → Certificates → Alerts

**Owner Dashboard modules:** My Instruments, Instrument Status, Apply for Verification,
Apply for Re-verification, Certificates, Expiry Alerts, Applications, Verification
History, Upload Documents, Compliance Readiness.

**Flow — Apply for verification:**
```
Select instrument → Fill/confirm specs → Upload documents & photos
→ Compliance Readiness Score checks fields/docs/photos
   (e.g., "Readiness: 75% — missing: serial number image")
→ Fix gaps → Submit → Status: SUBMITTED
```

## 3. Role: Manufacturer

**Screens:** Manufacturer Dashboard → Register Model → Register Instrument/Batch →
Add Serial Numbers → Add Specifications → View Registered Instruments → Lifecycle Status

**Flow:**
```
Register Model → Register Instrument(s)/Batch → Add serial numbers + specs
→ Digital Instrument ID generated per unit → Status: MANUFACTURED / UNCLAIMED
```
Note: this creates *identity*, not legal verification.

## 4. Role: LMO / GATC

**Screens:** LMO Dashboard → Assigned Applications → Instrument History →
Field Verification (Adaptive Checklist) → Observations → Evidence Upload →
Serial Number Capture (OCR) → PASS/FAIL Submission → "Compare with Previous Record"

**Flow — Field verification:**
```
Open assigned case → Review instrument history →
Adaptive checklist loads based on instrument type/category/capacity →
Capture/confirm serial number via OCR → System flags mismatch, if any →
Record observations → Upload evidence (photos/docs) →
System checks for missing evidence / inconsistent entries →
[If re-verification] optionally tap "Compare with Previous Record" →
System highlights what changed (ownership, location, specs, photos) →
Officer submits PASS or FAIL (officer decision is always final) →
  PASS → Certificate generated → QR activated → Status: VERIFIED
  FAIL → Failure reason recorded → Status: NON-COMPLIANT/FAILED → corrective flow
```
Officers can work **offline**; data is stored locally (encrypted) and synced later,
with conflict detection preventing silent overwrites.

## 5. Role: Administrator

**Screens:** Admin Dashboard → Pending Applications → Assign LMO/GATC → Reassign →
Pendency Monitor → Expiring Instruments → High-Risk Cases → Priority Flags →
Complaints → Heatmap → Anomaly Timeline → Officer Workload → Command Center

**Flow — Assignment:**
```
Application arrives (PENDING ASSIGNMENT) → Admin reviews →
System may show recommendation (location/workload/expertise/priority) →
Admin makes final assignment decision → Status: ASSIGNED → SCHEDULED
```

**Flow — Priority monitoring:**
```
Risk score updates (expiry, complaint, failure, anomaly) →
Case tagged RED/YELLOW/GREEN → Appears in Priority Flags list →
Admin opens Fraud-Suspicion Explanation Panel → sees plain-language reasons
(e.g., "HIGH RISK because: duplicate serial number detected, 3 complaints,
certificate expired") → Admin acts (reassign / escalate / request re-verification)
```

## 6. Role: Public / Consumer

**Screens:** QR Scan → Public Verification Page → Report Suspicion (form)

**Flow:**
```
Scan QR → Live server-side status lookup (not the printed/cached data) →
Show: instrument basic details, certificate status, validity, trust indicator
(colour + mandatory text label) → Option: "Report Suspicion" →
Report submitted → clustered with similar reports → priority increases only
after pattern analysis (prevents single-report abuse)
```
Privacy: only limited public fields are shown — never owner/business PII.

---

## 7. System State Machines

**Application Status Flow**
```
DRAFT → SUBMITTED → READINESS/DOCUMENT REVIEW → PENDING ASSIGNMENT → ASSIGNED
→ SCHEDULED → VERIFICATION IN PROGRESS → RESULT SUBMITTED
   → PASS → CERTIFICATE ISSUED → VERIFIED
   → FAIL → CORRECTIVE ACTION / RE-VERIFICATION FLOW
```

**Instrument Status Flow**
```
MANUFACTURED/REGISTERED → UNCLAIMED → OWNED → UNVERIFIED
→ VERIFICATION PENDING → VERIFICATION IN PROGRESS
   → VERIFIED → ACTIVE CERTIFICATE → EXPIRING SOON → EXPIRED
     → RE-VERIFICATION → VERIFIED AGAIN
   → FAILED / NON-COMPLIANT
```

**QR / Trust Status Logic**
```
GREEN  — certificate valid, low risk, no major anomalies
YELLOW — valid but nearing expiry, OR medium risk, OR requires attention
RED    — expired, OR high risk, OR suspicious/anomaly flag, OR action required
```
Text label is always shown alongside colour (accessibility + trust).

---

## 8. End-to-End Demo Story (for reference)

```
Manufacturer registers instrument → Digital Instrument ID created →
Buyer claims instrument → Applies for verification →
Compliance Readiness Score flags missing info → Owner completes application →
Admin assigns to LMO → LMO verifies, OCR checks serial number,
records observations + evidence → PASS → Certificate + QR issued →
Consumer scans QR: VERIFIED / TRUST: GREEN →
Later: complaint received → risk score rises → QR flips to YELLOW/RED →
Admin sees case in priority list → Re-verification: officer taps
"Compare with Previous Record" → system shows what changed →
new decision recorded → lifecycle timeline updated
```
