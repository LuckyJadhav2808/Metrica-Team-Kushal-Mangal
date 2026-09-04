import React from "react";

interface ExplanationPanelProps {
  reasons: string[];
  riskScore: number;
  priorityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  className?: string;
}

export function ExplanationPanel({
  reasons,
  riskScore,
  priorityLevel,
  className = "",
}: ExplanationPanelProps) {
  return (
    <div className={`bg-[#FDF2F2] border border-[#F5C2C7] rounded-md p-3 text-xs ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-status-red">
          <span className="material-symbols-outlined text-sm">warning</span>
          <span>Why Flagged? Risk Factor Analysis</span>
        </div>
        <span className="bg-status-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          {priorityLevel} PRIORITY ({riskScore}/100)
        </span>
      </div>

      <p className="text-[11px] text-neutral-700 mb-2">
        The system detected the following contributing anomalies for administrative enforcement:
      </p>

      <ul className="space-y-1 pl-4 list-disc text-neutral-800 text-[11px]">
        {reasons.map((reason, idx) => (
          <li key={idx} className="font-medium">
            {reason}
          </li>
        ))}
      </ul>

      <div className="mt-2 pt-2 border-t border-[#F5C2C7]/60 text-[10px] text-neutral-500 italic">
        * Explainable AI Regulatory Assist: Statutory decision to inspect remains with the District Legal Metrology Officer.
      </div>
    </div>
  );
}
