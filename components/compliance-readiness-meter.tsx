import React from "react";

interface ReadinessItem {
  label: string;
  isComplete: boolean;
  requiredFor: string;
}

interface ComplianceReadinessMeterProps {
  score?: number; // 0 - 100
  items?: ReadinessItem[];
  onFix?: () => void;
  className?: string;
}

export function ComplianceReadinessMeter({
  score = 0,
  items = [
    { label: "Instrument Model Approval No. Verified", isComplete: true, requiredFor: "Statutory Rule" },
    { label: "Purchase Invoice Copy Uploaded", isComplete: true, requiredFor: "Proof of Claim" },
    { label: "Physical Serial Nameplate Clear Photo", isComplete: score >= 80, requiredFor: "OCR Extraction" },
    { label: "Current Installation Address & Pincode", isComplete: true, requiredFor: "Jurisdiction Mapping" },
  ],
  onFix,
  className = "",
}: ComplianceReadinessMeterProps) {
  const completedCount = items.filter((i) => i.isComplete).length;
  const calculatedScore = score || Math.round((completedCount / items.length) * 100);

  const getScoreColor = () => {
    if (calculatedScore >= 80) return "bg-status-green";
    if (calculatedScore >= 50) return "bg-status-yellow";
    return "bg-status-red";
  };

  return (
    <div className={`bg-surface-card border border-border rounded-lg p-4 shadow-card ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-xs font-semibold text-neutral-900">
            Compliance Readiness Score
          </span>
          <p className="text-[11px] text-neutral-600">
            Pre-submission audit to prevent application rejections
          </p>
        </div>
        <span className="text-sm font-bold text-neutral-900 tabular-nums">
          {calculatedScore}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-500 rounded-full ${getScoreColor()}`}
          style={{ width: `${calculatedScore}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-1.5 pt-2 border-t border-border">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className={`material-symbols-outlined text-sm ${
                  item.isComplete ? "text-status-green" : "text-status-red"
                }`}
              >
                {item.isComplete ? "check_circle" : "cancel"}
              </span>
              <span className={item.isComplete ? "text-neutral-700" : "text-neutral-900 font-medium"}>
                {item.label}
              </span>
            </div>
            <span className="text-[10px] text-neutral-400">
              {item.isComplete ? "Ready" : `Missing (${item.requiredFor})`}
            </span>
          </div>
        ))}
      </div>

      {calculatedScore < 100 && onFix && (
        <button
          onClick={onFix}
          className="mt-3 w-full py-1.5 px-3 bg-primary-light text-primary hover:bg-primary/10 text-xs font-semibold rounded border border-primary/20 transition-colors flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">upload_file</span>
          Upload Missing Evidence to Reach 100%
        </button>
      )}
    </div>
  );
}
