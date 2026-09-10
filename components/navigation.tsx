"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMetrica, GOVERNMENT_PERSONAS } from "@/lib/store";
import { UserRole } from "@/lib/types";

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
  const { currentUser, instruments, applications, complaints, certificates, logout } = useMetrica();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          primaryTitle: "Statewide Portals",
          primary: [
            { id: "dashboard", label: "Command Center", href: "/admin", icon: "dashboard" },
            { id: "field", label: "Field Inspections (LMO)", href: "/lmo", icon: "checklist" },
            { id: "instruments", label: "Merchant Instruments", href: "/owner", icon: "storefront" },
            { id: "manufacturer", label: "Manufacturer Registry", href: "/manufacturer", icon: "precision_manufacturing" },
            { id: "qr", label: "Public Citizen Portal", href: "/qr", icon: "qr_code_scanner" },
          ],
          secondaryTitle: "Command Oversight (Strictly Admin)",
          secondary: [
            {
              id: "assignments",
              label: "Assignment Queue",
              href: "/admin?filter=PENDING",
              icon: "assignment_ind",
              badge: pendingAppsCount > 0 ? pendingAppsCount : undefined,
              badgeColor: "bg-blue-600 text-white",
            },
            {
              id: "flags",
              label: "Priority Anomaly Flags",
              href: "/admin?filter=HIGH_RISK",
              icon: "flag",
              badge: highRiskCount > 0 ? highRiskCount : undefined,
              badgeColor: "bg-rose-600 text-white",
            },
            {
              id: "complaints",
              label: "Citizen Grievances",
              href: "/admin?filter=COMPLAINTS",
              icon: "report_problem",
              badge: loggedComplaintsCount > 0 ? loggedComplaintsCount : undefined,
              badgeColor: "bg-amber-600 text-white",
            },
            {
              id: "workload",
              label: "Officer Workload",
              href: "/admin?view=workload",
              icon: "group",
            },
            {
              id: "heatmap",
              label: "GIS Compliance Heatmap",
              href: "/admin?view=heatmap",
              icon: "map",
              badge: "GIS",
              badgeColor: "bg-emerald-600 text-white",
            },
            {
              id: "network-graph",
              label: "Fraud Ring Network Graph",
              href: "/admin?view=network-graph",
              icon: "hub",
              badge: "RADAR",
              badgeColor: "bg-purple-600 text-white",
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
      <header className="md:hidden flex justify-between items-center w-full px-4 h-16 z-40 bg-surface border-b border-outline-variant fixed top-0 left-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-on-surface-variant p-2 rounded-lg hover:bg-surface-container transition-colors"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="font-bold text-primary text-lg">Metrica</div>
            <span className="text-[10px] text-on-surface-variant font-medium hidden sm:inline">
              Digital Identity Compliance
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/qr"
            className="text-on-surface-variant p-2 rounded-full hover:bg-surface-container transition-colors"
            title="Scan QR"
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
          </Link>
          <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
            {displayUser.avatarLetter || "U"}
          </div>
        </div>
      </header>

      {/* Mobile Slide Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-neutral-900/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-64 bg-surface h-full pt-16 px-2 py-4 overflow-y-auto flex flex-col justify-between shadow-2xl"
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
                <div className="truncate">
                  <p className="font-bold text-on-surface truncate">{displayUser.name}</p>
                  <p className="text-[10px] text-outline truncate">{displayUser.designation}</p>
                </div>
                <Link
                  href="/login"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="p-1.5 text-error hover:bg-error-container/20 rounded"
                  title="Sign Out"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </Link>
              </div>
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

            <Link
              href="/login"
              onClick={logout}
              className="p-1.5 text-outline hover:text-error hover:bg-error-container/20 rounded-lg transition-colors shrink-0"
              title="Sign Out to SSO Gateway"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
