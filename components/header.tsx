"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMetrica } from "@/lib/store";
import { UserRole } from "@/lib/types";
import { EvaluationSandbox } from "@/components/evaluation-sandbox";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function InstitutionalHeader({ title, subtitle }: HeaderProps) {
  const router = useRouter();
  const { currentUser, loginAs, logout, notifications, markNotificationRead, markAllNotificationsRead, instruments, applications } = useMetrica();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Dropdown states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isPortalsOpen, setIsPortalsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "larger">("normal");

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const portalsRef = useRef<HTMLDivElement>(null);

  const unreadNotifs = notifications.filter((n) => !n.read && (!n.targetRole || n.targetRole === currentUser.role));

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (portalsRef.current && !portalsRef.current.contains(e.target as Node)) {
        setIsPortalsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter search results
  const searchResults = searchQuery.trim().length > 1
    ? {
        instruments: instruments.filter(
          (i) =>
            i.digitalInstrumentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.modelName.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 4),
        applications: applications.filter(
          (a) =>
            a.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.applicantName.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 4),
      }
    : { instruments: [], applications: [] };

  const handlePersonaSwitch = (role: UserRole) => {
    loginAs(role);
    setIsProfileOpen(false);
    if (role === "ADMIN") router.push("/admin");
    else if (role === "LMO") router.push("/lmo");
    else if (role === "OWNER") router.push("/owner");
    else if (role === "MANUFACTURER") router.push("/manufacturer");
  };

  const handleSignOut = () => {
    logout();
    setIsProfileOpen(false);
    router.push("/login");
  };

  const portalsList = [
    {
      name: "Administrator Command Center",
      href: "/admin",
      desc: "Supervisory intelligence, queue triage, circle workload",
      roleReq: "ADMIN",
      icon: "dashboard",
    },
    {
      name: "Field Officer Inspection Docket",
      href: "/lmo",
      desc: "On-site verification, camera plate OCR, MPE calculator",
      roleReq: "LMO",
      icon: "checklist",
    },
    {
      name: "Commercial Merchant Workspace",
      href: "/owner",
      desc: "Scale inventory, verification application, certificate vault",
      roleReq: "OWNER",
      icon: "storefront",
    },
    {
      name: "Model Birth Registry (Manufacturer)",
      href: "/manufacturer",
      desc: "Central model approvals, batch digital ID minting",
      roleReq: "MANUFACTURER",
      icon: "precision_manufacturing",
    },
    {
      name: "Public Citizen QR Trust Page",
      href: "/qr/demo",
      desc: "Smartphone verification, trust seal, consumer grievances",
      roleReq: "PUBLIC",
      icon: "qr_code_scanner",
    },
  ];

  return (
    <>
      {/* TIER 0: National Identity Masthead */}
      <div className="bg-surface-container-lowest border-b border-outline-variant/60 hidden sm:block">
        {/* Tricolor Micro-Hairline Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

        <div className="px-4 lg:px-8 py-1 flex items-center justify-between text-[11px] text-on-surface-variant font-medium">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">भारत सरकार | Government of India</span>
            <span className="text-outline">•</span>
            <span>उपभोक्ता मामले विभाग | Department of Consumer Affairs</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border-r border-outline-variant pr-3">
              <button
                onClick={() => setFontSize("normal")}
                className={`px-1 rounded ${fontSize === "normal" ? "font-bold text-primary" : "text-outline"}`}
                title="Default Font Size"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize("large")}
                className={`px-1 rounded ${fontSize === "large" ? "font-bold text-primary" : "text-outline"}`}
                title="Medium Font Size"
              >
                A
              </button>
              <button
                onClick={() => setFontSize("larger")}
                className={`px-1 rounded ${fontSize === "larger" ? "font-bold text-primary" : "text-outline"}`}
                title="Large Font Size"
              >
                A+
              </button>
            </div>

            <span className="text-primary font-semibold cursor-pointer hover:underline">
              English | हिन्दी
            </span>
          </div>
        </div>
      </div>

      {/* TIER 1: Universal Institutional Navigation Header */}
      <header className="h-16 bg-surface border-b border-outline-variant px-3 sm:px-4 lg:px-6 flex items-center justify-between z-30 shrink-0 sticky top-0 shadow-xs">
        {/* Left: Breadcrumb & Portal Switcher Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          {/* Portal Switcher Dropdown */}
          <div className="relative shrink-0" ref={portalsRef}>
            <button
              onClick={() => setIsPortalsOpen(!isPortalsOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant rounded-lg text-xs font-semibold text-primary transition-colors"
              title="Switch Regulatory Portal"
            >
              <span className="material-symbols-outlined text-[18px]">apps</span>
              <span className="hidden sm:inline">Portals</span>
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>

            {/* Portal Switcher Drawer */}
            {isPortalsOpen && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-surface border border-outline-variant rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 bg-surface-container-low border-b border-outline-variant">
                  <h4 className="text-xs font-bold text-on-surface">National Metrica Portals</h4>
                  <p className="text-[11px] text-on-surface-variant">
                    Authorized workspaces under the Legal Metrology Act, 2009
                  </p>
                </div>
                <div className="p-2 divide-y divide-outline-variant/60">
                  {portalsList.map((portal) => (
                    <Link
                      key={portal.name}
                      href={portal.href}
                      onClick={() => setIsPortalsOpen(false)}
                      className="p-2.5 flex items-start gap-3 rounded-lg hover:bg-surface-container transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[18px]">{portal.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors flex items-center justify-between">
                          <span>{portal.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface-container font-mono text-outline">
                            {portal.roleReq}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                          {portal.desc}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Breadcrumb Hierarchy */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs min-w-0">
            <span className="font-semibold text-primary shrink-0">
              DoCA
            </span>
            <span className="material-symbols-outlined text-[14px] text-outline shrink-0">chevron_right</span>
            <span className="text-on-surface font-bold truncate max-w-[110px] md:max-w-[160px] 2xl:max-w-none">
              {title || "National Portal"}
            </span>
          </div>
        </div>

        {/* Center: Universal Search */}
        <div className="relative flex-1 min-w-0 max-w-xs mx-2 lg:mx-3 hidden md:block" ref={searchRef}>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search Scale ID, Serial, or Owner..."
              className="w-full pl-9 pr-10 py-1.5 bg-surface-container-low border border-outline-variant rounded-full text-xs text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all placeholder:text-outline"
            />
            <span className="absolute right-3 text-[10px] bg-surface border border-outline-variant rounded px-1.5 py-0.5 text-outline font-mono pointer-events-none">
              /
            </span>
          </div>

          {/* Search Dropdown Results */}
          {isSearchOpen && searchQuery.trim().length > 1 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-surface border border-outline-variant rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-2 border-b border-outline-variant bg-surface-container-low text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Registry Matches
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-outline-variant">
                {searchResults.instruments.length === 0 && searchResults.applications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-on-surface-variant">
                    No matching instruments or applications found
                  </div>
                ) : (
                  <>
                    {searchResults.instruments.map((inst) => (
                      <Link
                        key={inst.id}
                        href={`/qr/${inst.digitalInstrumentId}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="p-3 flex items-center justify-between hover:bg-surface-container-high transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-xs text-primary font-mono">{inst.digitalInstrumentId}</div>
                          <div className="text-[11px] text-on-surface-variant">{inst.modelName} • SN: {inst.serialNumber}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container font-medium text-on-surface">Scale</span>
                      </Link>
                    ))}
                    {searchResults.applications.map((app) => (
                      <Link
                        key={app.id}
                        href="/admin"
                        onClick={() => setIsSearchOpen(false)}
                        className="p-3 flex items-center justify-between hover:bg-surface-container-high transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-xs text-primary font-mono">{app.applicationNumber}</div>
                          <div className="text-[11px] text-on-surface-variant">{app.applicantName} • {app.jurisdictionCircle}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant font-medium">Application</span>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
          {/* Notifications Trigger */}
          <div className="relative shrink-0" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-1.5 sm:p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors relative"
              title="Official Notifications"
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">notifications</span>
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Drawer */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-outline-variant rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">notifications_active</span>
                    <span className="font-label-lg text-sm font-semibold text-on-surface">Regulatory Alerts</span>
                  </div>
                  {unreadNotifs.length > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-outline-variant">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-on-surface-variant">
                      No active alerts. All systems running normally.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3 text-xs transition-colors cursor-pointer ${
                          !n.read ? "bg-primary-fixed/20 hover:bg-primary-fixed/30" : "hover:bg-surface-container-low"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-semibold ${n.severity === "CRITICAL" ? "text-error" : "text-primary"}`}>
                            {n.title}
                          </span>
                          <span className="text-[10px] text-outline">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-on-surface-variant leading-tight">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SIH Evaluation Sandbox Toggle */}
          <div className="shrink-0">
            <EvaluationSandbox />
          </div>

          {/* Settings Trigger */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 sm:p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors hidden sm:inline-flex shrink-0"
            title="Jurisdiction & Portal Settings"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>

          {/* Official User Profile Pill */}
          <div className="relative shrink-0" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-1.5 sm:gap-2 pl-1.5 pr-2.5 py-1 bg-surface-container-low border border-outline-variant rounded-full hover:bg-surface-container-high transition-colors shrink-0"
            >
              <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-sm shrink-0">
                {currentUser.avatarLetter}
              </div>
              <div className="text-left hidden lg:block min-w-0">
                <div className="text-xs font-bold text-on-surface leading-tight truncate max-w-[80px] xl:max-w-[100px] 2xl:max-w-[130px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-outline leading-tight truncate">
                  {currentUser.role}
                </div>
              </div>
              <span className="material-symbols-outlined text-[16px] text-outline shrink-0">expand_more</span>
            </button>

            {/* Profile Dropdown with 1-Click Role Switcher */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-surface border border-outline-variant rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-4 bg-surface-container-low border-b border-outline-variant">
                  <div className="font-semibold text-sm text-on-surface">{currentUser.name}</div>
                  <div className="text-xs text-primary font-medium">{currentUser.designation}</div>
                  <div className="text-[11px] text-outline mt-1">{currentUser.jurisdictionCircle}</div>
                  {currentUser.officerBadgeId && (
                    <div className="mt-2 inline-block px-2 py-0.5 bg-surface border border-outline-variant rounded text-[10px] font-mono text-on-surface">
                      Badge: {currentUser.officerBadgeId}
                    </div>
                  )}
                </div>

                {/* Quick Persona Switcher for Evaluation */}
                <div className="p-3 border-b border-outline-variant bg-surface">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Switch Active Persona (Evaluation Mode)
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      onClick={() => handlePersonaSwitch("ADMIN")}
                      className={`p-2 rounded text-left border text-xs transition-colors ${
                        currentUser.role === "ADMIN" ? "bg-primary text-white font-bold border-primary" : "border-outline-variant hover:bg-surface-container"
                      }`}
                    >
                      <div className="font-medium">Controller</div>
                      <div className="text-[10px] opacity-80">DoCA Admin</div>
                    </button>

                    <button
                      onClick={() => handlePersonaSwitch("LMO")}
                      className={`p-2 rounded text-left border text-xs transition-colors ${
                        currentUser.role === "LMO" ? "bg-primary text-white font-bold border-primary" : "border-outline-variant hover:bg-surface-container"
                      }`}
                    >
                      <div className="font-medium">Inspector</div>
                      <div className="text-[10px] opacity-80">Field Officer</div>
                    </button>

                    <button
                      onClick={() => handlePersonaSwitch("OWNER")}
                      className={`p-2 rounded text-left border text-xs transition-colors ${
                        currentUser.role === "OWNER" ? "bg-primary text-white font-bold border-primary" : "border-outline-variant hover:bg-surface-container"
                      }`}
                    >
                      <div className="font-medium">Merchant</div>
                      <div className="text-[10px] opacity-80">Scale Licensee</div>
                    </button>

                    <button
                      onClick={() => handlePersonaSwitch("MANUFACTURER")}
                      className={`p-2 rounded text-left border text-xs transition-colors ${
                        currentUser.role === "MANUFACTURER" ? "bg-primary text-white font-bold border-primary" : "border-outline-variant hover:bg-surface-container"
                      }`}
                    >
                      <div className="font-medium">Manufacturer</div>
                      <div className="text-[10px] opacity-80">Apex Metrology</div>
                    </button>
                  </div>
                </div>

                <div className="p-2 bg-surface-container-low">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-error hover:bg-error-container/20 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    Sign Out to SSO Gateway
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/40 flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant mb-4">
              <h3 className="font-bold text-base text-on-surface">Portal & Jurisdiction Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-on-surface mb-1">Assigned Regulatory Jurisdiction</label>
                <div className="p-3 bg-surface-container-low border border-outline-variant rounded-lg font-medium text-on-surface">
                  {currentUser.jurisdictionCircle}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Statutory Verification Ruleset</label>
                <div className="p-3 bg-surface-container-low border border-outline-variant rounded-lg font-mono text-[11px] text-on-surface">
                  Legal Metrology (General) Rules, 2011 • Seventh Schedule (MPE Class III)
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
