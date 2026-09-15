"use client";

import React, { useState, useEffect } from "react";
import { VerificationApplication } from "@/lib/types";

interface BharatkoshPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: VerificationApplication | null;
  initialMode?: "PAYMENT" | "RECEIPT";
  onPaymentSuccess?: (paymentRef: string) => void;
}

export function BharatkoshPaymentModal({
  isOpen,
  onClose,
  application,
  initialMode = "PAYMENT",
  onPaymentSuccess,
}: BharatkoshPaymentModalProps) {
  const [activeTab, setActiveTab] = useState<"UPI" | "NET_BANKING">("UPI");
  const [mode, setMode] = useState<"PAYMENT" | "RECEIPT">(initialMode);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [selectedBank, setSelectedBank] = useState("SBI");
  const [copiedVpa, setCopiedVpa] = useState(false);

  // Generated or preserved receipt details
  const [receiptData, setReceiptData] = useState({
    cin: "SBIN260904812739",
    challanNo: "BK-1475-2026-99214",
    transactionId: "TR-NTRP-8849201",
    timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    amount: 590,
  });

  useEffect(() => {
    setMode(initialMode);
    if (initialMode === "RECEIPT" && application?.paymentRefNumber) {
      setReceiptData((prev) => ({
        ...prev,
        transactionId: application.paymentRefNumber || prev.transactionId,
        challanNo: `BK-1475-${application.applicationNumber?.replace(/[^0-9]/g, "") || "2026-881"}`,
      }));
    }
  }, [initialMode, application, isOpen]);

  useEffect(() => {
    if (!isOpen || mode !== "PAYMENT") return;
    setCountdown(300);
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, mode]);

  if (!isOpen || !application) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const vpa = "bharatkosh.metrology@sbi";
  const upiPayload = `upi://pay?pa=${vpa}&pn=LegalMetrologyDoCA&am=590.00&cu=INR&tn=${application.applicationNumber}`;

  const handleCopyVpa = () => {
    navigator.clipboard?.writeText(vpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const generatedRef = `CHALLAN-BK-${Date.now().toString().slice(-6)}`;
      const generatedCin = `SBIN2609${Math.floor(10000000 + Math.random() * 90000000)}`;
      const generatedChallan = `BK-1475-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const timeStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

      setReceiptData({
        cin: generatedCin,
        challanNo: generatedChallan,
        transactionId: generatedRef,
        timestamp: timeStr,
        amount: 590,
      });

      setIsProcessing(false);
      setMode("RECEIPT");
      if (onPaymentSuccess) {
        onPaymentSuccess(generatedRef);
      }
    }, 1200);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Sovereign Header Ribbon */}
        <div className="h-1.5 w-full bg-linear-to-r from-amber-600 via-white to-emerald-600" />

        {/* Modal Topbar */}
        <div className="bg-surface-container-low px-5 py-3.5 border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-on-surface">Bharatkosh NTRP Gateway</h3>
                <span className="text-[10px] font-mono font-bold bg-secondary/15 text-secondary px-1.5 py-0.2 rounded border border-secondary/30">
                  Major Head 1475
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Non-Tax Receipt Portal • Controller General of Accounts (CGA), Ministry of Finance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 overflow-y-auto space-y-4">
          {mode === "PAYMENT" ? (
            <>
              {/* Application Summary Card */}
              <div className="bg-surface-container-low border border-outline-variant/70 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs border-b border-outline-variant/50 pb-2">
                  <span className="text-on-surface-variant font-medium">Application Docket:</span>
                  <span className="font-mono font-bold text-primary">{application.applicationNumber}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-outline block">Applicant / Licensee</span>
                    <span className="font-semibold text-on-surface truncate block">{application.applicantName}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-outline block">Scale Serial Number</span>
                    <span className="font-mono text-on-surface">{application.instrumentSerial}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-outline block">Regulatory Head of Account</span>
                    <span className="font-mono text-[11px] text-secondary font-bold">1475-00-106-01 (LM Fees)</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-outline block">Jurisdiction DDO</span>
                    <span className="text-[11px] text-on-surface">Delhi North Circle (DDO 200147)</span>
                  </div>
                </div>
              </div>

              {/* Fee Schedule Breakdown (Seventh Schedule) */}
              <div className="border border-outline-variant/60 rounded-xl p-3.5 bg-surface space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-on-surface border-b border-outline-variant/40 pb-1.5">
                  <span>Fee Component (Legal Metrology Rules 2011)</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="space-y-1 text-xs text-on-surface-variant">
                  <div className="flex justify-between">
                    <span>Statutory Stamping & Verification Fee (Class III Scale)</span>
                    <span className="font-mono">₹450.00</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-outline">
                    <span>NABL Reference Standard Traceability Levy</span>
                    <span className="font-mono">₹50.00</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-outline">
                    <span>Central GST (CGST @ 9%)</span>
                    <span className="font-mono">₹45.00</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-outline">
                    <span>State GST (SGST @ 9%)</span>
                    <span className="font-mono">₹45.00</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/70 font-bold text-sm text-on-surface">
                  <span>Total Statutory Challan Amount:</span>
                  <span className="font-mono text-base text-primary">₹590.00</span>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <div className="flex rounded-xl border border-outline-variant p-1 bg-surface-container-low mb-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("UPI")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === "UPI"
                        ? "bg-surface text-primary shadow-xs border border-outline-variant"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">qr_code_2</span>
                    UPI (Dynamic QR & VPA)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("NET_BANKING")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === "NET_BANKING"
                        ? "bg-surface text-primary shadow-xs border border-outline-variant"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">account_balance</span>
                    Net Banking / SBI e-Pay
                  </button>
                </div>

                {/* TAB 1: UPI PAYMENT */}
                {activeTab === "UPI" && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-surface-container-low border border-outline-variant rounded-xl">
                      {/* Interactive SVG QR Code */}
                      <div className="w-36 h-36 bg-white p-2 rounded-xl border border-outline-variant/80 shadow-xs flex flex-col items-center justify-center shrink-0">
                        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                          <rect width="100" height="100" fill="white" />
                          {/* Corner squares */}
                          <rect x="10" y="10" width="24" height="24" rx="3" fill="#1e293b" />
                          <rect x="14" y="14" width="16" height="16" rx="2" fill="white" />
                          <rect x="18" y="18" width="8" height="8" rx="1" fill="#1e293b" />

                          <rect x="66" y="10" width="24" height="24" rx="3" fill="#1e293b" />
                          <rect x="70" y="14" width="16" height="16" rx="2" fill="white" />
                          <rect x="74" y="18" width="8" height="8" rx="1" fill="#1e293b" />

                          <rect x="10" y="66" width="24" height="24" rx="3" fill="#1e293b" />
                          <rect x="14" y="70" width="16" height="16" rx="2" fill="white" />
                          <rect x="18" y="74" width="8" height="8" rx="1" fill="#1e293b" />

                          {/* Pattern Blocks */}
                          <rect x="42" y="12" width="6" height="6" fill="#1e293b" />
                          <rect x="52" y="18" width="6" height="6" fill="#1e293b" />
                          <rect x="40" y="28" width="8" height="6" fill="#1e293b" />
                          <rect x="54" y="30" width="6" height="8" fill="#1e293b" />
                          <rect x="12" y="44" width="6" height="8" fill="#1e293b" />
                          <rect x="24" y="42" width="8" height="6" fill="#1e293b" />
                          <rect x="38" y="42" width="24" height="24" rx="4" fill="#0f766e" />
                          <text x="50" y="58" fontSize="16" fontWeight="bold" fill="white" textAnchor="middle">₹</text>
                          <rect x="72" y="44" width="6" height="6" fill="#1e293b" />
                          <rect x="82" y="50" width="8" height="6" fill="#1e293b" />
                          <rect x="42" y="72" width="6" height="6" fill="#1e293b" />
                          <rect x="52" y="78" width="8" height="6" fill="#1e293b" />
                          <rect x="70" y="72" width="6" height="8" fill="#1e293b" />
                          <rect x="80" y="80" width="8" height="8" fill="#1e293b" />
                        </svg>
                        <span className="text-[9px] font-mono font-semibold text-slate-500 mt-1">Scan via any UPI App</span>
                      </div>

                      {/* Payment Instructions & Timer */}
                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-on-surface-variant">Session Expires In:</span>
                          <span className="font-mono font-bold text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                            ⏱ {formattedTime}
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] text-outline block">Official Bharatkosh VPA:</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <input
                              type="text"
                              readOnly
                              value={vpa}
                              className="w-full text-xs font-mono bg-surface border border-outline-variant rounded-lg p-1.5 text-on-surface select-all"
                            />
                            <button
                              type="button"
                              onClick={handleCopyVpa}
                              className="px-2.5 py-1.5 bg-surface border border-outline-variant rounded-lg text-xs hover:bg-surface-container font-medium shrink-0"
                            >
                              {copiedVpa ? "Copied!" : "Copy"}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-outline">
                          <span className="material-symbols-outlined text-xs text-emerald-600">verified</span>
                          <span>BHIM • Google Pay • PhonePe • Paytm • CRED</span>
                        </div>
                      </div>
                    </div>

                    {/* Evaluator Fast Pass Trigger */}
                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      disabled={isProcessing}
                      className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                    >
                      {isProcessing ? (
                        <>
                          <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                          <span>Verifying NTRP Bank Gateway Response...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">bolt</span>
                          <span>Simulate Instant UPI Success (SIH Demo Fast Pass)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* TAB 2: NET BANKING */}
                {activeTab === "NET_BANKING" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "SBI", name: "State Bank of India", icon: "account_balance" },
                        { id: "PNB", name: "Punjab National Bank", icon: "account_balance" },
                        { id: "CANARA", name: "Canara Bank", icon: "account_balance" },
                        { id: "HDFC", name: "HDFC Bank", icon: "account_balance" },
                        { id: "ICICI", name: "ICICI Bank", icon: "account_balance" },
                        { id: "OTHER", name: "Other 40+ Banks", icon: "more_horiz" },
                      ].map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBank(b.id)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            selectedBank === b.id
                              ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                              : "border-outline-variant bg-surface hover:bg-surface-container-low text-on-surface-variant"
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg block mx-auto mb-1">
                            {b.icon}
                          </span>
                          <span className="text-[11px] font-medium leading-tight block truncate">
                            {b.name}
                          </span>
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      disabled={isProcessing}
                      className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                    >
                      {isProcessing ? (
                        <>
                          <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                          <span>Connecting to {selectedBank} Treasury Gateway...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">lock</span>
                          <span>Proceed to Pay ₹590 via {selectedBank} Net Banking</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* OFFICIAL FORM GAR-7 TREASURY RECEIPT */
            <div className="space-y-4">
              <div className="border-2 border-slate-800 rounded-2xl p-5 bg-white text-slate-900 space-y-4 shadow-sm printable-challan">
                {/* Formal Header */}
                <div className="text-center border-b-2 border-slate-800 pb-3 space-y-1">
                  <div className="text-[11px] font-bold tracking-widest text-slate-600 uppercase">
                    Government of India • Ministry of Finance
                  </div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    FORM GAR-7 (See Rule 26)
                  </h2>
                  <p className="text-xs font-semibold text-slate-700">
                    CENTRAL TREASURY e-CHALLAN RECEIPT (NON-TAX RECEIPT PORTAL - BHARATKOSH)
                  </p>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 uppercase mt-1">
                    CREDITED TO CONSOLIDATED FUND OF INDIA (SUCCESS) ✓
                  </div>
                </div>

                {/* Receipt Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Bharatkosh Challan No.</span>
                    <span className="font-mono font-bold text-slate-900">{receiptData.challanNo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Bank CIN (CIN Number)</span>
                    <span className="font-mono font-bold text-slate-900">{receiptData.cin}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Transaction Reference</span>
                    <span className="font-mono font-medium text-slate-800">{receiptData.transactionId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Payment Date & Time</span>
                    <span className="text-slate-800 font-mono text-[11px]">{receiptData.timestamp}</span>
                  </div>
                </div>

                {/* Statutory Account Details */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Major Head of Account:</span>
                    <span className="font-mono font-bold text-slate-900">1475 - Other General Economic Services</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Minor Head:</span>
                    <span className="font-mono text-slate-900">106 - Regulation of Weights & Measures</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Department / Ministry:</span>
                    <span className="text-slate-900 font-medium">Consumer Affairs (Legal Metrology)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Drawing & Disbursing Officer (DDO):</span>
                    <span className="font-mono text-slate-900">200147 (Controller, Delhi Circle)</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1">
                    <span className="text-slate-600">Remitter / Payee Name:</span>
                    <span className="font-semibold text-slate-900">{application.applicantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Docket Reference:</span>
                    <span className="font-mono text-slate-900">{application.applicationNumber}</span>
                  </div>
                </div>

                {/* Total Paid */}
                <div className="flex items-center justify-between border-t-2 border-slate-800 pt-2 font-bold">
                  <div>
                    <span className="text-xs text-slate-700 block">Total Amount Received:</span>
                    <span className="text-[10px] text-slate-500 font-normal italic">Rupees Five Hundred Ninety Only</span>
                  </div>
                  <span className="text-xl font-mono text-emerald-800">₹{receiptData.amount}.00</span>
                </div>

                {/* Footer Security Notice */}
                <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-2 flex items-center justify-between">
                  <span>Digitally generated through Controller General of Accounts, MoF.</span>
                  <span className="font-mono font-bold text-slate-700">AUTH: CGA-NTRP-VALID</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-2.5 rounded-xl border border-outline-variant font-bold text-xs text-on-surface hover:bg-surface-container transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  Print / Download GAR-7 Challan
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Done (Return to Dashboard)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Sovereign Footer */}
        <div className="bg-surface-container-low px-5 py-2.5 border-t border-outline-variant text-[11px] text-outline flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs text-emerald-600">lock</span>
            <span>256-Bit SSL Encrypted • RBI & NPCI Compliant</span>
          </div>
          <span>NTRP Ver 2026.4</span>
        </div>
      </div>
    </div>
  );
}
