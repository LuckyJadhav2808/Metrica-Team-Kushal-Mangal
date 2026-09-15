"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMetrica, GOVERNMENT_PERSONAS } from "@/lib/store";
import { UserRole } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: number | string;
  badgeColor?: string;
}

interface NavProps {
  activeSection?: string;
  role?: UserRole;
}

export function InstitutionalNavigation({ activeSection, role: propRole }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const { currentUser, loginAs, instruments, applications, complaints, certificates, logout } = useMetrica();
  const { language, setLanguage, fontScale, zoomIn, zoomOut, zoomReset } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

  const handlePersonaSwitch = async (role: UserRole) => {
    setIsProfileSheetOpen(false);
    setMobileMenuOpen(false);
    await loginAs(role);
    if (role === "ADMIN") {
      router.push("/admin");
      toast.info("Persona Switched", "Active role: Controller (DoCA Admin)");
    } else if (role === "LMO") {
      router.push("/lmo");
      toast.info("Persona Switched", "Active role: Field Inspection Officer (LMO)");
    } else if (role === "OWNER") {
      router.push("/owner");
      toast.info("Persona Switched", "Active role: Commercial Scale Licensee (Merchant)");
    } else if (role === "MANUFACTURER") {
      router.push("/manufacturer");
      toast.info("Persona Switched", "Active role: OEM Manufacturer");
    }
  };

  const handleSignOut = () => {
    setIsProfileSheetOpen(false);
    setMobileMenuOpen(false);
    logout();
    toast.info("Signed Out", "You have signed out of your session.");
    router.push("/login");
  };

  // Determine effective navigation role:
  // 1. Explicit prop if passed
  // 2. Active route hierarchy:
  //    - /lmo -> LMO (Field Officer Workspace)
  //    - /owner -> OWNER (Merchant Workspace)
  //    - /manufacturer -> MANUFACTURER (Manufacturer Workspace)
  //    - /admin -> ADMIN (Admin Command Center)
  //    - /qr -> PUBLIC (Citizen Portal)
  // 3. Fallback to current authenticated user's role
  const routeRole: UserRole | undefined = pathname.startsWith("/lmo")
    ? "LMO"
    : pathname.startsWith("/owner")
    ? "OWNER"
    : pathname.startsWith("/manufacturer")
    ? "MANUFACTURER"
    : pathname.startsWith("/admin")
    ? "ADMIN"
    : pathname.startsWith("/qr")
    ? "PUBLIC"
    : undefined;

  const effectiveRole: UserRole = propRole || routeRole || currentUser.role || "ADMIN";

  // Contextual persona to display at the bottom of the sidebar
  const displayUser = currentUser.role === effectiveRole ? currentUser : (GOVERNMENT_PERSONAS[effectiveRole] || currentUser);

  // Compute live contextual counts for senior-dev responsive badges
  const pendingAppsCount = applications.filter(
    (a) => a.status === "PAYMENT_COMPLETED_PENDING_ASSIGNMENT" || a.status === "DRAFT" || a.status === "PAYMENT_PENDING"
  ).length;

  const highRiskCount = instruments.filter(
    (i) => (i.riskScore && i.riskScore >= 50) || i.status === "SUSPENDED_TAMPERED" || i.priorityFlag === "CRITICAL"
  ).length;

  const loggedComplaintsCount = complaints.filter(
    (c) => c.status === "LOGGED" || c.status === "UNDER_INVESTIGATION"
  ).length;

  const lmoAssignedCount = applications.filter(
    (a) => a.assignedOfficerId === displayUser.id || a.status === "ASSIGNED" || a.status === "SCHEDULED"
  ).length;

  const activeCertsCount = certificates.filter((c) => c.status === "ACTIVE_VALID").length;

  // Generate 100% role-isolated navigation links
  const getNavLinks = (): {
    primaryTitle: string;
    primary: NavItem[];
    secondaryTitle: string;
    secondary: NavItem[];
  } => {
    switch (effectiveRole) {
      case "LMO":
        return {
          primaryTitle: "Field Operations",
          primary: [
            {
              id: "docket",
              label: "Assigned Docket",
              href: "/lmo",
              icon: "fact_check",
              badge: lmoAssignedCount > 0 ? lmoAssignedCount : undefined,
              badgeColor: "bg-primary text-white",
            },
            {
              id: "history",
              label: "Form-A Certificates",
              href: "/lmo?view=certs",
              icon: "verified",
              badge: certificates.length > 0 ? certificates.length : undefined,
            },
            {
              id: "standards",
              label: "Working Standards (Weights)",
              href: "/lmo?view=standards",
              icon: "scale",
            },
          ],
          secondaryTitle: "Field Inspection Tools",
          secondary: [
            { id: "qr", label: "Scan & Verify Scale QR", href: "/qr", icon: "qr_code_scanner" },
            { id: "offline", label: "Offline Sync Queue", href: "/lmo?view=offline", icon: "cloud_sync" },
            { id: "notices", label: "Section 25 Stop-Use", href: "/lmo?view=notices", icon: "warning" },
          ],
        };

      case "OWNER":
        return {
          primaryTitle: "Establishment Scales",
          primary: [
            {
              id: "instruments",
              label: "My Scales & Instruments",
              href: "/owner?tab=instruments",
              icon: "precision_manufacturing",
              badge: instruments.length > 0 ? instruments.length : undefined,
            },
            {
              id: "apply",
              label: "Apply for Stamping (Form-1)",
              href: "/owner?tab=applications",
              icon: "edit_document",
              badge: applications.length > 0 ? applications.length : undefined,
            },
            {
              id: "vault",
              label: "Certificate Vault (Form-A)",
              href: "/owner?tab=vault",
              icon: "verified_user",
              badge: activeCertsCount > 0 ? activeCertsCount : undefined,
              badgeColor: "bg-emerald-600 text-white",
            },
            {
              id: "readiness",
              label: "Compliance Readiness",
              href: "/owner?tab=readiness",
              icon: "rule",
            },
          ],
          secondaryTitle: "Merchant Services",
          secondary: [
            { id: "qr", label: "Test Scale QR Display", href: "/qr", icon: "qr_code_scanner" },
            { id: "challan", label: "Treasury Fee Receipts", href: "/owner?tab=applications", icon: "receipt_long" },
            { id: "feedback", label: "Consumer Feedback", href: "/owner?tab=instruments", icon: "reviews" },
          ],
        };

      case "MANUFACTURER":
        return {
          primaryTitle: "Production Line",
          primary: [
            { id: "manufacturer", label: "Model Birth Registry", href: "/manufacturer", icon: "approval" },
            { id: "mint", label: "Batch Serial Minter", href: "/manufacturer?action=mint", icon: "qr_code_2" },
            { id: "supply", label: "Supply Chain Transit", href: "/manufacturer?view=supply", icon: "local_shipping" },
          ],
          secondaryTitle: "Technical Standards",
          secondary: [
            { id: "specs", label: "Load Cell Schematics", href: "/manufacturer?tab=models", icon: "description" },
            { id: "qr", label: "Verify Minted QR", href: "/qr", icon: "qr_code_scanner" },
          ],
        };

      case "ADMIN":
      default:
        return {
          primaryTitle: language === "hi" ? "निदेशालय कमान" : "Directorate Command",
          primary: [
            { id: "dashboard", label: language === "hi" ? "कमांड सेंटर" : "Command Center", href: "/admin", icon: "dashboard" },
            {
              id: "assignments",
              label: language === "hi" ? "आवंटन कतार" : "Assignment Queue",
              href: "/admin?filter=PENDING",
              icon: "assignment_ind",
              badge: pendingAppsCount > 0 ? pendingAppsCount : undefined,
              badgeColor: "bg-blue-600 text-white",
            },
            {
              id: "flags",
              label: language === "hi" ? "प्राथमिकता विसंगति चेतावनियां" : "Priority Anomaly Flags",
              href: "/admin?filter=HIGH_RISK",
              icon: "flag",
              badge: highRiskCount > 0 ? highRiskCount : undefined,
              badgeColor: "bg-rose-600 text-white",
            },
            {
              id: "complaints",
              label: language === "hi" ? "नागरिक शिकायतें" : "Citizen Grievances",
              href: "/admin?filter=COMPLAINTS",
              icon: "report_problem",
              badge: loggedComplaintsCount > 0 ? loggedComplaintsCount : undefined,
              badgeColor: "bg-amber-600 text-white",
            },
          ],
          secondaryTitle: language === "hi" ? "स्थानिक विश्लेषण व खुफिया" : "Spatial Telemetry & Intelligence",
          secondary: [
            {
              id: "heatmap",
              label: language === "hi" ? "जीआईएस अनुपालन हीटमैप" : "GIS Compliance Heatmap",
              href: "/admin?view=heatmap",
              icon: "map",
              badge: "GIS",
              badgeColor: "bg-emerald-600 text-white",
            },
            {
              id: "workload",
              label: language === "hi" ? "अधिकारी कार्यभार" : "Officer Workload",
              href: "/admin?view=workload",
              icon: "group",
            },
          ],
        };
    }
  };

  const { primaryTitle, primary, secondaryTitle, secondary } = getNavLinks();

  const renderLink = (item: NavItem) => {
    let isActive = false;
    if (activeSection) {
      isActive = activeSection.toLowerCase() === item.id.toLowerCase();
    } else {
      if (item.href === "/admin") isActive = pathname === "/admin";
      else if (item.href === "/lmo") isActive = pathname === "/lmo";
      else if (item.href === "/owner") isActive = pathname === "/owner";
      else if (item.href === "/manufacturer") isActive = pathname === "/manufacturer";
      else if (item.href.startsWith("/qr")) isActive = pathname.startsWith("/qr");
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center justify-between px-3.5 py-2.5 text-xs transition-all duration-150 rounded-lg mx-2 my-0.5 ${
          isActive
            ? "bg-primary text-white font-semibold shadow-sm"
            : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="material-symbols-outlined text-[18px] shrink-0">{item.icon}</span>
          <span className="truncate">{item.label}</span>
        </div>
        {item.badge !== undefined && item.badge !== null && item.badge !== 0 && (
          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1.5 leading-none ${
              item.badgeColor || (isActive ? "bg-white/25 text-white" : "bg-surface-container text-on-surface")
            }`}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden flex justify-between items-center w-full px-4 h-16 z-40 bg-surface border-b border-outline-variant fixed top-0 left-0 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-on-surface-variant p-2 rounded-xl hover:bg-surface-container transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer active:scale-95"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs shrink-0">
              <span className="material-symbols-outlined text-lg">balance</span>
            </div>
            <div>
              <div className="font-bold text-primary text-sm leading-tight flex items-center gap-1">
                <span>Metrica</span>
                <span className="text-[9px] font-mono px-1 py-0.2 bg-primary/10 text-primary rounded font-bold">{effectiveRole}</span>
              </div>
              <div className="text-[9px] text-on-surface-variant font-medium leading-none">
                DoCA Legal Metrology
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/qr"
            className="text-on-surface-variant p-2 rounded-full hover:bg-surface-container transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Scan QR"
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
          </Link>

          {/* Interactive Mobile Profile Pill Trigger */}
          <button
            type="button"
            onClick={() => setIsProfileSheetOpen(true)}
            className="flex items-center gap-1.5 p-1 pl-1.5 rounded-full bg-surface-container border border-outline-variant hover:bg-surface-container-high transition-all active:scale-95 cursor-pointer min-h-[44px] shrink-0"
            title="User Profile, Role Switcher & Logout"
          >
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {displayUser.avatarLetter || "U"}
            </div>
            <span className="material-symbols-outlined text-[16px] text-outline pr-0.5">expand_more</span>
          </button>
        </div>
      </header>

      {/* Mobile Slide Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-2xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-72 bg-surface h-full pt-16 px-2 py-4 overflow-y-auto flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <div className="px-4 py-2">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {primaryTitle}
                </p>
              </div>
              {primary.map(renderLink)}

              <div className="mt-4 px-4 py-2">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {secondaryTitle}
                </p>
              </div>
              {secondary.map(renderLink)}
            </div>

            <div className="p-3 border-t border-outline-variant text-xs mt-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {displayUser.avatarLetter || "U"}
                  </div>
                  <div className="truncate min-w-0">
                    <p className="font-bold text-on-surface truncate text-xs leading-tight">{displayUser.name}</p>
                    <p className="text-[10px] text-outline truncate leading-tight mt-0.5">{displayUser.designation}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-2 text-outline hover:text-error hover:bg-error-container/20 rounded-lg transition-colors shrink-0 cursor-pointer"
                  title="Sign Out"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Profile, Role Switcher & Sign Out Bottom Sheet */}
      {isProfileSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setIsProfileSheetOpen(false)}
        >
          <div
            className="w-full max-w-md bg-surface border-t sm:border border-outline-variant rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sheet Pull Bar */}
            <div className="w-12 h-1.5 bg-outline-variant/80 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            {/* Profile Header */}
            <div className="p-4 bg-surface-container-low border-b border-outline-variant flex items-start justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary text-white font-bold text-lg flex items-center justify-center shadow-md shrink-0">
                  {currentUser.avatarLetter || "U"}
                </div>
                <div>
                  <div className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-primary/10 text-primary rounded font-mono font-bold">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-xs text-primary font-medium">{currentUser.designation}</div>
                  <div className="text-[11px] text-outline mt-0.5">{currentUser.jurisdictionCircle}</div>
                  {currentUser.officerBadgeId && (
                    <div className="mt-1 text-[10px] font-mono text-secondary font-semibold">
                      Badge: {currentUser.officerBadgeId}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsProfileSheetOpen(false)}
                className="p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Scrollable Sheet Body */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Persona Switcher (Evaluation Mode) */}
              <div>
                <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Switch Active Persona</span>
                  <span className="text-[10px] text-primary font-normal">Instant Switch</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handlePersonaSwitch("ADMIN")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      currentUser.role === "ADMIN"
                        ? "bg-primary text-white font-bold border-primary shadow-sm ring-2 ring-primary/20"
                        : "border-outline-variant hover:bg-surface-container-low text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="material-symbols-outlined text-[16px]">dashboard</span>
                      <span className="font-bold">Controller</span>
                    </div>
                    <div className="text-[10px] opacity-80">DoCA Central Admin</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePersonaSwitch("LMO")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      currentUser.role === "LMO"
                        ? "bg-primary text-white font-bold border-primary shadow-sm ring-2 ring-primary/20"
                        : "border-outline-variant hover:bg-surface-container-low text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="material-symbols-outlined text-[16px]">local_police</span>
                      <span className="font-bold">Inspector</span>
                    </div>
                    <div className="text-[10px] opacity-80">Field Officer Workspace</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePersonaSwitch("OWNER")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      currentUser.role === "OWNER"
                        ? "bg-primary text-white font-bold border-primary shadow-sm ring-2 ring-primary/20"
                        : "border-outline-variant hover:bg-surface-container-low text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="material-symbols-outlined text-[16px]">storefront</span>
                      <span className="font-bold">Merchant</span>
                    </div>
                    <div className="text-[10px] opacity-80">Scale Licensee Vault</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePersonaSwitch("MANUFACTURER")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      currentUser.role === "MANUFACTURER"
                        ? "bg-primary text-white font-bold border-primary shadow-sm ring-2 ring-primary/20"
                        : "border-outline-variant hover:bg-surface-container-low text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="material-symbols-outlined text-[16px]">precision_manufacturing</span>
                      <span className="font-bold">Manufacturer</span>
                    </div>
                    <div className="text-[10px] opacity-80">Model Birth Registry</div>
                  </button>
                </div>
              </div>

              {/* Language & Accessibility Bar */}
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-on-surface-variant text-[11px] font-semibold">Language:</span>
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      language === "en" ? "bg-primary text-white" : "text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("hi")}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      language === "hi" ? "bg-primary text-white" : "text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    हिन्दी
                  </button>
                </div>

                <div className="flex items-center gap-1 border-l border-outline-variant pl-2">
                  <span className="text-on-surface-variant text-[11px] font-semibold">Font:</span>
                  <button
                    type="button"
                    onClick={zoomOut}
                    className="px-1.5 py-0.5 rounded bg-surface border border-outline-variant text-[10px] font-bold"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={zoomReset}
                    className="px-1.5 py-0.5 rounded bg-surface border border-outline-variant text-[10px] font-bold"
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={zoomIn}
                    className="px-1.5 py-0.5 rounded bg-surface border border-outline-variant text-[10px] font-bold"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Public Trust QR Scanner Link */}
              <Link
                href="/qr"
                onClick={() => setIsProfileSheetOpen(false)}
                className="w-full p-2.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-xl flex items-center justify-between text-xs font-semibold text-on-surface transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">qr_code_scanner</span>
                  <span>Citizen QR Verification Portal</span>
                </div>
                <span className="material-symbols-outlined text-outline text-[16px]">chevron_right</span>
              </Link>
            </div>

            {/* Logout Footer Button */}
            <div className="p-4 bg-surface-container-low border-t border-outline-variant shrink-0">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-3 bg-red-50 hover:bg-red-100 text-error border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Sign Out / Logout to SSO Gateway</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Persistent Side Navigation Bar */}
      <nav className="hidden md:flex flex-col h-full bg-surface fixed left-0 top-0 w-[260px] border-r border-outline-variant z-40">
        {/* Brand & Agency Header */}
        <div className="p-4 border-b border-outline-variant flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shadow-sm shrink-0">
            <span className="material-symbols-outlined text-xl">balance</span>
          </div>
          <div>
            <div className="text-lg font-bold text-primary leading-tight">Metrica</div>
            <div className="text-[10px] text-on-surface-variant font-medium leading-tight mt-0.5">
              Digital Identity Compliance
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Links */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          <div>
            <div className="px-4 mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
                {primaryTitle}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface-container font-mono text-primary font-semibold">
                {effectiveRole}
              </span>
            </div>
            {primary.map(renderLink)}
          </div>

          <div>
            <div className="px-4 mb-1.5">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
                {secondaryTitle}
              </span>
            </div>
            {secondary.map(renderLink)}
          </div>
        </div>

        {/* Official User Profile Card at Bottom */}
        <div className="p-3 border-t border-outline-variant bg-surface-container-low/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0">
                {displayUser.avatarLetter || "U"}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-on-surface truncate leading-tight">
                  {displayUser.name}
                </div>
                <div className="text-[10px] text-outline truncate leading-tight mt-0.5">
                  {displayUser.designation}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="p-1.5 text-outline hover:text-error hover:bg-error-container/20 rounded-lg transition-colors shrink-0 cursor-pointer"
              title="Sign Out to SSO Gateway"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
