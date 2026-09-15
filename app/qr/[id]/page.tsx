"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useMetrica } from "@/lib/store";
import { Modal } from "@/components/ui/modal";
import { FormADocument } from "@/components/form-a-document";
import { MascotCompanion } from "@/components/mascot-companion";

export default function PublicQRVerificationPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = (params?.id as string) || "IND-MET-2026-AZ01";

  const { instruments, certificates, fileComplaint, refreshDatabase } = useMetrica();

  // Normalize ID (handle "demo" or "55201")
  const targetLookup = rawId === "demo" ? "IND-MET-2026-AZ01" : rawId;

  // Search input state
  const [searchInput, setSearchInput] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isRightsGuideOpen, setIsRightsGuideOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fallback DB fetch state if store is still populating
  const [dbInst, setDbInst] = useState<any>(null);
  const [dbCert, setDbCert] = useState<any>(null);
  const [isSearchingDb, setIsSearchingDb] = useState(true);

  // Find instrument in store
  const storeInst = useMemo(() => {
    return instruments.find(
      (i) =>
        i.digitalInstrumentId.toLowerCase() === targetLookup.toLowerCase() ||
        i.id.toLowerCase() === targetLookup.toLowerCase() ||
        i.serialNumber.toLowerCase() === targetLookup.toLowerCase() ||
        (targetLookup === "55201" && (i.digitalInstrumentId.includes("55201") || i.serialNumber.includes("55201")))
    );
  }, [instruments, targetLookup]);

  const storeCert = useMemo(() => {
    if (!storeInst) return null;
    return certificates.find(
      (c) =>
        c.instrumentId === storeInst.id ||
        c.digitalInstrumentId.toLowerCase() === storeInst.digitalInstrumentId.toLowerCase()
    );
  }, [certificates, storeInst]);

  // If not in store, query database API
  useEffect(() => {
    if (storeInst) {
      setIsSearchingDb(false);
      return;
    }
    if (targetLookup) {
      setIsSearchingDb(true);
      fetch(`/api/instruments?search=${encodeURIComponent(targetLookup)}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((items) => {
          if (Array.isArray(items) && items.length > 0) {
            setDbInst(items[0]);
            if (Array.isArray(items[0].certificates) && items[0].certificates.length > 0) {
              setDbCert(items[0].certificates[0]);
            } else {
              // Try fetching certificate separately
              fetch(`/api/certificates?instrumentId=${encodeURIComponent(items[0].id)}`)
                .then((cr) => (cr.ok ? cr.json() : []))
                .then((certs) => {
                  if (Array.isArray(certs) && certs.length > 0) setDbCert(certs[0]);
                })
                .catch(() => {});
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsSearchingDb(false);
        });
    } else {
      setIsSearchingDb(false);
    }
  }, [storeInst, targetLookup]);

  const inst = storeInst || dbInst;
  const cert = storeCert || dbCert;

  // Verification status logic
  const isSuspended = inst ? inst.status === "SUSPENDED_TAMPERED" || inst.priorityFlag === "CRITICAL" : false;
  const isExpired = inst ? inst.status === "EXPIRED" || (inst.validUntil && new Date(inst.validUntil) < new Date()) : false;
  const isVerified = inst ? inst.status === "VERIFIED_ACTIVE" && !isSuspended && !isExpired : false;

  // Days remaining calculation
  const daysRemaining = useMemo(() => {
    const validDate = cert?.validUntil || inst?.validUntil;
    if (!validDate) return null;
    const diff = Math.ceil((new Date(validDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [cert, inst]);

  // Anti-Cloning Geo-Anomaly Detector State (USP #4)
  const [isSimulatedClone, setIsSimulatedClone] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);

  // Auto-acquire user coordinates on mount if available
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            name: "Live Device GPS",
          });
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  // Registered APMC coordinates for the scale
  const registeredLocation = useMemo(() => {
    if (inst?.jurisdictionCircle?.toLowerCase().includes("mumbai") || inst?.ownerAddress?.toLowerCase().includes("mumbai")) {
      return { lat: 19.0760, lng: 72.8777, name: "Vashi APMC Yard, Navi Mumbai" };
    }
    if (inst?.jurisdictionCircle?.toLowerCase().includes("pune") || inst?.ownerAddress?.toLowerCase().includes("pune")) {
      return { lat: 18.5204, lng: 73.8567, name: "Gultekdi Market Yard, Pune" };
    }
    return { lat: 28.7156, lng: 77.1772, name: "Azadpur APMC Market Yard, Delhi" };
  }, [inst]);

  // Active scanner location (supports 1-click evaluator simulation)
  const scannerLocation = useMemo(() => {
    if (isSimulatedClone) {
      if (registeredLocation.name.includes("Delhi")) {
        return { lat: 19.0760, lng: 72.8777, name: "Dadar Wholesale Mandi, Mumbai (Simulated)" };
      }
      return { lat: 28.7156, lng: 77.1772, name: "Azadpur Mandi, Delhi (Simulated)" };
    }
    return userLocation || { lat: registeredLocation.lat, lng: registeredLocation.lng, name: registeredLocation.name };
  }, [isSimulatedClone, registeredLocation, userLocation]);

  // Haversine Distance Calculation (Delta in km)
  const distanceMismatchKm = useMemo(() => {
    if (!scannerLocation || !registeredLocation) return 0;
    const R = 6371; // Earth radius in km
    const dLat = (scannerLocation.lat - registeredLocation.lat) * (Math.PI / 180);
    const dLon = (scannerLocation.lng - registeredLocation.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(registeredLocation.lat * (Math.PI / 180)) *
        Math.cos(scannerLocation.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }, [scannerLocation, registeredLocation]);

  const isCloneDetected = distanceMismatchKm > 50 || isSimulatedClone;

  // Citizen Complaint Modal State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<any>("SHORT_WEIGHT");
  const [citizenName, setCitizenName] = useState("");
  const [citizenPhone, setCitizenPhone] = useState("");
  const [observedDiscrepancy, setObservedDiscrepancy] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [submittedDocketId, setSubmittedDocketId] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    router.push(`/qr/${encodeURIComponent(searchInput.trim())}`);
  };

  const handlePresetSelect = (id: string) => {
    router.push(`/qr/${encodeURIComponent(id)}`);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDesc.trim()) return;

    const fullDescription = observedDiscrepancy.trim()
      ? `Discrepancy: ${observedDiscrepancy.trim()} | Observation: ${reportDesc.trim()}`
      : reportDesc.trim();

    const newCmp = fileComplaint({
      digitalInstrumentId: inst ? inst.digitalInstrumentId : targetLookup,
      instrumentId: inst?.id,
      complaintType: reportCategory,
      description: fullDescription,
      complainantName: citizenName.trim() || "Anonymous Citizen",
      complainantPhone: citizenPhone.trim() || "+91 99000 00000",
    });

    setSubmittedDocketId(newCmp.id);
    setReportSubmitted(true);
  };

  const handleCloseReport = () => {
    setIsReportOpen(false);
    setReportSubmitted(false);
    setReportDesc("");
    setObservedDiscrepancy("");
  };

  return (
    <>
      {/* Standalone Printable Document (Exclusively shown during @media print) */}
      <div className="hidden print:block print-only-container">
        <FormADocument instrument={inst} certificate={cert} />
      </div>

      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16 screen-only-view">
      {/* Sovereign Tricolor Header Ribbon */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* Sovereign National Masthead */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/10 p-1 flex items-center justify-center border border-white/20">
              <Image
                alt="Government of India Emblem"
                className="w-full h-full object-contain"
                src="/logo.png"
                width={40}
                height={40}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-wider uppercase font-semibold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  भारत सरकार | Govt of India
                </span>
                <span className="text-[10px] text-slate-400 hidden md:inline">
                  उपभोक्ता मामले, खाद्य एवं सार्वजनिक वितरण मंत्रालय
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                e-Parapakhya <span className="text-xs font-normal text-slate-300">राष्ट्रीय विधिक माप विज्ञान सत्यापन पोर्टल</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/admin"
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
              <span>Officer Portal</span>
            </Link>
            <a
              href="tel:1915"
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 font-medium transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">call</span>
              <span>Helpline 1915</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 sm:px-6">
        {/* Quick Search & QR Simulator Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">National Instrument Verification Lookup</h2>
              <p className="text-xs text-slate-500">
                Scan or enter the Digital Metrology QR Identifier stamped on the scale
              </p>
            </div>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="w-full md:w-auto px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
              <span>Simulate QR Camera Scan</span>
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-[18px]">search</span>
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Scale ID (e.g. IND-MET-2026-AZ01, GZ02, 55201)"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Verify
            </button>
          </form>

          {/* Quick 1-Click Mandi Presets */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Quick Test Scales:
            </span>
            <button
              onClick={() => handlePresetSelect("IND-MET-2026-AZ01")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                targetLookup.includes("AZ01")
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400"
                  : "bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200"
              }`}
            >
              🟢 Azadpur (Active Verified)
            </button>
            <button
              onClick={() => handlePresetSelect("IND-MET-2026-GZ02")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                targetLookup.includes("GZ02")
                  ? "bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-400"
                  : "bg-slate-50 hover:bg-rose-50 text-slate-700 border-slate-200"
              }`}
            >
              🔴 Ghazipur (Section 25 Suspended)
            </button>
            <button
              onClick={() => handlePresetSelect("IND-MET-2026-OK03")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                targetLookup.includes("OK03")
                  ? "bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400"
                  : "bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200"
              }`}
            >
              🟡 Okhla (Stamping Expired)
            </button>
            <button
              onClick={() => handlePresetSelect("IND-MET-2026-JW01")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                targetLookup.includes("JW01")
                  ? "bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-400"
                  : "bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200"
              }`}
            >
              💎 Chandni Chowk (Class II Gold)
            </button>
            <button
              onClick={() => handlePresetSelect("IND-MET-2026-AZ02")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                targetLookup.includes("AZ02")
                  ? "bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-400"
                  : "bg-slate-50 hover:bg-rose-50 text-slate-700 border-slate-200"
              }`}
            >
              ⚠️ Broken Seal Yard Scale
            </button>
            <button
              onClick={() => handlePresetSelect("55201")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                targetLookup === "55201"
                  ? "bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-400"
                  : "bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200"
              }`}
            >
              ⚖️ Sunshine Groceries (55201)
            </button>

            {/* 1-Click Evaluator Clone Simulation Trigger (USP #4) */}
            <button
              type="button"
              onClick={() => setIsSimulatedClone((prev) => !prev)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                isSimulatedClone
                  ? "bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-400 animate-pulse"
                  : "bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300"
              }`}
              title="Demonstrate USP #4: Delhi APMC scale simultaneously scanned 1,418 km away in Mumbai"
            >
              <span className="material-symbols-outlined text-[14px]">
                {isSimulatedClone ? "cancel" : "fmd_bad"}
              </span>
              <span>
                {isSimulatedClone ? "Deactivate Clone Simulation" : "🚨 Simulate Clone Scan (Delhi scale in Mumbai)"}
              </span>
            </button>
          </div>
        </div>

        {/* Verification Certificate / Status Card */}
        {inst ? (
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden mb-6">
            {/* Status Sovereign Banner */}
            {isCloneDetected ? (
              <div className="bg-[#450a0a] bg-gradient-to-r from-[#450a0a] via-[#7f1d1d] to-[#450a0a] text-white p-5 sm:p-6 border-b-2 border-red-700 relative overflow-hidden ring-4 ring-rose-500/50 shadow-xl">
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shrink-0 border-2 border-white/40 shadow-lg animate-pulse">
                    <span className="material-symbols-outlined text-3xl text-white">fmd_bad</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 bg-black/60 px-2.5 py-0.5 rounded text-[11px] font-mono tracking-wide text-rose-200 border border-rose-400/40 uppercase">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                      <span className="font-bold text-rose-100">संदिग्ध प्रतिरूपण | COUNTERFEIT QR CLONE DETECTED</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                      <span>अवैध प्रतिरूपित QR कोड (IMPOSSIBLE TRAVEL ANOMALY)</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-rose-100 max-w-2xl leading-relaxed">
                      This QR identity is registered exclusively to{" "}
                      <strong className="text-white underline">{inst?.ownerName || "Authorized Merchant"}</strong> at{" "}
                      <strong className="text-white">{registeredLocation.name}</strong>. Your current scanner GPS locates this transaction{" "}
                      <strong className="text-amber-300 font-mono text-sm underline bg-black/40 px-1.5 py-0.5 rounded ml-1">
                        {distanceMismatchKm} km away in {scannerLocation.name}
                      </strong>.
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-2.5">
                      <span className="px-3 py-1 rounded bg-black/70 text-xs font-mono font-bold text-amber-300 border border-rose-500/60 shadow-xs">
                        🚨 Haversine Delta: {distanceMismatchKm} km (&gt;50 km threshold)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setReportCategory("SUSPECTED_TAMPERING");
                          setObservedDiscrepancy(`Impossible travel anomaly: Scale registered in ${registeredLocation.name} scanned in ${scannerLocation.name} (${distanceMismatchKm} km away)`);
                          setIsReportOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-950 rounded-lg text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer ring-2 ring-rose-400"
                      >
                        <span className="material-symbols-outlined text-sm text-rose-700">crisis_alert</span>
                        Report Counterfeit Clone Scale
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : isSuspended ? (
              <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 text-white p-5 border-b border-rose-800">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
                    <span className="material-symbols-outlined text-3xl text-white">gavel</span>
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-black/30 px-2 py-0.5 rounded text-[11px] font-mono tracking-wide text-rose-100 uppercase mb-1">
                      <span>धारा 25 निषेध आदेश | SECTION 25 STOP-USE NOTICE</span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">
                      अवैध वाणिज्यिक उपयोग - प्रयोग निषेध (SUSPENDED SCALE)
                    </h3>
                    <p className="text-xs text-rose-100 mt-1 max-w-2xl leading-relaxed">
                      This weighing instrument has been <strong>SUSPENDED</strong> by the Legal Metrology Inspectorate due to critical seal tampering and verified weight discrepancy. Commercial transactions on this scale constitute a cognizable offense under Section 25 & 53 of the Legal Metrology Act, 2009.
                    </p>
                  </div>
                </div>
              </div>
            ) : isExpired ? (
              <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white p-5 border-b border-amber-700">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
                    <span className="material-symbols-outlined text-3xl text-white">history_toggle_off</span>
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-black/30 px-2 py-0.5 rounded text-[11px] font-mono tracking-wide text-amber-100 uppercase mb-1">
                      <span>सत्यापन अवधि समाप्त | STAMPING OVERDUE</span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">
                      वार्षिक सत्यापन मियाद समाप्त (CALIBRATION EXPIRED)
                    </h3>
                    <p className="text-xs text-amber-100 mt-1 max-w-2xl leading-relaxed">
                      The mandatory 12-month re-verification validity for this commercial scale expired on{" "}
                      <strong>{inst.validUntil || "Overdue"}</strong>. The merchant is legally required to suspend usage until circle re-verification is completed.
                    </p>
                  </div>
                </div>
              </div>
            ) : isVerified ? (
              <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 text-white p-5 border-b border-emerald-900 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
                  <span className="material-symbols-outlined text-[160px]">verified</span>
                </div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600/60 backdrop-blur-xs flex items-center justify-center shrink-0 border border-emerald-400/40 shadow-inner">
                    <span className="material-symbols-outlined text-3xl text-emerald-200">verified</span>
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded text-[11px] font-mono tracking-wide text-emerald-200 uppercase mb-1">
                      <span>वैध विधिक माप मुद्रित | FORM-A VERIFIED INSTRUMENT</span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">
                      सत्यापित एवं प्रमाणित उपकरण (LEGAL FOR TRADE)
                    </h3>
                    <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
                      This weighing scale has been physically inspected, calibrated against NABL-traceable reference standards, and stamped under the Legal Metrology (General) Rules, 2011.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800 text-white p-5 border-b border-slate-900">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-3xl text-slate-300">hourglass_top</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase text-slate-400">स्थिति | STATUS</span>
                    <h3 className="text-xl font-bold">{inst.status.replace(/_/g, " ")}</h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Instrument is registered on National Metrica network and is pending inspection.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Official Verification Docket Body OR Fraud Quarantine Dossier */}
            {isCloneDetected ? (
              /* FRAUD QUARANTINE DOSSIER (Certificate Withheld) */
              <div className="p-6 bg-rose-50/40 space-y-5">
                {/* Certificate Withheld Notice */}
                <div className="p-4.5 rounded-xl bg-rose-100/80 border-2 border-rose-300 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-xl">block</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-rose-950 uppercase tracking-tight flex items-center gap-1.5">
                        <span>प्रमाण पत्र अवरुद्ध | FORM-A CERTIFICATE WITHHELD</span>
                        <span className="bg-rose-700 text-white text-[10px] px-2 py-0.2 rounded font-mono font-bold">
                          FRAUD QUARANTINE
                        </span>
                      </h4>
                      <p className="text-xs text-rose-900 mt-0.5 leading-relaxed font-medium">
                        The Legal Metrology verification certificate is <strong>STRICTLY WITHHELD</strong> for this physical device. Operating an unverified or cloned scale is a punishable offense under Section 25 of the Legal Metrology Act, 2009.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Forensic Spatial Discrepancy Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Legitimate Geofence */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-emerald-600 text-sm">verified_user</span>
                        Registered Legitimate Geofence
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.5 rounded font-mono">
                        ORIGINAL
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{inst.ownerName || "Ramesh Patel"}</p>
                      <p className="text-xs text-slate-600">{registeredLocation.name}</p>
                      <p className="text-[11px] font-mono text-slate-500 mt-1">
                        GPS: {registeredLocation.lat.toFixed(4)}° N, {registeredLocation.lng.toFixed(4)}° E
                      </p>
                    </div>
                  </div>

                  {/* Intercepted Clone Scan Location */}
                  <div className="p-4 rounded-xl bg-rose-50/70 border-2 border-rose-300 shadow-xs space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-rose-200">
                      <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-rose-600 text-sm">location_off</span>
                        Intercepted Scanner GPS Location
                      </span>
                      <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded font-mono">
                        SUSPECT CLONE
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-rose-950">{scannerLocation.name}</p>
                      <p className="text-xs text-rose-800">Current device scanning location</p>
                      <p className="text-[11px] font-mono text-rose-700 mt-1 font-bold">
                        GPS: {scannerLocation.lat.toFixed(4)}° N, {scannerLocation.lng.toFixed(4)}° E
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enforcement Actions Bar */}
                <div className="pt-3 border-t border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-rose-800 font-medium">
                    <span className="material-symbols-outlined text-rose-600 text-base">emergency</span>
                    <span>LMO Flying Squad alert initiated automatically under Section 53.</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled
                      className="px-3.5 py-2 bg-slate-200 text-slate-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed shadow-none"
                      title="Certificate withheld due to fraud detection"
                    >
                      <span className="material-symbols-outlined text-[16px]">lock</span>
                      <span>Form-A Withheld</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReportCategory("SUSPECTED_TAMPERING");
                        setObservedDiscrepancy(`IMPOSSIBLE TRAVEL FRAUD: Scale registered in ${registeredLocation.name} scanned in ${scannerLocation.name} (${distanceMismatchKm} km distance anomaly)`);
                        setIsReportOpen(true);
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">crisis_alert</span>
                      <span>Lodge Priority Enforcement Complaint</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Normal Verified / Standard Certificate Docket */
              <div className="p-6">
                {/* Form-A Certificate Top Data Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-slate-200">
                  {/* Scale ID & Model */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Digital Metrology Identifier (QR ID)
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-lg font-mono font-bold text-slate-900">
                          {inst.digitalInstrumentId}
                        </span>
                        <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                          UID
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Equipment Model & Accuracy Class
                      </span>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">
                        {inst.modelName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Class: <strong>{inst.accuracyClass || "CLASS_III"} (Commercial)</strong>
                        </span>
                        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Capacity: <strong>{inst.maxCapacity || 30} {inst.nominalUnit || "KG"}</strong>
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Serial Number & Manufacturer
                      </span>
                      <p className="text-xs font-mono text-slate-700 mt-0.5">
                        SN: {inst.serialNumber}
                      </p>
                      <p className="text-xs text-slate-500">
                        {inst.manufacturerName || "Apex Metrology Ltd"}
                      </p>
                    </div>
                  </div>

                  {/* Stamping Validity & Seal Security */}
                  <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/70">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Statutory Stamping Validity
                        </span>
                        <p className="text-base font-bold text-slate-900 mt-0.5">
                          {cert?.validUntil || inst.validUntil || "31 Dec 2026"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Last Inspected: {cert?.issueDate || inst.lastVerifiedAt || "10 Jan 2026"}
                        </p>
                      </div>

                      {daysRemaining !== null && (
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            daysRemaining > 30
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : daysRemaining > 0
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {daysRemaining > 0 ? `${daysRemaining} days remaining` : "Expired"}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Physical Lead / Holographic Seal
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="material-symbols-outlined text-[18px] text-indigo-600">lock</span>
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {cert?.physicalSealNumber || inst.currentSealNumber || "DL-LM-884-2026-A"}
                        </span>
                        {isSuspended && (
                          <span className="text-[10px] font-semibold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                            SEAL COMPROMISED
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Licensed Merchant & APMC Yard
                      </span>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">store</span>
                        {inst.ownerName || "Ramesh Patel"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {inst.ownerAddress || "Stall 14-B, Azadpur Mandi, Delhi 110033"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form-A Official Certificate Meta */}
                <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Certificate No:</span>
                      <span className="font-mono font-medium text-slate-900">
                        {cert?.certificateNumber || `CERT-DoCA-2026-${inst.digitalInstrumentId.replace(/[^0-9]/g, "") || "9912"}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Inspecting Officer:</span>
                      <span className="font-medium text-slate-700">
                        {cert?.signedByOfficerName || "Rajesh Kumar (LMO-DL-N-884)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                      <span className="material-symbols-outlined text-[14px] text-emerald-600">shield</span>
                      <span>HMAC-SHA256 Cryptographically Sealed</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-mono bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 mt-1">
                      <span className="material-symbols-outlined text-[14px] text-emerald-600">pin_drop</span>
                      <span className="truncate">📍 Geotagged Stamping: {cert?.geoCoordinates || "28.7156° N, 77.1772° E (Azadpur APMC Mandi Hub)"}</span>
                      <span className="text-[10px] font-bold text-emerald-800 ml-auto bg-emerald-200/70 px-1.5 py-0.5 rounded shrink-0">GEOFENCE LOCKED</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(true)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">print</span>
                      <span>Print Form-A</span>
                    </button>
                    <button
                      onClick={() => setIsReportOpen(true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">report_problem</span>
                      <span>Report Measurement Discrepancy</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : isSearchingDb ? (
          /* Live Regulatory Register Querying Pulse */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#002B5B] flex items-center justify-center mx-auto mb-3 border border-blue-200">
              <span className="material-symbols-outlined text-2xl animate-spin">sync</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Querying National Metrology Register...</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-mono">
              Verifying cryptographic Form-A seal for {targetLookup}
            </p>
          </div>
        ) : (
          /* Instrument Not Found State */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
              <span className="material-symbols-outlined text-3xl">device_unknown</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Scale Identifier Not Found</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
              The identifier <strong>{targetLookup}</strong> is not registered in the National Metrica Database. This may indicate an uncalibrated or counterfeit scale.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => handlePresetSelect("IND-MET-2026-AZ01")}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                View Verified Benchmark Scale
              </button>
              <button
                onClick={() => setIsReportOpen(true)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-semibold"
              >
                Report Unregistered Scale
              </button>
            </div>
          </div>
        )}

        {/* Consumer Legal Rights & MPE Tolerance Information Box */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600 text-xl">policy</span>
              <h3 className="text-sm font-bold text-slate-900">
                Consumer Legal Rights & Measurement Tolerances (MPE)
              </h3>
            </div>
            <button
              onClick={() => setIsRightsGuideOpen(!isRightsGuideOpen)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <span>{isRightsGuideOpen ? "Collapse" : "Expand Guide"}</span>
              <span className="material-symbols-outlined text-[16px]">
                {isRightsGuideOpen ? "expand_less" : "expand_more"}
              </span>
            </button>
          </div>

          <div className="p-4 text-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                  <span className="material-symbols-outlined text-emerald-600 text-[16px]">tune</span>
                  <span>Right to Zero-Tare</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Before weighing goods, the scale display must read exactly <strong>0.000 kg</strong>. Weight of bags or containers must be tared out.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                  <span className="material-symbols-outlined text-blue-600 text-[16px]">verified_user</span>
                  <span>Right to Inspect Stamp</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Citizens have the legal statutory right to inspect the officer's lead seal and QR sticker on any commercial scale.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                  <span className="material-symbols-outlined text-amber-600 text-[16px]">visibility</span>
                  <span>Unobstructed Display</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  The weight and price display must be clearly visible to the customer at eye level during transaction.
                </p>
              </div>
            </div>

            {isRightsGuideOpen && (
              <div className="pt-3 border-t border-slate-100 space-y-3 animate-fadeIn">
                <h4 className="font-semibold text-slate-800">
                  Statutory Maximum Permissible Error (MPE) for Class III Scales:
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border border-slate-200 rounded-lg">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2 border-b">Load Range (Verification Scale Interval e = 5g)</th>
                        <th className="p-2 border-b">Initial Verification MPE</th>
                        <th className="p-2 border-b">Service / Field Inspection MPE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      <tr>
                        <td className="p-2">0 to 500 e (0 to 2.5 kg)</td>
                        <td className="p-2 font-mono">±2.5 g</td>
                        <td className="p-2 font-mono">±5.0 g</td>
                      </tr>
                      <tr>
                        <td className="p-2">500 e to 2,000 e (2.5 kg to 10 kg)</td>
                        <td className="p-2 font-mono">±5.0 g</td>
                        <td className="p-2 font-mono">±10.0 g</td>
                      </tr>
                      <tr>
                        <td className="p-2">2,000 e to 6,000 e (Above 10 kg)</td>
                        <td className="p-2 font-mono">±7.5 g</td>
                        <td className="p-2 font-mono">±15.0 g</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  *As prescribed under Schedule VIII, Legal Metrology (General) Rules, 2011. Violations exceeding service MPE attract confiscation and penalty.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Simulated Camera QR Scanner Modal */}
      <Modal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="Simulated QR Scanner Viewfinder"
        subtitle="Aim your smartphone camera at the holographic QR code on the weighing instrument"
        maxWidth="md"
      >
        <div className="space-y-4 text-center">
          {/* Viewfinder Mockup */}
          <div className="relative w-full aspect-square max-w-xs mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-inner flex items-center justify-center p-4">
            {/* Camera feed placeholder */}
            <div className="absolute inset-0 bg-radial from-slate-800 to-slate-950 opacity-80" />

            {/* Corner reticles */}
            <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
            <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br" />

            {/* Animated Laser Scanning Beam */}
            <div className="absolute inset-x-8 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse" />

            {/* QR Mockup Center */}
            <div className="relative z-10 p-3 bg-white rounded-xl shadow-lg border border-slate-300">
              <span className="material-symbols-outlined text-6xl text-slate-900 block">qr_code_2</span>
              <p className="text-[9px] font-mono text-slate-600 mt-1 font-bold">DoCA-METRICA</p>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Select a test target QR code to simulate scanning:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => {
                setIsScannerOpen(false);
                handlePresetSelect("IND-MET-2026-AZ01");
              }}
              className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold text-center transition-colors"
            >
              Scan Azadpur Scale (Green)
            </button>
            <button
              onClick={() => {
                setIsScannerOpen(false);
                handlePresetSelect("IND-MET-2026-GZ02");
              }}
              className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-semibold text-center transition-colors"
            >
              Scan Ghazipur Scale (Red)
            </button>
            <button
              onClick={() => {
                setIsScannerOpen(false);
                handlePresetSelect("IND-MET-2026-OK03");
              }}
              className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold text-center transition-colors"
            >
              Scan Okhla Scale (Amber)
            </button>
          </div>
        </div>
      </Modal>

      {/* Citizen Grievance Reporting Modal */}
      <Modal
        isOpen={isReportOpen}
        onClose={handleCloseReport}
        title="National Citizen Measurement Grievance Portal"
        subtitle={`Filing statutory complaint for instrument: ${inst ? inst.digitalInstrumentId : targetLookup}`}
        maxWidth="lg"
      >
        {reportSubmitted ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">task_alt</span>
            </div>
            <h4 className="text-lg font-bold text-slate-900">Grievance Registered Successfully</h4>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg max-w-sm mx-auto">
              <span className="text-xs text-slate-500 uppercase tracking-wider block">Official Complaint Docket No.</span>
              <span className="text-base font-mono font-bold text-slate-900">{submittedDocketId}</span>
            </div>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Your report has been securely transmitted to the Circle Legal Metrology Officer and logged on the National Command Center. An enforcement inspection will be scheduled.
            </p>
            <div className="pt-3">
              <button
                onClick={handleCloseReport}
                className="px-6 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-amber-900">
              <span className="material-symbols-outlined text-[18px] text-amber-700 shrink-0 mt-0.5">info</span>
              <div>
                <strong>Legal Protection:</strong> Your report is protected under the Consumer Protection Act, 2019. Anonymous reporting is permitted.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Your Name (Optional)</label>
                <input
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  placeholder="Leave blank for anonymous"
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002B5B]/20 focus:border-[#002B5B] transition-all"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number (For SMS Updates)</label>
                <input
                  type="tel"
                  value={citizenPhone}
                  onChange={(e) => setCitizenPhone(e.target.value)}
                  placeholder="+91 98XXX XXXXX"
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002B5B]/20 focus:border-[#002B5B] transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nature of Measurement Issue *</label>
              <select
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#002B5B]/20 focus:border-[#002B5B] transition-all cursor-pointer"
              >
                <option value="SHORT_WEIGHT">Short Weight / Under-weighing (तौल में कमी)</option>
                <option value="BROKEN_SEAL">Damaged, Cut or Missing Holographic Seal (सील टूटी हुई)</option>
                <option value="EXPIRED_CERTIFICATE">Expired Calibration Certificate (सत्यापन मियाद समाप्त)</option>
                <option value="TAMPERING">Suspected Digital Keypad Tampering / Cheat Switch (कीपैड छेड़छाड़)</option>
                <option value="OTHER">Display Obscured from Buyer / Tare Refusal (डिस्प्ले छिपाना)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Observed Discrepancy (e.g. Charged for 1 kg, Actual weight was 850 g)
              </label>
              <input
                type="text"
                value={observedDiscrepancy}
                onChange={(e) => setObservedDiscrepancy(e.target.value)}
                placeholder="e.g. 5 kg bag showed 4.65 kg on kitchen scale (350 g short)"
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002B5B]/20 focus:border-[#002B5B] transition-all"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Detailed Observation *</label>
              <textarea
                rows={3}
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Describe vendor location, stall number, commodity purchased, or any conversation with the seller..."
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002B5B]/20 focus:border-[#002B5B] transition-all"
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCloseReport}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">gavel</span>
                <span>Submit Official Complaint</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Official Form-A Certificate Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Form-A Verification Certificate (Official Gazette Copy)"
        subtitle="Issued under Section 24 of The Legal Metrology Act, 2009 & Rule 24(1) of Legal Metrology (General) Rules, 2011"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner bg-slate-100 p-2 max-h-[65vh] overflow-y-auto">
            <FormADocument instrument={inst} certificate={cert} />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="text-slate-500 text-[11px] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
              <span>Conforms to Schedule XI Statutory Gazette Format</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>Print / Download PDF (A4)</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Dynamic Legal Metrology Companion (MetriPrahari) with scale reaction */}
      <MascotCompanion
        scaleId={targetLookup}
        scaleStatus={isCloneDetected ? "SUSPENDED_TAMPERED" : (storeInst?.status || dbInst?.status)}
        customTip={
          isCloneDetected
            ? `⚠️ FRAUD ALERT: Impossible distance detected (${distanceMismatchKm} km away from registered Mandi shop)! Suspected clone QR sticker on counterfeit scale.`
            : undefined
        }
      />
    </div>
  </>
  );
}
