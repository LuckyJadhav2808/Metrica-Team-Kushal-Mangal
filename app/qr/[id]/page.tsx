"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useMetrica } from "@/lib/store";
import { Modal } from "@/components/ui/modal";

export default function PublicQRVerificationPage() {
  const params = useParams();
  const rawId = (params?.id as string) || "55201";
  const { instruments, certificates, fileComplaint } = useMetrica();

  // Find instrument by digitalInstrumentId or id
  const inst = instruments.find(
    (i) => i.digitalInstrumentId.toLowerCase() === rawId.toLowerCase() || i.id === rawId || i.serialNumber.toLowerCase() === rawId.toLowerCase()
  );
  const cert = inst ? certificates.find((c) => c.instrumentId === inst.id) : null;

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<any>("SHORT_WEIGHT");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const isVerified = inst ? inst.status === "VERIFIED_ACTIVE" : true;
  const isFlagged = inst ? inst.status === "SUSPENDED_TAMPERED" || inst.priorityFlag === "HIGH" || inst.priorityFlag === "CRITICAL" : false;

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDesc) return;

    fileComplaint({
      digitalInstrumentId: inst ? inst.digitalInstrumentId : rawId,
      complaintType: reportCategory,
      description: reportDesc,
    });

    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setIsReportOpen(false);
      setReportDesc("");
    }, 1500);
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-margin-mobile font-sans">
      <div className="w-full max-w-sm bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-sm flex flex-col items-center text-center">
        {/* Logo */}
        <div className="w-20 h-20 mb-md rounded-full overflow-hidden flex items-center justify-center border border-outline-variant bg-surface-container">
          <Image
            alt="Digital Instrument Trust Platform Logo"
            className="w-full h-full object-cover"
            src="/logo.png"
            width={80}
            height={80}
          />
        </div>

        {/* Status Badge (per Stitch public_qr_verification_page) */}
        {isFlagged ? (
          <div className="inline-flex items-center gap-xs bg-error-container text-on-error-container px-md py-base rounded-full mb-lg border border-error/20">
            <span className="material-symbols-outlined text-error text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
            <span className="font-label-lg text-label-lg">ATTENTION REQUIRED</span>
          </div>
        ) : isVerified ? (
          <div className="inline-flex items-center gap-xs bg-secondary-container text-on-secondary-container px-md py-base rounded-full mb-lg">
            <span className="material-symbols-outlined text-on-secondary-container text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            <span className="font-label-lg text-label-lg">VERIFIED</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-xs bg-tertiary-fixed text-on-tertiary-fixed px-md py-base rounded-full mb-lg">
            <span className="material-symbols-outlined text-on-tertiary-fixed text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              pending
            </span>
            <span className="font-label-lg text-label-lg">PENDING STAMP</span>
          </div>
        )}

        {/* Instrument Details */}
        <div className="w-full flex flex-col gap-md border-b border-surface-variant pb-md mb-md">
          <div className="flex flex-col items-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Digital Instrument ID</span>
            <span className="font-headline-md text-headline-md text-on-surface font-mono">
              {inst ? inst.digitalInstrumentId : rawId}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Valid Until</span>
            <span className="font-body-lg text-body-lg text-on-surface font-semibold">
              {cert ? cert.validUntil : inst?.validUntil || "Oct 2026"}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Instrument Type</span>
            <span className="font-body-md text-body-md text-on-surface">
              {inst?.modelName || "Commercial Bench Scale"}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Location</span>
            <span className="font-body-md text-body-md text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-outline text-[16px]">location_on</span>
              {inst?.ownerAddress ? `${inst.ownerName}, ${inst.ownerAddress}` : "Sunshine Groceries, Unit 4"}
            </span>
          </div>
        </div>

        {/* Action Button: Report an Issue */}
        <button
          onClick={() => setIsReportOpen(true)}
          className="w-full mt-base flex items-center justify-center gap-xs bg-transparent border border-primary text-primary font-label-lg text-label-lg py-base px-md rounded-DEFAULT hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">report_problem</span>
          Report an Issue
        </button>
      </div>

      {/* Citizen Report Modal */}
      <Modal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        title="Report Measurement Issue"
        subtitle={`Instrument ID: ${inst ? inst.digitalInstrumentId : rawId}`}
      >
        {reportSubmitted ? (
          <div className="p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-xl">check</span>
            </div>
            <h4 className="font-label-lg text-label-lg text-on-surface">Report Registered</h4>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Thank you. The report has been transmitted to the Legal Metrology Inspectorate.
            </p>
          </div>
        ) : (
          <form onSubmit={handleReport} className="space-y-4">
            <div>
              <label className="block font-label-lg text-label-lg text-on-surface mb-1">Issue Type</label>
              <select
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                className="w-full p-2.5 border border-outline-variant rounded bg-surface-container-lowest font-body-md text-body-md"
              >
                <option value="SHORT_WEIGHT">Incorrect Measurement / Short Weight</option>
                <option value="BROKEN_SEAL">Damaged or Missing Holographic Seal</option>
                <option value="EXPIRED_CERTIFICATE">Expired Calibration Certificate</option>
                <option value="TAMPERING">Suspected Hardware Tampering</option>
              </select>
            </div>
            <div>
              <label className="block font-label-lg text-label-lg text-on-surface mb-1">Details</label>
              <textarea
                rows={3}
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Describe your observation..."
                className="w-full p-2.5 border border-outline-variant rounded bg-surface-container-lowest font-body-md text-body-md outline-none focus:border-primary"
                required
              />
            </div>
            <div className="pt-4 border-t border-outline-variant flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsReportOpen(false)}
                className="px-4 py-2 border border-outline text-on-surface rounded font-label-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-error text-on-error rounded font-label-lg hover:bg-error/90"
              >
                Submit Report
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
