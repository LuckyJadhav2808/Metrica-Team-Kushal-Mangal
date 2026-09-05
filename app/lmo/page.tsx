"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { InstitutionalNavigation } from "@/components/navigation";
import { InstitutionalHeader } from "@/components/header";
import { useMetrica } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { Certificate } from "@/lib/types";
import { FormADocument } from "@/components/form-a-document";

export default function LMOFieldVerificationPage() {
  const { applications, instruments, submitVerification, currentUser, loginAs } = useMetrica();
  const toast = useToast();

  // Dynamic Browser Network Connectivity State
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const assignedCases = applications.filter(
    (a) => a.status === "SCHEDULED" || a.status === "IN_PROGRESS" || a.status === "ASSIGNED"
  );
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
      <div className="bg-surface h-screen flex overflow-hidden font-sans">
        <InstitutionalNavigation activeSection="docket" />
        <main className="flex-1 flex flex-col h-full overflow-hidden md:ml-[260px] bg-background min-w-0">
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
    <div className="bg-surface h-screen flex overflow-hidden font-sans">
      {/* Persistent Left Sidebar Navigation */}
      <InstitutionalNavigation activeSection="docket" />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden md:ml-[260px] bg-background min-w-0 screen-only-view">
        {/* Universal Top Header with Masthead */}
        <InstitutionalHeader title="Field Officer Inspection Workspace" />

        {/* Dynamic Officer & Circle Status Banner */}
        <div className="bg-primary text-white py-2 px-4 flex items-center justify-between text-xs shrink-0 shadow-xs">
          <div className="flex items-center gap-2 truncate">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <span className="font-semibold text-xs truncate">
              Officer: {currentUser.name} (Badge: {currentUser.officerBadgeId || "LMO-DL-N-884"})
            </span>
            <span className="opacity-60 hidden sm:inline">•</span>
            <span className="opacity-90 hidden sm:inline truncate">
              Jurisdiction: {currentUser.jurisdictionCircle || "Delhi North District Circle"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] shrink-0">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                isOnline
                  ? "bg-white/15 text-emerald-200 border border-emerald-400/30"
                  : "bg-amber-500/25 text-amber-200 border border-amber-400/30"
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">
                {isOnline ? "cloud_done" : "cloud_off"}
              </span>
              <span>{isOnline ? "eMaap Realtime Connected" : "Offline Mode (Local Cache)"}</span>
            </div>
          </div>
        </div>

        {/* TOP DOCKET SELECTOR & WORKING STANDARDS RIBBON */}
        <div className="bg-surface-container-low border-b border-outline-variant px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          {/* Left: Assigned Cases Scrollable Pills */}
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-x-auto py-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface shrink-0 pr-1">
              <span className="material-symbols-outlined text-primary text-[18px]">assignment</span>
              <span>Assigned Docket ({assignedCases.length}):</span>
            </div>

            {assignedCases.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="text-[11px] bg-surface border border-outline-variant px-2.5 py-1 rounded-lg">
                  No pending field inspections assigned in this circle
                </span>
                <Link href="/admin" className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5">
                  Assign from Queue &rarr;
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {assignedCases.map((c) => {
                  const isSelected = c.id === currentApp?.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedAppId(c.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shrink-0 ${
                        isSelected
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-surface text-on-surface border-outline-variant hover:border-primary/50 hover:bg-surface-container"
                      }`}
                    >
                      <span className="font-mono font-bold text-[11px]">{c.applicationNumber}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          isSelected ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                        }`}
                      >
                        {c.status}
                      </span>
                      <span className="truncate max-w-[120px] font-semibold">{c.applicantName}</span>
                      <span className="opacity-70 text-[10px] hidden sm:inline font-mono">({c.scheduledSlot || "Morning"})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Working Standards Kit Traceability Health Pill */}
          <div className="flex items-center gap-2 shrink-0 bg-surface border border-outline-variant px-3 py-1.5 rounded-xl shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
              <span className="material-symbols-outlined text-secondary text-[17px]">verified</span>
              <span>Standards Kit #DL-WS-04</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-bold font-mono">
              NPL India Traceable (Valid Nov 2026)
            </span>
          </div>
        </div>

        {/* 2-STATION DUAL-COLUMN WORKSPACE */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-7xl mx-auto items-start">
            {/* STATION 1: Physical Inspection & Identification Station */}
            <div className="space-y-4">
              {/* 1.1 Instrument Dossier & Camera OCR */}
              <section className="bg-surface border border-outline-variant rounded-2xl p-4 lg:p-5 shadow-xs">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">scale</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline font-mono">Station 1 • Physical Dossier</span>
                      <h3 className="font-bold text-sm text-on-surface">Instrument Identification</h3>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container font-mono font-bold text-primary border border-outline-variant">
                    {currentInst ? currentInst.digitalInstrumentId : "IND-MET-2026-X8829"}
                  </span>
                </div>

                <div className="bg-surface-container-low border border-outline-variant/70 rounded-xl p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-baseline justify-between">
                    <h4 className="font-bold text-sm text-on-surface">
                      {currentInst?.modelName || "Precision Commercial Scale"}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-surface text-on-surface-variant font-medium border border-outline-variant uppercase">
                      {currentInst?.category.replace(/_/g, " ") || "Commercial Bench Scale"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-outline block text-[10px]">Target Serial:</span>
                      <span className="font-mono font-bold text-on-surface">{currentInst?.serialNumber || "SN-8829-X"}</span>
                    </div>
                    <div>
                      <span className="text-outline block text-[10px]">Max Capacity / Class:</span>
                      <span className="font-semibold text-on-surface">{currentInst?.maxCapacity || 30} kg (Class III)</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-outline block text-[10px]">Trading Premises:</span>
                      <span className="font-medium text-on-surface">{currentInst?.ownerName || "Merchant Retailer"} • {currentInst?.ownerAddress || "Shop 12, APMC Mandi"}</span>
                    </div>
                  </div>

                  {/* Camera OCR Trigger */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCameraModalOpen(true)}
                      className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold shadow-2xs transition-all active:scale-98 ${
                        ocrVerified
                          ? "bg-secondary text-white hover:bg-secondary/90"
                          : "bg-primary text-white hover:bg-primary-container"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {ocrVerified ? "check_circle" : "photo_camera"}
                      </span>
                      <span>{ocrVerified ? "Plate OCR Verified ✓ (Serial Matched 99.4%)" : "Scan Nameplate Serial (Camera OCR)"}</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* 1.2 Rule 12 Physical Integrity Checklist */}
              <section className="bg-surface border border-outline-variant rounded-2xl p-4 lg:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">fact_check</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline font-mono">Statutory Checks</span>
                      <h3 className="font-bold text-sm text-on-surface">Physical Integrity (Rule 12)</h3>
                    </div>
                  </div>
                  <span className="text-[10px] text-outline font-mono bg-surface-container px-2 py-0.5 rounded">3/3 Required</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest cursor-pointer hover:bg-surface-container-low transition-colors">
                    <input
                      type="checkbox"
                      checked={housingIntact}
                      onChange={(e) => setHousingIntact(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-outline-variant text-primary"
                    />
                    <span className="text-on-surface leading-snug">
                      <strong>Housing Integrity:</strong> Structurally intact with zero unauthorized apertures or tampering.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest cursor-pointer hover:bg-surface-container-low transition-colors">
                    <input
                      type="checkbox"
                      checked={levelCentered}
                      onChange={(e) => setLevelCentered(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-outline-variant text-primary"
                    />
                    <span className="text-on-surface leading-snug">
                      <strong>Spirit Level Alignment:</strong> Leveling bubble is centered inside the central alignment ring.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest cursor-pointer hover:bg-surface-container-low transition-colors">
                    <input
                      type="checkbox"
                      checked={zeroTracking}
                      onChange={(e) => setZeroTracking(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-outline-variant text-primary"
                    />
                    <span className="text-on-surface leading-snug">
                      <strong>Zero-Setting & Tare:</strong> Mechanisms reliably return display reading to 0.000 kg.
                    </span>
                  </label>
                </div>
              </section>

              {/* 1.3 Photographic Audit Evidence */}
              <section className="bg-surface border border-outline-variant rounded-2xl p-4 lg:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">camera_enhance</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline font-mono">Geo-Tagged Evidence</span>
                      <h3 className="font-bold text-sm text-on-surface">Photographic Audit Trail</h3>
                    </div>
                  </div>
                  <span className="text-[10px] text-outline font-mono">Rule 16 Audit Record</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  {/* Photo 1: Plate */}
                  <button
                    type="button"
                    onClick={() => handleTogglePhoto("plate")}
                    className={`p-3 border-2 border-dashed rounded-xl text-center transition-all ${
                      capturedPhotos.plate ? "border-secondary bg-secondary/5" : "border-outline-variant hover:border-primary bg-surface-container-lowest"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-2xl mb-1 ${capturedPhotos.plate ? "text-secondary" : "text-outline"}`}>
                      badge
                    </span>
                    <div className="font-bold text-on-surface text-[11px] leading-tight">1. Nameplate</div>
                    <div className="text-[10px] text-outline mt-0.5">
                      {capturedPhotos.plate ? "Attached ✓" : "Attach Photo"}
                    </div>
                  </button>

                  {/* Photo 2: Wire Seal */}
                  <button
                    type="button"
                    onClick={() => handleTogglePhoto("seal")}
                    className={`p-3 border-2 border-dashed rounded-xl text-center transition-all ${
                      capturedPhotos.seal ? "border-secondary bg-secondary/5" : "border-outline-variant hover:border-primary bg-surface-container-lowest"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-2xl mb-1 ${capturedPhotos.seal ? "text-secondary" : "text-outline"}`}>
                      lock
                    </span>
                    <div className="font-bold text-on-surface text-[11px] leading-tight">2. Lead Seal</div>
                    <div className="text-[10px] text-outline mt-0.5">
                      {capturedPhotos.seal ? "Attached ✓" : "Attach Photo"}
                    </div>
                  </button>

                  {/* Photo 3: Standard Weights */}
                  <button
                    type="button"
                    onClick={() => handleTogglePhoto("weights")}
                    className={`p-3 border-2 border-dashed rounded-xl text-center transition-all ${
                      capturedPhotos.weights ? "border-secondary bg-secondary/5" : "border-outline-variant hover:border-primary bg-surface-container-lowest"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-2xl mb-1 ${capturedPhotos.weights ? "text-secondary" : "text-outline"}`}>
                      fitness_center
                    </span>
                    <div className="font-bold text-on-surface text-[11px] leading-tight">3. Pan Load</div>
                    <div className="text-[10px] text-outline mt-0.5">
                      {capturedPhotos.weights ? "Attached ✓" : "Attach Photo"}
                    </div>
                  </button>
                </div>
              </section>
            </div>

            {/* STATION 2: Metrological Accuracy & Sealing Station */}
            <div className="space-y-4">
              {/* 2.1 Accuracy Test & MPE Calculator */}
              <section className="bg-surface border border-outline-variant rounded-2xl p-4 lg:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">balance</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline font-mono">Station 2 • Metrology Engine</span>
                      <h3 className="font-bold text-sm text-on-surface">Maximum Permissible Error (MPE)</h3>
                    </div>
                  </div>
                  <span className="text-[10px] text-outline font-mono bg-surface-container px-2 py-0.5 rounded">7th Schedule Class III</span>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/60">
                      <label className="block text-[11px] font-bold text-on-surface mb-1">Working Standard Applied (kg)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={nominalLoad}
                        onChange={(e) => setNominalLoad(e.target.value)}
                        className="w-full p-2 bg-surface border border-outline-variant rounded-lg font-mono font-bold text-xs text-on-surface outline-none focus:border-primary"
                      />
                      <span className="text-[10px] text-outline mt-1 block">NPL Traceable Standard</span>
                    </div>

                    <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/60">
                      <label className="block text-[11px] font-bold text-on-surface mb-1">Observed Display Indication (kg)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={observedLoad}
                        onChange={(e) => setObservedLoad(e.target.value)}
                        className="w-full p-2 bg-surface border border-outline-variant rounded-lg font-mono font-bold text-xs text-on-surface outline-none focus:border-primary"
                      />
                      <span className="text-[10px] text-outline mt-1 block">Instrument LCD Readout</span>
                    </div>
                  </div>

                  {/* Real-Time MPE Calculator Verdict Card */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      isWithinTolerance
                        ? "bg-emerald-50/80 border-emerald-300 text-emerald-900"
                        : "bg-red-50/80 border-red-300 text-red-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">
                          {isWithinTolerance ? "check_circle" : "error"}
                        </span>
                        <div>
                          <div className="font-bold text-xs">
                            {isWithinTolerance
                              ? "WITHIN STATUTORY TOLERANCE (PASS)"
                              : "EXCEEDS STATUTORY TOLERANCE (FAIL)"}
                          </div>
                          <div className="text-[11px] mt-0.5 leading-snug">
                            Calculated Deviation: <span className="font-mono font-bold">{calculatedError.toFixed(4)} kg</span>
                            <span className="opacity-80"> (Statutory MPE Threshold: &plusmn;{mpeLimit} kg)</span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase shrink-0 ${
                          isWithinTolerance ? "bg-emerald-200 text-emerald-950 font-mono" : "bg-red-200 text-red-950 font-mono"
                        }`}
                      >
                        {isWithinTolerance ? "PASS" : "FAIL"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2.2 Wire Seal & Inspector Notes */}
              <section className="bg-surface border border-outline-variant rounded-2xl p-4 lg:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">fingerprint</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline font-mono">Physical Sealing & Audit</span>
                      <h3 className="font-bold text-sm text-on-surface">Security Seal & Legal Remarks</h3>
                    </div>
                  </div>
                  <span className="text-[10px] text-outline font-mono">Sec 24 Legal Metrology</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">
                      Applied Holographic Lead Wire Seal Number
                    </label>
                    <input
                      type="text"
                      value={sealWireNumber}
                      onChange={(e) => setSealWireNumber(e.target.value)}
                      placeholder="e.g. SEAL-DL-2026-9921"
                      className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg font-mono font-bold text-xs outline-none focus:border-primary text-on-surface"
                      required
                    />
                    <span className="text-[10px] text-outline mt-1 block">
                      Tamper-evident barcode seal permanently linked in the national verification ledger.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">
                      Inspector Summary Notes & Observations
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Physical calibration completed on site as per Legal Metrology (General) Rules 2011. Leveling verified..."
                      className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs outline-none focus:border-primary text-on-surface resize-none"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* STICKY BOTTOM STATUTORY VERDICT CONSOLE (Unobstructed & Always Available) */}
        <div className="p-3.5 lg:p-4 bg-surface-container-low border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 text-xs text-on-surface-variant truncate">
            <span className="flex items-center gap-1.5 font-semibold">
              <span className={`w-2.5 h-2.5 rounded-full ${ocrVerified ? "bg-emerald-500" : "bg-amber-400"}`} />
              OCR: {ocrVerified ? "Verified (99.4%)" : "Pending Scan"}
            </span>
            <span className="opacity-40">•</span>
            <span className="flex items-center gap-1.5 font-semibold">
              <span className={`w-2.5 h-2.5 rounded-full ${isWithinTolerance ? "bg-emerald-500" : "bg-red-500"}`} />
              MPE: {isWithinTolerance ? "Within Limits" : "Tolerance Exceeded"}
            </span>
            <span className="opacity-40 hidden md:inline">•</span>
            <span className="text-[11px] text-outline hidden md:inline truncate">
              Case: {currentApp?.applicationNumber || "None Selected"}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleDecision("FAIL")}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-error text-white rounded-xl text-xs font-bold hover:bg-error/90 transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              REJECT (Issue Form-B Notice)
            </button>

            <button
              type="button"
              onClick={() => handleDecision("PASS")}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-secondary text-white rounded-xl text-xs font-bold hover:bg-secondary/90 transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              PASS (Issue Form-A Certificate)
            </button>
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
                className="flex-1 py-2.5 bg-surface border border-outline-variant text-on-surface rounded-lg font-semibold hover:bg-surface-container flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">print</span>
                Print Form-A
              </button>
              <button
                type="button"
                onClick={() => setIssuedCert(null)}
                className="flex-1 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary-container cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Standalone Printable Document (Exclusively shown during @media print) */}
      {issuedCert && (
        <div className="hidden print:block print-only-container">
          <FormADocument instrument={currentInst} certificate={issuedCert} />
        </div>
      )}
    </div>
  );
}
