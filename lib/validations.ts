import { z } from "zod";

export const RegisterInstrumentSchema = z.object({
  serialNumber: z.string().trim().min(3, "Serial number must be at least 3 characters").max(60),
  modelName: z.string().trim().min(2, "Model name must be at least 2 characters").max(100),
  category: z.enum([
    "ELECTRONIC_COUNTER_SCALE",
    "PLATFORM_SCALE",
    "WEIGHBRIDGE",
    "JEWELRY_PRECISION_BALANCE",
    "FUEL_DISPENSER_NOZZLE",
    "FLOW_METER",
    "LENGTH_MEASURE",
  ]).default("ELECTRONIC_COUNTER_SCALE"),
  accuracyClass: z.enum([
    "CLASS_I",
    "CLASS_II",
    "CLASS_III",
    "CLASS_IV",
    "LIQUID_0_3",
    "LIQUID_0_5",
  ]).default("CLASS_III"),
  nominalUnit: z.enum(["KG", "GRAM", "LITER", "MILLILITER", "METER"]).default("KG"),
  maxCapacity: z.coerce.number().positive("Max capacity must be positive").default(30.0),
  minCapacity: z.coerce.number().nonnegative().default(0.1),
  verificationInterval: z.coerce.number().positive().default(0.005),
  manufacturerName: z.string().trim().default("Apex Metrology Ltd"),
  ownerId: z.string().optional(),
  ownerName: z.string().trim().optional(),
  ownerAddress: z.string().trim().optional(),
  pincode: z.string().trim().regex(/^\d{6}$/, "Pincode must be 6 digits").default("110001"),
  jurisdictionCircle: z.string().trim().default("Delhi North District Circle"),
  status: z.string().default("REGISTERED_PENDING_VERIFICATION"),
});

export const CreateApplicationSchema = z.object({
  instrumentId: z.string().min(1, "Instrument ID is required"),
  applicantName: z.string().trim().min(2, "Applicant name is required"),
  applicantPhone: z.string().trim().default("+91 98000 00000"),
  type: z.enum([
    "INITIAL_VERIFICATION",
    "PERIODIC_REVERIFICATION",
    "POST_REPAIR_VERIFICATION",
  ]).default("INITIAL_VERIFICATION"),
  readinessScore: z.coerce.number().min(0).max(100).default(85),
});

export const UpdateApplicationSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  officerId: z.string().optional(),
  officerName: z.string().optional(),
  scheduledDate: z.string().optional(),
  scheduledSlot: z.string().optional(),
  paymentStatus: z.enum(["PENDING", "PAID"]).optional(),
  status: z.string().optional(),
});

export const SubmitVerificationSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  instrumentId: z.string().min(1, "Instrument ID is required"),
  officerId: z.string().optional(),
  officerName: z.string().optional(),
  result: z.enum(["PASS", "FAIL"]),
  appliedSealNumber: z.string().optional(),
  ocrSerialMatched: z.boolean().default(false),
  mpeTolerancePassed: z.boolean().default(false),
  observations: z.array(z.any()).default([]),
  summaryNotes: z.string().default(""),
});

export const FileComplaintSchema = z.object({
  instrumentId: z.string().optional(),
  digitalInstrumentId: z.string().optional(),
  complaintType: z.enum([
    "SHORT_WEIGHT",
    "BROKEN_SEAL",
    "EXPIRED_STAMP",
    "TAMPERED_SOFTWARE",
    "UNAUTHORIZED_MODIFICATION",
  ]).default("SHORT_WEIGHT"),
  description: z.string().trim().min(5, "Description must be at least 5 characters"),
  complainantPhone: z.string().trim().default("+91 99000 11223"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});

export const LoginSchema = z.object({
  email: z.string().trim().min(1, "Email or identifier is required"),
  password: z.string().optional(),
  role: z.string().optional(),
});
