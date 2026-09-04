"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { InstitutionalNavigation } from "@/components/navigation";
import { InstitutionalHeader } from "@/components/header";
import { useMetrica } from "@/lib/store";
import { Instrument, InstrumentCategory } from "@/lib/types";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

function OwnerDashboardContent() {
  const { instruments, applications, certificates, addInstrument, submitApplication, payApplicationFee, currentUser } = useMetrica();
  const toast = useToast();
  const searchParams = useSearchParams();

  // Sub-section tab: "instruments" | "applications" | "vault" | "readiness"
  const [activeTab, setActiveTab] = useState<"instruments" | "applications" | "vault" | "readiness">("instruments");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "applications" || tabParam === "vault" || tabParam === "readiness" || tabParam === "instruments") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedInst, setSelectedInst] = useState<Instrument | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [serial, setSerial] = useState("");
  const [category, setCategory] = useState<InstrumentCategory>("ELECTRONIC_COUNTER_SCALE");
  const [capacity, setCapacity] = useState("30");
  const [hasUploadedCert, setHasUploadedCert] = useState(false);

  const activeCertificates = certificates.filter((c) => c.status === "ACTIVE_VALID").length;
  const pendingApps = applications.filter((a) => a.status !== "PASSED_CERTIFIED").length;
  const expiringCount = instruments.filter((i) => i.status === "EXPIRING_SOON" || i.status === "EXPIRED").length;

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serial || !name) return;

    const newInst = addInstrument({
      serialNumber: serial,
      modelName: name,
      category,
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: parseFloat(capacity) || 30,
      minCapacity: 0.1,
      verificationInterval: 0.005,
      manufacturerName: "Apex Metrology Ltd",
      ownerName: currentUser.organizationName || currentUser.name || "Commercial Retail Store",
      ownerAddress: "Shop 12, APMC Market Yard",
      pincode: "110001",
      jurisdictionCircle: currentUser.jurisdictionCircle || "Delhi North District Circle",
      status: "REGISTERED_PENDING_VERIFICATION",
    });

    toast.success(
      "Scale Registered Successfully",
      `Instrument ${newInst.digitalInstrumentId} added to your regulatory portfolio.`
    );

    setSerial("");
    setName("");
    setIsRegisterOpen(false);
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInst) return;

    const app = submitApplication({
      instrumentId: selectedInst.id,
      type: "INITIAL_VERIFICATION",
      applicantName: selectedInst.ownerName || currentUser.name || "Retail Merchant",
      applicantPhone: currentUser.phone || "+91 98100 00000",
      readinessScore: hasUploadedCert ? 100 : 75,
    });

    payApplicationFee(app.id, "CHALLAN-" + Date.now().toString().slice(-6));

    toast.success(
      "Verification Application Filed (Form-1)",
      `Application ${app.applicationNumber} submitted. Statutory verification fee paid under Bharatkosh e-Challan.`
    );

    setIsApplyOpen(false);
    setActiveTab("applications");
  };

  return (
    <div className="bg-surface h-full flex overflow-hidden font-sans">
      <InstitutionalNavigation activeSection={activeTab} />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[260px] flex flex-col h-full overflow-hidden bg-background min-w-0">
        <InstitutionalHeader title="Merchant & Owner Workspace" />

        {/* Executive Sub-Section Header Tier */}
        <div className="px-4 lg:px-8 pt-5 pb-0 border-b border-outline-variant bg-surface shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold tracking-wide border border-secondary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  Commercial Licensee Vault • {currentUser.organizationName || "Green Valley Groceries"}
                </span>
              </div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-on-surface tracking-tight">
                Scale Compliance Dashboard
              </h1>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Manage weighing balances, track stamping cycles, and access statutory certificates.
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="bg-surface border border-outline-variant text-primary font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 hover:bg-surface-container-low transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">add_box</span>
                Add Instrument
              </button>
              <button
                onClick={() => {
                  if (instruments.length > 0) {
                    setSelectedInst(instruments[0]);
                    setIsApplyOpen(true);
                  } else {
                    setIsRegisterOpen(true);
                  }
                }}
                className="bg-primary text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-primary-container transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                Apply for Stamping
              </button>
            </div>
          </div>

          {/* Sub-Section Tab Strip (Underline Style, Never Wraps) */}
          <div className="flex items-center gap-2 sm:gap-6 border-t border-outline-variant/60 overflow-x-auto no-scrollbar pt-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("instruments")}
              className={`pb-3 pt-2 whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === "instruments"
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">precision_manufacturing</span>
              My Scales & Instruments
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-container font-mono text-on-surface">
                {instruments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("applications")}
              className={`pb-3 pt-2 whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === "applications"
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">edit_document</span>
              Stamping Applications
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-container font-mono text-on-surface">
                {applications.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("vault")}
              className={`pb-3 pt-2 whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === "vault"
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              Certificate Vault
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-container font-mono text-on-surface">
                {activeCertificates}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("readiness")}
              className={`pb-3 pt-2 whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === "readiness"
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">rule</span>
              Compliance Readiness
            </button>
          </div>
        </div>

        {/* Scrollable Sub-Section Canvas */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
          {/* SUB-SECTION 1: MY SCALES & INSTRUMENTS */}
          {activeTab === "instruments" && (
            <div className="space-y-6">
              {/* Summary Metrics (3 Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-surface border border-outline-variant rounded-xl p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <h3 className="text-xs text-on-surface-variant font-medium">Active Valid Certificates</h3>
                    <div className="text-2xl font-bold text-on-surface mt-1">{activeCertificates}</div>
                    <p className="text-[10px] text-secondary font-semibold mt-0.5">Compliant for trading</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                </div>

                <div className="bg-surface border border-outline-variant rounded-xl p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <h3 className="text-xs text-on-surface-variant font-medium">Pending Verifications</h3>
                    <div className="text-2xl font-bold text-on-surface mt-1">{pendingApps}</div>
                    <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Awaiting circle officer</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                    <span className="material-symbols-outlined">pending_actions</span>
                  </div>
                </div>

                <div className="bg-surface border border-outline-variant rounded-xl p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <h3 className="text-xs text-on-surface-variant font-medium">Expiring Soon (30 Days)</h3>
                    <div className="text-2xl font-bold text-on-surface mt-1">{expiringCount}</div>
                    <p className="text-[10px] text-error font-semibold mt-0.5">Re-stamping required</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center">
                    <span className="material-symbols-outlined">alarm</span>
                  </div>
                </div>
              </div>

              {/* Registered Instruments Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-on-surface">Registered Commercial Scales</h3>
                  <span className="text-xs text-on-surface-variant">{instruments.length} Total Registered</span>
                </div>

                {instruments.length === 0 ? (
                  <div className="bg-surface border border-outline-variant rounded-2xl p-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-outline mb-2">scale</span>
                    <h4 className="font-bold text-base text-on-surface">No Instruments Registered</h4>
                    <p className="text-xs text-on-surface-variant mt-1 mb-4 max-w-sm mx-auto">
                      Add your commercial weighing scales or counter balances to manage statutory stamping.
                    </p>
                    <button
                      onClick={() => setIsRegisterOpen(true)}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-xs hover:bg-primary-container"
                    >
                      Add First Instrument
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {instruments.map((inst) => {
                      const isVerified = inst.status === "VERIFIED_ACTIVE";
                      const isHighRisk = inst.priorityFlag === "HIGH" || inst.priorityFlag === "CRITICAL";

                      return (
                        <div
                          key={inst.id}
                          className="bg-surface border border-outline-variant rounded-2xl p-4 shadow-xs hover:border-primary transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                                {inst.digitalInstrumentId}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                isVerified
                                  ? "bg-secondary-container text-on-secondary-container"
                                  : isHighRisk
                                  ? "bg-error-container text-on-error-container"
                                  : "bg-surface-container text-on-surface-variant"
                              }`}>
                                {isVerified ? "VALID CERT" : inst.status.replace(/_/g, " ")}
                              </span>
                            </div>

                            <h4 className="font-bold text-sm text-on-surface">{inst.modelName}</h4>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">
                              Serial: <span className="font-mono font-semibold">{inst.serialNumber}</span> • Max: {inst.maxCapacity} {inst.nominalUnit}
                            </p>
                            <p className="text-[10px] text-outline mt-0.5">
                              Premises: {inst.ownerAddress || "APMC Yard"}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between text-xs">
                            <Link
                              href={`/qr/${inst.digitalInstrumentId}`}
                              className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">qr_code_2</span>
                              Public QR Card
                            </Link>

                            <button
                              onClick={() => {
                                setSelectedInst(inst);
                                setIsApplyOpen(true);
                              }}
                              className="px-2.5 py-1 bg-surface-container-low border border-outline-variant text-on-surface hover:bg-primary hover:text-white rounded text-[11px] font-semibold transition-all"
                            >
                              Apply Stamping
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-SECTION 2: STAMPING APPLICATIONS */}
          {activeTab === "applications" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-on-surface">Statutory Verification Applications (Form-1)</h3>
                  <p className="text-xs text-on-surface-variant">Track government inspection scheduling and e-Challan payments.</p>
                </div>
                <button
                  onClick={() => {
                    if (instruments.length > 0) {
                      setSelectedInst(instruments[0]);
                      setIsApplyOpen(true);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow-xs hover:bg-primary-container"
                >
                  + File New Application
                </button>
              </div>

              {applications.length === 0 ? (
                <div className="p-10 bg-surface border border-outline-variant rounded-xl text-center text-xs text-on-surface-variant">
                  No active verification applications filed yet.
                </div>
              ) : (
                <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant">
                      <tr>
                        <th className="p-3">Application No.</th>
                        <th className="p-3">Instrument ID</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Readiness</th>
                        <th className="p-3">e-Challan Fee</th>
                        <th className="p-3">Scheduled Slot</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {applications.map((app) => (
                        <tr key={app.id} className="hover:bg-surface-container-low/50">
                          <td className="p-3 font-mono font-bold text-primary">{app.applicationNumber}</td>
                          <td className="p-3 font-mono">{app.instrumentSerial}</td>
                          <td className="p-3">{app.type.replace(/_/g, " ")}</td>
                          <td className="p-3">
                            <span className="font-bold text-emerald-700">{app.readinessScore}%</span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-on-surface-variant">
                            {app.paymentRefNumber || "PAID-CHALLAN"}
                          </td>
                          <td className="p-3 text-on-surface">
                            {app.scheduledDate ? `${app.scheduledDate} (${app.scheduledSlot})` : "Awaiting Officer"}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 uppercase">
                              {app.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SUB-SECTION 3: CERTIFICATE VAULT */}
          {activeTab === "vault" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-on-surface">Official Stamping Certificates Repository (Form-A)</h3>
                <p className="text-xs text-on-surface-variant">
                  Cryptographically signed certificates under the Legal Metrology (General) Rules 2011.
                </p>
              </div>

              {certificates.length === 0 ? (
                <div className="p-12 bg-surface border border-outline-variant rounded-xl text-center">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">verified_user</span>
                  <h4 className="font-bold text-base text-on-surface">No Certificates Issued Yet</h4>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                    Certificates appear here immediately once an LMO inspector completes physical on-site testing.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="bg-surface border border-outline-variant rounded-xl p-5 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-mono font-bold text-primary text-xs">{cert.certificateNumber}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            LEGAL STAMP ACTIVE
                          </span>
                        </div>
                        <div className="font-bold text-sm text-on-surface mt-1">
                          Instrument: {cert.digitalInstrumentId}
                        </div>
                        <div className="text-xs text-on-surface-variant mt-1">
                          Holographic Wire Seal: <strong className="font-mono">{cert.physicalSealNumber}</strong>
                        </div>
                        <div className="text-xs text-on-surface-variant mt-0.5">
                          Calibration Validity: <strong>{cert.issueDate} &rarr; {cert.validUntil}</strong>
                        </div>
                        <div className="text-[10px] font-mono text-outline mt-2 truncate">
                          Signature: {cert.digitalSignatureHash}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-outline-variant flex gap-2">
                        <button
                          onClick={() => window.print()}
                          className="flex-1 py-1.5 bg-surface border border-outline-variant rounded text-xs font-semibold hover:bg-surface-container flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">print</span>
                          Print Certificate
                        </button>
                        <Link
                          href={cert.qrPayloadUrl}
                          className="flex-1 py-1.5 bg-primary text-white rounded text-xs font-semibold hover:bg-primary-container flex items-center justify-center gap-1 text-center"
                        >
                          <span className="material-symbols-outlined text-[14px]">qr_code</span>
                          View Public QR
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-SECTION 4: COMPLIANCE READINESS */}
          {activeTab === "readiness" && (
            <div className="space-y-6 max-w-3xl">
              <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base text-on-surface">Statutory Stamping Readiness Meter</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Checklist required prior to LMO field officer inspection under the Seventh Schedule.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-secondary">85%</div>
                    <span className="text-[10px] font-bold text-secondary uppercase">Ready for Inspection</span>
                  </div>
                </div>

                <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden mb-6">
                  <div className="bg-secondary h-full rounded-full w-[85%] transition-all" />
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900">
                    <span className="material-symbols-outlined text-base text-emerald-700">check_circle</span>
                    <div>
                      <strong className="block font-semibold">Instrument Birth Identity Verified</strong>
                      <span className="text-[11px] opacity-80">Digital Twin serial numbers registered and matched in Central Registry.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900">
                    <span className="material-symbols-outlined text-base text-emerald-700">check_circle</span>
                    <div>
                      <strong className="block font-semibold">Statutory Stamping Fee Paid</strong>
                      <span className="text-[11px] opacity-80">Fee submitted via official Bharatkosh e-Challan transaction.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900">
                    <span className="material-symbols-outlined text-base text-emerald-700">check_circle</span>
                    <div>
                      <strong className="block font-semibold">Physical Leveling Ready</strong>
                      <span className="text-[11px] opacity-80">Weighing pan is mounted on stable, vibration-free masonry counter.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900">
                    <span className="material-symbols-outlined text-base text-amber-700">warning</span>
                    <div>
                      <strong className="block font-semibold">Commercial Purchase Invoice Proof (Optional)</strong>
                      <span className="text-[11px] opacity-80">Keep physical invoice copy ready during the LMO officer's scheduled visit.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal: Register New Instrument */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Commercial Weighing Instrument"
        subtitle="Add a physical scale or balance to your business compliance vault"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-on-surface mb-1">Instrument Model / Trade Name</label>
            <input
              type="text"
              placeholder="e.g. Apex Counter Pro 30"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface-container-lowest outline-none focus:border-primary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-on-surface mb-1">Stamped Serial Number</label>
              <input
                type="text"
                placeholder="SN-8829-X"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface-container-lowest font-mono outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-on-surface mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InstrumentCategory)}
                className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface-container-lowest outline-none focus:border-primary"
              >
                <option value="ELECTRONIC_COUNTER_SCALE">Electronic Counter Scale</option>
                <option value="PLATFORM_SCALE">Platform Scale</option>
                <option value="WEIGHBRIDGE">Heavy Weighbridge</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-container shadow-xs"
          >
            Register Scale in Vault
          </button>
        </form>
      </Modal>

      {/* Modal: Apply for Verification (Form-1) */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        title="Apply for Statutory Stamping (Form-1)"
        subtitle="Submit application for official Legal Metrology verification"
      >
        {selectedInst && (
          <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant">
              <div className="font-bold text-on-surface">{selectedInst.modelName}</div>
              <div className="text-[11px] text-on-surface-variant font-mono">
                ID: {selectedInst.digitalInstrumentId} • Serial: {selectedInst.serialNumber}
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px]">
              <strong>Statutory Fee:</strong> ₹150.00 (Class III Commercial Scale, Seventh Schedule). Generated under Bharatkosh e-Challan upon submission.
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasUploadedCert}
                onChange={(e) => setHasUploadedCert(e.target.checked)}
                className="rounded text-primary"
              />
              <span className="text-on-surface">I confirm physical scale is installed and ready for field inspection.</span>
            </label>

            <button
              type="submit"
              className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-container shadow-xs"
            >
              Submit Form-1 & Pay e-Challan Fee
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default function OwnerDashboardPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center text-xs text-outline">Loading Merchant Workspace...</div>}>
      <OwnerDashboardContent />
    </Suspense>
  );
}

