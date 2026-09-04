"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMetrica } from "@/lib/store";
import { UserRole } from "@/lib/types";

export function RoleSwitcher() {
  const pathname = usePathname();
  const { currentRole, setCurrentRole, instruments, applications } = useMetrica();

  const roles: { role: UserRole; label: string; path: string; icon: string }[] = [
    { role: "ADMIN", label: "Admin Command Center", path: "/admin", icon: "shield_person" },
    { role: "OWNER", label: "Instrument Owner", path: "/owner", icon: "store" },
    { role: "LMO", label: "LMO Field Officer", path: "/lmo", icon: "verified" },
    { role: "MANUFACTURER", label: "Manufacturer", path: "/manufacturer", icon: "precision_manufacturing" },
    { role: "PUBLIC", label: "Public QR Scan", path: "/qr/demo", icon: "qr_code_scanner" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-neutral-900 text-white px-4 py-2 text-xs border-b border-neutral-700 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="bg-primary-container px-2 py-0.5 rounded font-bold tracking-wider text-[11px] text-white">
            METRICA
          </span>
          <span className="text-neutral-400 hidden sm:inline">
            SIH 2026 | Legal Metrology Trust Platform
          </span>
        </div>

        <nav aria-label="Role Switcher" className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-neutral-400 mr-1 hidden md:inline">Role Switcher:</span>
          {roles.map((r) => {
            const isActive = pathname.startsWith(r.path) || currentRole === r.role;
            return (
              <Link
                key={r.role}
                href={r.path}
                onClick={() => setCurrentRole(r.role)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors text-xs font-medium ${
                  isActive
                    ? "bg-primary text-white shadow-sm ring-1 ring-white/20"
                    : "text-neutral-300 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <span className="material-symbols-outlined text-sm leading-none">{r.icon}</span>
                <span>{r.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 text-neutral-400">
          <span className="text-[11px]">
            Instruments: <strong className="text-white">{instruments.length}</strong>
          </span>
          <span className="text-[11px]">
            Apps: <strong className="text-white">{applications.length}</strong>
          </span>
        </div>
      </div>
    </header>
  );
}
