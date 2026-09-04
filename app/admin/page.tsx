"use client";

import React, { useState } from "react";
import { InstitutionalNavigation } from "@/components/navigation";
import { InstitutionalHeader } from "@/components/header";
import { useMetrica } from "@/lib/store";
import { VerificationApplication, Complaint } from "@/lib/types";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

export default function AdminCommandCenterPage() {
  const { applications, instruments, complaints, assignOfficer } = useMetrica();
  const toast = useToast();

  // Active view tab state: DASHBOARD | ASSIGNMENTS | FLAGS | COMPLAINTS | WORKLOAD
  const [activeTab, setActiveTab] = useState<"DASHBOARD" | "ASSIGNMENTS" | "FLAGS" | "COMPLAINTS" | "WORKLOAD">("DASHBOARD");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "HIGH_RISK" | "PENDING">("ALL");
  const [expandedWhyFlaggedId, setExpandedWhyFlaggedId] = useState<string | null>(null);

  // New Case Modal State
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [newCaseOwner, setNewCaseOwner] = useState("");
  const [newCaseCategory, setNewCaseCategory] = useState("Commercial Bench Scale");
  const [newCaseSerial, setNewCaseSerial] = useState("");

  // Assign Officer Modal
  const [selectedAppForAssign, setSelectedAppForAssign] = useState<VerificationApplication | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState("LMO Rajesh Kumar (North District)");
  const [scheduledDate, setScheduledDate] = useState("2026-09-10");
  const [scheduledSlot, setScheduledSlot] = useState("10:00 AM - 01:00 PM");

  const pendingCount = applications.filter((a) => a.status !== "PASSED_CERTIFIED").length;
  const highRiskCount = instruments.filter((i) => i.priorityFlag === "HIGH" || i.priorityFlag === "CRITICAL").length;
  const expiringCount = instruments.filter((i) => i.status === "EXPIRING_SOON" || i.status === "EXPIRED").length;
  const openComplaintsCount = complaints.filter((c) => c.status === "LOGGED").length;

  const filteredApps = applications.filter((app) => {
    const inst = instruments.find((i) => i.id === app.instrumentId);
    const matchesSearch =
      app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inst && inst.digitalInstrumentId.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeFilter === "HIGH_RISK") return inst?.priorityFlag === "HIGH" || inst?.priorityFlag === "CRITICAL";
    if (activeFilter === "PENDING") return app.status !== "PASSED_CERTIFIED" && app.status !== "SCHEDULED";
    return true;
  });

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForAssign) return;
    assignOfficer(selectedAppForAssign.id, "lmo-01", selectedOfficer, scheduledDate, scheduledSlot);
    toast.success(
      "Officer Assigned Successfully",
      `Application ${selectedAppForAssign.applicationNumber} assigned to ${selectedOfficer} for ${scheduledDate} (${scheduledSlot})`
    );
    setSelectedAppForAssign(null);
  };

  return (
    <div className="bg-surface h-full flex overflow-hidden">
      <InstitutionalNavigation activeSection={activeTab.toLowerCase()} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden md:ml-[260px] bg-background">
        {/* Universal Top Header */}
        <InstitutionalHeader title="Administrator Command Center" />

        {/* Production Executive Hero Tier */}
        <div className="px-4 lg:px-8 pt-5 pb-0 border-b border-outline-variant bg-surface shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold tracking-wide border border-secondary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  National Regulatory Oversight Active • Circle DL-01
                </span>
              </div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-on-surface tracking-tight">
                Command Center Oversight
              </h1>
              <p className="text-xs text-on-surface-variant mt-0.5 max-w-xl">
                Real-time statutory verification monitoring, anomaly triage, and field officer dispatch.
              </p>
            </div>

            {/* Primary Action Button (Clean right alignment) */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsNewCaseOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-container transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Case File
              </button>
            </div>
          </div>

          {/* Dedicated Tab Navigation Bar (Underline style, zero wrapping) */}
          <div className="flex items-center gap-2 sm:gap-6 border-t border-outline-variant/60 overflow-x-auto no-scrollbar pt-1">
            <button
              onClick={() => setActiveTab("DASHBOARD")}
              className={`pb-3 pt-2 text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === "DASHBOARD"
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">dashboard</span>
              Overview
            </button>

            <button
              onClick={() => setActiveTab("ASSIGNMENTS")}
              className={`pb-3 pt-2 text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === "ASSIGNMENTS"
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">assignment_ind</span>
              Assignment Queue
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-container font-mono text-on-surface">
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("FLAGS")}
              className={`pb-3 pt-2 text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === "FLAGS"
                  ? "border-error text-error"
                  : "border-transparent text-on-surface-variant hover:text-error"
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-error">flag</span>
              Priority Flags
              {highRiskCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-error text-white font-mono font-bold">
                  {highRiskCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("COMPLAINTS")}
              className={`pb-3 pt-2 text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === "COMPLAINTS"
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">report_problem</span>
              Citizen Complaints
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-container font-mono text-on-surface">
                {openComplaintsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("WORKLOAD")}
              className={`pb-3 pt-2 text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === "WORKLOAD"
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">group</span>
              Officer Workload
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
          {/* TAB 1: OVERVIEW & MASTER QUEUE */}
          {(activeTab === "DASHBOARD" || activeTab === "ASSIGNMENTS") && (
            <>
              {/* Executive KPI Stats Row (4 Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Card 1: Pending Assignments */}
                <div
                  onClick={() => setActiveTab("ASSIGNMENTS")}
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col shadow-sm cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Pending Assignments
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[18px]">assignment</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mt-auto">
                    <span className="font-display text-3xl font-extrabold text-on-surface">
                      {pendingCount}
                    </span>
                    <span className="text-xs font-medium text-on-surface-variant">cases</span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[11px] text-outline">
                    <span>Awaiting officer dispatch</span>
                    <span className="text-primary font-semibold group-hover:underline">Open Queue &rarr;</span>
                  </div>
                </div>

                {/* Card 2: High Priority Cases */}
                <div
                  onClick={() => setActiveTab("FLAGS")}
                  className="bg-surface-container-lowest border border-outline-variant border-l-4 border-l-error rounded-xl p-4 flex flex-col shadow-sm cursor-pointer hover:border-error/50 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-error uppercase tracking-wider">
                      High Priority Cases
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-error-container text-on-error-container flex items-center justify-center group-hover:bg-error group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[18px]">priority_high</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mt-auto">
                    <span className="font-display text-3xl font-extrabold text-error">
                      {highRiskCount}
                    </span>
                    <span className="text-xs font-medium text-on-surface-variant">require action</span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[11px] text-outline">
                    <span className="text-error font-medium">Critical Triage</span>
                    <span className="text-error font-semibold group-hover:underline">View Flags &rarr;</span>
                  </div>
                </div>

                {/* Card 3: Expiring This Week */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col shadow-sm hover:border-outline transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Expiring This Week
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-tertiary-container/15 text-tertiary-container flex items-center justify-center group-hover:bg-tertiary-container group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[18px]">event_busy</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mt-auto">
                    <span className="font-display text-3xl font-extrabold text-tertiary-container">
                      {expiringCount}
                    </span>
                    <span className="text-xs font-medium text-on-surface-variant">certificates</span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[11px] text-outline">
                    <span>Statutory 30-day window</span>
                    <span className="text-on-surface-variant font-medium">Auto-notified</span>
                  </div>
                </div>

                {/* Card 4: Open Complaints */}
                <div
                  onClick={() => setActiveTab("COMPLAINTS")}
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col shadow-sm cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Open Complaints
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[18px]">report</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mt-auto">
                    <span className="font-display text-3xl font-extrabold text-on-surface">
                      {openComplaintsCount}
                    </span>
                    <span className="text-xs font-medium text-on-surface-variant">active files</span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[11px] text-outline">
                    <span>From Public QR Scans</span>
                    <span className="text-primary font-semibold group-hover:underline">Read Feed &rarr;</span>
                  </div>
                </div>
              </div>

              {/* Data Dense Table Section */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-sm">
                <div className="p-md border-b border-outline-variant bg-surface-bright flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h3 className="font-headline-md text-base font-bold text-on-surface">
                    {activeTab === "ASSIGNMENTS" ? "Unassigned Application Queue" : "Master Regulatory Case Queue"}
                  </h3>
                  <div className="flex items-center gap-md w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                        search
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search ID or Owner..."
                        className="w-full pl-9 pr-4 py-1.5 border border-outline-variant rounded bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setActiveFilter("ALL")}
                        className={`px-2.5 py-1.5 border rounded text-xs transition-colors ${
                          activeFilter === "ALL" ? "bg-primary text-white font-medium" : "border-outline-variant text-primary"
                        }`}
                      >
                        All ({applications.length})
                      </button>
                      <button
                        onClick={() => setActiveFilter("PENDING")}
                        className={`px-2.5 py-1.5 border rounded text-xs transition-colors ${
                          activeFilter === "PENDING" ? "bg-primary text-white font-medium" : "border-outline-variant text-primary"
                        }`}
                      >
                        Pending ({pendingCount})
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {filteredApps.length === 0 ? (
                    <div className="p-12 text-center text-on-surface-variant">
                      <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-3 text-outline">
                        <span className="material-symbols-outlined text-2xl">inbox</span>
                      </div>
                      <h4 className="font-bold text-sm text-on-surface">Queue is currently empty</h4>
                      <p className="text-xs mt-1 mb-4 text-on-surface-variant max-w-sm mx-auto">
                        New applications submitted by instrument owners will appear here for administrative oversight.
                      </p>
                      <button
                        onClick={() => setIsNewCaseOpen(true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded text-xs font-semibold"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Create Case File
                      </button>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-surface-container-low border-b border-outline-variant">
                          <th className="py-3 px-md font-semibold text-on-surface-variant uppercase">Instrument ID</th>
                          <th className="py-3 px-md font-semibold text-on-surface-variant uppercase">Owner</th>
                          <th className="py-3 px-md font-semibold text-on-surface-variant uppercase">Status</th>
                          <th className="py-3 px-md font-semibold text-on-surface-variant uppercase">Risk Level</th>
                          <th className="py-3 px-md font-semibold text-on-surface-variant uppercase">Expiry Date</th>
                          <th className="py-3 px-md font-semibold text-on-surface-variant uppercase text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {filteredApps.map((app) => {
                          const inst = instruments.find((i) => i.id === app.instrumentId);
                          const isHighRisk = inst?.priorityFlag === "HIGH" || inst?.priorityFlag === "CRITICAL";

                          return (
                            <tr key={app.id} className="hover:bg-surface-container-low transition-colors">
                              <td className="py-3 px-md font-mono font-medium text-primary">
                                {inst ? inst.digitalInstrumentId : app.applicationNumber}
                                <span className="block text-[11px] text-on-surface-variant font-mono">
                                  SN: {app.instrumentSerial}
                                </span>
                              </td>
                              <td className="py-3 px-md">
                                <div className="font-medium text-on-surface">{app.applicantName}</div>
                                <div className="text-[11px] text-on-surface-variant">{app.jurisdictionCircle}</div>
                              </td>
                              <td className="py-3 px-md">
                                {app.status === "PASSED_CERTIFIED" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-medium text-[11px]">
                                    VALID
                                  </span>
                                ) : app.status === "SCHEDULED" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant font-medium text-[11px]">
                                    SCHEDULED
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant font-medium text-[11px]">
                                    PENDING
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-md">
                                {isHighRisk ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error-container text-on-error-container font-bold text-[11px]">
                                    CRITICAL
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-fixed-dim text-on-secondary-fixed font-medium text-[11px]">
                                    LOW
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-md text-on-surface-variant">
                                {inst?.validUntil || "Inspection Pending"}
                              </td>
                              <td className="py-3 px-md text-right">
                                {app.status === "SCHEDULED" ? (
                                  <span className="text-[11px] text-outline italic">Assigned</span>
                                ) : (
                                  <button
                                    onClick={() => setSelectedAppForAssign(app)}
                                    className="px-3 py-1 bg-primary text-white rounded text-xs font-semibold hover:bg-primary-container"
                                  >
                                    Assign
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: PRIORITY FLAGS */}
          {activeTab === "FLAGS" && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-error flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl">warning</span>
                    Priority Risk Flags & Suspicion Monitoring
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Instruments flagged with critical discrepancies, expired stamps, or repeat consumer complaints.
                  </p>
                </div>
              </div>

              {instruments.filter((i) => i.priorityFlag === "HIGH" || i.priorityFlag === "CRITICAL").length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl text-secondary mb-2">verified_user</span>
                  <div className="font-bold text-sm text-on-surface">No High Priority Anomalies</div>
                  <p className="text-xs mt-1">Zero instruments currently flagged as Critical or High risk in this circle.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {instruments
                    .filter((i) => i.priorityFlag === "HIGH" || i.priorityFlag === "CRITICAL")
                    .map((inst) => (
                      <div key={inst.id} className="border border-error/30 rounded-lg p-4 bg-error-container/10">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono font-bold text-primary text-sm">{inst.digitalInstrumentId}</span>
                            <span className="ml-2 text-xs text-on-surface-variant font-mono">SN: {inst.serialNumber}</span>
                            <div className="text-xs font-medium text-on-surface mt-1">{inst.modelName} • {inst.ownerName || "Unassigned"}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-error text-white text-[10px] font-bold">
                            RISK SCORE: {inst.riskScore}/100
                          </span>
                        </div>

                        {/* Explainable Diagnostics */}
                        <div className="mt-3 pt-3 border-t border-error/20 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div className="bg-surface p-2.5 rounded border border-outline-variant">
                            <span className="font-semibold text-error block">1. Calibration Expired</span>
                            <span className="text-[11px] text-on-surface-variant">Lapsed statutory grace period.</span>
                          </div>
                          <div className="bg-surface p-2.5 rounded border border-outline-variant">
                            <span className="font-semibold text-error block">2. Consumer Reports</span>
                            <span className="text-[11px] text-on-surface-variant">Active short-weight reports logged.</span>
                          </div>
                          <div className="bg-surface p-2.5 rounded border border-outline-variant">
                            <span className="font-semibold text-error block">3. Action Required</span>
                            <span className="text-[11px] text-on-surface-variant">Dispatch enforcement inspection.</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CITIZEN COMPLAINTS INTELLIGENCE */}
          {activeTab === "COMPLAINTS" && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">report_problem</span>
                    Citizen Suspicion & Measurement Reports Feed
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Aggregated grievance intelligence submitted by consumers scanning scale QR codes in the field.
                  </p>
                </div>
              </div>

              {complaints.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">thumb_up</span>
                  <div className="font-bold text-sm text-on-surface">No Open Consumer Complaints</div>
                  <p className="text-xs mt-1">No short-weight or tampering reports have been filed by citizens.</p>
                </div>
              ) : (
                <div className="divide-y divide-outline-variant border border-outline-variant rounded-lg overflow-hidden">
                  {complaints.map((c) => (
                    <div key={c.id} className="p-4 hover:bg-surface-container-low transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-bold text-[10px]">
                            {c.complaintType}
                          </span>
                          <span className="font-mono text-xs font-semibold text-primary">
                            Target Scale: {c.digitalInstrumentId || "UNKNOWN"}
                          </span>
                        </div>
                        <span className="text-[11px] text-outline">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface mt-1">{c.description}</p>
                      <div className="mt-3 flex gap-2">
                        <button className="px-2.5 py-1 bg-primary text-white rounded text-[11px] font-medium hover:bg-primary-container">
                          Dispatch LMO Raid
                        </button>
                        <button className="px-2.5 py-1 border border-outline text-on-surface rounded text-[11px] hover:bg-surface-container">
                          Dismiss Grievance
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: OFFICER WORKLOAD DISTRIBUTION */}
          {activeTab === "WORKLOAD" && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-base text-on-surface flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-xl">group</span>
                Legal Metrology Officer (LMO) Workload & Circle Capacity
              </h3>
              <p className="text-xs text-on-surface-variant mb-4">
                Monitor field inspector backlog and rebalance assignments across district circles.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-outline-variant rounded-lg p-4 bg-surface">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center">R</div>
                    <div>
                      <div className="font-bold text-xs text-on-surface">Rajesh Kumar</div>
                      <div className="text-[10px] text-outline">LMO • North District Circle</div>
                    </div>
                  </div>
                  <div className="text-xs flex justify-between py-1 border-t border-outline-variant">
                    <span className="text-on-surface-variant">Active Cases:</span>
                    <span className="font-bold text-primary">2 cases</span>
                  </div>
                  <div className="text-xs flex justify-between py-1">
                    <span className="text-on-surface-variant">Avg. Turnaround:</span>
                    <span className="font-medium text-secondary">1.4 days</span>
                  </div>
                  <button className="w-full mt-2 py-1 bg-surface-container-low border border-outline-variant text-[11px] rounded font-medium text-primary hover:bg-surface-container">
                    Assign Cases
                  </button>
                </div>

                <div className="border border-outline-variant rounded-lg p-4 bg-surface">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center">S</div>
                    <div>
                      <div className="font-bold text-xs text-on-surface">Sunita Sharma</div>
                      <div className="text-[10px] text-outline">LMO • Central District Circle</div>
                    </div>
                  </div>
                  <div className="text-xs flex justify-between py-1 border-t border-outline-variant">
                    <span className="text-on-surface-variant">Active Cases:</span>
                    <span className="font-bold text-primary">4 cases</span>
                  </div>
                  <div className="text-xs flex justify-between py-1">
                    <span className="text-on-surface-variant">Avg. Turnaround:</span>
                    <span className="font-medium text-secondary">2.1 days</span>
                  </div>
                  <button className="w-full mt-2 py-1 bg-surface-container-low border border-outline-variant text-[11px] rounded font-medium text-primary hover:bg-surface-container">
                    Assign Cases
                  </button>
                </div>

                <div className="border border-outline-variant rounded-lg p-4 bg-surface">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-tertiary text-white font-bold text-xs flex items-center justify-center">G</div>
                    <div>
                      <div className="font-bold text-xs text-on-surface">GATC Calibration Labs</div>
                      <div className="text-[10px] text-outline">Zone 1 Accredited Center</div>
                    </div>
                  </div>
                  <div className="text-xs flex justify-between py-1 border-t border-outline-variant">
                    <span className="text-on-surface-variant">Active Tests:</span>
                    <span className="font-bold text-primary">1 batch</span>
                  </div>
                  <div className="text-xs flex justify-between py-1">
                    <span className="text-on-surface-variant">Capacity:</span>
                    <span className="font-medium text-secondary">High (Available)</span>
                  </div>
                  <button className="w-full mt-2 py-1 bg-surface-container-low border border-outline-variant text-[11px] rounded font-medium text-primary hover:bg-surface-container">
                    Dispatch Lab Tests
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Assign LMO Modal */}
      <Modal
        isOpen={!!selectedAppForAssign}
        onClose={() => setSelectedAppForAssign(null)}
        title="Assign Legal Metrology Officer"
        subtitle={`Application: ${selectedAppForAssign?.applicationNumber} • Category: ${selectedAppForAssign?.instrumentCategory}`}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Select Legal Metrology Officer (LMO) / GATC
            </label>
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              className="w-full p-2.5 border border-outline-variant rounded bg-surface-container-lowest text-xs text-on-surface focus:border-primary outline-none"
            >
              <option value="LMO Rajesh Kumar (North District)">LMO Rajesh Kumar (North District — 2 pending cases)</option>
              <option value="LMO Sunita Sharma (Central Circle)">LMO Sunita Sharma (Central Circle — 4 pending cases)</option>
              <option value="GATC Precision Testing Labs (Zone 1)">GATC Precision Testing Labs (Zone 1)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Inspection Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full p-2.5 border border-outline-variant rounded bg-surface-container-lowest text-xs text-on-surface focus:border-primary outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Time Window Slot</label>
              <select
                value={scheduledSlot}
                onChange={(e) => setScheduledSlot(e.target.value)}
                className="w-full p-2.5 border border-outline-variant rounded bg-surface-container-lowest text-xs text-on-surface focus:border-primary outline-none"
              >
                <option value="10:00 AM - 01:00 PM">Morning (10:00 AM - 01:00 PM)</option>
                <option value="02:00 PM - 05:00 PM">Afternoon (02:00 PM - 05:00 PM)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedAppForAssign(null)}
              className="px-4 py-2 border border-outline text-on-surface rounded text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded text-xs font-semibold hover:bg-primary-container"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* New Case Modal */}
      <Modal
        isOpen={isNewCaseOpen}
        onClose={() => setIsNewCaseOpen(false)}
        title="Open Statutory Case File"
        subtitle="Initiate statutory case file for commercial weighing instrument"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.info(
              "Statutory Case File Initiated",
              `Regulatory case file registered for ${newCaseOwner} (Category: ${newCaseCategory})`
            );
            setIsNewCaseOpen(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Owner / Trading Entity</label>
            <input
              type="text"
              value={newCaseOwner}
              onChange={(e) => setNewCaseOwner(e.target.value)}
              placeholder="e.g. Metro Retail Logistics"
              className="w-full p-2.5 border border-outline-variant rounded bg-surface-container-lowest text-xs outline-none focus:border-primary"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Category</label>
              <select
                value={newCaseCategory}
                onChange={(e) => setNewCaseCategory(e.target.value)}
                className="w-full p-2.5 border border-outline-variant rounded bg-surface-container-lowest text-xs outline-none focus:border-primary"
              >
                <option value="Commercial Bench Scale">Commercial Bench Scale</option>
                <option value="Platform Scale">Platform Weighing Scale</option>
                <option value="Fuel Dispenser">Fuel Dispenser Unit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Stamped Serial</label>
              <input
                type="text"
                value={newCaseSerial}
                onChange={(e) => setNewCaseSerial(e.target.value)}
                placeholder="SN-8829-X"
                className="w-full p-2.5 border border-outline-variant rounded bg-surface-container-lowest text-xs font-mono outline-none focus:border-primary"
                required
              />
            </div>
          </div>
          <div className="pt-4 border-t border-outline-variant flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsNewCaseOpen(false)}
              className="px-4 py-2 border border-outline text-on-surface rounded text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded text-xs font-semibold hover:bg-primary-container"
            >
              Open Case File
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
