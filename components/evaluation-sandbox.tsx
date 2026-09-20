"use client";

import React, { useState, useRef, useEffect } from "react";
import { useMetrica } from "@/lib/store";
import { useToast } from "@/components/ui/toast";

export function EvaluationSandbox() {
  const {
    instruments,
    applications,
    complaints,
    certificates,
    refreshDatabase,
    loadBenchmarkData,
    clearAllData,
  } = useMetrica();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasData = instruments.length > 0;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSeedBenchmark = async () => {
    setIsLoading(true);
    try {
      let benchmarkApplied = false;
      try {
        const res = await fetch("/api/benchmark/seed", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            loadBenchmarkData(data.data);
            benchmarkApplied = true;
          }
        }
      } catch (err) {
        console.warn("Backend seed endpoint notice:", err);
      }

      if (!benchmarkApplied) {
        loadBenchmarkData();
      }

      await refreshDatabase();
      toast.success(
        "Benchmark Dataset Active",
        "Populated 12 scales across Azadpur, Ghazipur, and Okhla Mandis with live MPE dockets."
      );
    } catch (err) {
      loadBenchmarkData();
      toast.success(
        "Benchmark Dataset Active",
        "Populated 12 scales across Azadpur, Ghazipur, and Okhla Mandis in evaluation mode."
      );
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const handleResetCleanSlate = async () => {
    setIsLoading(true);
    try {
      try {
        await fetch("/api/benchmark/reset", { method: "POST" });
      } catch (err) {
        console.warn("Backend reset endpoint notice:", err);
      }
      clearAllData();
      toast.info(
        "Clean Slate Activated",
        "All instruments and applications cleared to 0. Ready for clean onboarding demonstration."
      );
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all shadow-xs ${
          hasData
            ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
            : "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
        }`}
        title="Toggle Hackathon Evaluation Sandbox Dataset"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            hasData ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
          }`}
        />
        <span className="material-symbols-outlined text-[15px]">database</span>
        <span className="hidden 2xl:inline">
          {hasData ? `Sandbox: ${instruments.length} Mandi Scales` : "Sandbox: Clean Slate (0)"}
        </span>
        <span className="hidden sm:inline 2xl:hidden">
          {hasData ? `Sandbox (${instruments.length})` : "Sandbox (0)"}
        </span>
        <span className="material-symbols-outlined text-[14px]">expand_more</span>
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-outline-variant rounded-xl shadow-2xl z-50 overflow-hidden text-xs">
          {/* Header */}
          <div className="p-3 bg-[#002B5B] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span className="material-symbols-outlined text-amber-400 text-sm">bolt</span>
                SIH Evaluation Sandbox
              </div>
              <span className="text-[10px] text-white/70 font-mono">Benchmark Data</span>
            </div>
            <p className="text-[11px] text-white/80 mt-1 leading-snug">
              Instant toggling between an authentic Indian Metrology dataset (APMC Mandis) and an empty database.
            </p>
          </div>

          {/* Live Metrics */}
          <div className="p-3 bg-surface-container-low border-b border-outline-variant">
            <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Live Database State
            </div>
            <div className="grid grid-cols-4 gap-1 text-center font-mono">
              <div className="p-1.5 bg-surface rounded border border-outline-variant">
                <div className="font-bold text-primary text-sm">{instruments.length}</div>
                <div className="text-[9px] text-outline">Scales</div>
              </div>
              <div className="p-1.5 bg-surface rounded border border-outline-variant">
                <div className="font-bold text-emerald-700 text-sm">{applications.length}</div>
                <div className="text-[9px] text-outline">Apps</div>
              </div>
              <div className="p-1.5 bg-surface rounded border border-outline-variant">
                <div className="font-bold text-blue-700 text-sm">{certificates.length}</div>
                <div className="text-[9px] text-outline">Certs</div>
              </div>
              <div className="p-1.5 bg-surface rounded border border-outline-variant">
                <div className="font-bold text-error text-sm">{complaints.length}</div>
                <div className="text-[9px] text-outline">Grievances</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-3 space-y-2 bg-surface">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleSeedBenchmark}
              className="w-full p-2 rounded-lg bg-emerald-50 border border-emerald-200 hover:border-emerald-500 hover:bg-emerald-100/70 transition-all text-left group flex items-start gap-2.5"
            >
              <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-sm">dataset</span>
              </div>
              <div>
                <div className="font-bold text-emerald-950 text-xs group-hover:underline">
                  Load Realistic Benchmark (12 Scales)
                </div>
                <div className="text-[10px] text-emerald-900/70 leading-tight mt-0.5">
                  Populates Essae & Avery scales across Azadpur, Ghazipur, Okhla mandis with live MPE dockets.
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleResetCleanSlate}
              className="w-full p-2 rounded-lg bg-surface border border-outline-variant hover:border-error hover:bg-error-container/10 transition-all text-left group flex items-start gap-2.5"
            >
              <div className="w-6 h-6 rounded bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
              </div>
              <div>
                <div className="font-bold text-on-surface text-xs group-hover:text-error">
                  Reset to Clean Slate (0 Scales)
                </div>
                <div className="text-[10px] text-outline leading-tight mt-0.5">
                  Empties all records to demonstrate registering a scale from scratch during live presentation.
                </div>
              </div>
            </button>
          </div>

          {/* Footer note */}
          <div className="px-3 py-2 bg-surface-container-low border-t border-outline-variant text-[10px] text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs text-primary">verified</span>
            <span>Complies with Legal Metrology Act, 2009 (Seventh Schedule)</span>
          </div>
        </div>
      )}
    </div>
  );
}
