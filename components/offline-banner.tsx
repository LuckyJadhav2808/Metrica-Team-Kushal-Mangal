"use client";

import React, { useState } from "react";

export function OfflineBanner({ onToggle }: { onToggle?: (isOffline: boolean) => void }) {
  const [isOffline, setIsOffline] = useState(false);

  const toggle = () => {
    const next = !isOffline;
    setIsOffline(next);
    if (onToggle) onToggle(next);
  };

  return (
    <div
      className={`px-4 py-2 text-xs font-medium flex items-center justify-between transition-colors border-b ${
        isOffline
          ? "bg-[#FEF7E0] text-[#B06000] border-[#FEE7A6]"
          : "bg-surface-container text-neutral-700 border-border"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-base leading-none">
          {isOffline ? "cloud_off" : "wifi"}
        </span>
        <span>
          {isOffline
            ? "Offline Mode Active — Inspections cached locally in Dexie.js (will sync upon reconnection)"
            : "Field Network Connected — Live sync active"}
        </span>
      </div>

      <button
        onClick={toggle}
        className="px-2.5 py-1 rounded bg-white border border-border shadow-xs hover:bg-neutral-100 text-[11px] font-semibold text-neutral-800"
      >
        {isOffline ? "Simulate Reconnect" : "Simulate Offline"}
      </button>
    </div>
  );
}
