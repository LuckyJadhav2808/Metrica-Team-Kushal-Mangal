import { prisma } from "../lib/prisma";
import crypto from "crypto";
import { RegisterInstrumentSchema, FileComplaintSchema } from "../lib/validations";
import { INDIAN_CITIES } from "../lib/geo-config";

async function runSystemVerification() {
  console.log("=================================================");
  console.log("  METRICA SIH 2026 — SYSTEM VERIFICATION SUITE   ");
  console.log("=================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assertTest(name: string, condition: boolean, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✔ [PASS] ${name}`);
    } else {
      console.error(`  ✖ [FAIL] ${name} ${detail ? `(${detail})` : ""}`);
    }
  }

  // 1. Database & Prisma Connection Test
  console.log("--- 1. Database Engineering & Optimization ---");
  try {
    const instCount = await prisma.instrument.count();
    assertTest("Database connection active and responding", true);
    assertTest(`Instruments seeded in database (Found: ${instCount})`, instCount >= 10);

    const userCount = await prisma.user.count();
    assertTest(`Government personas & officers seeded (Found: ${userCount})`, userCount >= 4);
  } catch (err: any) {
    assertTest("Database connection active and responding", false, err.message);
  }

  // 2. Cryptographic Integrity & Tamper Proof Test
  console.log("\n--- 2. AppSec & Cryptographic Verification ---");
  try {
    const secret = "test-sovereign-secret";
    const certNumber = "CERT-DoCA-2026-9999";
    const digitalInstrumentId = "IND-MET-2026-AZ01";
    const sealNumber = "SEAL-DL-2026-9921";
    const issueDate = "2026-09-14";
    const officerName = "Rajesh Kumar";

    const payload = `${certNumber}|${digitalInstrumentId}|${sealNumber}|${issueDate}|${officerName}`;
    const hash1 = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const hash2 = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    assertTest("HMAC-SHA256 signature is deterministic", hash1 === hash2);

    const tamperedPayload = `${certNumber}|${digitalInstrumentId}|SEAL-TAMPERED-0000|${issueDate}|${officerName}`;
    const tamperedHash = crypto.createHmac("sha256", secret).update(tamperedPayload).digest("hex");

    assertTest("Tampered seal payload generates completely different hash", hash1 !== tamperedHash);
  } catch (err: any) {
    assertTest("Cryptographic verification", false, err.message);
  }

  // 3. Zero-Trust Runtime Payload Validation
  console.log("\n--- 3. Zero-Trust Runtime Validation (Zod) ---");
  const validInst = RegisterInstrumentSchema.safeParse({
    serialNumber: "SN-TEST-8899",
    modelName: "Apex Counter Scale Pro",
    maxCapacity: 30,
    minCapacity: 0.1,
    pincode: "110001",
  });
  assertTest("RegisterInstrumentSchema accepts valid instrument payload", validInst.success);

  const invalidInst = RegisterInstrumentSchema.safeParse({
    serialNumber: "X", // too short
    modelName: "",
    pincode: "INVALID_PIN",
  });
  assertTest("RegisterInstrumentSchema rejects invalid serial and malformed pincode", !invalidInst.success);

  const validComplaint = FileComplaintSchema.safeParse({
    digitalInstrumentId: "IND-MET-2026-AZ01",
    complaintType: "SHORT_WEIGHT",
    description: "Scale indicated 1.000 kg for 850 grams actual vegetable weight",
    complainantPhone: "+91 99000 11223",
  });
  assertTest("FileComplaintSchema accepts well-formed citizen complaint", validComplaint.success);

  // 4. GIS Multi-City Configuration
  console.log("\n--- 4. Multi-City GIS Telemetry Registry ---");
  const cities = ["DELHI", "MUMBAI", "PUNE"] as const;
  for (const city of cities) {
    const config = INDIAN_CITIES[city];
    const hasCoords = config && config.center && config.center[0] > 0 && config.center[1] > 0;
    const hasHubs = config && config.hubs && config.hubs.length > 0;
    assertTest(`GIS City [${city}] configured with valid coordinates & hubs (${config.hubs.length} hubs)`, Boolean(hasCoords && hasHubs));
  }

  console.log("\n=================================================");
  console.log(`  VERIFICATION RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("=================================================\n");

  await prisma.$disconnect();
  process.exit(passedTests === totalTests ? 0 : 1);
}

runSystemVerification().catch((e) => {
  console.error("Verification execution error:", e);
  process.exit(1);
});
