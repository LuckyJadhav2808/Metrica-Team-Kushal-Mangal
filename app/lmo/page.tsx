"use client";

import React, { useState } from "react";
import Link from "next/link";
import { InstitutionalNavigation } from "@/components/navigation";
import { InstitutionalHeader } from "@/components/header";
import { useMetrica } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { Certificate } from "@/lib/types";

export default function LMOFieldVerificationPage() {
  const { applications, instruments, submitVerification, currentUser, loginAs } = useMetrica();
  const toast = useToast();

  const assignedCases = applications.filter((a) => a.status === "SCHEDULED" || a.status === "IN_PROGRESS");
  const [selectedAppId, setSelectedAppId] = useState<string>(assignedCases.length > 0 ? assignedCases[0].id : "");

  const currentApp = applications.find((a) => a.id === selectedAppId) || (assignedCases.length > 0 ? assignedCases[0] : null);
  const currentInst = currentApp ? instruments.find((i) => i.id === currentApp.instrumentId) : (instruments.length > 0 ? instruments[0] : null);

  // Form check state
  const [housingIntact, setHousingIntact] = useState(true);
  const [levelCentered, setLevelCentered] = useState(true);
  const [zeroTracking, setZeroTracking] = useState(true);
  const [nominalLoad, setNominalLoad] = useState("10.000");
  const [observedLoad, setObservedLoad] = useState("10.002");
  const [sealWireNumber, setSealWireNumber] = useState("SEAL-DL-2026-9921");
  const [notes, setNotes] = useState("");

  // Optical OCR scan state
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrVerified, setOcrVerified] = useState(false);

  // Evidence Photos Captured state
  const [capturedPhotos, setCapturedPhotos] = useState<{ plate: boolean; seal: boolean; weights: boolean }>({
    plate: false,
    seal: false,
    weights: false,
  });

  // Success / Failure Modal State
  const [issuedCert, setIssuedCert] = useState<Certificate | null>(null);

  // MPE Calculation
  const nominalVal = parseFloat(nominalLoad) || 10;
  const observedVal = parseFloat(observedLoad) || 10;
  const calculatedError = Math.abs(observedVal - nominalVal);
  const mpeLimit = 0.005; // 5 grams for standard commercial Class III at 10kg
  const isWithinTolerance = calculatedError <= mpeLimit;

  // RBAC Barrier if visitor is a commercial merchant or manufacturer
  if (currentUser.role === "OWNER" || currentUser.role === "MANUFACTURER") {
    return (
      <div className="bg-surface h-full flex overflow-hidden font-sans">
        <InstitutionalNavigation activeSection="docket" />
        <main className="flex-1 flex flex-col h-full overflow-hidden md:ml-[260px] bg-background">
          <InstitutionalHeader title="Field Officer Inspection Workspace" />
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-surface border border-outline-variant rounded-2xl p-6 shadow-xl text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
              </div>
              <h2 className="font-bold text-base text-on-surface">
                Legal Metrology Inspectorate Clearance Required
              </h2>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                You are currently signed in as <strong>{currentUser.name}</strong> ({currentUser.designation}). The On-Site Field Docket and Stamping Tools are strictly restricted to authorized Legal Metrology Officers (LMO) and Directorate Administrators.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    loginAs("LMO");
                    toast.success("Switched to Field Officer", "Logged in as Rajesh Kumar (LMO Grade-I).");
                  }}
                  className="flex-1 py-2.5 px-4 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-container transition-all shadow-sm"
                >
                  Switch to Inspector (Rajesh Kumar)
                </button>
                <Link
                  href="/owner"
                  className="flex-1 py-2.5 px-4 bg-surface-container-low border border-outline-variant text-on-surface rounded-lg text-xs font-semibold hover:bg-surface-container transition-all text-center flex items-center justify-center"
                >
                  Return to Merchant Portal
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleSimulateOcr = () => {
    setOcrScanning(true);
    setTimeout(() => {
      setOcrScanning(false);
      setOcrVerified(true);
      setIsCameraModalOpen(false);
      setCapturedPhotos((prev) => ({ ...prev, plate: true }));
      toast.success(
        "Optical Character Recognition Succeeded",
        `Serial ${currentInst?.serialNumber || "SN-8829-X"} matched against Central Registry (Confidence: 99.4%)`
      );
    }, 1100);
  };

  const handleTogglePhoto = (key: "plate" | "seal" | "weights") => {
    setCapturedPhotos((prev) => {
      const nextVal = !prev[key];
      if (nextVal) {
        toast.info("Photographic Evidence Attached", `Geo-tagged frame for ${key} attached with cryptographic timestamp.`);
      }
      return { ...prev, [key]: nextVal };
    });
  };

  const handleDecision = (decision: "PASS" | "FAIL") => {
    if (!currentApp || !currentInst) {
      toast.error(
        "No Active Inspection Case Selected",
        "Please select an assigned case from your docket to conduct verification."
      );
      return;
    }

    if (decision === "PASS" && !isWithinTolerance) {
      toast.error(
        "Legal Tolerance Violation",
        "Scale exceeds statutory Maximum Permissible Error (MPE). Instrument cannot pass legal stamping."
      );
      return;
    }

    const appliedSeal = decision === "PASS" ? (sealWireNumber || "HOL-DEL-" + Math.floor(1000 + Math.random() * 9000)) : undefined;

    const { certificate } = submitVerification({
      applicationId: currentApp.id,
      instrumentId: currentInst.id,
      officerId: currentUser.id || "off-del-01",
      officerName: currentUser.name || "Rajesh Kumar (LMO Grade-I)",
      result: decision,
      appliedSealNumber: appliedSeal,
      ocrSerialMatched: ocrVerified,
      mpeTolerancePassed: isWithinTolerance,
      observations: [
        {
          id: "obs-1",
          nominalTestValue: nominalVal,
          observedValue: observedVal,
          unit: "KG",
          errorCalculated: calculatedError,
          maxPermissibleError: mpeLimit,
          isWithinTolerance: isWithinTolerance,
          testCategory: "INCREASING_LOAD",
        },
      ],
      summaryNotes: notes || "Physical calibration completed on site as per Legal Metrology (General) Rules 2011.",
    });

    if (decision === "PASS" && certificate) {
      setIssuedCert(certificate);
      toast.success(
        "Statutory Certificate Issued (Form-A)",
        `Certificate ${certificate.certificateNumber} activated. Hologram seal ${appliedSeal} committed to national ledger.`
      );
    } else {
      toast.error(
        "Statutory Rejection Notice Issued (Form-B)",
        `15 days granted to ${currentInst.ownerName || "Merchant"} for servicing and re-verification under Rule 16.`
      );
    }
  };

  return (
    <div className="bg-surface h-full flex overflow-hidden font-sans">
      {/* Persistent Left Sidebar Navigation */}
      <InstitutionalNavigation activeSection="docket" />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden md:ml-[260px] bg-background">
        {/* Universal Top Header with Masthead */}
        <InstitutionalHeader title="Field Officer Inspection Workspace" />

        {/* Dynamic Officer & Circle Status Banner */}
        <div className="bg-primary text-white py-2 px-4 flex items-center justify-between text-xs shrink-0 shadow-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-xs truncate">
              Officer: {currentUser.name} (Badge: {currentUser.officerBadgeId || "LMO-DL-N-884"})
            </span>
            <span className="opacity-60 hidden sm:inline">•</span>
            <span className="opacity-90 hidden sm:inline truncate">
              Jurisdiction: {currentUser.jurisdictionCircle || "Delhi North District Circle"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] shrink-0">
            <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded">
              <span className="material-symbols-outlined text-[14px]">cloud_done</span>
              <span>Offline Cache Synced</span>
            </div>
          </div>
        </div>

        {/* 2-Column Independent Scroll Workspace */}
        <div className="flex-1 overflow-hidden p-4 lg:p-6 flex flex-col lg:flex-row gap-5">
          {/* COLUMN 1: Pinned Today's Assigned Docket (Independent Scroll) */}
          <div className="lg:w-4/12 xl:w-3/12 h-full flex flex-col bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden shrink-0">
            {/* Docket Header */}
            <div className="p-4 border-b border-outline-variant bg-surface-container-low flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
                <h3 className="font-bold text-xs text-on-surface">Today's Inspection Docket</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                {assignedCases.length} Cases
              </span>
            </div>

            {/* Scrollable Docket Case List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {assignedCases.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant text-xs">
                  <span className="material-symbols-outlined text-3xl text-outline mb-2">event_available</span>
                  <p className="font-bold text-on-surface">Docket is Clear</p>
                  <p className="text-[11px] text-outline mt-1">No pending field inspections assigned in this circle.</p>
                  <Link href="/admin" className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">
                    Assign from Queue &rarr;
                  </Link>
                </div>
              ) : (
                assignedCases.map((c) => {
                  const inst = instruments.find((i) => i.id === c.instrumentId);
                  const isSelected = c.id === currentApp?.id;

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedAppId(c.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                          : "border-outline-variant hover:border-primary/50 hover:bg-surface-container-low"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-mono font-bold text-primary text-[11px]">{c.applicationNumber}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold uppercase">
                          {c.status}
                        </span>
                      </div>
                      <div className="font-bold text-on-surface mt-1">{c.applicantName}</div>
                      <div className="text-[11px] text-outline truncate">{inst?.ownerAddress || "Delhi Mandi"}</div>
                      <div className="mt-2 pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[10px] text-on-surface-variant">
                        <span>SN: {c.instrumentSerial}</span>
                        <span className="font-semibold text-primary">{c.scheduledSlot || "Morning Slot"}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Docket Footer: Working Standards Kit Health */}
            <div className="p-3 border-t border-outline-variant bg-surface-container-low shrink-0 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-on-surface mb-1">
                <span className="material-symbols-outlined text-secondary text-[16px]">verified</span>
                Standards Kit #DL-WS-04
              </div>
              <div className="flex justify-between text-[10px] text-outline">
                <span>NPL India (NABL Traceable)</span>
                <span className="text-secondary font-semibold">Valid Nov 2026</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Active Verification Canvas (Independent Scroll + Sticky Verdict Footer) */}
          <div className="lg:w-8/12 xl:w-9/12 h-full flex flex-col bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
            {/* Scrollable Sub-Sections Container */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
              {/* Header Card: Scale Identity & Optical Camera Plate OCR */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 lg:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="w-20 h-20 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center relative shrink-0">
                    <span className="material-symbols-outlined text-3xl text-outline">scale</span>
                    {ocrVerified && (
                      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-xs">check</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-surface-container font-mono font-bold text-primary">
                        {currentInst ? currentInst.digitalInstrumentId : "IND-MET-2026-X8829"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant font-semibold uppercase">
                        {currentInst?.category.replace(/_/g, " ") || "Commercial Bench Scale"}
                      </span>
                    </div>

                    <h2 className="font-display text-lg font-bold text-on-surface">
                      {currentInst?.modelName || "Precision Commercial Scale"}
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Target Stamped Serial: <span className="font-mono font-bold text-on-surface">{currentInst?.serialNumber || "SN-8829-X"}</span> • Max: {currentInst?.maxCapacity || 30} kg (Class III)
                    </p>
                    <p className="text-[11px] text-outline mt-0.5">
                      Trading Premises: {currentInst?.ownerName || "Merchant Retailer"} ({currentInst?.ownerAddress || "Shop 12, APMC Yard"})
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => setIsCameraModalOpen(true)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 ${
                          ocrVerified
                            ? "bg-secondary text-white"
                            : "bg-primary text-white hover:bg-primary-container"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {ocrVerified ? "check_circle" : "photo_camera"}
                        </span>
                        {ocrVerified ? "Stamped Plate OCR Verified ✓ (99.4%)" : "Scan Stamped Nameplate (Camera OCR)"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* SUB-SECTION 1: Physical Integrity & Statutory Markings */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs">
                <div className="bg-surface-container-low px-4 py-2.5 border-b border-outline-variant flex items-center justify-between">
                  <h3 className="font-bold text-xs text-on-surface uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">view_in_ar</span>
                    1. Physical Integrity & Statutory Markings
                  </h3>
                  <span className="text-[10px] text-outline font-mono">Rule 12 Compliance</span>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="flex items-start gap-2.5 p-2 rounded-lg border border-outline-variant/60 bg-surface cursor-pointer hover:bg-surface-container-low">
                      <input
                        type="checkbox"
                        checked={housingIntact}
                        onChange={(e) => setHousingIntact(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-outline-variant text-primary"
                      />
                      <span className="text-on-surface leading-snug">Housing structurally intact with zero tampering apertures.</span>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 rounded-lg border border-outline-variant/60 bg-surface cursor-pointer hover:bg-surface-container-low">
                      <input
                        type="checkbox"
                        checked={levelCentered}
                        onChange={(e) => setLevelCentered(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-outline-variant text-primary"
                      />
                      <span className="text-on-surface leading-snug">Spirit level bubble is centered in the alignment ring.</span>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 rounded-lg border border-outline-variant/60 bg-surface cursor-pointer hover:bg-surface-container-low">
                      <input
                        type="checkbox"
                        checked={zeroTracking}
                        onChange={(e) => setZeroTracking(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-outline-variant text-primary"
                      />
                      <span className="text-on-surface leading-snug">Automatic zero-setting & tare mechanisms return to 0.000 kg.</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">Inspector Physical Notes</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Lead wire seal intact, no rust on weighing pan, leveling footpads secure..."
                      className="w-full p-2 bg-surface-container-low border border-outline-variant rounded text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </section>

              {/* SUB-SECTION 2: Accuracy Test & Statutory MPE Calculator */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs">
                <div className="bg-surface-container-low px-4 py-2.5 border-b border-outline-variant flex items-center justify-between">
                  <h3 className="font-bold text-xs text-on-surface uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">balance</span>
                    2. Accuracy Test & Maximum Permissible Error (MPE)
                  </h3>
                  <span className="text-[10px] text-outline font-mono">Seventh Schedule (Class III)</span>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-on-surface mb-1">Working Standard Applied (kg)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={nominalLoad}
                        onChange={(e) => setNominalLoad(e.target.value)}
                        className="w-full p-2 bg-surface-container-low border border-outline-variant rounded font-mono font-bold text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-on-surface mb-1">Observed Display Indication (kg)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={observedLoad}
                        onChange={(e) => setObservedLoad(e.target.value)}
                        className="w-full p-2 bg-surface-container-low border border-outline-variant rounded font-mono font-bold text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Real-time MPE Verdict Chip */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    isWithinTolerance
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-red-50 border-red-200 text-red-900"
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">
                        {isWithinTolerance ? "check_circle" : "error"}
                      </span>
                      <div>
                        <div className="font-bold text-xs">
                          {isWithinTolerance ? "WITHIN LEGAL MPE TOLERANCE (STATUTORY PASS)" : "EXCEEDS LEGAL MPE TOLERANCE (STATUTORY REJECTION)"}
                        </div>
                        <div className="text-[11px] opacity-80">
                          Calculated Deviation: <span className="font-mono font-bold">{calculatedError.toFixed(4)} kg</span> (Legal Maximum Permissible Error: &plusmn;{mpeLimit} kg)
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      isWithinTolerance ? "bg-emerald-200 text-emerald-900" : "bg-red-200 text-red-900"
                    }`}>
                      {isWithinTolerance ? "PASS" : "FAIL"}
                    </span>
                  </div>
                </div>
              </section>

              {/* SUB-SECTION 3: Geo-Tagged Photographic Evidence & Hologram Seal */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs">
                <div className="bg-surface-container-low px-4 py-2.5 border-b border-outline-variant flex items-center justify-between">
                  <h3 className="font-bold text-xs text-on-surface uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">photo_camera</span>
                    3. Geo-Tagged Photographic Evidence & Wire Seal
                  </h3>
                  <span className="text-[10px] text-outline font-mono">Mandatory Audit Trial</span>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Photo 1: Plate */}
                    <div
                      onClick={() => handleTogglePhoto("plate")}
                      className={`p-3 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                        capturedPhotos.plate ? "border-secondary bg-secondary/5" : "border-outline-variant hover:border-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl text-outline mb-1">badge</span>
                      <div className="font-bold text-on-surface text-[11px]">1. Nameplate & Serial</div>
                      <div className="text-[10px] text-outline mt-0.5">
                        {capturedPhotos.plate ? "Attached ✓ (Geo-Tagged)" : "Click to Attach"}
                      </div>
                    </div>

                    {/* Photo 2: Wire Seal */}
                    <div
                      onClick={() => handleTogglePhoto("seal")}
                      className={`p-3 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                        capturedPhotos.seal ? "border-secondary bg-secondary/5" : "border-outline-variant hover:border-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl text-outline mb-1">lock</span>
                      <div className="font-bold text-on-surface text-[11px]">2. Physical Lead Seal</div>
                      <div className="text-[10px] text-outline mt-0.5">
                        {capturedPhotos.seal ? "Attached ✓ (Geo-Tagged)" : "Click to Attach"}
                      </div>
                    </div>

                    {/* Photo 3: Standard Weights */}
                    <div
                      onClick={() => handleTogglePhoto("weights")}
                      className={`p-3 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                        capturedPhotos.weights ? "border-secondary bg-secondary/5" : "border-outline-variant hover:border-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl text-outline mb-1">fitness_center</span>
                      <div className="font-bold text-on-surface text-[11px]">3. Standard Pan Load</div>
                      <div className="text-[10px] text-outline mt-0.5">
                        {capturedPhotos.weights ? "Attached ✓ (Geo-Tagged)" : "Click to Attach"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                      Applied Holographic Lead Wire Seal Number
                    </label>
                    <input
                      type="text"
                      value={sealWireNumber}
                      onChange={(e) => setSealWireNumber(e.target.value)}
                      placeholder="e.g. SEAL-DL-2026-9921"
                      className="w-full p-2 bg-surface-container-low border border-outline-variant rounded font-mono font-bold text-xs outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* STICKY BOTTOM STATUTORY VERDICT FOOTER (Always Visible!) */}
            <div className="p-3.5 lg:p-4 bg-surface-container-low border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 text-xs text-on-surface-variant truncate">
                <span className="flex items-center gap-1 font-semibold">
                  <span className={`w-2 h-2 rounded-full ${ocrVerified ? "bg-emerald-500" : "bg-amber-400"}`} />
                  OCR: {ocrVerified ? "Verified" : "Pending"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold">
                  <span className={`w-2 h-2 rounded-full ${isWithinTolerance ? "bg-emerald-500" : "bg-red-500"}`} />
                  MPE: {isWithinTolerance ? "Passed" : "Failed"}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleDecision("FAIL")}
                  className="flex-1 sm:flex-none px-4 py-2 bg-error text-white rounded-lg text-xs font-bold hover:bg-error/90 transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  REJECT (Issue Form-B Notice)
                </button>

                <button
                  type="button"
                  onClick={() => handleDecision("PASS")}
                  className="flex-1 sm:flex-none px-5 py-2 bg-secondary text-white rounded-lg text-xs font-bold hover:bg-secondary/90 transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  PASS (Issue Form-A Certificate)
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Simulated Camera OCR Viewfinder Modal */}
      <Modal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        title="Optical Camera Plate Scanner"
        subtitle="Align physical serial nameplate within the target reticle."
      >
        <div className="space-y-4">
          <div className="h-56 bg-neutral-900 rounded-xl relative overflow-hidden flex items-center justify-center border-2 border-primary/40">
            {ocrScanning ? (
              <div className="text-center text-white space-y-2">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                <p className="text-xs font-mono tracking-wider text-primary">ANALYZING OPTICAL CHARACTER PATTERNS...</p>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Target Bounding Reticle */}
                <div className="w-4/5 h-28 border-2 border-dashed border-primary/80 rounded-lg flex items-center justify-center bg-white/5 backdrop-blur-xs">
                  <div className="text-center">
                    <span className="text-white font-mono text-sm tracking-widest font-bold block">
                      {currentInst?.serialNumber || "SN-8829-X"}
                    </span>
                    <span className="text-[10px] text-white/70">Legal Metrology Stamped Serial</span>
                  </div>
                </div>
                <div className="absolute bottom-2 text-[10px] text-white/60 font-mono">
                  ISO-17025 Compliant Calibration Capture
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={ocrScanning}
            onClick={handleSimulateOcr}
            className="w-full py-2.5 bg-primary text-white rounded-lg text-xs font-bold shadow-sm hover:bg-primary-container transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">document_scanner</span>
            {ocrScanning ? "Processing Plate OCR..." : "Capture & Match Plate Record"}
          </button>
        </div>
      </Modal>

      {/* Verification Certificate Modal (Form-A) */}
      {issuedCert && (
        <Modal
          isOpen={!!issuedCert}
          onClose={() => setIssuedCert(null)}
          title="Verification Certificate Issued (Form-A)"
          subtitle="Legal Metrology Act, 2009 • Section 24 Stamping"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
              <div className="flex items-center gap-2 font-bold text-sm mb-1">
                <span className="material-symbols-outlined text-secondary text-xl">verified</span>
                Verification Certificate Committed
              </div>
              <div className="text-[11px]">Certificate No: <strong className="font-mono">{issuedCert.certificateNumber}</strong></div>
              <div className="text-[11px]">Valid Until: <strong>{issuedCert.validUntil}</strong></div>
              <div className="text-[11px]">Physical Seal: <strong className="font-mono">{issuedCert.physicalSealNumber}</strong></div>
              <div className="text-[10px] font-mono text-emerald-700 mt-2 truncate">
                Signature: {issuedCert.digitalSignatureHash}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-surface border border-outline-variant text-on-surface rounded-lg font-semibold hover:bg-surface-container flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-base">print</span>
                Print Form-A
              </button>
              <button
                type="button"
                onClick={() => setIssuedCert(null)}
                className="flex-1 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary-container"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
