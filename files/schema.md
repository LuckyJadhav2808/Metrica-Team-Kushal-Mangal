# Data Schema
## Online Verification & Intelligent Lifecycle Management System

Companion to `prd.md` and `app-flow.md`. Written as entity definitions with fields,
types, and relationships — implementation-agnostic (works for Postgres/Prisma/etc).

---

## Entity-Relationship Overview

```
USER / ORGANIZATION
   └── OWNS ── INSTRUMENT
                  ├── InstrumentModel
                  ├── Manufacturer
                  ├── OwnershipHistory
                  ├── LocationHistory
                  ├── VerificationApplication
                  │      ├── Assignment
                  │      └── VerificationSchedule
                  ├── Verification
                  │      ├── VerificationObservation
                  │      └── Evidence
                  ├── Certificate
                  │      └── QRVerificationLog
                  ├── Complaint
                  ├── RepairModificationEvent
                  ├── RiskScore / TrustScore
                  ├── Anomaly / PriorityFlag
                  ├── AuditLog
                  └── InstrumentEvent (chain of custody timeline)
```

---

## Core Entities

### User
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| role | enum | OWNER, MANUFACTURER, LMO, GATC, ADMIN, PUBLIC |
| name | string | |
| email | string | unique |
| phone | string | |
| password_hash | string | |
| organization_id | UUID (FK → Organization) | nullable |
| jurisdiction_id | UUID (FK → Jurisdiction) | nullable, for LMO/GATC/Admin |
| created_at / updated_at | timestamp | |

### Organization
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | string | business/manufacturer/GATC name |
| type | enum | BUSINESS, MANUFACTURER, GATC |
| registration_number | string | |
| address | string | |

### Manufacturer
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| organization_id | UUID (FK → Organization) | |
| license_number | string | |

### InstrumentModel
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| manufacturer_id | UUID (FK) | |
| model_name | string | |
| category | enum | e.g., WEIGHING_SCALE, FUEL_DISPENSER, WATER_METER, etc. |
| default_capacity | string | |
| spec_json | jsonb | flexible spec fields per category |

### Instrument (the Digital Instrument ID / Digital Twin root)
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | **the permanent Digital Instrument ID** |
| instrument_model_id | UUID (FK) | nullable if not manufacturer-registered |
| manufacturer_id | UUID (FK) | nullable |
| serial_number | string | unique, indexed |
| capacity | string | |
| specifications | jsonb | |
| current_owner_id | UUID (FK → User/Organization) | nullable until claimed |
| current_location_id | UUID (FK → InstrumentLocation) | |
| status | enum | MANUFACTURED, UNCLAIMED, OWNED, UNVERIFIED, VERIFICATION_PENDING, VERIFICATION_IN_PROGRESS, VERIFIED, FAILED, EXPIRED, RE_VERIFICATION, DECOMMISSIONED |
| current_risk_score | int | denormalized latest value |
| current_trust_score | int | denormalized latest value |
| priority_flag | enum | RED, YELLOW, GREEN, nullable |
| created_at / updated_at | timestamp | |

### InstrumentOwnership
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| instrument_id | UUID (FK) | |
| owner_id | UUID (FK → User/Organization) | |
| start_date / end_date | date | end_date null = current owner |
| transfer_reason | string | nullable |

### InstrumentLocation
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| instrument_id | UUID (FK) | |
| jurisdiction_id | UUID (FK) | |
| address | string | |
| effective_from / effective_to | date | |

### VerificationApplication
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| instrument_id | UUID (FK) | |
| applicant_id | UUID (FK → User) | |
| type | enum | INITIAL, RE_VERIFICATION |
| status | enum | DRAFT, SUBMITTED, READINESS_REVIEW, PENDING_ASSIGNMENT, ASSIGNED, SCHEDULED, VERIFICATION_IN_PROGRESS, RESULT_SUBMITTED, CERTIFICATE_ISSUED, FAILED |
| readiness_score | int | 0–100, from Compliance Readiness Score check |
| submitted_at | timestamp | |

### Assignment
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| application_id | UUID (FK) | |
| assigned_to_user_id | UUID (FK → LMO/GATC User) | |
| assigned_by_admin_id | UUID (FK → Admin User) | admin-controlled, per design decision |
| assigned_at | timestamp | |
| reassignment_reason | string | nullable |

### VerificationSchedule
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| application_id | UUID (FK) | |
| scheduled_date | date | |
| scheduled_slot | string | |

### Verification
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| application_id | UUID (FK) | |
| instrument_id | UUID (FK) | |
| officer_id | UUID (FK → LMO/GATC User) | |
| result | enum | PASS, FAIL |
| failure_reason | string | nullable |
| serial_number_ocr_result | string | raw OCR output |
| serial_number_match | boolean | OCR vs registered record |
| performed_offline | boolean | |
| synced_at | timestamp | nullable |
| submitted_at | timestamp | |

### VerificationObservation
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| verification_id | UUID (FK) | |
| checklist_item | string | from adaptive checklist |
| value | string / jsonb | |
| flagged_inconsistent | boolean | |

