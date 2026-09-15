"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console with structured context
    console.error("[METRICA_ERROR_BOUNDARY_CAPTURED]", {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white border border-border rounded-2xl p-8 shadow-card text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-status-yellow-bg border border-status-yellow-border flex items-center justify-center text-status-yellow">
          <span className="material-symbols-outlined text-3xl">gavel</span>
        </div>

        <h1 className="text-xl font-bold text-neutral-900 tracking-tight mb-2">
          Regulatory Session Interruption
        </h1>

        <p className="text-xs text-neutral-600 leading-relaxed mb-6">
          An unexpected exception occurred while rendering this legal metrology view. Your statutory data and local session remain completely secure.
        </p>

        {error.digest && (
          <div className="bg-surface-container-low border border-border rounded-lg p-2.5 mb-6 text-left">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block mb-1">
              Audit Reference ID
            </span>
            <span className="text-xs font-mono text-neutral-800 break-all select-all font-semibold">
              {error.digest}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            size="md"
            icon="refresh"
            onClick={() => reset()}
            className="flex-1"
          >
            Recover Workspace
          </Button>

          <Link href="/" className="flex-1">
            <Button variant="secondary" size="md" icon="home" className="w-full">
              Portal Home
            </Button>
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-2 text-[11px] text-neutral-500">
          <span className="material-symbols-outlined text-sm text-primary">shield</span>
          <span>Department of Consumer Affairs • Legal Metrology Division</span>
        </div>
      </div>
    </div>
  );
}
