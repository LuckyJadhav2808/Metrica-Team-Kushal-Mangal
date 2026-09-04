# 🏛️ METRICA — Master Technical Execution Blueprint & Specification
## Online Verification & Intelligent Lifecycle Management System for Weighing and Measuring Instruments
> **Problem Statement ID:** 26036  
> **Organization:** Ministry of Consumer Affairs, Food & Public Distribution  
> **Department:** Department of Consumer Affairs (DoCA)  
> **Target Event:** Smart India Hackathon (SIH 2026)  
> **Version:** 2.1 — Architecturally Airtight & Production-Grade Specification  

---

# 📑 Table of Contents
1. [Executive Summary & Core Paradigm](#1-executive-summary--core-paradigm)
2. [Approved Technology Stack & Zero-Cost Student Architecture](#2-approved-technology-stack--zero-cost-student-architecture)
3. [Master Scope Matrix (Mandatory + 47 USPs + 7 Domain Additions)](#3-master-scope-matrix)
4. [Complete 26-Entity Relational Data Model (Prisma Schema v2.1)](#4-complete-26-entity-relational-data-model)
5. [User Roles & Dashboard Architecture](#5-user-roles--dashboard-architecture)
6. [Core Workflows & State Machines](#6-core-workflows--state-machines)
7. [Step-by-Step Implementation Roadmap](#7-step-by-step-implementation-roadmap)
8. [Offline-First PWA & Client-Side OCR Architecture](#8-offline-first-pwa--client-side-ocr-architecture)
9. [Winning Hackathon Demo Script (18-Step Storyline)](#9-winning-hackathon-demo-script)

---

# 1. Executive Summary & Core Paradigm

### The Problem
Traditional Legal Metrology verification in India operates on isolated, static paper/PDF certificates. Once issued, certificates cannot actively reflect physical tampering, unverified repairs, machine swapping, or consumer short-weight complaints between 1-2 year inspection cycles.

### The Paradigm Shift
Metrica decouples the **Instrument Identity** from its **Verification Certificate**:
- **A Certificate is Transient:** Expires, renews, replaces, or revokes.
- **The Digital Instrument ID (Digital Twin) is Permanent:** Preserves full lifecycle pedigree across 10-15 years, tracking ownership changes, physical locations, repairs, complaints, calibration readings, and real-time risk scores.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       PERMANENT DIGITAL INSTRUMENT ID                    │
│                                                                         │
│  [Birth: Manufacturer Specs] ──▶ [Claim & KYC: Business Owner]          │
│                                ──▶ [Field Inspection: LMO + OCR]       │
│                                ──▶ [Dynamic QR: Live Trust Score]      │
│                                ──▶ [Event Loop: Complaints / Repairs]   │
│                                ──▶ [Statutory & Early Re-verification]  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 2. Approved Technology Stack & Zero-Cost Student Architecture

| Layer | Technology | Rationale & Responsibility | Free Student Alternative |
| :--- | :--- | :--- | :--- |
| **Framework** | **Next.js 15 (React 19, TypeScript)** | Monorepo velocity, SSR for instant public QR verification, rich client dashboards. | Vercel Free Hobby Tier |
| **UI & Styling** | **Tailwind CSS + Shadcn UI + Framer Motion** | State-of-the-art government design system, micro-animations, accessible dark/light themes. | 100% Free Open Source |
| **Mobile & Offline** | **Next-PWA / Workbox + Dexie.js (IndexedDB) + Capacitor (Optional APK)** | Zero-install PWA with native camera OCR, GPS tagging, and 100% offline inspection capability; instant APK wrapper if requested. | 100% Free Open Source |
| **Database & ORM** | **PostgreSQL + PostGIS + Prisma ORM** | ACID-compliant legal records, spatial queries for jurisdiction heatmaps, typed relational joins across 26 entities. | **Supabase Free Tier (500MB)** or Local Postgres |
| **Storage (Evidence Vault)** | **Supabase Storage / Local `/public/uploads`** | Tamper-proof encrypted evidence repository for photos, invoices, and observation sheets. | **Supabase Storage (1GB Free)** / Local Next.js |
| **OCR & Vision** | **Client-Side WebAssembly (Tesseract.js)** | Runs directly on browser/mobile CPU in $<1.5\text{s}$. Zero server load, zero timeout, works 100% offline. | 100% Free Open Source (Zero API cost) |
| **Certificates & QR** | **`@react-pdf/renderer` + `qrcode` + Node Crypto (HMAC SHA-256)** | Digitally signed PDF certificates with embedded live dynamic QR codes. | 100% Free Open Source |
| **Mapping & Charts** | **Leaflet / React-Leaflet + Recharts** | Jurisdiction compliance heatmap, officer workload charts, risk distribution analytics. | OpenStreetMap (100% Free) |

---

# 3. Master Scope Matrix

## A. Mandatory Problem Statement Requirements (PS 26036)
- [x] **Stakeholder Management:** Registration, KYC, profile management, and multi-tier RBAC login.
- [x] **Instrument Management:** Specification cataloging, invoice & photo uploads, claim flow.
- [x] **Verification Workflow:** Initial & re-verification applications, admin human-in-the-loop assignment, slot scheduling.
- [x] **Field Operations:** Mobile-ready inspection interface, digital observation recording, PASS/FAIL determination.
- [x] **Certificates:** Programmatic QR-enabled digital certificate generation, search repository, export/print.
- [x] **Monitoring & Alerts:** Expiry tracking, automated renewal alerts, pendency & enforcement tracking.
- [x] **Dashboards:** Dedicated portals for Owner, Manufacturer, LMO/GATC, and Administrator.

## B. The 47 Selected USP Features
1. **Instrument Digital Twin:** Complete lifecycle tracking (specs, owners, locations, tests, complaints).
2. **Dynamic QR Trust Verification:** Server-side real-time lookup (not static spoofable certificate data).
3. **OCR-Based Identity Validation:** Camera scan of metal nameplate to prevent machine swapping.
4. **Certificate Cloning Detection:** Detects duplicate QR scans from impossible distances or conflicting serials.
5. **Compliance Risk Score:** Real-time mathematical index ($0-100$) factoring expiry, failures, complaints, OCR flags.
6. **Predictive Re-verification Intelligence:** Identifies drifting calibration trends for early voluntary inspection.
7. **Smart Enforcement Prioritization:** Ranks inspection backlog for administrators by risk severity.
8. **AI-Assisted Field Verification:** Real-time form validation against missing readings or anomalous inputs.
9. **Adaptive Verification Workflow:** Category-specific checklists (weighbridges vs. gold balances vs. fuel meters).
10. **"What Changed?" Re-verification Analysis:** Side-by-side spec, photo, and location diff engine.
11. **Offline-First Field Verification:** Full inspection execution in zero-connectivity environments.
12. **Offline Data Conflict Detection:** Prevents silent overwrites; cryptographic timestamp reconciliation.
13. **Administrator-Controlled Assignment:** Algorithmic routing recommendations with mandatory human sign-off.
14. **Priority Flagging:** 🔴 High, 🟡 Medium, 🟢 Low dynamic enforcement badges.
15. **Digital Chain of Custody:** Chronological ledger of manufacturer, distributor, owner, and transferee transitions.
16. **Public Consumer Trust Verification:** Zero-login mobile QR page for shoppers.
17. **Complaint Intelligence:** Citizen feedback aggregation detecting merchant/market short-weighting clusters.
18. **National Instrument Identity:** Universal ID surviving state transfers and certificate renewals.
19. **Duplicate Registration Detection:** Pre-registration cross-checks against existing serials and image similarity.
20. **Document Consistency Checking:** Cross-checks invoice OCR data against entered specifications.
21. **Compliance Readiness Score:** Pre-submission progress indicator (e.g., *"80% Ready - Missing serial plate photo"*).
22. **Model Failure Pattern Detection:** Batch-level anomaly detection flagging manufacturer defect clusters.
23. **Jurisdiction Compliance Heatmap:** Interactive spatial map of expired devices, pendency, and risk hotspots.
24. **Immutable Audit Trail:** Append-only ledger recording who, what, when, old value, and new value.
25. **Controlled Correction Workflow:** Mandatory supervisor sign-off and rationale logging for legal record corrections.
26. **Digital Evidence Vault:** Encrypted, tamper-proof repository linked to Instrument IDs.
27. **On-Demand Evidence Comparison:** One-click visual photo overlays across inspection cycles.
28. **Network-Based Fraud Detection:** Flags suspicious graph ties (e.g., same scale claimed by multiple businesses).
29. **Regulatory Decision Support:** Curated *"Top 10 High-Risk Cases Requiring Immediate Action"* panel.
30. **QR Colour Based on Trust/Risk:** 🟢 Green (Valid), 🟡 Yellow (Expiring/Medium Risk), 🔴 Red (Expired/Tampered).
31. **Business Compliance Profile:** Merchant trust rating based on renewal timeliness and complaint history.
32. **Digital Instrument Passport:** Exportable health & identity summary sheet.
33. **Smart Certificate Authentication API:** Public REST API for third-party systems (GST, Mandi portals, e-Commerce).
34. **Event-Driven Compliance Monitoring:** Automated risk recalculation triggered by repairs, transfers, or complaints.
35. **Instrument Anomaly Timeline:** Visual progression of events leading to a risk escalation.
36. **Fraud/Anomaly Explanation Panel:** Plain-language breakdown explaining *why* an instrument is flagged.
37. **Smart Case Clustering:** Geographic bundling of pending inspections for optimal officer route planning.
38. **Instrument Health Timeline:** Visual chronological pulse of all lifetime events.
39. **Context-Aware Expiry Alerts:** Smart notification delivery distinguishing gentle reminders from statutory warnings.
40. **Zero-Trust Certificate Verification:** Every lookup re-authenticates against master registry state.
41. **AI Inspection Summary Generator:** Auto-synthesizes calibration readings into a draft inspection report.
42. **Risk-Based Alert Escalation:** Automatic escalation from normal reminders to regulatory enforcement notices.
43. **Instrument History Portability:** Seamless cross-jurisdiction calibration record continuity.
44. **Compliance Intelligence Command Center:** Single-pane-of-glass executive overview for department heads.
45. **Privacy-Aware Role-Based Data Views:** Role-tailored data masking (public view vs. officer view).
46. **Instrument Trust Score:** Public-facing integrity index ($0-100$).
47. **Continuous Compliance Model:** Post-certification active lifecycle monitoring.

## C. The 7 Legal Metrology Realism Additions
48. **Statutory Fee Matrix & Payment Gateway Integration:** Auto-calculates statutory verification fees (Legal Metrology Rules 2011) + overdue penalty days + instant UPI/e-Challan receipt.
49. **Physical Stamping / Hologram Seal Tracking:** Records unique lead/wire seal and hologram sticker IDs; mismatch triggers immediate physical tampering alarm.
50. **Maximum Permissible Error (MPE) Math Engine:** Mathematical verification against statutory tolerance limits based on instrument Accuracy Class (Class I, II, III, IV, and liquid measures).
51. **Central Model Approval (`IND/...`) Validation:** Validates manufacturer model approval numbers against the central registry.
52. **Pincode-to-Jurisdiction Circle Auto-Routing:** Maps shop addresses directly to the assigned LMO territorial circle.
53. **Multilingual Interface (English / Hindi / Regional):** Bhashini/Indic language toggling on public QR pages.
54. **Multi-Channel Alert Dispatch (SMS / WhatsApp Simulation):** Automated alerts for expiry and schedule updates.

---

# 4. Complete 26-Entity Relational Data Model (Prisma Schema v2.1)

```prisma
// ==========================================
// 1. AUTHENTICATION, USERS & ORGANIZATIONS
// ==========================================

enum UserRole {
  MANUFACTURER
  OWNER
  LMO
  GATC
  ADMIN
  SUPER_ADMIN
}

model User {
  id              String         @id @default(uuid())
  email           String         @unique
  passwordHash    String
  fullName        String
  phone           String         @unique
  role            UserRole
  isActive        Boolean        @default(true)
  organizationId  String?
  organization    Organization?  @relation(fields: [organizationId], references: [id])
  jurisdictionId  String?
  jurisdiction    Jurisdiction?  @relation(fields: [jurisdictionId], references: [id])
  
  assignedApps    Assignment[]   @relation("OfficerAssignments")
  inspections     Verification[] @relation("OfficerVerifications")
  investigations  Complaint[]    @relation("OfficerInvestigations")
  auditLogs       AuditLog[]
  notifications   Notification[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}

model Organization {
  id              String         @id @default(uuid())
  name            String
  tradeName       String?
  gstin           String?        @unique
  regNumber       String?        @unique
  orgType         String         // MANUFACTURER, COMMERCIAL_BUSINESS, GATC_LAB, GOVT_DEPT
  address         String
  pincode         String
  district        String
  state           String
  complianceScore Float          @default(100.0)
  
  users           User[]
  instruments     Instrument[]   @relation("OwnedInstruments")
  manufactured    Instrument[]   @relation("ManufacturedInstruments")
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}

model Jurisdiction {
  id              String         @id @default(uuid())
  state           String
  district        String
  circleName      String         // e.g. "Zone 4 - South Circle"
  pincodes        String[]       // Array of covered pincodes
  latitude        Float?
  longitude       Float?
  
  officers        User[]
  instruments     Instrument[]
  applications    VerificationApplication[]
}

// ==========================================
// 2. INSTRUMENT & DIGITAL TWIN
// ==========================================

enum InstrumentStatus {
  MANUFACTURED_UNCLAIMED
  REGISTERED_PENDING_VERIFICATION
  VERIFIED_ACTIVE
  EXPIRING_SOON
  EXPIRED
  REJECTION_NOTICE_ISSUED
  REPAIR_PENDING_INSPECTION
  SUSPENDED_TAMPERED
  DECOMMISSIONED
}

enum MeasurementUnit {
  KG
  GRAM
  LITER
  MILLILITER
  METER
}

enum AccuracyClass {
  CLASS_I    // Special (Jewelry / Analytical)
  CLASS_II   // High (Commercial precious)
  CLASS_III  // Medium (Commercial counter scales, weighbridges)
  CLASS_IV   // Ordinary
  LIQUID_0_3 // Petrol Nozzles (0.3% MPE)
  LIQUID_0_5 // Standard Flow Meters (0.5% MPE)
  LENGTH_M1  // Metric Length Measures
}

enum InstrumentCategory {
  ELECTRONIC_COUNTER_SCALE
  PLATFORM_SCALE
  WEIGHBRIDGE
  JEWELRY_PRECISION_BALANCE
  FUEL_DISPENSER_NOZZLE
  FLOW_METER
  WATER_METER
  LENGTH_MEASURE
}

model InstrumentModel {
  id                  String             @id @default(uuid())
  modelName           String
  modelNumber         String
  modelApprovalNumber String             // Central Gov IND/... approval
  accuracyClass       AccuracyClass
  instrumentCategory  InstrumentCategory
  nominalUnit         MeasurementUnit
  maxCapacity         Float              // in nominalUnit
  minCapacity         Float              // in nominalUnit
  verificationInterval Float             // 'e' value / division
  createdAt           DateTime           @default(now())
  
  instruments         Instrument[]
}

model Instrument {
  id                   String             @id @default(uuid())
  digitalInstrumentId  String             @unique // e.g. "IND-MET-2026-X892J"
  serialNumber         String
  modelId              String
  model                InstrumentModel    @relation(fields: [modelId], references: [id])
  manufacturerId       String
  manufacturer         Organization       @relation("ManufacturedInstruments", fields: [manufacturerId], references: [id])
  currentOwnerId       String?
  currentOwner         Organization?      @relation("OwnedInstruments", fields: [currentOwnerId], references: [id])
  jurisdictionId       String
  jurisdiction         Jurisdiction       @relation(fields: [jurisdictionId], references: [id])
  
  currentStatus        InstrumentStatus   @default(MANUFACTURED_UNCLAIMED)
  riskScore            Float              @default(0.0) // 0 - 100
  trustScore           Float              @default(100.0) // 0 - 100
  priorityFlag         String             @default("LOW") // LOW, MEDIUM, HIGH, CRITICAL
  
  lastVerifiedAt       DateTime?
  validUntil           DateTime?
  currentSealNumber    String?            // Physical Hologram/Lead Seal
  primaryQrUrl         String?            // Live QR scan link
  qrAccessSecret       String             @default(uuid()) // Anti-tamper token
  
  installationLocation String?
  latitude             Float?
  longitude            Float?
  
  ownershipHistory     InstrumentOwnership[]
  locationHistory      InstrumentLocation[]
  applications         VerificationApplication[]
  verifications        Verification[]
  certificates         Certificate[]
  complaints           Complaint[]
  repairEvents         RepairModificationEvent[]
  evidenceVault        Evidence[]
  anomalies            Anomaly[]
  lifecycleEvents      InstrumentEvent[]
  qrScanLogs           QRVerificationLog[]
  
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  @@unique([manufacturerId, serialNumber])
}

model InstrumentOwnership {
  id              String       @id @default(uuid())
  instrumentId    String
  instrument      Instrument   @relation(fields: [instrumentId], references: [id])
  ownerOrgId      String
  transferDate    DateTime     @default(now())
  invoiceNumber   String?
  invoiceDate     DateTime?
  documentUrl     String?
}

model InstrumentLocation {
  id              String       @id @default(uuid())
  instrumentId    String
  instrument      Instrument   @relation(fields: [instrumentId], references: [id])
  address         String
  pincode         String
  latitude        Float?
  longitude       Float?
  effectiveFrom   DateTime     @default(now())
}

// ==========================================
// 3. VERIFICATION & FIELD INSPECTION
// ==========================================

enum ApplicationStatus {
  DRAFT
  PAYMENT_PENDING
  PAYMENT_COMPLETED_PENDING_ASSIGNMENT
  ASSIGNED
  SCHEDULED
  IN_PROGRESS
  PASSED_CERTIFIED
  REJECTION_NOTICE_ISSUED // 15-day corrective repair window
  REPAIRED_PENDING_REINSPECTION
}

enum VerificationType {
  INITIAL_VERIFICATION
  PERIODIC_REVERIFICATION
  POST_REPAIR_VERIFICATION
}

model VerificationApplication {
  id                 String             @id @default(uuid())
  applicationNumber  String             @unique // e.g. "APP-2026-00492"
  instrumentId       String
  instrument         Instrument         @relation(fields: [instrumentId], references: [id])
  jurisdictionId     String
  jurisdiction       Jurisdiction       @relation(fields: [jurisdictionId], references: [id])
  applicantUserId    String
  
  verificationType   VerificationType
  status             ApplicationStatus  @default(DRAFT)
  readinessScore     Float              @default(0.0) // 0 - 100%
  
  statutoryFee       Float
  penaltyFee         Float              @default(0.0)
  totalFeePaid       Float              @default(0.0)
  paymentStatus      String             @default("PENDING") // PENDING, PAID, FAILED
  paymentRefNumber   String?
  paymentReceiptUrl  String?
  
  assignment         Assignment?
  schedule           VerificationSchedule?
  verification       Verification?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
}

model Assignment {
  id                 String                  @id @default(uuid())
  applicationId      String                  @unique
  application        VerificationApplication @relation(fields: [applicationId], references: [id])
  assignedOfficerId  String
  assignedOfficer    User                    @relation("OfficerAssignments", fields: [assignedOfficerId], references: [id])
  assignedByAdminId  String
  assignedAt         DateTime                @default(now())
  notes              String?
}

model VerificationSchedule {
  id                 String                  @id @default(uuid())
  applicationId      String                  @unique
  application        VerificationApplication @relation(fields: [applicationId], references: [id])
  scheduledDate      DateTime
  timeSlot           String                  // e.g. "10:00 AM - 01:00 PM"
  isConfirmed        Boolean                 @default(true)
}

enum VerificationResult {
  PASS
  FAIL
}

model Verification {
  id                  String                  @id @default(uuid())
  applicationId       String                  @unique
  application         VerificationApplication @relation(fields: [applicationId], references: [id])
  instrumentId        String
  instrument          Instrument              @relation(fields: [instrumentId], references: [id])
  officerId           String
  officer             User                    @relation("OfficerVerifications", fields: [officerId], references: [id])
  
  inspectionDate      DateTime                @default(now())
  result              VerificationResult
  appliedSealNumber   String?                 // Physical Hologram/Lead Seal applied
  mpeTolerancePassed  Boolean
  ocrSerialMatched    Boolean
  ocrImageEvidenceUrl String?
  latitude            Float?
  longitude           Float?
  isOfflineSynced     Boolean                 @default(false)
  officerSummaryNotes String?
  rejectionNoticeUrl  String?                 // Form-B statutory notice if failed
  
  observations        VerificationObservation[]
  certificate         Certificate?
  createdAt           DateTime                @default(now())
}

model VerificationObservation {
  id                  String          @id @default(uuid())
  verificationId      String
  verification        Verification    @relation(fields: [verificationId], references: [id])
  nominalTestValue    Float           // Standard test weight/volume applied
  observedValue       Float           // Reading shown on instrument
  unit                MeasurementUnit
  errorCalculated     Float           // (observedValue - nominalTestValue)
  maxPermissibleError Float           // Statutory tolerance limit (±MPE)
  isWithinTolerance   Boolean
  testCategory        String          // ECCENTRICITY, REPEATABILITY, INCREASING_LOAD, DECREASING_LOAD, ZERO_LOAD
}

// ==========================================
// 4. CERTIFICATES & REPOSITORY
// ==========================================

enum CertificateStatus {
  ACTIVE_VALID
  EXPIRING_SOON
  EXPIRED
  REVOKED
  SUPERSEDED
}

model Certificate {
  id                   String            @id @default(uuid())
  certificateNumber    String            @unique // e.g. "CERT-DL-2026-99384"
  verificationId       String            @unique
  verification         Verification      @relation(fields: [verificationId], references: [id])
  instrumentId         String
  instrument           Instrument        @relation(fields: [instrumentId], references: [id])
  
  issueDate            DateTime          @default(now())
  validUntil           DateTime
  status               CertificateStatus @default(ACTIVE_VALID)
  
  physicalSealNumber   String
  digitalSignatureHash String            // HMAC SHA-256 for non-repudiation
  signedByOfficerId    String
  pdfDocumentUrl       String
  qrCodeUrl            String
  qrAccessSecret       String
  createdAt            DateTime          @default(now())
}

model QRVerificationLog {
  id                   String       @id @default(uuid())
  instrumentId         String
  instrument           Instrument   @relation(fields: [instrumentId], references: [id])
  scannedAt            DateTime     @default(now())
  ipAddress            String?
  userAgent            String?
  approxLatitude       Float?
  approxLongitude      Float?
  isFlaggedSuspicious  Boolean      @default(false)
}

// ==========================================
// 5. INTELLIGENCE, RISK, COMPLAINTS & AUDITS
// ==========================================

enum ComplaintStatus {
  LOGGED
  UNDER_INVESTIGATION
  ACTION_TAKEN_RAID
  DISMISSED
}

model Complaint {
  id                   String          @id @default(uuid())
  instrumentId         String
  instrument           Instrument      @relation(fields: [instrumentId], references: [id])
  complainantName      String?
  complainantPhone     String?
  complaintType        String          // SHORT_WEIGHT, BROKEN_SEAL, EXPIRED_CERTIFICATE, TAMPERING
  description          String
  evidencePhotoUrl     String?
  status               ComplaintStatus @default(LOGGED)
  assignedOfficerId    String?
  assignedOfficer      User?           @relation("OfficerInvestigations", fields: [assignedOfficerId], references: [id])
  resolutionNotes      String?
  impactOnRiskScore    Float           @default(20.0)
  createdAt            DateTime        @default(now())
}

model RepairModificationEvent {
  id                   String       @id @default(uuid())
  instrumentId         String
  instrument           Instrument   @relation(fields: [instrumentId], references: [id])
  repairDate           DateTime     @default(now())
  repairerName         String
  repairerLicenseNumber String?     // State Authorized Repairer License
  componentsReplaced   String
  reasonForRepair      String
  invoiceProofUrl      String?
  requiresReinspection Boolean      @default(true)
  status               String       @default("REPORTED") // REPORTED, UNDER_INSPECTION, APPROVED_RESTAMPED
}

model Evidence {
  id                   String       @id @default(uuid())
  instrumentId         String
  instrument           Instrument   @relation(fields: [instrumentId], references: [id])
  evidenceType         String       // NAMEPLATE_PHOTO, STAMP_PHOTO, INVOICE_PDF, TEST_LOG
  fileUrl              String
  sha256Hash           String
  uploadedAt           DateTime     @default(now())
}

model Anomaly {
  id                   String       @id @default(uuid())
  instrumentId         String
  instrument           Instrument   @relation(fields: [instrumentId], references: [id])
  anomalyType          String       // OCR_MISMATCH, CLONING_SUSPECTED, BATCH_FAILURE, REPAIR_UNINSPECTED
  description          String
  severity             String       // LOW, MEDIUM, HIGH, CRITICAL
  isDismissed          Boolean      @default(false)
  detectedAt           DateTime     @default(now())
}

model InstrumentEvent {
  id                   String       @id @default(uuid())
  instrumentId         String
  instrument           Instrument   @relation(fields: [instrumentId], references: [id])
  eventType            String       // MANUFACTURED, REGISTERED, INSPECTED, CERTIFIED, REPAIRED, COMPLAINT_LOGGED
  title                String
  description          String
  actorUserId          String?
  createdAt            DateTime     @default(now())
}

model AuditLog {
  id                   String       @id @default(uuid())
  userId               String?
  user                 User?        @relation(fields: [userId], references: [id])
  action               String       // CREATE, UPDATE, ASSIGN, PASS, FAIL, REPAIR, CORRECTION
  entityName           String       // Instrument, Verification, Certificate
  entityId             String
  previousState        Json?
  newState             Json?
  timestamp            DateTime     @default(now())
}

model Notification {
  id                   String       @id @default(uuid())
  userId               String
  user                 User         @relation(fields: [userId], references: [id])
  title                String
  message              String
  type                 String       // EXPIRY_ALERT, ASSIGNMENT, COMPLAINT, PAYMENT_DUE
  isRead               Boolean      @default(false)
  createdAt            DateTime     @default(now())
}
```

---

# 5. User Roles & Dashboard Architecture

```
                                  METRICA PORTAL
                                         │
     ┌──────────────────┬────────────────┼─────────────────┬──────────────────┐
     ▼                  ▼                ▼                 ▼                  ▼
[1. Public QR]    [2. Owner]      [3. Manufacturer]   [4. LMO Officer]   [5. Admin]
- Live Trust badge - My Scales     - Mint Batch IDs    - Mobile PWA       - Command Center
- Plain English    - Apply & Pay   - Model Catalog     - Camera WASM OCR  - Heatmap
- Report Tamper    - Readiness %   - Track Pedigree    - MPE Calculator   - Pendency Queue
- Hindi Toggle     - Certificates  - Defect Trends     - Offline Queue    - Assignment
```

---

# 6. Core Workflows & State Machines

### A. The End-to-End Verification Pipeline (With Statutory Payment & Rejection Notice)

```
1. ONBOARDING
   Manufacturer Mints Serials OR Owner Claims Existing Scale ──▶ Status: MANUFACTURED_UNCLAIMED / REGISTERED
                                                                          │
2. APPLICATION & PRE-SUBMISSION                                           ▼
   Owner Enters Specs ──▶ Compliance Readiness Bar (e.g. 100%) ──▶ Status: DRAFT
                                                                          │
3. STATUTORY PAYMENT GATEWAY (Mandatory Before Assignment)               ▼
   Auto-calculate Fee Matrix (Capacity + Late Penalty) ──▶ Pay via UPI/e-Challan ──▶ Status: PAYMENT_COMPLETED_PENDING_ASSIGNMENT
                                                                          │
4. ADMIN DISPATCH & SCHEDULING                                            ▼
   Admin Selects Officer (Proximity/Workload) ──▶ Slot Confirmed ──▶ Status: SCHEDULED
                                                                          │
5. FIELD INSPECTION (Online / 100% Offline PWA)                           ▼
   LMO Scans Plate via Client WASM OCR ──▶ Checks MPE Load Tolerances ──▶ Verifies Physical Seal
                                                                          │
        ┌─────────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────┐
        ▼                                                                                                                                   ▼
   [PASS WORKFLOW]                                                                                                                     [FAIL WORKFLOW]
   • Record Physical Hologram/Lead Seal Number                                                                                         • Issue Statutory Form-B Rejection Notice
   • Generate HMAC SHA-256 Signed PDF Certificate                                                                                      • 15-Day Corrective Window for Licensed Repair
   • Embed Live Dynamic QR Code (Points to Permanent Digital ID)                                                                       • Status: REJECTION_NOTICE_ISSUED
   • Update Instrument: lastVerifiedAt, validUntil, Status: VERIFIED_ACTIVE                                                                      │
   • Trust Score = 100 / Risk Score = 0                                                                                                         ▼
                                                                                                                                       • Owner Logs Repair Event with Invoice
                                                                                                                                       • Status: REPAIR_PENDING_INSPECTION
                                                                                                                                       • Fast-Track Post-Repair Re-verification
```

---

# 7. Step-by-Step Implementation Roadmap

### 🧱 Phase 1: Core Foundation & Mandatory PS Baseline (Sprint 1)
- [ ] Initialize Next.js 15 full-stack app with TypeScript, Tailwind CSS, and Lucide icons.
- [ ] Set up Supabase / PostgreSQL database and apply the 26-entity Prisma schema.
- [ ] Implement JWT/Session authentication with Role-Based Access Control (RBAC).
- [ ] Build the 4 core navigation shells (Owner, Manufacturer, LMO, Admin).
- [ ] Build the Instrument Registration and Claim workflows.
- [ ] Implement the Verification Application submission & Statutory Fee calculation matrix.
- [ ] Build the Admin Assignment and Scheduling interface.
- [ ] Build the LMO field inspection form with PASS/FAIL submission.
- [ ] Implement programmatic PDF Certificate generation and QR code creation.

### 🌟 Phase 2: High-Impact USPs & Differentiators (Sprint 2)
- [ ] Build the **Client-Side WebAssembly OCR Camera** (Tesseract.js) for instant, zero-cost nameplate extraction.
- [ ] Implement the **"What Changed?" Historical Diff Engine** (USP #10).
- [ ] Build the **Dynamic Risk & Trust Scoring Formula Engine** (USP #5, #46).
- [ ] Build the **Explainable Anomaly Panel** (USP #36).
- [ ] Build the **Public QR Mobile Landing Page** with Green/Yellow/Red status (USP #2, #30).
- [ ] Implement the **Citizen Short-Weight Complaint Feedback Loop** (USP #16, #17).
- [ ] Build the **Pre-Submission Compliance Readiness Bar** (USP #21).
- [ ] Implement **Physical Seal Number Recording & Tampering Detection** (Domain #49).
- [ ] Implement the **Maximum Permissible Error (MPE) Tolerance Calculator** (Domain #50).

### 🚀 Phase 3: Advanced Intelligence & Offline PWA (Sprint 3)
- [ ] Configure Service Worker and Dexie.js (IndexedDB) for **Offline Field Inspection** (USP #11, #12).
- [ ] Build the **Jurisdiction Compliance Leaflet Heatmap** (USP #23).
- [ ] Implement **Batch Model Failure Anomaly Detection** (USP #22).
- [ ] Build the **Digital Evidence Vault** and **Immutable Audit Log Viewer** (USP #24, #26).
- [ ] Implement **Multilingual Hindi/English toggle** on public and owner pages (Domain #53).

### 🏆 Phase 4: Hackathon Polish & Live Demo Orchestration (Sprint 4)
- [ ] Seed database with rich demo data across Delhi, Mumbai, and Bangalore.
- [ ] Rehearse the 18-step Golden Path hackathon demo script.
- [ ] Verify offline Wi-Fi disconnect demonstration.

---

# 8. Offline-First PWA & Client-Side OCR Architecture

```
┌────────────────────────────────────────────────────────┐
│                   FIELD OFFICER MOBILE PWA             │
│                                                        │
│  [Online]  ──▶ Downloads Assigned Application Queue    │
│  [Offline] ──▶ Performs Calibration & OCR in Browser   │
│            ──▶ Records Observations in Dexie.js (IDB)  │
│            ──▶ Generates Tamper-Proof Local Timestamps │
│  [Online]  ──▶ Background Sync flushes Queue to Server │
│            ──▶ Resolves Conflicts via Hash Locks       │
└────────────────────────────────────────────────────────┘
```
1. **Client-Side WASM OCR:** Optical character recognition runs in the user's browser using `tesseract.js`. This eliminates cloud serverless timeouts (Vercel 10s limit) and works 100% offline.
2. **Dexie.js Local Database:** Stores assigned inspections, captured photos, and calibration logs in local browser storage.
3. **Sync Engine:** Automatically flushes pending inspections upon network reconnection with cryptographic hashes.

---

# 9. Winning Hackathon Demo Script

Follow this exact 18-step live demonstration narrative to captivate evaluators:

1. **Factory Floor (Manufacturer):** Login as *GoldStandard Scales Ltd.* $\to$ Mint a batch of 5 digital weighbridge IDs with model approval `IND/09/2026/88`.
2. **Retail Onboarding (Owner):** Login as *Sharma Grocery Store* $\to$ Claim scale via Serial $\to$ Pre-submission check shows `75% Ready` $\to$ Upload invoice and photo $\to$ `100% Ready` $\to$ Pay statutory ₹250 fee via UPI.
3. **Command Center (Admin):** Admin views incoming queue $\to$ Assigns to nearby *LMO Officer Rajesh Kumar*.
4. **The "Wi-Fi Disconnect" Flex (LMO):** LMO opens assigned queue on mobile $\to$ **Presenter turns OFF laptop Wi-Fi** $\to$ Opens inspection offline $\to$ Snaps camera photo of metal nameplate $\to$ **Client WASM OCR extracts serial number in 1 second**.
5. **MPE Testing (LMO):** Enters test loads ($10\text{ kg} \to 10.003\text{ kg}$) $\to$ MPE calculator marks **PASSED (Within ±5g statutory tolerance)** $\to$ Enters physical lead seal `#HOL-8821` $\to$ Submits inspection offline.
6. **Sync (LMO):** **Presenter turns Wi-Fi back ON** $\to$ Queue automatically syncs to cloud in real time.
7. **Certificate Generation:** Digital Certificate + HMAC SHA-256 signature + live dynamic QR code generated instantly.
8. **Consumer Experience (Public):** Scan QR code $\to$ Mobile browser displays **🟢 Green: Official Legal Metrology Certified**.
9. **The Anomaly & Risk Spike:** Citizen files a short-weight complaint from the QR page.
10. **Dynamic Reaction:** The scale's **Risk Score spikes to 78 (🔴 High Risk)** $\to$ Anomaly panel explains: *"Risk elevated due to citizen short-weight complaint"*.
11. **Regulatory Action:** Admin Command Center instantly highlights the scale in the **Urgent Enforcement Raid Queue**.
12. **Re-verification Diff:** LMO opens re-inspection $\to$ Uses **"What Changed?" Diff Engine** to compare original photo vs. current state to detect unauthorized modification.

---
*End of Blueprint v2.1. This document serves as the single source of truth for the Metrica implementation.*