### Evidence
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| instrument_id | UUID (FK) | |
| verification_id | UUID (FK) | nullable — evidence can attach to application too |
| type | enum | PHOTO, DOCUMENT, SERIAL_NUMBER_IMAGE, INVOICE |
| file_url | string | secure storage reference |
| uploaded_by_id | UUID (FK → User) | |
| uploaded_at | timestamp | |

### Certificate
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| instrument_id | UUID (FK) | |
| verification_id | UUID (FK) | |
| certificate_number | string | unique |
| issued_at | date | |
| valid_until | date | |
| status | enum | VALID, EXPIRED, REVOKED, SUPERSEDED |
| qr_token | string | unique, unguessable — the only thing embedded in the QR |

### QRVerificationLog
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| certificate_id | UUID (FK) | |
| scanned_at | timestamp | |
| scanner_ip_hash | string | privacy-safe |
| resolved_status_at_scan | string | GREEN/YELLOW/RED snapshot for audit |

### Complaint
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| instrument_id | UUID (FK) | nullable if reporter can't identify instrument |
| reported_by_id | UUID (FK → User) | nullable for anonymous public reports |
| category | enum | INCORRECT_MEASUREMENT, SUSPICIOUS_CERTIFICATE, POSSIBLE_TAMPERING, OTHER |
| description | text | |
| status | enum | OPEN, CLUSTERED, REVIEWED, RESOLVED, DISMISSED |
| created_at | timestamp | |

### RepairModificationEvent
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| instrument_id | UUID (FK) | |
| reported_by_id | UUID (FK → User) | |
| description | text | what changed |
| evidence_id | UUID (FK → Evidence) | nullable |
| review_required_flag | boolean | system-suggested, not authoritative |
| event_date | date | |

### RiskScore / TrustScore
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| instrument_id | UUID (FK) | |
| score | int | 0–100 |
| level | enum | LOW, MEDIUM, HIGH |
| factors_json | jsonb | list of contributing factors, for the explanation panel |
| calculated_at | timestamp | |

### Anomaly
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| instrument_id | UUID (FK) | |
| type | enum | SERIAL_MISMATCH, DUPLICATE_REGISTRATION, CERTIFICATE_CLONE_SUSPECTED, DOCUMENT_INCONSISTENCY, NETWORK_PATTERN |
| explanation | text | plain-language reason (Fraud-Suspicion Explanation Panel) |
| detected_at | timestamp | |
| resolved | boolean | |

### PriorityFlag
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| instrument_id | UUID (FK) | |
| level | enum | RED, YELLOW, GREEN |
| reason_summary | text | |
| set_at | timestamp | |

### AuditLog (immutable)
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| entity_type | string | e.g., "Instrument", "Certificate" |
| entity_id | UUID | |
| actor_id | UUID (FK → User) | |
| action | string | |
| previous_value | jsonb | nullable |
| new_value | jsonb | nullable |
| correction_reason | string | nullable — only for controlled corrections |
| created_at | timestamp | append-only, never updated/deleted |

### Notification
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK) | |
| type | enum | EXPIRY_REMINDER, ASSIGNMENT, STATUS_CHANGE, PRIORITY_ALERT |
| message | text | |
| severity | enum | LOW, MEDIUM, HIGH, CRITICAL |
| read | boolean | |
| created_at | timestamp | |

### Jurisdiction
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | string | |
| region_code | string | |

### InstrumentEvent (chain-of-custody timeline)
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| instrument_id | UUID (FK) | |
| event_type | enum | MANUFACTURED, REGISTERED, OWNERSHIP_TRANSFER, VERIFICATION, CERTIFICATE_ISSUED, REPAIR_MODIFICATION, RE_VERIFICATION, CERTIFICATE_RENEWAL, COMPLAINT, ANOMALY_DETECTED, DECOMMISSIONED |
| event_ref_id | UUID | polymorphic ref to the source record |
| occurred_at | timestamp | |

---

## Key Relationships Summary

- `Instrument` is the aggregate root — every other entity hangs off `instrument_id`.
- `VerificationApplication` → `Assignment` → `Verification` → `Certificate` is the linear happy-path chain.
- `RiskScore`, `TrustScore`, `Anomaly`, and `PriorityFlag` are all derived/recalculated records, not user-edited — they read from `Complaint`, `Verification`, `Certificate`, and `AuditLog`.
- `AuditLog` and `InstrumentEvent` are both append-only; corrections create new rows, never mutate old ones.
- `QRVerificationLog` never stores personal data about the scanner — only enough to detect abuse patterns for `Complaint` clustering.

## Indexing Notes (for implementation)
- `Instrument.serial_number` — unique index, used for duplicate detection (USP-27).
- `Certificate.qr_token` — unique index, the only lookup key exposed via QR.
- `Complaint.instrument_id`, `Anomaly.instrument_id` — indexed for risk score recalculation.
- `VerificationApplication.status`, `Instrument.status` — indexed for dashboard filtering/pendency queries.
