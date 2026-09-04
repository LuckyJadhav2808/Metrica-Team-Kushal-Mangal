"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();

  const getNavItems = (): NavItem[] => {
    switch (role) {
      case "ADMIN":
        return [
          { label: "Command Center", href: "/admin", icon: "dashboard" },
          { label: "Pending Assignments", href: "/admin#pending", icon: "assignment" },
          { label: "High-Risk Cases", href: "/admin#high-risk", icon: "warning" },
          { label: "Complaints Intelligence", href: "/admin#complaints", icon: "report" },
          { label: "Officer Workload", href: "/admin#workload", icon: "badge" },
        ];
      case "OWNER":
        return [
          { label: "My Instruments", href: "/owner", icon: "scale" },
          { label: "Applications", href: "/owner#applications", icon: "edit_document" },
          { label: "Certificates Vault", href: "/owner#certificates", icon: "verified" },
          { label: "Readiness Check", href: "/owner#readiness", icon: "fact_check" },
          { label: "Expiry Alerts", href: "/owner#alerts", icon: "notifications" },
        ];
      case "LMO":
      case "GATC":
        return [
          { label: "Assigned Cases", href: "/lmo", icon: "checklist" },
          { label: "Field Inspection", href: "/lmo#inspect", icon: "document_scanner" },
          { label: "Offline Queue", href: "/lmo#offline", icon: "sync_problem" },
          { label: "Inspection History", href: "/lmo#history", icon: "history" },
        ];
      case "MANUFACTURER":
        return [
          { label: "Registered Models", href: "/manufacturer", icon: "category" },
          { label: "Batch Serial Minter", href: "/manufacturer#mint", icon: "qr_code_2" },
          { label: "Instruments Catalog", href: "/manufacturer#catalog", icon: "inventory_2" },
          { label: "Lifecycle Status", href: "/manufacturer#lifecycle", icon: "timeline" },
        ];
      default:
        return [{ label: "Public Scan", href: "/qr/demo", icon: "qr_code" }];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-[260px] shrink-0 bg-surface-card border-r border-border min-h-[calc(100vh-40px)] flex flex-col justify-between p-4">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-border">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
            <span className="material-symbols-outlined text-xl">scale</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-900 tracking-tight leading-none">
              METRICA
            </h1>
            <p className="text-[11px] text-neutral-600 mt-1">
              DoCA Legal Metrology
            </p>
          </div>
        </div>

        {/* Role Badge */}
        <div className="px-2 mb-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-600 block mb-1">
            Active Portal
          </span>
          <div className="bg-surface-container px-3 py-1.5 rounded-md text-xs font-semibold text-primary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {role.replace("_", " ")}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary-light text-primary font-semibold border-l-4 border-primary pl-2 shadow-sm"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`material-symbols-outlined text-lg leading-none ${isActive ? "text-primary" : "text-neutral-400"}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="bg-primary text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="border-t border-border pt-4 px-2 text-[11px] text-neutral-600">
        <p className="font-medium text-neutral-700">Govt of India</p>
        <p className="text-[10px] text-neutral-400 mt-0.5">PS ID: 26036 | SIH 2026</p>
      </div>
    </aside>
  );
}
