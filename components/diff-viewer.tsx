import React from "react";
import { Modal } from "./ui/modal";

interface DiffField {
  label: string;
  previousValue: string;
  currentValue: string;
  isModified: boolean;
}

interface DiffViewerProps {
  isOpen: boolean;
  onClose: () => void;
  instrumentId: string;
  serialNumber: string;
  diffFields?: DiffField[];
}

export function DiffViewer({
  isOpen,
  onClose,
  instrumentId,
  serialNumber,
  diffFields = [
    { label: "Owner Business Name", previousValue: "Verma Traders (Old Mandi)", currentValue: "Verma Enterprise Pvt Ltd", isModified: true },
    { label: "Installation Address", previousValue: "Shop 12, Subzi Mandi, Zone 4", currentValue: "Shop 12, Subzi Mandi, Zone 4", isModified: false },
    { label: "Physical Hologram Seal", previousValue: "#HOL-DEL-4410", currentValue: "#HOL-DEL-4410", isModified: false },
    { label: "Max Calibration Capacity", previousValue: "30.00 kg", currentValue: "30.00 kg", isModified: false },
    { label: "Reported Component Repair", previousValue: "None logged", currentValue: "Loadcell recalibrated by licensed vendor", isModified: true },
  ],
}: DiffViewerProps) {
  const modifiedCount = diffFields.filter((f) => f.isModified).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title="What Changed? Re-verification Historical Diff"
      subtitle={`Comparing previous inspection record vs current state for ${serialNumber} (${instrumentId})`}
    >
      <div className="space-y-4 text-xs">
        <div className="bg-surface-container p-3 rounded-md flex items-center justify-between border border-border">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary">compare_arrows</span>
            <span className="font-semibold text-neutral-900">
              Audit Snapshot Comparison
            </span>
          </div>
          <span className="bg-status-yellow-bg text-[#B06000] border border-status-yellow-border px-2 py-0.5 rounded text-[11px] font-semibold">
            {modifiedCount} field(s) changed since last stamp
          </span>
        </div>

        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-[11px] font-semibold text-neutral-600 border-b border-border uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Field</th>
                <th className="py-2.5 px-3">Previous Verified Record</th>
                <th className="py-2.5 px-3">Current Application / State</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {diffFields.map((field, idx) => (
                <tr
                  key={idx}
                  className={field.isModified ? "bg-[#FEF7E0]/40 font-medium" : "hover:bg-neutral-50"}
                >
                  <td className="py-2.5 px-3 text-neutral-900 font-semibold">{field.label}</td>
                  <td className="py-2.5 px-3 text-neutral-600">{field.previousValue}</td>
                  <td className="py-2.5 px-3 text-neutral-900">
                    <span className={field.isModified ? "text-[#B06000] font-semibold" : ""}>
                      {field.currentValue}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {field.isModified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#B06000] font-bold bg-[#FEF7E0] px-1.5 py-0.5 rounded border border-[#FEE7A6]">
                        <span className="material-symbols-outlined text-xs">edit</span>
                        CHANGED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500 font-medium">
                        <span className="material-symbols-outlined text-xs">check</span>
                        MATCH
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-surface-container-low rounded border border-border text-[11px] text-neutral-600">
          <p className="font-semibold text-neutral-800 mb-0.5">Officer Verification Guidance:</p>
          Ensure any modifications to loadcell, calibration potentiometers, or physical seals comply with Legal Metrology (General) Rules. Verify authorization of the licensed repairer.
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded hover:bg-primary-dark transition-colors"
          >
            Acknowledge & Return to Inspection
          </button>
        </div>
      </div>
    </Modal>
  );
}
