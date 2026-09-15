"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { InstitutionalNavigation } from "@/components/navigation";
import { InstitutionalHeader } from "@/components/header";
import { useMetrica } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { Certificate, Instrument } from "@/lib/types";
import { FormADocument } from "@/components/form-a-document";
import { DiffViewer } from "@/components/diff-viewer";

export default function LMOFieldVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-surface h-screen flex items-center justify-center font-sans text-xs text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            <span>Loading Field Officer Inspection Workspace...</span>
          </div>
        </div>
      }
    >
      <LMOFieldVerificationContent />
    </Suspense>
  );
}

function LMOFieldVerificationContent() {
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "docket";

  const {
    applications,
    instruments,
    certificates,
    complaints,
    submitVerification,
    currentUser,
    loginAs,
    refreshDatabase,
  } = useMetrica();
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

  // -------------------------------------------------------------
  // DOCKET VIEW STATE (Station 1 & Station 2 Inspection Workflow)
  // -------------------------------------------------------------
  const assignedCases = applications.filter(
    (a) => a.status === "SCHEDULED" || a.status === "IN_PROGRESS" || a.status === "ASSIGNED"
  );
  const [selectedAppId, setSelectedAppId] = useState<string>(assignedCases.length > 0 ? assignedCases[0].id : "");

  const currentApp = applications.find((a) => a.id === selectedAppId) || (assignedCases.length > 0 ? assignedCases[0] : null);
  const currentInst = currentApp ? instruments.find((i) => i.id === currentApp.instrumentId) : (instruments.length > 0 ? instruments[0] : null);

  // Universal 5-Point Statutory Physical Checklist State (USP #9)
  const [housingIntact, setHousingIntact] = useState(true);
  const [levelCentered, setLevelCentered] = useState(true);
  const [zeroTracking, setZeroTracking] = useState(true);
  const [displayVisible, setDisplayVisible] = useState(true);
  const [leadWireCavity, setLeadWireCavity] = useState(true);

  const checklistCompletedCount = [
    housingIntact,
    levelCentered,
    zeroTracking,
    displayVisible,
    leadWireCavity,
  ].filter(Boolean).length;
  const checklistPassed = checklistCompletedCount === 5;

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

  // Historical Diff Modal State (USP #10: What Changed Analysis)
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  // Anti-Armchair Geolocation Audit Watermark (Domain Realism #52)
  const [geoCoords, setGeoCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    hubName: string;
    source: "HARDWARE_GPS" | "MANDI_GEOFENCE";
    lockedAt: string;
  }>({
    lat: 28.7156,
    lng: 77.1772,
    accuracy: 8,
    hubName: "Azadpur APMC Mandi Hub",
    source: "MANDI_GEOFENCE",
    lockedAt: "12:00 PM",
  });
  const [isAcquiringGps, setIsAcquiringGps] = useState(false);

  const acquireGpsCoordinates = () => {
    setIsAcquiringGps(true);
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoCoords({
            lat: Number(pos.coords.latitude.toFixed(4)),
            lng: Number(pos.coords.longitude.toFixed(4)),
            accuracy: Math.round(pos.coords.accuracy || 12),
            hubName: "On-Site Hardware GPS Fix",
            source: "HARDWARE_GPS",
            lockedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });
          setIsAcquiringGps(false);
          toast.success("Hardware GPS Acquired", `Coordinates locked: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E (±${Math.round(pos.coords.accuracy || 12)}m)`);
        },
        (err) => {
          // Fallback to Mandi Geofence Hub
          setGeoCoords({
            lat: 28.7156,
            lng: 77.1772,
            accuracy: 8,
            hubName: "Azadpur APMC Mandi Hub",
            source: "MANDI_GEOFENCE",
            lockedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });
          setIsAcquiringGps(false);
          toast.info("Mandi Hub Geofence Active", "Using official APMC Mandi hub coordinates (28.7156° N, 77.1772° E).");
        },
        { timeout: 6000, enableHighAccuracy: true }
      );
    } else {
      setIsAcquiringGps(false);
    }
  };

  useEffect(() => {
    acquireGpsCoordinates();
  }, []);

  const diffFields = useMemo(() => {
    if (!currentInst) return undefined;
    const isPeriodic = currentApp?.type === "PERIODIC_REVERIFICATION" || currentInst.status === "VERIFIED_ACTIVE" || currentInst.status === "EXPIRING_SOON";
    const hasRepair = currentApp?.type === "POST_REPAIR_VERIFICATION" || currentInst.status === "REPAIR_PENDING_INSPECTION";

    return [
      {
        label: "Trading Business Name",
        previousValue: currentInst.ownerName ? `${currentInst.ownerName} (Registered)` : "Verma Traders (Old Mandi)",
        currentValue: currentApp?.applicantName || currentInst.ownerName || "Verma Traders Pvt Ltd",
        isModified: Boolean(currentApp?.applicantName && currentInst.ownerName && currentApp.applicantName !== currentInst.ownerName),
      },
      {
        label: "Installation Address",
        previousValue: currentInst.ownerAddress || "Shop 12, Subzi Mandi Yard",
        currentValue: currentInst.ownerAddress || "Shop 12, Subzi Mandi Yard",
        isModified: false,
      },
      {
        label: "Physical Wire Seal Number",
        previousValue: currentInst.currentSealNumber || "SEAL-DL-2025-4410",
        currentValue: sealWireNumber,
        isModified: true, // During re-verification, a new seal wire is affixed
      },
      {
        label: "Max Calibration Capacity",
        previousValue: `${currentInst.maxCapacity || 30.0} kg (${currentInst.accuracyClass || "Class III"})`,
        currentValue: `${currentInst.maxCapacity || 30.0} kg (${currentInst.accuracyClass || "Class III"})`,
        isModified: false,
      },
      {
        label: "Verification Interval (e)",
        previousValue: `${currentInst.verificationInterval || 0.005} kg`,
        currentValue: `${currentInst.verificationInterval || 0.005} kg`,
        isModified: false,
      },
      {
        label: "Reported Component Repair / Service",
        previousValue: "Factory Initial Seal (No alterations)",
        currentValue: hasRepair
          ? "Loadcell sensor recalibrated & potentiometer adjusted by licensed vendor"
          : isPeriodic
          ? "Annual statutory periodic re-stamping due"
          : "Initial verification onboarding",
        isModified: hasRepair,
      },
    ];
  }, [currentInst, currentApp, sealWireNumber]);

  // MPE Calculation
  const nominalVal = parseFloat(nominalLoad) || 10;
  const observedVal = parseFloat(observedLoad) || 10;
  const calculatedError = Math.abs(observedVal - nominalVal);
  const mpeLimit = 0.005; // 5 grams for standard commercial Class III at 10kg
  const isWithinTolerance = calculatedError <= mpeLimit;

  // -------------------------------------------------------------
  // FORM-A CERTIFICATES VIEW STATE
  // -------------------------------------------------------------
  const [certSearchQuery, setCertSearchQuery] = useState("");
  const [selectedCertForPreview, setSelectedCertForPreview] = useState<Certificate | null>(null);
  const [certFilter, setCertFilter] = useState<"ALL" | "VALID" | "EXPIRING">("ALL");

  const filteredCertificates = useMemo(() => {
    return certificates.filter((c) => {
      const matchesSearch =
        c.certificateNumber.toLowerCase().includes(certSearchQuery.toLowerCase()) ||
        c.digitalInstrumentId.toLowerCase().includes(certSearchQuery.toLowerCase()) ||
        c.physicalSealNumber.toLowerCase().includes(certSearchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (certFilter === "VALID") return c.status === "ACTIVE_VALID";
      if (certFilter === "EXPIRING") return c.status === "EXPIRING_SOON";
      return true;
    });
  }, [certificates, certSearchQuery, certFilter]);

  // -------------------------------------------------------------
  // OFFLINE SYNC VIEW STATE
  // -------------------------------------------------------------
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState("Today at 11:45 AM");

  const handleForceSync = async () => {
    setIsSyncing(true);
    await refreshDatabase();
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setLastSyncTime(`Today at ${now}`);
      toast.success(
        "National eMaap Cloud Reconciled",
        `Bi-directional sync complete: 16 instruments, 8 dockets, and ${certificates.length} Form-A certificates updated.`
      );
    }, 1200);
  };

  const handlePreCacheMandi = () => {
    toast.info(
      "Mandi Offline Registry Cached",
      "Downloaded all active commercial instruments and cryptographic verification keys to local encrypted browser storage."
    );
  };

  // -------------------------------------------------------------
  // SECTION 25 STOP-USE NOTICES STATE
  // -------------------------------------------------------------
  const [selectedNoticeForModal, setSelectedNoticeForModal] = useState<any | null>(null);

  const suspendedInstruments = useMemo(() => {
    return instruments.filter(
      (i) => i.status === "SUSPENDED_TAMPERED" || i.priorityFlag === "CRITICAL" || i.priorityFlag === "HIGH"
    );
  }, [instruments]);

  // Handle OCR simulation
  const handleSimulateOcr = () => {
    setOcrScanning(true);
    setTimeout(() => {
      setOcrScanning(false);
      setOcrVerified(true);
      setCapturedPhotos((prev) => ({ ...prev, plate: true }));
      setIsCameraModalOpen(false);
      toast.success("Optical Character Recognition Matched", "Scale serial SN matched with 99.4% optical confidence.");
    }, 1200);
  };

  // Handle verification submission
  const handleDecision = (verdict: "PASS" | "FAIL") => {
    if (!currentApp || !currentInst) return;

    if (!ocrVerified && verdict === "PASS") {
      toast.warning("Evidence Missing", "Please perform camera OCR serial verification before official stamping.");
      return;
    }

    if (!checklistPassed && verdict === "PASS") {
      toast.warning("Checklist Incomplete", `Rule 11 inspection checklist is incomplete (${checklistCompletedCount}/5). All 5 integrity checks must pass.`);
      return;
    }

    const { verification, certificate } = submitVerification({
      applicationId: currentApp.id,
      instrumentId: currentInst.id,
      officerId: currentUser.id,
      officerName: currentUser.name,
      result: verdict === "PASS" ? "PASS" : "FAIL",
      appliedSealNumber: verdict === "PASS" ? sealWireNumber : undefined,
      ocrSerialMatched: ocrVerified,
      ocrExtractedSerial: currentInst.serialNumber,
      mpeTolerancePassed: isWithinTolerance,
      observations: [
        {
          id: "obs-1",
          nominalTestValue: nominalVal,
          observedValue: observedVal,
          unit: "KG",
          errorCalculated: calculatedError,
          maxPermissibleError: mpeLimit,
          isWithinTolerance,
          testCategory: "INCREASING_LOAD",
        },
      ],
      summaryNotes: notes || (verdict === "PASS" ? "Verified and stamped as per Legal Metrology Act, 2009." : "MPE tolerance exceeded. Section 25 Stop-Use applied."),
      performedOffline: !isOnline,
      geoCoordinates: `${geoCoords.lat.toFixed(4)}° N, ${geoCoords.lng.toFixed(4)}° E (${geoCoords.hubName})`,
    });

    if (verdict === "PASS" && certificate) {
      setIssuedCert(certificate);
      toast.success("Scale Stamped & Certified", `Form-A Certificate ${certificate.certificateNumber} generated.`);
    } else {
      toast.error("Scale Rejected", "Statutory Form-B Notice issued. Commercial use prohibited.");
    }
  };

  // Determine active section for sidebar highlighting
  const getActiveSection = () => {
    switch (currentView) {
      case "certs":
        return "history";
      case "standards":
        return "standards";
      case "offline":
        return "offline";
      case "notices":
        return "notices";
      case "docket":
      default:
        return "docket";
    }
  };

  // RBAC Barrier if visitor is a commercial merchant or manufacturer
  if (currentUser.role === "OWNER" || currentUser.role === "MANUFACTURER") {
    return (
      <div className="bg-surface h-screen flex overflow-hidden font-sans">
        <InstitutionalNavigation activeSection="docket" role="LMO" />
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
                This terminal is restricted exclusively to commissioned Field Officers (LMO) carrying verified reference standards.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => loginAs("LMO")}
                  className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-xs hover:bg-primary-container cursor-pointer transition-all"
                >
                  Authorize as Inspector Rajesh Kumar (Grade-I)
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-surface h-screen flex overflow-hidden font-sans">
      {/* Persistent Left Sidebar Navigation */}
      <InstitutionalNavigation activeSection={getActiveSection()} role="LMO" />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden md:ml-[260px] bg-background min-w-0 screen-only-view pt-16 md:pt-0">
        {/* Universal Top Header with Masthead */}
        <InstitutionalHeader title="Field Officer Inspection Workspace" />

        {/* Dynamic Officer & Circle Status Banner (Option A Compact Layout) */}
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
            {/* Standards Kit NPL Traceability Pill */}
            <Link
              href="/lmo?view=standards"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white/95 border border-white/20 font-medium transition-colors"
              title="Reference Working Standards Kit — Traceable to NPL India, Valid until Nov 2026. Click to inspect registry."
            >
              <span className="material-symbols-outlined text-[14px] text-emerald-300">verified</span>
              <span className="font-mono font-semibold">Kit #DL-WS-04</span>
              <span className="text-[10px] text-emerald-200 font-mono opacity-90">(NPL Valid)</span>
            </Link>

            {/* eMaap Realtime / Offline Connectivity Pill */}
            <Link
              href="/lmo?view=offline"
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                isOnline
                  ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/30"
                  : "bg-amber-500/25 text-amber-200 border border-amber-400/30 hover:bg-amber-500/35"
              }`}
              title={isOnline ? "Live bi-directional synchronization with National eMaap Server. Click for offline queue." : "Operating in offline local cache mode."}
            >
              <span className="material-symbols-outlined text-[13px]">
                {isOnline ? "cloud_done" : "cloud_off"}
              </span>
              <span>{isOnline ? "eMaap Live" : "Offline"}</span>
            </Link>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: ASSIGNED DOCKET (Physical Inspection + MPE Stamping)  */}
        {/* ------------------------------------------------------------- */}
        {currentView === "docket" && (
          <>
            {/* TOP DOCKET SELECTOR RIBBON */}
            <div className="bg-surface-container-low border-b border-outline-variant px-4 py-2 flex items-center justify-between gap-3 shrink-0">
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
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shrink-0 cursor-pointer ${
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
                          <span className="truncate max-w-[140px] font-semibold">{c.applicantName}</span>
                          <span className="opacity-70 text-[10px] hidden sm:inline font-mono">({c.scheduledSlot || "Morning"})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
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

                      {/* Camera OCR & Historical Diff Analysis Triggers */}
                      <div className="pt-2 space-y-2">
                        <button
                          type="button"
                          onClick={() => setIsCameraModalOpen(true)}
                          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold shadow-2xs transition-all active:scale-98 cursor-pointer ${
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

                        <button
                          type="button"
                          onClick={() => setIsDiffModalOpen(true)}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-all active:scale-98 cursor-pointer"
                          title="Compare current application against previous legal verification record (USP #10)"
                        >
                          <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
                          <span>Compare with Previous Record (What Changed?)</span>
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* 1.2 Statutory Physical Checklist (Universal 5-Point + Category Adaptive Alert - USP #9) */}
                  <section className="bg-surface border border-outline-variant rounded-2xl p-4 lg:p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
                      <h4 className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-base">fact_check</span>
                        Rule 11 Universal 5-Point Integrity Checklist
                      </h4>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${checklistPassed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
                        {checklistCompletedCount} / 5 Required
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Check 1 */}
                      <label className="flex items-center justify-between p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-low cursor-pointer hover:bg-surface-container transition-all">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={housingIntact}
                            onChange={(e) => setHousingIntact(e.target.checked)}
                            className="w-4 h-4 text-primary rounded focus:ring-primary"
                          />
                          <div>
                            <span className="font-semibold text-on-surface block">Stamping Security Cavity & Housing</span>
                            <span className="text-[10px] text-outline">Cast-iron housing free from illicit drill-holes, bypass wiring or cheat magnets</span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-sm text-secondary">verified_user</span>
                      </label>

                      {/* Check 2 */}
                      <label className="flex items-center justify-between p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-low cursor-pointer hover:bg-surface-container transition-all">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={levelCentered}
                            onChange={(e) => setLevelCentered(e.target.checked)}
                            className="w-4 h-4 text-primary rounded focus:ring-primary"
                          />
                          <div>
                            <span className="font-semibold text-on-surface block">Spirit Level Indicator Centered</span>
                            <span className="text-[10px] text-outline">Air bubble strictly inside central concentric ring on level indicator</span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-sm text-secondary">adjust</span>
                      </label>

                      {/* Check 3 */}
                      <label className="flex items-center justify-between p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-low cursor-pointer hover:bg-surface-container transition-all">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={zeroTracking}
                            onChange={(e) => setZeroTracking(e.target.checked)}
                            className="w-4 h-4 text-primary rounded focus:ring-primary"
                          />
                          <div>
                            <span className="font-semibold text-on-surface block">Automatic Zero-Tracking Function</span>
                            <span className="text-[10px] text-outline">Returns strictly to 0.000g upon pan release without mechanical sticking</span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-sm text-secondary">check</span>
                      </label>

                      {/* Check 4 */}
                      <label className="flex items-center justify-between p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-low cursor-pointer hover:bg-surface-container transition-all">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={displayVisible}
                            onChange={(e) => setDisplayVisible(e.target.checked)}
                            className="w-4 h-4 text-primary rounded focus:ring-primary"
                          />
                          <div>
                            <span className="font-semibold text-on-surface block">Dual Customer Display Visibility</span>
                            <span className="text-[10px] text-outline">Secondary weight display clearly visible at customer eye level (Rule 11(3))</span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-sm text-secondary">visibility</span>
                      </label>

                      {/* Check 5 */}
                      <label className="flex items-center justify-between p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-low cursor-pointer hover:bg-surface-container transition-all">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={leadWireCavity}
                            onChange={(e) => setLeadWireCavity(e.target.checked)}
                            className="w-4 h-4 text-primary rounded focus:ring-primary"
                          />
                          <div>
                            <span className="font-semibold text-on-surface block">Tamper Lead Wire Cavity Clear</span>
                            <span className="text-[10px] text-outline">Pre-drilled calibration screw hole unblocked for government lead wire threading</span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-sm text-secondary">pin</span>
                      </label>
                    </div>

                    {/* DYNAMIC CATEGORY-SPECIFIC STATUTORY ALERT NOTE (USP #9) */}
                    <div className="mt-3 p-3 rounded-xl bg-surface-container border border-outline-variant/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-primary flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">assignment_late</span>
                          Category Inspection Advisory:
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-outline-variant text-on-surface-variant font-mono">
                          {currentInst?.category || "ELECTRONIC_COUNTER_SCALE"}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">
                        {currentInst?.category === "JEWELRY_PRECISION_BALANCE" || currentInst?.accuracyClass === "CLASS_II" || currentInst?.accuracyClass === "CLASS_I"
                          ? "⚖️ Rule 24 Bullion & Jewelry Standard: Inspect draft shield glass enclosure for air currents. Verify anti-vibration damping table lock; check that weight indication remains stable when enclosure doors slide shut."
                          : currentInst?.category === "WEIGHBRIDGE"
                          ? "🚛 Industrial Weighbridge Protocol: Inspect underground pit drainage for slurry accumulation. Verify loadcell summing junction box for unauthorized wireless RF interceptor relays."
                          : currentInst?.category === "FUEL_DISPENSER_NOZZLE" || currentInst?.category === "FLOW_METER"
                          ? "⛽ Petroleum Dispenser Protocol: Verify meter calibration wire seal, pulser electromagnetic shielding, and nozzle auto-shutoff mechanism under Rule 21."
                          : "🛒 Standard Commercial Retail Protocol: Verify corner-load eccentricity at 1/3 max capacity. Confirm secondary consumer display is unobstructed by merchandise."}
                      </p>
                    </div>
                  </section>
                </div>

                {/* STATION 2: Error Calibration & Stamping Station */}
                <div className="space-y-4">
                  {/* 2.1 MPE Formula Engine */}
                  <section className="bg-surface border border-outline-variant rounded-2xl p-4 lg:p-5 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-outline-variant/60 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                          <span className="material-symbols-outlined text-xl">calculate</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-outline font-mono">Station 2 • Calibration</span>
                          <h3 className="font-bold text-sm text-on-surface">Maximum Permissible Error (MPE)</h3>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${isWithinTolerance ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                          {isWithinTolerance ? "Tolerance OK" : "MPE EXCEEDED"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-on-surface mb-1">
                          Nominal Test Mass (kg)
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={nominalLoad}
                          onChange={(e) => setNominalLoad(e.target.value)}
                          className="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg font-mono font-bold text-xs text-on-surface outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-on-surface mb-1">
                          Observed Indication (kg)
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={observedLoad}
                          onChange={(e) => setObservedLoad(e.target.value)}
                          className="w-full p-2 bg-surface-container-low border border-outline-variant rounded-lg font-mono font-bold text-xs text-on-surface outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* MPE Meter */}
                    <div className="bg-surface-container-low border border-outline-variant/80 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Calculated Absolute Deviation:</span>
                        <span className="font-mono font-bold text-primary">
                          {(calculatedError * 1000).toFixed(1)} g
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-outline">
                        <span>Statutory Limit (Class III @ 10kg):</span>
                        <span className="font-mono">± {(mpeLimit * 1000).toFixed(1)} g</span>
                      </div>

                      <div className="w-full bg-outline-variant/40 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${isWithinTolerance ? "bg-secondary" : "bg-error"}`}
                          style={{ width: `${Math.min(100, (calculatedError / mpeLimit) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </section>

                  {/* 2.2 Security Lead Seal Application */}
                  <section className="bg-surface border border-outline-variant rounded-2xl p-4 lg:p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
                      <h4 className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-base">pin</span>
                        Tamper-Evident Lead Wire Seal Registry
                      </h4>
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

                  {/* 2.3 Anti-Armchair Geolocation Watermark (Domain Realism #52) */}
                  <section className="bg-surface border border-outline-variant rounded-2xl p-4 lg:p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
                      <h4 className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-base">pin_drop</span>
                        Anti-Armchair Geolocation Audit Watermark
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        GEOFENCE VERIFIED ✓
                      </span>
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant/70 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-on-surface-variant font-medium">Device Coordinates:</span>
                        <span className="font-mono font-bold text-primary">
                          {geoCoords.lat.toFixed(4)}° N, {geoCoords.lng.toFixed(4)}° E
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-on-surface-variant font-medium">Jurisdiction Hub:</span>
                        <span className="font-semibold text-on-surface flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-secondary">domain</span>
                          {geoCoords.hubName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-outline">
                        <span>Source: <strong className="font-mono text-on-surface-variant">{geoCoords.source}</strong> (±{geoCoords.accuracy}m)</span>
                        <span>Lock: <strong className="font-mono text-on-surface-variant">{geoCoords.lockedAt}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-outline">
                        Sec 52 Anti-Armchair Inspection: Geotag permanently embedded in certificate hash.
                      </span>
                      <button
                        type="button"
                        onClick={acquireGpsCoordinates}
                        disabled={isAcquiringGps}
                        className="px-2.5 py-1 rounded-lg border border-outline-variant text-[11px] font-bold text-primary hover:bg-primary/5 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                        title="Acquire live GPS or fall back to Mandi Hub Fix for SIH demonstration"
                      >
                        <span className={`material-symbols-outlined text-xs ${isAcquiringGps ? "animate-spin" : ""}`}>
                          sync
                        </span>
                        <span>{isAcquiringGps ? "Acquiring..." : "Re-acquire GPS / Mandi Lock"}</span>
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* STICKY BOTTOM STATUTORY VERDICT CONSOLE */}
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
                <span className="opacity-40">•</span>
                <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  GPS: {geoCoords.lat.toFixed(2)}°N, {geoCoords.lng.toFixed(2)}°E
                </span>
                <span className="opacity-40">•</span>
                <span className={`flex items-center gap-1.5 font-semibold ${checklistPassed ? "text-emerald-700" : "text-amber-700"}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${checklistPassed ? "bg-emerald-500" : "bg-amber-500"}`} />
                  Checklist: {checklistCompletedCount}/5
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
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-error text-white rounded-xl text-xs font-bold hover:bg-error/90 transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  REJECT (Issue Form-B Notice)
                </button>

                <button
                  type="button"
                  onClick={() => handleDecision("PASS")}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-secondary text-white rounded-xl text-xs font-bold hover:bg-secondary/90 transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  PASS (Issue Form-A Certificate)
                </button>
              </div>
            </div>
          </>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: FORM-A CERTIFICATES GAZETTE VAULT                     */}
        {/* ------------------------------------------------------------- */}
        {currentView === "certs" && (
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant pb-4">
              <div>
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">verified</span>
                  Form-A Verification Certificates Register
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Official gazette certificates issued under Rule 11(1) of Legal Metrology (General) Rules, 2011 with SHA-256 seal integrity.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold px-3 py-1 bg-surface-container border border-outline-variant rounded-full text-primary">
                  {filteredCertificates.length} Certificates Registered
                </span>
              </div>
            </div>

            {/* Filter and Search Ribbon */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-base pointer-events-none">search</span>
                <input
                  type="text"
                  value={certSearchQuery}
                  onChange={(e) => setCertSearchQuery(e.target.value)}
                  placeholder="Search Certificate No, Scale ID, or Seal..."
                  className="w-full pl-9 pr-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface focus:border-primary outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCertFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    certFilter === "ALL" ? "bg-primary text-white" : "bg-surface text-on-surface-variant border border-outline-variant"
                  }`}
                >
                  All ({certificates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCertFilter("VALID")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    certFilter === "VALID" ? "bg-primary text-white" : "bg-surface text-on-surface-variant border border-outline-variant"
                  }`}
                >
                  Active Valid
                </button>
                <button
                  type="button"
                  onClick={() => setCertFilter("EXPIRING")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    certFilter === "EXPIRING" ? "bg-primary text-white" : "bg-surface text-on-surface-variant border border-outline-variant"
                  }`}
                >
                  Expiring Soon
                </button>
              </div>
            </div>

            {/* Certificate Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCertificates.map((cert) => {
                const targetInst = instruments.find((i) => i.id === cert.instrumentId || i.digitalInstrumentId === cert.digitalInstrumentId);
                return (
                  <div
                    key={cert.id}
                    className="bg-surface border border-outline-variant rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-primary/50 transition-all space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[10px] text-outline font-mono block">Certificate Number</span>
                          <h4 className="font-mono font-bold text-xs text-primary">{cert.certificateNumber}</h4>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                          {cert.status}
                        </span>
                      </div>

                      <div className="bg-surface-container-low rounded-xl p-3 text-xs space-y-1.5 border border-outline-variant/60">
                        <div className="flex justify-between">
                          <span className="text-outline">Instrument ID:</span>
                          <span className="font-mono font-bold text-on-surface">{cert.digitalInstrumentId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-outline">Physical Seal No:</span>
                          <span className="font-mono font-semibold text-on-surface">{cert.physicalSealNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-outline">Issue Date:</span>
                          <span className="text-on-surface">{cert.issueDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-outline">Valid Until:</span>
                          <span className="font-bold text-secondary">{cert.validUntil}</span>
                        </div>
                        <div className="flex justify-between truncate pt-1 border-t border-outline-variant/40">
                          <span className="text-outline">Establishment:</span>
                          <span className="font-medium text-on-surface truncate max-w-[150px]">
                            {targetInst?.ownerName || "Commercial Licensee"}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-outline font-mono truncate mt-2">
                        Hash: {cert.digitalSignatureHash}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedCertForPreview(cert)}
                      className="w-full py-2 bg-surface border border-outline-variant rounded-xl font-bold text-xs text-on-surface hover:bg-surface-container flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base text-primary">description</span>
                      <span>View & Print Official Form-A</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: WORKING STANDARDS (WEIGHTS) TRACEABILITY REGISTRY     */}
        {/* ------------------------------------------------------------- */}
        {currentView === "standards" && (
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant pb-4">
              <div>
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-xl">scale</span>
                  Inspector Working Standards Kit & Traceability Register
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Physical reference mass standards certified under Section 27 and Rule 27 of Legal Metrology (General) Rules, 2011.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  NPL India Traceable (Valid)
                </span>
              </div>
            </div>

            {/* Reference Kit Hero Dossier Card */}
            <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="border-r border-outline-variant/60 pr-3">
                  <span className="text-[10px] text-outline uppercase font-bold block">Assigned Reference Kit</span>
                  <span className="font-mono font-bold text-sm text-primary">Standards Kit #DL-WS-04</span>
                  <span className="text-[11px] text-on-surface-variant block mt-1">
                    Custodian: {currentUser.name} ({currentUser.officerBadgeId || "LMO-DL-N-884"})
                  </span>
                </div>

                <div className="border-r border-outline-variant/60 pr-3">
                  <span className="text-[10px] text-outline uppercase font-bold block">Primary Traceability Source</span>
                  <span className="font-bold text-sm text-on-surface">NPL India (CSIR New Delhi)</span>
                  <span className="text-[11px] text-on-surface-variant block mt-1">
                    Calibration Cert: <strong className="font-mono">NPL/MET/2025/WS-8841-B</strong>
                  </span>
                </div>

                <div className="border-r border-outline-variant/60 pr-3">
                  <span className="text-[10px] text-outline uppercase font-bold block">Secondary Laboratory</span>
                  <span className="font-semibold text-xs text-on-surface">State Secondary Standards Lab</span>
                  <span className="text-[11px] text-on-surface-variant block mt-1">Pusa Campus, New Delhi</span>
                </div>

                <div>
                  <span className="text-[10px] text-outline uppercase font-bold block">Validity Window</span>
                  <span className="font-bold text-xs text-secondary block">14 Nov 2025 &rarr; 13 Nov 2026</span>
                  <span className="text-[10px] text-emerald-700 font-semibold mt-1 inline-block">
                    ✓ Calibration Valid (68 Days Remaining)
                  </span>
                </div>
              </div>
            </div>

            {/* Table of Calibrated Reference Masses in Kit */}
            <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
                <h3 className="font-bold text-xs text-on-surface uppercase tracking-wider">
                  Verified Physical Weights Inventory (Kit #DL-WS-04)
                </h3>
                <span className="text-[11px] text-outline font-mono">12 Standards Verified</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container text-on-surface-variant font-semibold text-[11px]">
                      <th className="p-3">Denomination</th>
                      <th className="p-3">OIML Class</th>
                      <th className="p-3">Material & Shape</th>
                      <th className="p-3">Measured Drift</th>
                      <th className="p-3">Statutory MPE</th>
                      <th className="p-3 text-right">Verification Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {[
                      { mass: "20.000 kg", class: "Class M1", mat: "Cast Iron Bar with Cavity", drift: "+0.0002 g", mpe: "± 1000 mg", status: "PASS" },
                      { mass: "10.000 kg", class: "Class M1", mat: "Cast Iron Bar with Cavity", drift: "+0.0001 g", mpe: "± 500 mg", status: "PASS" },
                      { mass: "5.000 kg", class: "Class M1", mat: "Polished Cylindrical Brass", drift: "-0.0001 g", mpe: "± 250 mg", status: "PASS" },
                      { mass: "2.000 kg", class: "Class M1", mat: "Polished Cylindrical Brass", drift: "0.0000 g", mpe: "± 100 mg", status: "PASS" },
                      { mass: "1.000 kg", class: "Class M1", mat: "Polished Cylindrical Brass", drift: "+0.00005 g", mpe: "± 50 mg", status: "PASS" },
                      { mass: "500.000 g", class: "Class F2", mat: "Knobbed Brass Standard", drift: "+0.00001 g", mpe: "± 25 mg", status: "PASS" },
                      { mass: "200.000 g", class: "Class F2", mat: "Knobbed Brass Standard", drift: "0.0000 g", mpe: "± 10 mg", status: "PASS" },
                      { mass: "100.000 g", class: "Class F2", mat: "Knobbed Brass Standard", drift: "-0.00002 g", mpe: "± 5 mg", status: "PASS" },
                      { mass: "50.000 g to 1.000 g", class: "Class F2", mat: "Fractional Precision Sheet Set", drift: "± 0.00001 g", mpe: "± 2 mg", status: "PASS" },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                        <td className="p-3 font-mono font-bold text-on-surface">{row.mass}</td>
                        <td className="p-3 font-semibold text-primary">{row.class}</td>
                        <td className="p-3 text-on-surface-variant">{row.mat}</td>
                        <td className="p-3 font-mono text-emerald-700">{row.drift}</td>
                        <td className="p-3 font-mono text-outline">{row.mpe}</td>
                        <td className="p-3 text-right">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            {row.status} ✓
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 4: OFFLINE SYNC QUEUE & MANDI BUFFER                     */}
        {/* ------------------------------------------------------------- */}
        {currentView === "offline" && (
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant pb-4">
              <div>
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">cloud_sync</span>
                  Mandi Edge Offline Buffer & Central Synchronization Engine
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Cryptographic local buffer allowing uninterrupted field inspections when APMC mandi cellular network coverage drops.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleForceSync}
                  className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-container shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-base ${isSyncing ? "animate-spin" : ""}`}>
                    sync
                  </span>
                  <span>{isSyncing ? "Reconciling eMaap..." : "Force Bidirectional Sync"}</span>
                </button>
              </div>
            </div>

            {/* Connectivity Telemetry Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface border border-outline-variant rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-outline">Network State</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                </div>
                <div className="font-bold text-sm text-on-surface">
                  {isOnline ? "Online • National Gateway Connected" : "Offline • Edge Buffer Mode"}
                </div>
                <div className="text-[11px] text-on-surface-variant mt-1">
                  Latency: 28ms to e-Maap Server (NIC Delhi)
                </div>
              </div>

              <div className="bg-surface border border-outline-variant rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-outline">Encrypted Local Buffer</span>
                  <span className="material-symbols-outlined text-base text-secondary">storage</span>
                </div>
                <div className="font-bold text-sm text-on-surface">0 Pending Sync Transactions</div>
                <div className="text-[11px] text-on-surface-variant mt-1">
                  IndexedDB Storage: 4.8 MB utilized of 500 MB
                </div>
              </div>

              <div className="bg-surface border border-outline-variant rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-outline">Last Reconciled</span>
                  <span className="material-symbols-outlined text-base text-primary">schedule</span>
                </div>
                <div className="font-bold text-sm text-on-surface">{lastSyncTime}</div>
                <div className="text-[11px] text-on-surface-variant mt-1">
                  SHA-256 Checksum: Verified Matching Cloud
                </div>
              </div>
            </div>

            {/* Offline Pre-Caching Tools */}
            <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-xs text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">download_for_offline</span>
                Pre-Cache Mandi Circle Registry for Disconnected Operation
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Before entering underground cold storages or rural grain wholesale yards, pre-download the cryptographic scale registry and valid merchant licenses for your jurisdiction circle ({currentUser.jurisdictionCircle}).
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePreCacheMandi}
                  className="px-3.5 py-2 bg-surface-container border border-outline-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high transition-all cursor-pointer flex items-center gap-1.5 text-on-surface"
                >
                  <span className="material-symbols-outlined text-base text-secondary">cloud_download</span>
                  Pre-Cache Azadpur & Jahangirpuri Mandi Bundle (16 Scales)
                </button>

                <button
                  type="button"
                  onClick={() => toast.info("Audit Trail Saved", "Offline inspection event ledger saved to local encrypted vault.")}
                  className="px-3.5 py-2 bg-surface-container border border-outline-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high transition-all cursor-pointer flex items-center gap-1.5 text-on-surface"
                >
                  <span className="material-symbols-outlined text-base text-primary">history_edu</span>
                  Export Offline Diagnostic Log
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 5: SECTION 25 STOP-USE & SEIZURE ORDERS                  */}
        {/* ------------------------------------------------------------- */}
        {currentView === "notices" && (
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant pb-4">
              <div>
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-xl">warning</span>
                  Statutory Stop-Use & Scale Seizure Register (Section 25)
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Official enforcement orders prohibiting commercial measurement due to broken seals, short-weight, or fraudulent tampering.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-full bg-error-container text-error text-xs font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                  {suspendedInstruments.length} Active Stop-Use Orders
                </span>
              </div>
            </div>

            {/* Notices Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suspendedInstruments.map((inst, idx) => (
                <div
                  key={inst.id}
                  className="bg-surface border-2 border-error/40 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-error transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] text-error font-mono font-bold block uppercase tracking-wider">
                          Statutory Seizure Order #{idx + 1}
                        </span>
                        <h4 className="font-mono font-bold text-sm text-on-surface">{inst.digitalInstrumentId}</h4>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-error text-white font-bold uppercase">
                        STOP-USE ENFORCED
                      </span>
                    </div>

                    <div className="bg-error-container/20 rounded-xl p-3 text-xs space-y-1.5 border border-error/30 text-on-surface">
                      <div className="flex justify-between">
                        <span className="text-outline">Scale Model:</span>
                        <span className="font-semibold">{inst.modelName} (SN: {inst.serialNumber})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-outline">Establishment:</span>
                        <span className="font-medium">{inst.ownerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-outline">Location:</span>
                        <span className="text-on-surface">{inst.ownerAddress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-outline">Violated Condition:</span>
                        <span className="font-bold text-error">
                          {inst.status === "SUSPENDED_TAMPERED" ? "Broken Lead Wire Seal / Tampering Detected" : "Overdue Verification (MPE Drift)"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 text-[11px] text-on-surface-variant leading-relaxed">
                      <strong>Legal Mandate:</strong> Under Section 25 & Section 34 of the Legal Metrology Act, 2009, this instrument is confiscated from trade. Any further weighing on this instrument constitutes a cognizable offense punishable by fine and imprisonment.
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-outline-variant/60">
                    <button
                      type="button"
                      onClick={() => setSelectedNoticeForModal(inst)}
                      className="flex-1 py-2 bg-surface border border-outline-variant rounded-xl font-bold text-xs text-on-surface hover:bg-surface-container flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base text-primary">description</span>
                      <span>View Gazette Notice</span>
                    </button>
                    <Link
                      href="/lmo?view=docket"
                      className="flex-1 py-2 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-container flex items-center justify-center gap-1.5 transition-all text-center"
                    >
                      <span className="material-symbols-outlined text-base">build</span>
                      <span>Schedule Re-Inspection</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
            className="w-full py-2.5 bg-primary text-white rounded-lg text-xs font-bold shadow-sm hover:bg-primary-container transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">document_scanner</span>
            {ocrScanning ? "Processing Plate OCR..." : "Capture & Match Plate Record"}
          </button>
        </div>
      </Modal>

      {/* Verification Certificate Modal (Form-A from Docket) */}
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

      {/* Form-A Gazette View & Print Modal (from Certificates View) */}
      {selectedCertForPreview && (
        <Modal
          isOpen={!!selectedCertForPreview}
          onClose={() => setSelectedCertForPreview(null)}
          title="Official Form-A Verification Certificate"
          subtitle={`Gazette Record • ${selectedCertForPreview.certificateNumber}`}
        >
          <div className="space-y-4">
            <div className="max-h-[70vh] overflow-y-auto border border-outline-variant rounded-xl p-2 bg-white">
              <FormADocument
                certificate={selectedCertForPreview}
                instrument={instruments.find((i) => i.id === selectedCertForPreview.instrumentId || i.digitalInstrumentId === selectedCertForPreview.digitalInstrumentId)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-container flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-base">print</span>
                Print / Download PDF (A4)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCertForPreview(null)}
                className="px-4 py-2 bg-surface border border-outline-variant rounded-xl font-bold text-xs text-on-surface hover:bg-surface-container cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Section 25 Stop-Use Gazette Notice Modal */}
      {selectedNoticeForModal && (
        <Modal
          isOpen={!!selectedNoticeForModal}
          onClose={() => setSelectedNoticeForModal(null)}
          title="Statutory Stop-Use Order (Section 25)"
          subtitle={`Order Ref: SEC25-${selectedNoticeForModal.digitalInstrumentId}`}
        >
          <div className="space-y-3 text-xs">
            <div className="p-4 bg-error-container/30 border border-error/40 rounded-xl text-on-surface space-y-2">
              <div className="flex items-center gap-2 text-error font-bold text-sm">
                <span className="material-symbols-outlined text-xl">gavel</span>
                Directorate of Legal Metrology Stop-Use Proclamation
              </div>
              <p className="leading-relaxed">
                Notice is hereby served under <strong>Section 25 of the Legal Metrology Act, 2009</strong> to <strong>{selectedNoticeForModal.ownerName}</strong> trading at <strong>{selectedNoticeForModal.ownerAddress}</strong>.
              </p>
              <div className="bg-surface p-2.5 rounded-lg border border-outline-variant font-mono text-[11px] space-y-1">
                <div>Scale ID: <strong>{selectedNoticeForModal.digitalInstrumentId}</strong></div>
                <div>Serial Number: <strong>{selectedNoticeForModal.serialNumber}</strong></div>
                <div>Reason: <span className="text-error font-bold">Broken Holographic Seal / Short-Weight Violation</span></div>
              </div>
              <p className="text-[11px] text-error font-semibold leading-tight">
                Use of this instrument for commercial transaction is strictly prohibited. Continued use constitutes a non-bailable offense under Section 34.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-surface border border-outline-variant rounded-xl font-bold text-xs text-on-surface hover:bg-surface-container flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">print</span>
                Print Seizure Notice
              </button>
              <button
                type="button"
                onClick={() => setSelectedNoticeForModal(null)}
                className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-container cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Historical Diff Modal (USP #10: What Changed Analysis) */}
      <DiffViewer
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        instrumentId={currentInst?.digitalInstrumentId || "IND-MET-2026-X8829"}
        serialNumber={currentInst?.serialNumber || "SN-8829-X"}
        diffFields={diffFields}
      />

      {/* Standalone Printable Document (Exclusively shown during @media print) */}
      {issuedCert && (
        <div className="hidden print:block print-only-container">
          <FormADocument certificate={issuedCert} instrument={currentInst || undefined} />
        </div>
      )}
      {selectedCertForPreview && (
        <div className="hidden print:block print-only-container">
          <FormADocument
            certificate={selectedCertForPreview}
            instrument={instruments.find((i) => i.id === selectedCertForPreview.instrumentId || i.digitalInstrumentId === selectedCertForPreview.digitalInstrumentId)}
          />
        </div>
      )}
    </div>
  );
}
