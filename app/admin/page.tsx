"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { InstitutionalNavigation } from "@/components/navigation";
import { InstitutionalHeader } from "@/components/header";
import { useMetrica } from "@/lib/store";
import { VerificationApplication, Complaint, Instrument } from "@/lib/types";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

export default function AdminCommandCenterPage() {
  return (
    <Suspense fallback={
      <div className="bg-surface h-full flex items-center justify-center font-sans text-xs text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>Loading Administrative Command Center...</span>
        </div>
      </div>
    }>
      <AdminCommandCenterContent />
    </Suspense>
  );
}

function AdminCommandCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  const viewParam = searchParams.get("view");

  const {
    applications,
    instruments,
    complaints,
    assignOfficer,
    updateComplaintStatus,
    dispatchRaidForComplaint,
    updateInstrumentFlag,
  } = useMetrica();
  const toast = useToast();

  // Active view tab state: DASHBOARD | ASSIGNMENTS | FLAGS | COMPLAINTS | WORKLOAD
  const [activeTab, setActiveTab] = useState<"DASHBOARD" | "ASSIGNMENTS" | "FLAGS" | "COMPLAINTS" | "WORKLOAD">("DASHBOARD");

  // Sync tab with URL parameters from sidebar links
  useEffect(() => {
    if (filterParam === "HIGH_RISK") {
      setActiveTab("FLAGS");
    } else if (filterParam === "COMPLAINTS") {
      setActiveTab("COMPLAINTS");
    } else if (filterParam === "PENDING") {
      setActiveTab("ASSIGNMENTS");
    } else if (viewParam === "workload") {
      setActiveTab("WORKLOAD");
    }
  }, [filterParam, viewParam]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "HIGH_RISK" | "PENDING">("ALL");

  // Priority Flags Sub-Filter State
  const [flagFilter, setFlagFilter] = useState<"ALL" | "CRITICAL" | "HIGH" | "TAMPERED">("ALL");
  const [selectedInstForRaid, setSelectedInstForRaid] = useState<Instrument | null>(null);
  const [raidOfficer, setRaidOfficer] = useState("LMO Rajesh Kumar (North District)");
  const [raidDate, setRaidDate] = useState("2026-09-08");
  const [raidSlot, setRaidSlot] = useState("10:00 AM - 01:00 PM");
  const [raidNotes, setRaidNotes] = useState("");

  // Citizen Grievances State
  const [complaintFilter, setComplaintFilter] = useState<"ALL" | "LOGGED" | "ACTION_TAKEN_RAID" | "RESOLVED">("ALL");
  const [selectedComplaintForRaid, setSelectedComplaintForRaid] = useState<Complaint | null>(null);
  const [selectedComplaintForResolve, setSelectedComplaintForResolve] = useState<Complaint | null>(null);
  const [resolutionText, setResolutionText] = useState("");

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
  const criticalCount = instruments.filter((i) => i.priorityFlag === "CRITICAL").length;
  const tamperedCount = instruments.filter((i) => i.status === "SUSPENDED_TAMPERED").length;
  const expiringCount = instruments.filter((i) => i.status === "EXPIRING_SOON" || i.status === "EXPIRED").length;
  const openComplaintsCount = complaints.filter((c) => c.status === "LOGGED").length;
  const resolvedComplaintsCount = complaints.filter((c) => c.status === "RESOLVED" || c.status === "DISMISSED").length;

  // Circle Officers definition
  const CIRCLE_OFFICERS = [
    {
      id: "lmo-01",
      name: "Rajesh Kumar",
      designation: "LMO Grade-I",
      circle: "Delhi North District Circle",
      hub: "Azadpur Mandi & Jahangirpuri",
      avatar: "R",
      color: "bg-primary",
      turnaround: "1.4 days",
      kitId: "Standards Kit #DL-WS-04",
    },
    {
      id: "lmo-02",
      name: "Sunita Sharma",
      designation: "LMO Grade-I",
      circle: "Delhi Central District Circle",
      hub: "Chandni Chowk & Daryaganj",
      avatar: "S",
      color: "bg-emerald-700",
      turnaround: "1.8 days",
      kitId: "Standards Kit #DL-WS-02",
    },
    {
      id: "lmo-03",
      name: "Amitabh Roy",
      designation: "LMO Grade-II",
      circle: "Delhi East District Circle",
      hub: "Ghazipur Mandi & Mayur Vihar",
      avatar: "A",
      color: "bg-purple-700",
      turnaround: "2.1 days",
      kitId: "Standards Kit #DL-WS-09",
    },
    {
      id: "lmo-04",
      name: "Vikramaditya Rao",
      designation: "LMO Grade-II",
      circle: "Delhi South District Circle",
      hub: "Okhla Industrial & Mehrauli",
      avatar: "V",
      color: "bg-amber-700",
      turnaround: "1.6 days",
      kitId: "Standards Kit #DL-WS-07",
    },
  ];

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

  const filteredFlags = instruments
    .filter((i) => i.priorityFlag === "HIGH" || i.priorityFlag === "CRITICAL" || i.status === "SUSPENDED_TAMPERED")
    .filter((i) => {
      if (flagFilter === "CRITICAL") return i.priorityFlag === "CRITICAL";
      if (flagFilter === "HIGH") return i.priorityFlag === "HIGH";
      if (flagFilter === "TAMPERED") return i.status === "SUSPENDED_TAMPERED";
      return true;
    });

  const filteredComplaints = complaints.filter((c) => {
    if (complaintFilter === "LOGGED") return c.status === "LOGGED";
    if (complaintFilter === "ACTION_TAKEN_RAID") return c.status === "ACTION_TAKEN_RAID";
    if (complaintFilter === "RESOLVED") return c.status === "RESOLVED" || c.status === "DISMISSED";
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

  const handleDispatchPriorityRaid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstForRaid) return;

    // Create emergency enforcement verification case
    const raidApp = dispatchRaidForComplaint(
      "cmp-inst-" + selectedInstForRaid.id,
      "lmo-01",
      raidOfficer,
      raidDate,
      raidSlot,
      raidNotes || "Surprise priority inspection dispatched under Section 25. Risk Anomaly."
    );

    toast.error(
      "Surprise Enforcement Raid Dispatched",
      `Case ${raidApp.applicationNumber} assigned to ${raidOfficer}. Target scale ${selectedInstForRaid.digitalInstrumentId} flagged for emergency audit.`
    );
    setSelectedInstForRaid(null);
    setRaidNotes("");
  };

  const handleDispatchComplaintRaid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintForRaid) return;

    const raidApp = dispatchRaidForComplaint(
      selectedComplaintForRaid.id,
      "lmo-01",
      raidOfficer,
      raidDate,
      raidSlot,
      raidNotes || `Surprise inspection dispatched on citizen complaint ${selectedComplaintForRaid.id}.`
    );

    toast.success(
      "Surprise Raid Scheduled on Complaint",
      `Assigned to ${raidOfficer} for ${raidDate} (${raidSlot}). Complaint status updated to Action Taken.`
    );
    setSelectedComplaintForRaid(null);
    setRaidNotes("");
  };

  const handleResolveComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintForResolve) return;

    updateComplaintStatus(
      selectedComplaintForResolve.id,
      "RESOLVED",
      resolutionText || "Physical calibration and seal verification conducted. Scale verified within statutory limits."
    );

    toast.success(
      "Citizen Grievance Resolved",
      `Grievance ${selectedComplaintForResolve.id} marked as RESOLVED. Risk score de-escalated on target instrument.`
    );
    setSelectedComplaintForResolve(null);
    setResolutionText("");
  };

  return (
    <div className="bg-surface h-full flex overflow-hidden">
      {/* Dynamic Sidebar highlighting based on activeTab */}
      <InstitutionalNavigation activeSection={activeTab.toLowerCase()} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden md:ml-[260px] bg-background min-w-0">
        {/* Universal Top Header */}
        <InstitutionalHeader title="Administrator Command Center" />

        {/* Production Executive Hero Tier */}
        <div className="px-4 lg:px-8 pt-5 pb-0 border-b border-outline-variant bg-surface shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold tracking-wide border border-secondary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  National Regulatory Oversight Active • Central Directorate
                </span>
              </div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-on-surface tracking-tight">
                Command Center Oversight
              </h1>
              <p className="text-xs text-on-surface-variant mt-0.5 max-w-xl">
                Real-time statutory verification monitoring, anomaly triage, citizen grievance redressal, and officer capacity.
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

          {/* Dedicated Tab Navigation Bar */}
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
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-error text-white font-mono font-bold animate-pulse">
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
              Citizen Grievances
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

                {/* Card 3: Expiring Calibration */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col shadow-sm hover:border-outline transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Expiring Stamping
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[18px]">event_busy</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mt-auto">
                    <span className="font-display text-3xl font-extrabold text-amber-800">
                      {expiringCount}
                    </span>
                    <span className="text-xs font-medium text-on-surface-variant">certificates</span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[11px] text-outline">
                    <span>Statutory 30-day window</span>
                    <span className="text-on-surface-variant font-medium">Auto-notified</span>
                  </div>
                </div>

                {/* Card 4: Open Grievances */}
                <div
                  onClick={() => setActiveTab("COMPLAINTS")}
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col shadow-sm cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Citizen Grievances
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
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
                <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h3 className="font-bold text-sm text-on-surface">
                    {activeTab === "ASSIGNMENTS" ? "Unassigned Application Queue" : "Master Regulatory Case Queue"}
                  </h3>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                        search
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search ID or Owner..."
                        className="w-full pl-9 pr-4 py-1.5 border border-outline-variant rounded-lg bg-surface text-xs text-on-surface outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => setActiveFilter("ALL")}
                        className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors ${
                          activeFilter === "ALL" ? "bg-primary text-white border-primary" : "border-outline-variant text-on-surface hover:bg-surface"
                        }`}
                      >
                        All ({applications.length})
                      </button>
                      <button
                        onClick={() => setActiveFilter("PENDING")}
                        className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors ${
                          activeFilter === "PENDING" ? "bg-primary text-white border-primary" : "border-outline-variant text-on-surface hover:bg-surface"
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Create Case File
                      </button>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-surface-container-low border-b border-outline-variant">
                          <th className="py-3 px-4 font-semibold text-on-surface-variant uppercase text-[11px]">Instrument ID</th>
                          <th className="py-3 px-4 font-semibold text-on-surface-variant uppercase text-[11px]">Owner & Mandi</th>
                          <th className="py-3 px-4 font-semibold text-on-surface-variant uppercase text-[11px]">Status</th>
                          <th className="py-3 px-4 font-semibold text-on-surface-variant uppercase text-[11px]">Risk Level</th>
                          <th className="py-3 px-4 font-semibold text-on-surface-variant uppercase text-[11px]">Expiry Date</th>
                          <th className="py-3 px-4 font-semibold text-on-surface-variant uppercase text-[11px] text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {filteredApps.map((app) => {
                          const inst = instruments.find((i) => i.id === app.instrumentId);
                          const isHighRisk = inst?.priorityFlag === "HIGH" || inst?.priorityFlag === "CRITICAL";

                          return (
                            <tr key={app.id} className="hover:bg-surface-container-low transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-primary">
                                {inst ? inst.digitalInstrumentId : app.applicationNumber}
                                <span className="block text-[11px] text-on-surface-variant font-mono font-normal">
                                  SN: {app.instrumentSerial}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-on-surface">{app.applicantName}</div>
                                <div className="text-[11px] text-on-surface-variant">{app.jurisdictionCircle}</div>
                              </td>
                              <td className="py-3 px-4">
                                {app.status === "PASSED_CERTIFIED" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                    VERIFIED
                                  </span>
                                ) : app.status === "SCHEDULED" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                                    SCHEDULED
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                                    PENDING
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {isHighRisk ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-bold text-[10px]">
                                    CRITICAL
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium text-[10px] border border-emerald-200">
                                    LOW
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-on-surface-variant">
                                {inst?.validUntil || "Inspection Pending"}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {app.status === "SCHEDULED" ? (
                                  <span className="text-[11px] text-outline italic">Assigned ({app.assignedOfficerName?.split(" ")[0]})</span>
                                ) : (
                                  <button
                                    onClick={() => setSelectedAppForAssign(app)}
                                    className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-container transition-all active:scale-95"
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

          {/* TAB 2: PRIORITY FLAGS & ANOMALY TRIAGE */}
          {activeTab === "FLAGS" && (
            <div className="space-y-5">
              {/* Header & Metric Strip */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-base text-error flex items-center gap-2">
                      <span className="material-symbols-outlined text-2xl">warning</span>
                      National Anomaly Radar & Priority Risk Triage
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Statutory monitoring of instruments flagged with expired stamping, consumer complaints, or Section 25 suspicion.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    <button
                      onClick={() => setFlagFilter("ALL")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        flagFilter === "ALL" ? "bg-error text-white border-error shadow-xs" : "bg-surface text-on-surface border-outline-variant hover:bg-surface-container"
                      }`}
                    >
                      All Flags ({highRiskCount})
                    </button>
                    <button
                      onClick={() => setFlagFilter("CRITICAL")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        flagFilter === "CRITICAL" ? "bg-error text-white border-error shadow-xs" : "bg-surface text-on-surface border-outline-variant hover:bg-surface-container"
                      }`}
                    >
                      Critical ({criticalCount})
                    </button>
                    <button
                      onClick={() => setFlagFilter("TAMPERED")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        flagFilter === "TAMPERED" ? "bg-error text-white border-error shadow-xs" : "bg-surface text-on-surface border-outline-variant hover:bg-surface-container"
                      }`}
                    >
                      Section 25 Stop-Use ({tamperedCount})
                    </button>
                  </div>
                </div>

                {filteredFlags.length === 0 ? (
                  <div className="p-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl text-secondary mb-2">verified_user</span>
                    <div className="font-bold text-base text-on-surface">Zero Priority Anomalies in Active Filter</div>
                    <p className="text-xs mt-1 text-outline">All commercial weighing instruments comply with Rule 12 & Rule 16.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredFlags.map((inst) => {
                      const scaleComplaints = complaints.filter(
                        (c) => c.digitalInstrumentId === inst.digitalInstrumentId || c.instrumentId === inst.id
                      );
                      const isSuspended = inst.status === "SUSPENDED_TAMPERED";

                      return (
                        <div
                          key={inst.id}
                          className={`rounded-2xl p-5 border transition-all shadow-xs ${
                            isSuspended
                              ? "bg-red-50/70 border-red-300"
                              : inst.priorityFlag === "CRITICAL"
                              ? "bg-red-50/50 border-error/40"
                              : "bg-amber-50/40 border-amber-300"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-mono font-bold text-sm text-primary">
                                  {inst.digitalInstrumentId}
                                </span>
                                <span className="text-xs font-mono text-outline">SN: {inst.serialNumber}</span>
                                {isSuspended ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-error text-white font-bold tracking-wide uppercase">
                                    SECTION 25 STOP-USE NOTICE
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-bold tracking-wide uppercase">
                                    {inst.priorityFlag} PRIORITY
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-sm text-on-surface">
                                {inst.modelName} • {inst.ownerName || "Merchant Retailer"}
                              </h4>
                              <p className="text-xs text-on-surface-variant mt-0.5">
                                Trading Premises: {inst.ownerAddress || "APMC Mandi Yard"} ({inst.jurisdictionCircle})
                              </p>
                            </div>

                            {/* Risk Score Pill */}
                            <div className="text-right shrink-0">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-error text-white font-mono font-bold text-xs shadow-xs">
                                <span className="material-symbols-outlined text-[15px]">speed</span>
                                RISK: {inst.riskScore}/100
                              </div>
                              <span className="block text-[10px] text-outline mt-1 font-mono">
                                Max Cap: {inst.maxCapacity}kg (Class III)
                              </span>
                            </div>
                          </div>

                          {/* Dynamic Explainable Diagnostics */}
                          <div className="mt-4 pt-3 border-t border-outline-variant/60 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className="bg-surface p-3 rounded-xl border border-outline-variant">
                              <span className="font-bold text-error block text-[11px] uppercase tracking-wider mb-0.5">
                                1. Calibration Validity
                              </span>
                              <span className="text-on-surface-variant leading-snug">
                                {inst.validUntil ? `Valid until ${inst.validUntil} (Lapsed grace period).` : "No valid stamping recorded in national ledger."}
                              </span>
                            </div>

                            <div className="bg-surface p-3 rounded-xl border border-outline-variant">
                              <span className="font-bold text-error block text-[11px] uppercase tracking-wider mb-0.5">
                                2. Citizen Grievance History
                              </span>
                              <span className="text-on-surface-variant leading-snug">
                                {scaleComplaints.length > 0
                                  ? `${scaleComplaints.length} report(s) filed on short-weight or broken seal.`
                                  : "Zero citizen reports. Flagged via algorithmic expiry."}
                              </span>
                            </div>

                            <div className="bg-surface p-3 rounded-xl border border-outline-variant">
                              <span className="font-bold text-error block text-[11px] uppercase tracking-wider mb-0.5">
                                3. Statutory Action Order
                              </span>
                              <span className="text-on-surface-variant leading-snug">
                                {isSuspended
                                  ? "Stop-use enforced. Scale sealed pending physical raid."
                                  : "Surprise enforcement raid authorized under Rule 16."}
                              </span>
                            </div>
                          </div>

                          {/* Enforcement Actions Row */}
                          <div className="mt-4 pt-3 border-t border-outline-variant/60 flex flex-wrap items-center justify-between gap-2">
                            <Link
                              href={`/qr/${inst.digitalInstrumentId}`}
                              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[16px]">qr_code</span>
                              View Public Trust Badge &rarr;
                            </Link>

                            <div className="flex items-center gap-2">
                              {!isSuspended && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateInstrumentFlag(inst.id, "CRITICAL", "Section 25 Stop-Use Notice Issued by Directorate", true);
                                    toast.error(
                                      "Section 25 Stop-Use Notice Issued",
                                      `Instrument ${inst.digitalInstrumentId} locked. Digital QR Trust Seal revoked.`
                                    );
                                  }}
                                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-all flex items-center gap-1 shadow-2xs"
                                >
                                  <span className="material-symbols-outlined text-[16px]">block</span>
                                  Issue Stop-Use Notice
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedInstForRaid(inst)}
                                className="px-3.5 py-1.5 bg-error text-white rounded-lg text-xs font-bold hover:bg-error/90 transition-all flex items-center gap-1 shadow-xs active:scale-98"
                              >
                                <span className="material-symbols-outlined text-[16px]">local_police</span>
                                Dispatch Priority Raid
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  updateInstrumentFlag(inst.id, "LOW", "Flag cleared by Directorate Administrator", false);
                                  toast.success("Anomaly Cleared", `Instrument ${inst.digitalInstrumentId} downgraded to Low Risk.`);
                                }}
                                className="px-3 py-1.5 bg-surface border border-outline-variant text-on-surface rounded-lg text-xs font-semibold hover:bg-surface-container transition-all"
                              >
                                Clear Flag
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CITIZEN GRIEVANCES FEED */}
          {activeTab === "COMPLAINTS" && (
            <div className="space-y-5">
              {/* Grievances Metric Bar */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-2xl">support_agent</span>
                      Citizen Grievance Redressal Feed (INGRAM Integration)
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Live reports filed by consumers scanning scale QR codes at APMC mandis and retail stores.
                    </p>
                  </div>

                  {/* Grievance Filter Pills */}
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    <button
                      onClick={() => setComplaintFilter("ALL")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        complaintFilter === "ALL" ? "bg-primary text-white border-primary shadow-xs" : "bg-surface text-on-surface border-outline-variant hover:bg-surface-container"
                      }`}
                    >
                      All ({complaints.length})
                    </button>
                    <button
                      onClick={() => setComplaintFilter("LOGGED")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        complaintFilter === "LOGGED" ? "bg-primary text-white border-primary shadow-xs" : "bg-surface text-on-surface border-outline-variant hover:bg-surface-container"
                      }`}
                    >
                      Pending Action ({openComplaintsCount})
                    </button>
                    <button
                      onClick={() => setComplaintFilter("ACTION_TAKEN_RAID")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        complaintFilter === "ACTION_TAKEN_RAID" ? "bg-primary text-white border-primary shadow-xs" : "bg-surface text-on-surface border-outline-variant hover:bg-surface-container"
                      }`}
                    >
                      Raids Dispatched ({complaints.filter((c) => c.status === "ACTION_TAKEN_RAID").length})
                    </button>
                    <button
                      onClick={() => setComplaintFilter("RESOLVED")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        complaintFilter === "RESOLVED" ? "bg-primary text-white border-primary shadow-xs" : "bg-surface text-on-surface border-outline-variant hover:bg-surface-container"
                      }`}
                    >
                      Resolved ({resolvedComplaintsCount})
                    </button>
                  </div>
                </div>

                {filteredComplaints.length === 0 ? (
                  <div className="p-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl text-outline mb-2">thumb_up</span>
                    <div className="font-bold text-base text-on-surface">No Grievances in this Filter</div>
                    <p className="text-xs mt-1 text-outline">No consumer measurement reports match the selected state.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {filteredComplaints.map((c) => {
                      const targetInst = instruments.find(
                        (i) => i.digitalInstrumentId === c.digitalInstrumentId || i.id === c.instrumentId
                      );

                      return (
                        <div
                          key={c.id}
                          className="bg-surface border border-outline-variant rounded-2xl p-4 sm:p-5 hover:border-primary/40 transition-all shadow-xs"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-bold text-[10px] tracking-wide uppercase">
                                {c.complaintType.replace(/_/g, " ")}
                              </span>

                              {c.status === "LOGGED" ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                                  PENDING TRIAGE
                                </span>
                              ) : c.status === "ACTION_TAKEN_RAID" ? (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold text-[10px] flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                  SURPRISE RAID DISPATCHED
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                  RESOLVED & CLOSED
                                </span>
                              )}

                              <span className="text-[11px] text-outline font-mono">
                                ID: {c.id}
                              </span>
                            </div>

                            <span className="text-[11px] text-outline">
                              {new Date(c.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="bg-surface-container-low rounded-xl p-3.5 border border-outline-variant/60 my-2 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-on-surface">
                                Target: <span className="font-mono text-primary font-bold">{c.digitalInstrumentId || "IND-MET-2026-DEL"}</span>
                                {targetInst ? ` (${targetInst.modelName} • ${targetInst.ownerName})` : ""}
                              </span>
                              <Link
                                href={`/qr/${c.digitalInstrumentId}`}
                                className="text-[11px] text-primary hover:underline font-semibold"
                              >
                                View QR &rarr;
                              </Link>
                            </div>
                            <p className="text-on-surface leading-relaxed text-xs">
                              &ldquo;{c.description}&rdquo;
                            </p>
                            {c.resolutionNotes && (
                              <div className="mt-2 pt-2 border-t border-outline-variant/50 text-emerald-800 text-[11px] bg-emerald-50/60 p-2 rounded-lg">
                                <strong>Directorate Resolution:</strong> {c.resolutionNotes}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                            {c.status === "LOGGED" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setSelectedComplaintForRaid(c)}
                                  className="px-3.5 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-xs active:scale-98"
                                >
                                  <span className="material-symbols-outlined text-[16px]">local_police</span>
                                  Dispatch LMO Raid
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedComplaintForResolve(c)}
                                  className="px-3.5 py-1.5 bg-secondary text-white rounded-lg text-xs font-bold hover:bg-secondary/90 transition-all flex items-center gap-1 shadow-xs"
                                >
                                  <span className="material-symbols-outlined text-[16px]">task_alt</span>
                                  Resolve Grievance
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    updateComplaintStatus(c.id, "DISMISSED", "Dismissed after initial triage: No statutory infraction found.");
                                    toast.info("Grievance Dismissed", `Complaint ${c.id} marked as dismissed.`);
                                  }}
                                  className="px-3 py-1.5 bg-surface border border-outline-variant text-on-surface rounded-lg text-xs font-medium hover:bg-surface-container"
                                >
                                  Dismiss
                                </button>
                              </>
                            )}

                            {c.status === "ACTION_TAKEN_RAID" && (
                              <button
                                type="button"
                                onClick={() => setSelectedComplaintForResolve(c)}
                                className="px-3.5 py-1.5 bg-secondary text-white rounded-lg text-xs font-bold hover:bg-secondary/90 transition-all flex items-center gap-1 shadow-xs"
                              >
                                <span className="material-symbols-outlined text-[16px]">task_alt</span>
                                Mark Inspection Complete & Resolve
                              </button>
                            )}

                            {c.status === "RESOLVED" && (
                              <span className="text-[11px] font-bold text-secondary flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                Investigation Closed
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DISTRICT OFFICER WORKLOAD CAPACITY */}
          {activeTab === "WORKLOAD" && (
            <div className="space-y-5">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-2xl">group</span>
                      District Legal Metrology Officer (LMO) Workload & Capacity Rebalancing
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Real-time inspector caseload distribution across APMC mandis, testing circles, and working standards kits.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {CIRCLE_OFFICERS.map((officer) => {
                    const assignedOfficerCases = applications.filter(
                      (a) => a.assignedOfficerName?.includes(officer.name) || a.assignedOfficerId === officer.id
                    );
                    const activeCasesCount = assignedOfficerCases.filter(
                      (a) => a.status === "SCHEDULED" || a.status === "IN_PROGRESS"
                    ).length;
                    const completedCount = assignedOfficerCases.filter(
                      (a) => a.status === "PASSED_CERTIFIED"
                    ).length;

                    // Capacity load status
                    const capacityPercent = Math.min(100, Math.round((activeCasesCount / 6) * 100));
                    const isOverloaded = activeCasesCount >= 5;

                    return (
                      <div
                        key={officer.id}
                        className="bg-surface border border-outline-variant rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-all"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-9 h-9 rounded-xl ${officer.color} text-white font-bold text-sm flex items-center justify-center shadow-xs`}>
                                {officer.avatar}
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-on-surface">{officer.name}</h4>
                                <span className="text-[10px] text-outline font-medium">{officer.designation}</span>
                              </div>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              isOverloaded ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {isOverloaded ? "High Load" : "Available"}
                            </span>
                          </div>

                          <div className="text-[11px] text-on-surface-variant bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/60 mb-3 space-y-1">
                            <div><strong>Jurisdiction:</strong> {officer.circle}</div>
                            <div className="text-[10px] text-outline truncate"><strong>Primary Mandi:</strong> {officer.hub}</div>
                            <div className="text-[10px] text-secondary font-mono"><strong>Traceable Kit:</strong> {officer.kitId}</div>
                          </div>

                          {/* Caseload Metrics */}
                          <div className="space-y-2 text-xs mb-3">
                            <div className="flex justify-between items-baseline">
                              <span className="text-on-surface-variant text-[11px]">Active Docket:</span>
                              <span className="font-mono font-bold text-primary text-sm">{activeCasesCount} cases</span>
                            </div>

                            <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden border border-outline-variant/40">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isOverloaded ? "bg-error" : activeCasesCount >= 3 ? "bg-primary" : "bg-secondary"
                                }`}
                                style={{ width: `${Math.max(15, capacityPercent)}%` }}
                              />
                            </div>

                            <div className="flex justify-between text-[10px] text-outline pt-1">
                              <span>Completed: {completedCount} scales</span>
                              <span>Avg Turnaround: {officer.turnaround}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-outline-variant flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOfficer(`LMO ${officer.name} (${officer.circle.split(" ")[1]})`);
                              const unassigned = applications.find((a) => a.status !== "SCHEDULED" && a.status !== "PASSED_CERTIFIED");
                              if (unassigned) {
                                setSelectedAppForAssign(unassigned);
                              } else {
                                toast.info("No Unassigned Cases", "All pending applications in the queue are currently assigned.");
                              }
                            }}
                            className="flex-1 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-container transition-all text-center shadow-2xs"
                          >
                            Assign Docket
                          </button>

                          <Link
                            href="/lmo"
                            className="px-2.5 py-1.5 bg-surface-container-low border border-outline-variant text-on-surface text-xs font-semibold rounded-lg hover:bg-surface-container flex items-center justify-center"
                            title="Open Officer Workspace"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Priority Raid Dispatch Modal (From Anomaly Radar) */}
      {selectedInstForRaid && (
        <Modal
          isOpen={!!selectedInstForRaid}
          onClose={() => setSelectedInstForRaid(null)}
          title="Dispatch Surprise Enforcement Raid"
          subtitle={`Target: ${selectedInstForRaid.digitalInstrumentId} • Owner: ${selectedInstForRaid.ownerName || "Merchant"}`}
        >
          <form onSubmit={handleDispatchPriorityRaid} className="space-y-4 text-xs">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-[11px] leading-snug">
              <strong>Statutory Warning (Legal Metrology Act, 2009 • Section 25):</strong> Dispatches an unscheduled emergency raid team to seize or test suspicious measuring instruments with priority forensic logging.
            </div>

            <div>
              <label className="block font-bold text-on-surface mb-1">Assigned Circle Officer</label>
              <select
                value={raidOfficer}
                onChange={(e) => setRaidOfficer(e.target.value)}
                className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface font-semibold text-xs outline-none focus:border-primary"
              >
                <option value="LMO Rajesh Kumar (North District)">LMO Rajesh Kumar (North District — Azadpur Mandi)</option>
                <option value="LMO Sunita Sharma (Central Circle)">LMO Sunita Sharma (Central Circle — Chandni Chowk)</option>
                <option value="LMO Amitabh Roy (East District)">LMO Amitabh Roy (East District — Ghazipur Mandi)</option>
                <option value="LMO Vikramaditya Rao (South District)">LMO Vikramaditya Rao (South District — Okhla Mandi)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-on-surface mb-1">Raid Date</label>
                <input
                  type="date"
                  value={raidDate}
                  onChange={(e) => setRaidDate(e.target.value)}
                  className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface font-semibold text-xs outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-1">Surprise Slot</label>
                <select
                  value={raidSlot}
                  onChange={(e) => setRaidSlot(e.target.value)}
                  className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface font-semibold text-xs outline-none focus:border-primary"
                >
                  <option value="10:00 AM - 01:00 PM">Morning Raid (10:00 AM)</option>
                  <option value="02:00 PM - 05:00 PM">Afternoon Raid (02:00 PM)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-on-surface mb-1">Enforcement Instructions</label>
              <input
                type="text"
                value={raidNotes}
                onChange={(e) => setRaidNotes(e.target.value)}
                placeholder="e.g. Test with 10kg Class M1 standard weight, check lead seal wire number..."
                className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="pt-3 border-t border-outline-variant flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedInstForRaid(null)}
                className="px-4 py-2 border border-outline-variant rounded-lg font-semibold hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-error text-white rounded-lg font-bold hover:bg-error/90 shadow-xs"
              >
                Authorize & Dispatch Raid
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Complaint Raid Dispatch Modal (From Grievances Feed) */}
      {selectedComplaintForRaid && (
        <Modal
          isOpen={!!selectedComplaintForRaid}
          onClose={() => setSelectedComplaintForRaid(null)}
          title="Dispatch Raid on Citizen Grievance"
          subtitle={`Grievance ID: ${selectedComplaintForRaid.id} • Target Scale: ${selectedComplaintForRaid.digitalInstrumentId || "Mandi Scale"}`}
        >
          <form onSubmit={handleDispatchComplaintRaid} className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-snug">
              <strong>Consumer Grievance:</strong> &ldquo;{selectedComplaintForRaid.description}&rdquo;
            </div>

            <div>
              <label className="block font-bold text-on-surface mb-1">Assigned Inspector</label>
              <select
                value={raidOfficer}
                onChange={(e) => setRaidOfficer(e.target.value)}
                className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface font-semibold text-xs outline-none focus:border-primary"
              >
                <option value="LMO Rajesh Kumar (North District)">LMO Rajesh Kumar (North District — Azadpur Mandi)</option>
                <option value="LMO Sunita Sharma (Central Circle)">LMO Sunita Sharma (Central Circle — Chandni Chowk)</option>
                <option value="LMO Amitabh Roy (East District)">LMO Amitabh Roy (East District — Ghazipur Mandi)</option>
                <option value="LMO Vikramaditya Rao (South District)">LMO Vikramaditya Rao (South District — Okhla Mandi)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-on-surface mb-1">Scheduled Date</label>
                <input
                  type="date"
                  value={raidDate}
                  onChange={(e) => setRaidDate(e.target.value)}
                  className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface font-semibold text-xs outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-1">Time Slot</label>
                <select
                  value={raidSlot}
                  onChange={(e) => setRaidSlot(e.target.value)}
                  className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface font-semibold text-xs outline-none focus:border-primary"
                >
                  <option value="10:00 AM - 01:00 PM">Morning (10:00 AM - 01:00 PM)</option>
                  <option value="02:00 PM - 05:00 PM">Afternoon (02:00 PM - 05:00 PM)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedComplaintForRaid(null)}
                className="px-4 py-2 border border-outline-variant rounded-lg font-semibold hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-container shadow-xs"
              >
                Dispatch Raid
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Complaint Resolution Modal */}
      {selectedComplaintForResolve && (
        <Modal
          isOpen={!!selectedComplaintForResolve}
          onClose={() => setSelectedComplaintForResolve(null)}
          title="Resolve & Close Citizen Grievance"
          subtitle={`Grievance: ${selectedComplaintForResolve.id} • Category: ${selectedComplaintForResolve.complaintType}`}
        >
          <form onSubmit={handleResolveComplaint} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-on-surface mb-1">Official Inspection Findings & Resolution</label>
              <textarea
                rows={3}
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="e.g. Physical calibration conducted on site by LMO Rajesh Kumar. Scale passed MPE tolerance test (deviation 0.002kg). Hologram seal renewed..."
                className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface text-xs outline-none focus:border-primary resize-none"
                required
              />
            </div>

            <div className="pt-3 border-t border-outline-variant flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedComplaintForResolve(null)}
                className="px-4 py-2 border border-outline-variant rounded-lg font-semibold hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-secondary text-white rounded-lg font-bold hover:bg-secondary/90 shadow-xs"
              >
                Commit Official Resolution
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Standard Application Assignment Modal */}
      {selectedAppForAssign && (
        <Modal
          isOpen={!!selectedAppForAssign}
          onClose={() => setSelectedAppForAssign(null)}
          title="Assign Legal Metrology Officer"
          subtitle={`Application: ${selectedAppForAssign.applicationNumber} • Category: ${selectedAppForAssign.instrumentCategory}`}
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-on-surface mb-1">
                Select Legal Metrology Officer (LMO)
              </label>
              <select
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
                className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface font-semibold text-xs text-on-surface focus:border-primary outline-none"
              >
                <option value="LMO Rajesh Kumar (North District)">LMO Rajesh Kumar (North District — Azadpur Mandi)</option>
                <option value="LMO Sunita Sharma (Central Circle)">LMO Sunita Sharma (Central Circle — Chandni Chowk)</option>
                <option value="LMO Amitabh Roy (East District)">LMO Amitabh Roy (East District — Ghazipur Mandi)</option>
                <option value="LMO Vikramaditya Rao (South District)">LMO Vikramaditya Rao (South District — Okhla Mandi)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-on-surface mb-1">Inspection Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface font-semibold text-xs text-on-surface focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-1">Time Window Slot</label>
                <select
                  value={scheduledSlot}
                  onChange={(e) => setScheduledSlot(e.target.value)}
                  className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface font-semibold text-xs text-on-surface focus:border-primary outline-none"
                >
                  <option value="10:00 AM - 01:00 PM">Morning (10:00 AM - 01:00 PM)</option>
                  <option value="02:00 PM - 05:00 PM">Afternoon (02:00 PM - 05:00 PM)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedAppForAssign(null)}
                className="px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-semibold hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-container shadow-xs"
              >
                Confirm Assignment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* New Case Modal */}
      {isNewCaseOpen && (
        <Modal
          isOpen={isNewCaseOpen}
          onClose={() => setIsNewCaseOpen(false)}
          title="Open Statutory Case File"
          subtitle="Initiate regulatory case file for commercial weighing instrument"
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
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block font-bold text-on-surface mb-1">Owner / Trading Entity</label>
              <input
                type="text"
                value={newCaseOwner}
                onChange={(e) => setNewCaseOwner(e.target.value)}
                placeholder="e.g. Metro Retail Logistics"
                className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface text-xs outline-none focus:border-primary"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-on-surface mb-1">Category</label>
                <select
                  value={newCaseCategory}
                  onChange={(e) => setNewCaseCategory(e.target.value)}
                  className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface text-xs outline-none focus:border-primary"
                >
                  <option value="Commercial Bench Scale">Commercial Bench Scale</option>
                  <option value="Platform Scale">Platform Weighing Scale</option>
                  <option value="Fuel Dispenser">Fuel Dispenser Unit</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-1">Stamped Serial</label>
                <input
                  type="text"
                  value={newCaseSerial}
                  onChange={(e) => setNewCaseSerial(e.target.value)}
                  placeholder="SN-8829-X"
                  className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface text-xs font-mono outline-none focus:border-primary"
                  required
                />
              </div>
            </div>
            <div className="pt-3 border-t border-outline-variant flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewCaseOpen(false)}
                className="px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-semibold hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-container shadow-xs"
              >
                Open Case File
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
