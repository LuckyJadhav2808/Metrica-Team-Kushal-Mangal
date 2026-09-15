import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 font-sans">
      <div className="max-w-lg w-full bg-white border border-border rounded-2xl p-8 shadow-card text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-light border border-[#AECBFA] flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-3xl">search_off</span>
        </div>

        <div className="inline-block px-2.5 py-0.5 rounded-full bg-surface-container-high text-[11px] font-mono font-semibold text-neutral-700 uppercase tracking-wider mb-2">
          HTTP 404 • Resource Not Located
        </div>

        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight mb-2">
          Regulatory Record Not Found
        </h1>

        <p className="text-xs text-neutral-600 leading-relaxed mb-6 max-w-md mx-auto">
          The requested weighing instrument identifier, certificate URL, or regulatory docket route does not exist in the National Legal Metrology database.
        </p>

        <div className="bg-surface-container-low border border-border rounded-xl p-4 mb-6 text-left space-y-2">
          <div className="text-xs font-semibold text-neutral-800">
            Common reasons for this notice:
          </div>
          <ul className="text-[11px] text-neutral-600 space-y-1 list-disc pl-4">
            <li>The Digital Instrument ID was mistyped or scan payload is corrupted.</li>
            <li>The instrument has not completed factory registration under Model Approval.</li>
            <li>You may have followed an expired or obsolete inspection bookmark.</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="flex-1">
            <Button variant="primary" size="md" icon="qr_code_scanner" className="w-full">
              Citizen QR Scanner
            </Button>
          </Link>
          <Link href="/login" className="flex-1">
            <Button variant="secondary" size="md" icon="lock" className="w-full">
              Officer Login
            </Button>
          </Link>
        </div>

        <div className="mt-8 pt-4 border-t border-border flex items-center justify-center gap-2 text-[11px] text-neutral-500">
          <span className="material-symbols-outlined text-sm text-primary">verified</span>
          <span>Metrica National Legal Metrology Network • SIH 2026</span>
        </div>
      </div>
    </div>
  );
}
