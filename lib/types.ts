// Metrica Domain Types (Strictly aligned with schema.md and PROJECT_BLUEPRINT.md)

export type UserRole = "MANUFACTURER" | "OWNER" | "LMO" | "GATC" | "ADMIN" | "PUBLIC";

export type InstrumentCategory =
  | "ELECTRONIC_COUNTER_SCALE"
  | "PLATFORM_SCALE"
  | "WEIGHBRIDGE"
  | "JEWELRY_PRECISION_BALANCE"
  | "FUEL_DISPENSER_NOZZLE"
  | "FLOW_METER"
  | "LENGTH_MEASURE";

export type AccuracyClass =
  | "CLASS_I"
  | "CLASS_II"
  | "CLASS_III"
  | "CLASS_IV"
  | "LIQUID_0_3"
  | "LIQUID_0_5";

export type MeasurementUnit = "KG" | "GRAM" | "LITER" | "MILLILITER" | "METER";

export type InstrumentStatus =
  | "MANUFACTURED_UNCLAIMED"
  | "REGISTERED_PENDING_VERIFICATION"
  | "VERIFIED_ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "REJECTION_NOTICE_ISSUED"
  | "REPAIR_PENDING_INSPECTION"
  | "SUSPENDED_TAMPERED";

export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ApplicationStatus =
  | "DRAFT"
  | "PAYMENT_PENDING"
  | "PAYMENT_COMPLETED_PENDING_ASSIGNMENT"
  | "ASSIGNED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "PASSED_CERTIFIED"
  | "REJECTION_NOTICE_ISSUED"
  | "REPAIRED_PENDING_REINSPECTION";

export type VerificationResult = "PASS" | "FAIL";

export interface Instrument {
  id: string;
  digitalInstrumentId: string; // e.g. "IND-MET-2026-X892J"
  serialNumber: string;
  modelName: string;
  category: InstrumentCategory;
  accuracyClass: AccuracyClass;
  nominalUnit: MeasurementUnit;
  maxCapacity: number;
  minCapacity: number;
  verificationInterval: number; // 'e' value
  manufacturerName: string;
  ownerName?: string;
  ownerGstin?: string;
  ownerAddress?: string;
  jurisdictionCircle: string;
  pincode: string;
  status: InstrumentStatus;
  riskScore: number; // 0 - 100
  trustScore: number; // 0 - 100
  priorityFlag: PriorityLevel;
  lastVerifiedAt?: string;
  validUntil?: string;
  currentSealNumber?: string;
  createdAt: string;
}

export interface VerificationApplication {
  id: string;
  applicationNumber: string; // e.g. "APP-2026-00101"
  instrumentId: string;
  instrumentSerial: string;
  instrumentCategory: InstrumentCategory;
  applicantName: string;
  applicantPhone: string;
  jurisdictionCircle: string;
  type: "INITIAL_VERIFICATION" | "PERIODIC_REVERIFICATION" | "POST_REPAIR_VERIFICATION";
  status: ApplicationStatus;
  readinessScore: number; // 0 - 100%
  statutoryFee: number;
  penaltyFee: number;
  paymentStatus: "PENDING" | "PAID";
  paymentRefNumber?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  createdAt: string;
}

export interface VerificationObservation {
  id: string;
  nominalTestValue: number;
  observedValue: number;
  unit: MeasurementUnit;
  errorCalculated: number;
  maxPermissibleError: number;
  isWithinTolerance: boolean;
  testCategory: string; // "ECCENTRICITY" | "REPEATABILITY" | "INCREASING_LOAD" | "DECREASING_LOAD"
}

export interface Verification {
  id: string;
  applicationId: string;
  instrumentId: string;
  officerId: string;
  officerName: string;
  inspectionDate: string;
  result: VerificationResult;
  appliedSealNumber?: string;
  ocrSerialMatched: boolean;
  ocrExtractedSerial?: string;
  mpeTolerancePassed: boolean;
  observations: VerificationObservation[];
  summaryNotes?: string;
  performedOffline?: boolean;
  geoCoordinates?: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string; // e.g. "CERT-DL-2026-0089"
  instrumentId: string;
  digitalInstrumentId: string;
  issueDate: string;
  validUntil: string;
  status: "ACTIVE_VALID" | "EXPIRING_SOON" | "EXPIRED" | "REVOKED";
  physicalSealNumber: string;
  digitalSignatureHash: string;
  signedByOfficerName: string;
  qrPayloadUrl: string;
  geoCoordinates?: string;
}

export interface Complaint {
  id: string;
  instrumentId?: string;
  digitalInstrumentId?: string;
  complainantName?: string;
  complainantPhone?: string;
  complaintType: "SHORT_WEIGHT" | "BROKEN_SEAL" | "EXPIRED_CERTIFICATE" | "TAMPERING" | "OTHER";
  description: string;
  status: "LOGGED" | "UNDER_INVESTIGATION" | "ACTION_TAKEN_RAID" | "DISMISSED" | "RESOLVED";
  impactOnRiskScore: number;
  createdAt: string;
  resolutionNotes?: string;
  investigationApplicationId?: string;
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  designation: string;
  email: string;
  phone: string;
  organizationName?: string;
  jurisdictionCircle: string;
  officerBadgeId?: string;
  avatarLetter: string;
}

export interface Notification {
  id: string;
  userId?: string;
  targetRole?: UserRole;
  type: "EXPIRY_REMINDER" | "ASSIGNMENT" | "COMPLAINT_FILED" | "STATUS_CHANGE" | "SYSTEM";
  title: string;
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  read: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
}

export interface Jurisdiction {
  id: string;
  name: string;
  stateCode: string;
  district: string;
  activeOfficersCount: number;
}
