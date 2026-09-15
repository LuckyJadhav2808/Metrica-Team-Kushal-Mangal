"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMetrica } from "@/lib/store";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/lib/i18n";
import { MascotCompanion } from "@/components/mascot-companion";

export default function LandingPage() {
  const router = useRouter();
  const { instruments, complaints } = useMetrica();
  const { language, setLanguage, fontScale, zoomIn, zoomOut, zoomReset, t } = useI18n();

  // Search & Navigation state
  const [searchQuery, setSearchQuery] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRightsGuideOpen, setIsRightsGuideOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Compute live national metrics from store
  const totalScales = instruments.length > 0 ? instruments.length : 1420;
  const verifiedCount = instruments.filter(
    (i) => i.status === "VERIFIED_ACTIVE" && i.priorityFlag !== "CRITICAL"
  ).length;
  const complianceRate =
    instruments.length > 0
      ? Math.round((verifiedCount / instruments.length) * 100)
      : 96;
  const loggedComplaints = complaints.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    router.push(`/qr/${encodeURIComponent(query)}`);
  };

  const handleQuickLookup = (id: string) => {
    router.push(`/qr/${encodeURIComponent(id)}`);
  };

  // WebRTC Camera initialization for live QR scanning
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else {
        setCameraError("Camera access not supported on this browser/environment.");
      }
    } catch (err: any) {
      setCameraError(
        err?.message || "Camera permission denied or camera device unavailable."
      );
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const handleCloseScanner = () => {
    stopCamera();
    setIsScannerOpen(false);
  };

  // Continuous real-time BarcodeDetector scanning loop on video feed
  React.useEffect(() => {
    let animationFrameId: number;
    let detector: any = null;

    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      } catch (e) {
        console.warn("BarcodeDetector initialization notice:", e);
      }
    }

    const scanFrame = async () => {
      if (isCameraActive && videoRef.current && detector && videoRef.current.readyState === 4) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const raw = barcodes[0].rawValue;
            if (raw) {
              const match = raw.match(/qr\/([A-Za-z0-9-_]+)/) || [null, raw];
              const extractedId = match[1] || raw.trim();
              stopCamera();
              setIsScannerOpen(false);
              router.push(`/qr/${encodeURIComponent(extractedId)}`);
              return;
            }
          }
        } catch {}
      }
      if (isCameraActive) {
        animationFrameId = requestAnimationFrame(scanFrame);
      }
    };

    if (isCameraActive) {
      animationFrameId = requestAnimationFrame(scanFrame);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isCameraActive, router]);

  // Image upload QR detection
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        const img = new (window as any).Image();
        img.src = URL.createObjectURL(file);
        await img.decode();
        const barcodes = await detector.detect(img);
        if (barcodes && barcodes.length > 0) {
          const raw = barcodes[0].rawValue;
          const match = raw.match(/qr\/([A-Za-z0-9-_]+)/) || [null, raw];
          const extractedId = match[1] || raw.trim();
          handleCloseScanner();
          router.push(`/qr/${encodeURIComponent(extractedId)}`);
          return;
        } else {
          setCameraError("No QR code detected in this image. Try capturing a closer photo of the sticker.");
        }
      } catch (err: any) {
        setCameraError("Could not decode image: " + err.message);
      }
    } else {
      setCameraError("Native BarcodeDetector not supported in this browser. Please use search or 1-click test dockets.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-amber-100 selection:text-amber-900">
      {/* 1. National Sovereign Tricolor Strip */}
      <div className="h-1.5 w-full flex shrink-0">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* Sovereign National Accessibility & Language Bar */}
      <div className="bg-slate-100 border-b border-slate-200/80 text-[11px] text-slate-600 px-4 sm:px-6 lg:px-8 py-1 flex items-center justify-between font-medium">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-[#002B5B]">भारत सरकार | Government of India</span>
          <span className="text-slate-400">•</span>
          <span className="hidden sm:inline">उपभोक्ता मामले विभाग | Department of Consumer Affairs</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Accessibility Font Size Resizer (A- | A | A+) */}
          <div className="flex items-center gap-1 border-r border-slate-300 pr-3">
            <button
              type="button"
              onClick={zoomOut}
              disabled={fontScale <= 70}
              className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                fontScale < 100
                  ? "font-extrabold text-[#002B5B] bg-blue-100 ring-1 ring-blue-300"
                  : "text-slate-600 hover:text-slate-900"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title={`Zoom Out / Reduce Font Size (Current: ${fontScale}%)`}
            >
              A-
            </button>
            <button
              type="button"
              onClick={zoomReset}
              className={`px-1.5 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                fontScale === 100
                  ? "font-extrabold text-[#002B5B] bg-blue-100 ring-1 ring-blue-300"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title={`Reset Font Size (Current: ${fontScale}%)`}
            >
              A {fontScale !== 100 && <span className="text-[9px] font-mono">({fontScale}%)</span>}
            </button>
            <button
              type="button"
              onClick={zoomIn}
              disabled={fontScale >= 160}
              className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                fontScale > 100
                  ? "font-extrabold text-[#002B5B] bg-blue-100 ring-1 ring-blue-300"
                  : "text-slate-600 hover:text-slate-900"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title={`Zoom In / Enlarge Font Size (Current: ${fontScale}%)`}
            >
              A+
            </button>
          </div>

          {/* Bilingual Language Switcher (English | हिन्दी) */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                language === "en"
                  ? "font-bold text-[#002B5B] bg-blue-100 underline decoration-[#002B5B] decoration-2"
                  : "text-slate-600 hover:text-slate-900 hover:underline"
              }`}
              title="Switch interface to English"
            >
              English
            </button>
            <span className="text-slate-400">|</span>
            <button
              type="button"
              onClick={() => setLanguage("hi")}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                language === "hi"
                  ? "font-bold text-[#002B5B] bg-blue-100 underline decoration-[#002B5B] decoration-2"
                  : "text-slate-600 hover:text-slate-900 hover:underline"
              }`}
              title="मंच को हिन्दी में बदलें"
            >
              हिन्दी
            </button>
          </div>
        </div>
      </div>

      {/* 2. Sovereign National Masthead */}
      <header className="bg-[#002B5B] text-white border-b border-blue-900/60 sticky top-0 z-40 shadow-md shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Official Emblem & Metrica Branding */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/10 p-1 flex items-center justify-center border border-white/20 shrink-0 shadow-inner">
              <Image
                alt="Government of India Emblem"
                className="w-full h-full object-contain"
                src="/logo.png"
                width={44}
                height={44}
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-wider uppercase font-extrabold text-[#FF9933] bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  भारत सरकार | GOVT OF INDIA
                </span>
                <span className="text-[11px] text-blue-200 hidden md:inline font-medium">
                  उपभोक्ता मामले, खाद्य और सार्वजनिक वितरण मंत्रालय
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Metrica <span className="font-light text-blue-200 text-xs sm:text-sm">| e-Parapakhya</span>
                </h1>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold hidden sm:inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  National Trust Grid Active
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Departmental Gateway */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsRightsGuideOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-200 hover:text-white hover:bg-white/10 border border-white/10 transition-colors hidden sm:flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              Consumer Rights
            </button>

            <a
              href="tel:1915"
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 transition-colors flex items-center gap-1"
              title="National Consumer Helpline"
            >
              <span className="material-symbols-outlined text-[16px]">support_agent</span>
              <span className="hidden xs:inline">NCH 1915</span>
            </a>

            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 shadow-sm border border-blue-400/30 transition-all flex items-center gap-1.5 group"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-300">admin_panel_settings</span>
              <span>Officer & Merchant Sign In</span>
              <span className="group-hover:translate-x-0.5 transition-transform text-white/70">&rarr;</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 3. Citizen Hero & Instant Verification Hub */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#002B5B] via-[#0A3A6F] to-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 shrink-0">
        {/* Background Subtle Patterns */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-32 -bottom-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          {/* Statutory Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-amber-300 mb-5 shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-[#FF9933]">verified_user</span>
            <span>Legal Metrology Act, 2009 • Section 24 Public Verification Gateway</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight sm:leading-snug">
            Every Gram Matters. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-emerald-300">
              Verify Any Commercial Scale in India.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-blue-100/85 max-w-2xl mx-auto leading-relaxed">
            Zero login required for citizens. Instant server-side verification of official calibration stamps,
            holographic seals, and permissible measurement tolerances for Mandis, Groceries, Petrol Pumps & Jewellers.
          </p>

          {/* Citizen Verification Console Box */}
          <div className="mt-8 max-w-2xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl border border-white/30 text-slate-900 text-left">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#002B5B]">search</span>
                  Digital Instrument ID / Serial Lookup
                </label>
                <p className="text-[11px] text-slate-500">
                  Search by plate serial number, QR identifier, or verification certificate number
                </p>
              </div>

              {/* Instant Camera QR Scanner Trigger */}
              <button
                type="button"
                id="btn-landing-scanner"
                onClick={() => {
                  setIsScannerOpen(true);
                  startCamera();
                }}
                className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                <span>Scan Scale QR Code</span>
              </button>
            </div>

            {/* Live Search Form */}
            <form onSubmit={handleSearch} className="mt-3.5 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">barcode_scanner</span>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. IND-MET-2026-AZ01 or DL-SCALE-001"
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm font-medium border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002B5B]/30 focus:border-[#002B5B] transition-all font-mono"
                />
              </div>
              <button
                type="submit"
                id="btn-verify-submit"
                className="px-6 py-3 bg-[#002B5B] hover:bg-blue-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Verify Scale Now</span>
              </button>
            </form>

            {/* Quick-Fill Mandi Presets for Evaluators */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-amber-600">bolt</span>
                  Evaluator 1-Click Verification Dockets:
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Click to test live statuses</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLookup("IND-MET-2026-AZ01")}
                  className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 group-hover:underline">
                      🟢 Azadpur Mandi
                    </span>
                    <span className="text-[9px] font-bold bg-emerald-200 text-emerald-800 px-1 rounded">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                    IND-MET-2026-AZ01 • Counter Scale
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLookup("IND-MET-2026-JW01")}
                  className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 group-hover:underline">
                      🟢 Chandni Chowk
                    </span>
                    <span className="text-[9px] font-bold bg-blue-200 text-blue-800 px-1 rounded">
                      CLASS II
                    </span>
                  </div>
                  <div className="text-[10px] text-blue-700 font-mono mt-0.5">
                    IND-MET-2026-JW01 • Gold Balance
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLookup("IND-MET-2026-AZ02")}
                  className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 group-hover:underline">
                      🔴 Tampered Yard Scale
                    </span>
                    <span className="text-[9px] font-bold bg-rose-200 text-rose-800 px-1 rounded">
                      SUSPENDED
                    </span>
                  </div>
                  <div className="text-[10px] text-rose-700 font-mono mt-0.5">
                    IND-MET-2026-AZ02 • Broken Seal
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Live National Regulatory Grid Metrics */}
      <section className="bg-white border-y border-slate-200 py-6 px-4 sm:px-6 lg:px-8 shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="p-3 border-r last:border-0 border-slate-100">
              <div className="text-2xl sm:text-3xl font-black text-[#002B5B]">
                {totalScales.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                Monitored Instruments
              </div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                ● Live Central Registry
              </div>
            </div>

            <div className="p-3 border-r last:border-0 border-slate-100">
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                {complianceRate}%
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                Stamping Compliance
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                Within Legal MPE Limit
              </div>
            </div>

            <div className="p-3 border-r last:border-0 border-slate-100">
              <div className="text-2xl sm:text-3xl font-black text-indigo-600">
                4 Circles
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                Enforcement Districts
              </div>
              <div className="text-[10px] text-indigo-500 font-medium mt-0.5">
                Delhi, Mumbai, Bengaluru
              </div>
            </div>

            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black text-amber-600">
                {loggedComplaints} Logged
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                Citizen Grievances
              </div>
              <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                100% Triage & LMO Raids
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Four Pillars of Citizen Consumer Protection */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto shrink-0 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#002B5B] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
            Statutory Public Safeguards
          </span>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-3">
            How Metrica Protects Every Consumer
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Under the Legal Metrology Act, 2009, all commercial transactions involving weight or measure
            must strictly adhere to statutory standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Pillar 1 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-3.5">
              <span className="material-symbols-outlined text-2xl">qr_code_2</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Dynamic Holographic QR</h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Unlike fake printed stickers, Metrica QRs query the national ledger in real-time, instantly
              revealing if a scale is valid, expired, or suspended.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mb-3.5">
              <span className="material-symbols-outlined text-2xl">straighten</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">MPE Tolerance Transparency</h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Full visibility into Maximum Permissible Error tolerances. For a standard Class III 10kg vegetable
              scale, variation cannot exceed ±5 grams.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center mb-3.5">
              <span className="material-symbols-outlined text-2xl">gavel</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Digital Form-A Certificate</h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              View official government verification certificates signed by state Legal Metrology Officers,
              complete with HMAC-SHA256 cryptographic seal hashes.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mb-3.5">
              <span className="material-symbols-outlined text-2xl">campaign</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Instant Grievance Redressal</h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Shoppers can report short-weighting or broken lead seals in 30 seconds. Reports feed directly into
              the District Controller&apos;s urgent raid queue.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Step-by-Step Consumer Journey */}
      <section className="bg-slate-100/80 border-y border-slate-200 py-12 px-4 sm:px-6 lg:px-8 shrink-0">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              How to Verify a Scale at Any Market
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Follow these three simple steps when shopping at Mandis, Supermarkets, or Jewellers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-[#002B5B] text-white font-black text-sm flex items-center justify-center mb-3">
                1
              </div>
              <h4 className="text-sm font-bold text-slate-900">Locate the Hologram Sticker</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Check the side or front plate of the weighing machine for the green holographic Metrica
                statutory stamping badge and lead wire seal.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-[#002B5B] text-white font-black text-sm flex items-center justify-center mb-3">
                2
              </div>
              <h4 className="text-sm font-bold text-slate-900">Scan with Any Mobile Camera</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Open your smartphone camera or click the &quot;Scan Scale QR Code&quot; button above. No app
                installation or login registration is needed.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-[#002B5B] text-white font-black text-sm flex items-center justify-center mb-3">
                3
              </div>
              <h4 className="text-sm font-bold text-slate-900">Check Green Stamp or Report</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Confirm the scale is 🟢 VERIFIED ACTIVE. If you observe weight cheating or an unverified scale,
                click &quot;File Consumer Grievance&quot; immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Institutional Stakeholder Gateway (Officers & Merchants) */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto shrink-0 w-full">
        <div className="bg-gradient-to-br from-[#002B5B] to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-blue-900 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-[10px] font-bold uppercase tracking-wider border border-blue-400/20">
              <span className="material-symbols-outlined text-[13px]">lock</span>
              Departmental & Merchant Access
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              Are you an Enforcement Officer or Commercial Merchant?
            </h3>
            <p className="text-xs text-blue-100/80 leading-relaxed">
              Authorized personnel can access the Central Command Center, Field Verification Dockets,
              or Commercial Scale Inventory workspaces through the unified gateway.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
            <Link
              href="/login"
              className="px-5 py-3 rounded-xl bg-white text-[#002B5B] hover:bg-blue-50 font-bold text-xs shadow-md transition-all text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              Access Institutional Gateway &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Official Government Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs py-10 px-4 sm:px-6 lg:px-8 mt-auto shrink-0">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold mb-2 text-sm">
              <span className="material-symbols-outlined text-amber-400 text-lg">balance</span>
              Metrica Regulatory Grid
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Online Verification & Intelligent Lifecycle Management System for Weighing and Measuring Instruments.
              SIH 2026 Problem Statement ID: 26036.
            </p>
          </div>

          <div>
            <h5 className="text-white font-semibold text-xs mb-2.5 uppercase tracking-wider">
              Department Details
            </h5>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li>Department of Consumer Affairs (DoCA)</li>
              <li>Ministry of Consumer Affairs, Food & Public Distribution</li>
              <li>Krishi Bhawan, New Delhi - 110001</li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold text-xs mb-2.5 uppercase tracking-wider">
              Statutory Framework
            </h5>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li>The Legal Metrology Act, 2009</li>
              <li>The Legal Metrology (General) Rules, 2011</li>
              <li>MPE Tolerance Schedules (Class I, II, III, IV)</li>
              <li>Consumer Protection Act, 2019</li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold text-xs mb-2.5 uppercase tracking-wider">
              Citizen Helplines
            </h5>
            <div className="space-y-2 text-[11px]">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-amber-400 font-bold">National Consumer Helpline</div>
                <div className="text-white text-sm font-mono font-bold mt-0.5">Toll-Free: 1915</div>
                <div className="text-[10px] text-slate-500">Available 24x7 across all states</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            © 2026 Department of Consumer Affairs, Government of India. Designed for National SIH 2026.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/qr/IND-MET-2026-AZ01" className="hover:text-slate-300 transition-colors">
              Public QR Verification
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:text-slate-300 transition-colors">
              Department Portal
            </Link>
          </div>
        </div>
      </footer>

      {/* MODAL 1: LIVE QR CAMERA / SIMULATOR */}
      <Modal
        isOpen={isScannerOpen}
        onClose={handleCloseScanner}
        title="Live QR Scanner & Instrument Verification"
      >
        <div className="space-y-4">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900">
            <div className="flex items-center gap-2 font-bold mb-1">
              <span className="material-symbols-outlined text-[18px] text-purple-700">qr_code_scanner</span>
              Point Camera at Scale QR Sticker
            </div>
            <p className="text-[11px] text-purple-800/80">
              Align the physical holographic QR code inside the camera viewfinder. The digital twin certificate
              will open automatically.
            </p>
          </div>

          {/* Video / Camera Viewfinder */}
          <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {isCameraActive && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            {/* Scanner Crosshair Reticle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-purple-400 border-dashed rounded-xl relative">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-purple-400 shadow-[0_0_8px_#a855f7] animate-bounce" />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-purple-200 font-mono bg-purple-950/20">
                  SCANNING STAMP
                </div>
              </div>
            </div>

            {cameraError && (
              <div className="absolute inset-x-4 bottom-4 p-2 bg-rose-950/90 border border-rose-600/50 rounded-lg text-[11px] text-rose-200 text-center">
                {cameraError}
              </div>
            )}
          </div>

          {/* Camera Upload & Detection Status */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Continuous Live Video QR Detection Active</span>
            </div>
            <label className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer border border-slate-300 text-[11px] flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-[15px]">upload_file</span>
              <span>Upload QR Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Evaluator 1-Click Simulated Scans */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Evaluator Test QR Targets (Instant Camera Simulation):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  handleCloseScanner();
                  router.push("/qr/IND-MET-2026-AZ01");
                }}
                className="p-2.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-left transition-colors flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="font-bold text-[11px]">Azadpur Mandi Scale #1</div>
                  <div className="text-[10px] text-emerald-700 font-mono">IND-MET-2026-AZ01</div>
                </div>
                <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-bold self-start mt-1">
                  🟢 VERIFIED
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCloseScanner();
                  router.push("/qr/IND-MET-2026-GZ02");
                }}
                className="p-2.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-950 text-left transition-colors flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="font-bold text-[11px]">Ghazipur Yard Scale #2</div>
                  <div className="text-[10px] text-rose-700 font-mono">IND-MET-2026-GZ02</div>
                </div>
                <span className="text-[9px] bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded font-bold self-start mt-1">
                  🔴 TAMPERED
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCloseScanner();
                  router.push("/qr/IND-MET-2026-OK03");
                }}
                className="p-2.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 text-left transition-colors flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="font-bold text-[11px]">Okhla Platform Scale #3</div>
                  <div className="text-[10px] text-amber-700 font-mono">IND-MET-2026-OK03</div>
                </div>
                <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold self-start mt-1">
                  🟡 EXPIRED
                </span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: CONSUMER RIGHTS & STATUTORY TOLERANCES */}
      <Modal
        isOpen={isRightsGuideOpen}
        onClose={() => setIsRightsGuideOpen(false)}
        title="Know Your Statutory Consumer Rights"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="font-bold text-blue-900 text-sm mb-1">The Legal Metrology Act, 2009</h4>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Under Section 24, every weighing or measuring instrument used in any transaction must be verified
              and stamped before use. Using an unverified or tampered instrument is a punishable offence.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Statutory Maximum Permissible Error (MPE) Limits
            </h5>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-[11px]">
              <div className="grid grid-cols-3 bg-slate-100 font-bold p-2 text-slate-800 border-b border-slate-200">
                <span>Scale Class</span>
                <span>Typical Application</span>
                <span>Maximum Allowed Error</span>
              </div>
              <div className="grid grid-cols-3 p-2 border-b border-slate-100">
                <span className="font-semibold text-slate-900">Class III (Medium)</span>
                <span>Mandi & Grocery Counter Scales</span>
                <span className="font-mono text-emerald-700">±5 g at 10 kg</span>
              </div>
              <div className="grid grid-cols-3 p-2 border-b border-slate-100">
                <span className="font-semibold text-slate-900">Class II (High)</span>
                <span>Jewellery & Gold Balances</span>
                <span className="font-mono text-emerald-700">±0.05 g at 1 kg</span>
              </div>
              <div className="grid grid-cols-3 p-2">
                <span className="font-semibold text-slate-900">Class I (Special)</span>
                <span>Pharmaceutical & Micro Balances</span>
                <span className="font-mono text-emerald-700">±1 mg at 100 g</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
              <span className="material-symbols-outlined text-[16px] text-amber-700">warning</span>
              Signs of Potential Tampering
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-900/90">
              <li>Lead wire seal missing, cut, or dangling loosely from the calibration screw.</li>
              <li>Scale display does not show stable &quot;0.000&quot; before placing goods.</li>
              <li>Verification certificate date has expired or does not match the QR lookup.</li>
              <li>Holographic sticker has been peeled or scraped.</li>
            </ul>
          </div>

          <div className="text-right pt-2">
            <button
              onClick={() => setIsRightsGuideOpen(false)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs"
            >
              Understood
            </button>
          </div>
        </div>
      </Modal>

      {/* Legal Metrology Companion Mascot (MetriPrahari) */}
      <MascotCompanion />
    </div>
  );
}
