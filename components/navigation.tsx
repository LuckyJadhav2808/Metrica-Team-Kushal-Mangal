"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMetrica } from "@/lib/store";

interface NavProps {
  activeSection?: string;
}

export function InstitutionalNavigation({ activeSection }: NavProps) {
  const pathname = usePathname();
  const { currentUser, logout } = useMetrica();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Generate role-specific navigation links
  const getNavLinks = () => {
    switch (currentUser.role) {
      case "LMO":
        return {
          primary: [
            { id: "docket", label: "Field Inspection Docket", href: "/lmo", icon: "fact_check" },
            { id: "history", label: "Verification Certificates", href: "/lmo?view=certs", icon: "verified" },
            { id: "standards", label: "Standards & Weights", href: "/lmo?view=standards", icon: "scale" },
          ],
          secondaryTitle: "Regulatory Portals",
          secondary: [
            { id: "dashboard", label: "Command Center", href: "/admin", icon: "dashboard" },
            { id: "instruments", label: "Merchant Registry", href: "/owner", icon: "storefront" },
            { id: "qr", label: "Public QR Scanner", href: "/qr/demo", icon: "qr_code_scanner" },
          ],
        };
      case "OWNER":
        return {
          primary: [
            { id: "instruments", label: "My Scales & Instruments", href: "/owner?tab=instruments", icon: "precision_manufacturing" },
            { id: "apply", label: "Apply for Stamping", href: "/owner?tab=applications", icon: "edit_document" },
            { id: "vault", label: "Certificate Vault", href: "/owner?tab=vault", icon: "verified_user" },
            { id: "readiness", label: "Compliance Readiness", href: "/owner?tab=readiness", icon: "rule" },
          ],
          secondaryTitle: "Services & Redressal",
          secondary: [
            { id: "qr", label: "Verify Scale QR", href: "/qr/demo", icon: "qr_code_scanner" },
            { id: "grievance", label: "Citizen Grievance Redressal", href: "/qr/demo?action=report", icon: "support_agent" },
          ],
        };
      case "MANUFACTURER":
        return {
          primary: [
            { id: "manufacturer", label: "Model Birth Registry", href: "/manufacturer", icon: "approval" },
            { id: "mint", label: "Mint Digital IDs", href: "/manufacturer?action=mint", icon: "qr_code_2" },
            { id: "supply", label: "Supply Chain Transit", href: "/manufacturer?view=supply", icon: "local_shipping" },
          ],
          secondaryTitle: "Enforcement",
          secondary: [
            { id: "dashboard", label: "Command Center", href: "/admin", icon: "dashboard" },
            { id: "qr", label: "Public QR Check", href: "/qr/demo", icon: "qr_code_scanner" },
          ],
        };
      case "ADMIN":
      default:
        return {
          primary: [
            { id: "dashboard", label: "Command Center", href: "/admin", icon: "dashboard" },
            { id: "field", label: "Field Inspections (LMO)", href: "/lmo", icon: "checklist" },
            { id: "instruments", label: "Merchant Instruments", href: "/owner", icon: "storefront" },
            { id: "manufacturer", label: "Manufacturer Registry", href: "/manufacturer", icon: "precision_manufacturing" },
            { id: "qr", label: "Public QR Check", href: "/qr/demo", icon: "qr_code_scanner" },
          ],
          secondaryTitle: "Command Oversight",
          secondary: [
            { id: "assignments", label: "Assignment Queue", href: "/admin?filter=PENDING", icon: "assignment_ind" },
            { id: "flags", label: "Priority Flags", href: "/admin?filter=HIGH_RISK", icon: "flag" },
            { id: "complaints", label: "Citizen Grievances", href: "/admin?filter=COMPLAINTS", icon: "report_problem" },
            { id: "workload", label: "Officer Workload", href: "/admin?view=workload", icon: "group" },
          ],
        };
    }
  };

  const { primary, secondaryTitle, secondary } = getNavLinks();

  const renderLink = (item: { id: string; label: string; href: string; icon: string }) => {
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
        className={`flex items-center gap-3 px-4 py-2.5 text-xs transition-all duration-150 rounded-lg mx-2 my-0.5 ${
          isActive
            ? "bg-primary text-white font-semibold shadow-sm"
            : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
        <span className="truncate">{item.label}</span>
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
            href="/qr/demo"
            className="text-on-surface-variant p-2 rounded-full hover:bg-surface-container transition-colors"
            title="Scan QR"
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
          </Link>
          <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
            {currentUser.avatarLetter || "U"}
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
                  {currentUser.role} Workspace
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
                  <p className="font-bold text-on-surface truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-outline truncate">{currentUser.designation}</p>
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
                {currentUser.role} Navigation
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface-container font-mono text-primary font-semibold">
                {currentUser.role}
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
                {currentUser.avatarLetter || "U"}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-on-surface truncate leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-outline truncate leading-tight mt-0.5">
                  {currentUser.designation}
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
