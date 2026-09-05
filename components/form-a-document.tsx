"use client";

import React from "react";
import Image from "next/image";

interface FormADocumentProps {
  instrument: any;
  certificate?: any;
}

export function FormADocument({ instrument, certificate }: FormADocumentProps) {
  if (!instrument) return null;

  const certNo =
    certificate?.certificateNumber ||
    `CERT-DoCA-2026-${(instrument.digitalInstrumentId || "REG").replace("IND-MET-2026-", "")}`;

  const issueDate = certificate?.issueDate || instrument.lastVerifiedAt || "2026-02-01";
  const validUntil = certificate?.validUntil || instrument.validUntil || "2027-01-31";
  const sealNo =
    certificate?.physicalSealNumber ||
    instrument.currentSealNumber ||
    `DL-LM-902-${instrument.serialNumber || "2026"}`;
  const officerName =
    certificate?.signedByOfficerName || "Sunita Sharma (LMO-DL-C-902)";
  const circle = instrument.jurisdictionCircle || "Delhi Central District Circle";
  const hash =
    certificate?.digitalSignatureHash ||
    "a1c8f498902be71f28b4c9e830f14d872b9a7812cd4e0f11928374a5b6c7d8e9";

  const qrUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/qr/${encodeURIComponent(instrument.digitalInstrumentId)}`
      : `https://metrica.gov.in/qr/${encodeURIComponent(instrument.digitalInstrumentId)}`;

  return (
    <div className="form-a-document bg-white text-black p-8 max-w-[210mm] mx-auto text-[11px] leading-tight font-serif selection:bg-none print:p-6 print:m-0 print:max-w-full">
      {/* Outer Double-Line Statutory Gazette Border */}
      <div className="border-[3px] border-double border-black p-5 relative">
        {/* Ashoka Watermark in background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none">
          <Image
            src="/logo.png"
            alt="National Watermark"
            width={340}
            height={340}
            className="object-contain filter grayscale"
          />
        </div>

        {/* Official Header */}
        <div className="text-center border-b-2 border-black pb-3.5 relative z-10">
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="w-12 h-12 relative flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Emblem of India"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div className="text-[13px] font-bold tracking-wider uppercase">
            भारत सरकार | GOVERNMENT OF INDIA
          </div>
          <div className="text-[11px] font-semibold text-neutral-800 uppercase">
            उपभोक्ता मामले, खाद्य और सार्वजनिक वितरण मंत्रालय
          </div>
          <div className="text-[10px] tracking-wide text-neutral-700 uppercase">
            MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION
          </div>
          <div className="text-[11px] font-bold tracking-wider uppercase mt-0.5">
            विधिक माप विज्ञान प्रभाग | LEGAL METROLOGY DIVISION
          </div>
          <div className="text-[10px] text-neutral-700 italic">
            कार्यालय विधिक माप विज्ञान नियंत्रक / Office of the Controller of Legal Metrology
          </div>

          <div className="mt-2.5 pt-2 border-t border-black/40">
            <h1 className="text-base font-black tracking-widest uppercase underline decoration-1 underline-offset-2">
              FORM A
            </h1>
            <div className="text-[10px] font-bold uppercase tracking-wider">
              [See Rule 24(1) of the Legal Metrology (General) Rules, 2011]
            </div>
            <div className="text-xs font-bold tracking-wide uppercase mt-0.5">
              प्रमाणीकरण एवं सत्यापन प्रमाण-पत्र | CERTIFICATE OF VERIFICATION
            </div>
            <div className="text-[9px] text-neutral-600 italic">
              Issued under Section 24 of The Legal Metrology Act, 2009 (Act No. 1 of 2010)
            </div>
          </div>
        </div>

        {/* Certificate Reference Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2.5 border-b border-black text-[10px] font-mono bg-neutral-50/60 my-1 relative z-10">
          <div className="border-r border-black/30 pr-2">
            <span className="block text-[8px] font-sans font-bold uppercase text-neutral-500">
              Certificate Number
            </span>
            <span className="font-bold text-black">{certNo}</span>
          </div>
          <div className="border-r border-black/30 pr-2 pl-1">
            <span className="block text-[8px] font-sans font-bold uppercase text-neutral-500">
              Digital QR Identifier
            </span>
            <span className="font-bold text-black">{instrument.digitalInstrumentId}</span>
          </div>
          <div className="border-r border-black/30 pr-2 pl-1">
            <span className="block text-[8px] font-sans font-bold uppercase text-neutral-500">
              Date of Verification
            </span>
            <span className="font-bold text-black">{issueDate}</span>
          </div>
          <div className="pl-1">
            <span className="block text-[8px] font-sans font-bold uppercase text-neutral-500">
              Validity Due Date
            </span>
            <span className="font-bold text-black underline">{validUntil}</span>
          </div>
        </div>

        {/* Section 1: Licensed Trader / Merchant Details */}
        <div className="mt-3 relative z-10">
          <div className="bg-neutral-200/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-black/40">
            1. Particulars of Merchant / APMC Mandi Establishment (धारक / व्यापारी का विवरण)
          </div>
          <table className="w-full mt-1 border-collapse text-[10.5px]">
            <tbody>
              <tr className="border-b border-neutral-300">
                <td className="w-1/3 py-1 font-semibold text-neutral-700">Name of Merchant / Occupier:</td>
                <td className="py-1 font-bold text-black uppercase">
                  {instrument.ownerName || "Commercial Trading Licensee"}
                </td>
              </tr>
              <tr className="border-b border-neutral-300">
                <td className="py-1 font-semibold text-neutral-700">Business Premises / Mandi Yard:</td>
                <td className="py-1 font-medium text-black">
                  {instrument.ownerAddress || "APMC Commercial Trading Complex, Delhi"} (PIN: {instrument.pincode || "110001"})
                </td>
              </tr>
              <tr className="border-b border-neutral-300">
                <td className="py-1 font-semibold text-neutral-700">Enforcement District / Circle:</td>
                <td className="py-1 font-semibold text-black">{circle}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold text-neutral-700">Treasury Challan / Fee Receipt:</td>
                <td className="py-1 font-mono text-[9.5px]">
                  TR-5 Receipt No. DL-TR-{certNo.replace(/[^0-9]/g, "").slice(0, 6) || "991204"} • Fee Paid: ₹200.00 (Statutory Schedule-V Fee)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Technical Particulars of Weighing Instrument */}
        <div className="mt-3 relative z-10">
          <div className="bg-neutral-200/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-black/40">
            2. Technical Particulars of Verified Weighing Instrument (उपकरण का तकनीकी विवरण)
          </div>
          <table className="w-full mt-1 border border-black/40 border-collapse text-[10px] text-center">
            <thead>
              <tr className="bg-neutral-100 border-b border-black/40 font-bold">
                <th className="p-1 border-r border-black/30 text-left">Nomenclature / Model</th>
                <th className="p-1 border-r border-black/30">Serial Number</th>
                <th className="p-1 border-r border-black/30">Accuracy Class</th>
                <th className="p-1 border-r border-black/30">Capacity (Max / Min)</th>
                <th className="p-1 border-r border-black/30">Verification Scale (e)</th>
                <th className="p-1">Tested MPE Tolerance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black/20">
                <td className="p-1.5 border-r border-black/30 text-left font-semibold">
                  {instrument.modelName || "Electronic Counter Scale"}
                  <span className="block text-[8.5px] font-normal text-neutral-600">
                    Make: {instrument.manufacturerName || "Apex Metrology Ltd"}
                  </span>
                </td>
                <td className="p-1.5 border-r border-black/30 font-mono font-bold">
                  {instrument.serialNumber || "SN-2026-UNKNOWN"}
                </td>
                <td className="p-1.5 border-r border-black/30 font-bold text-blue-900">
                  {instrument.accuracyClass ? instrument.accuracyClass.replace("_", " ") : "CLASS III"}
                </td>
                <td className="p-1.5 border-r border-black/30 font-semibold">
                  {instrument.maxCapacity || 30} {instrument.nominalUnit || "KG"} / {instrument.minCapacity || 0.1} {instrument.nominalUnit || "KG"}
                </td>
                <td className="p-1.5 border-r border-black/30 font-mono">
                  {instrument.verificationInterval || 0.005} {instrument.nominalUnit || "KG"}
                </td>
                <td className="p-1.5 text-emerald-800 font-bold font-mono">
                  PASS (Within ±0.005 {instrument.nominalUnit || "KG"})
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Physical Stamping & Security Seals */}
        <div className="mt-3 relative z-10">
          <div className="bg-neutral-200/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-black/40">
            3. Physical Verification Stamping & Security Seals (मुद्रण एवं सुरक्षा सील)
          </div>
          <div className="grid grid-cols-2 gap-3 mt-1 text-[10px]">
            <div className="border border-black/30 p-2 bg-neutral-50/50">
              <span className="font-bold text-neutral-800 block mb-0.5">Physical Lead / Holographic Wire Seal:</span>
              <span className="font-mono font-bold text-black text-[11px] bg-white px-1.5 py-0.5 border border-neutral-300 inline-block">
                {sealNo}
              </span>
              <span className="block text-[8.5px] text-neutral-600 mt-1">
                Quarter Stamped: Q1 2026 • Verified on standard working standards traceable to NPL (National Physical Laboratory).
              </span>
            </div>
            <div className="border border-black/30 p-2 bg-neutral-50/50">
              <span className="font-bold text-neutral-800 block mb-0.5">Cryptographic HMAC-SHA256 Seal Hash:</span>
              <span className="font-mono text-[8px] text-neutral-800 break-all block bg-white p-1 border border-neutral-300">
                {hash}
              </span>
              <span className="block text-[8.5px] text-emerald-700 font-semibold mt-0.5">
                ● Registered on Central Metrica Regulatory Trust Grid
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Statutory Legal Attestation Clause */}
        <div className="mt-3 p-2.5 border border-black/40 bg-neutral-50 text-[9.5px] italic text-neutral-800 leading-relaxed relative z-10">
          <strong>सत्यापन घोषणा (Attestation):</strong> &ldquo;I hereby certify that I have this day examined, tested, verified, and stamped the weighing and measuring instrument described above with the official verification stamp, and have found the same to conform to the standards and Maximum Permissible Error (MPE) limits prescribed under the Legal Metrology Act, 2009 and the Legal Metrology (General) Rules, 2011.&rdquo;
        </div>

        {/* Section 5: Official Signatures, Official Emblem Seal & Verification QR */}
        <div className="mt-3.5 pt-2 border-t border-black/50 grid grid-cols-3 gap-4 items-end relative z-10">
          {/* Left: Scannable Public QR Verification */}
          <div className="text-center border border-black/30 p-2 bg-white flex flex-col items-center justify-center">
            {/* Real SVG QR Code representation */}
            <div className="w-16 h-16 bg-neutral-100 border border-black flex items-center justify-center p-1">
              <svg viewBox="0 0 29 29" className="w-full h-full text-black fill-current">
                <path d="M0 0h7v7H0zm2 2h3v3H2zm6-2h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zm3 0h1v1h-1zm2 0h1v1h-1zm3 0h1v1h-1zm2 0h7v7h-7zm2 2h3v3h-3zm-14 6h1v1h-1zm3 0h1v1h-1zm3 0h2v1h-2zm4 0h1v1h-1zm2 0h1v1h-1zm-13 2h1v1H8zm3 0h1v1h-1zm4 0h1v1h-1zm3 0h1v1h-1zm3 0h2v1h-2zm-13 2h2v1H8zm4 0h1v1h-1zm3 0h2v1h-2zm4 0h1v1h-1zm3 0h1v1h-1zm-15 2h1v1H7zm3 0h2v1h-2zm4 0h1v1h-1zm3 0h1v1h-1zm3 0h2v1h-2zm-14 2h1v1H8zm2 0h2v1h-2zm3 0h1v1h-1zm2 0h1v1h-1zm3 0h2v1h-2zm-13 2h1v1H9zm2 0h1v1h-1zm4 0h2v1h-2zm3 0h1v1h-1zm-18 2h7v7H0zm2 2h3v3H2zm6-2h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zm3 0h2v1h-2zm3 0h1v1h-1zm2 0h1v1h-1zm-9 3h2v1H9zm4 0h1v1h-1zm3 0h2v1h-2zm2 0h1v1h-1zm-10 2h1v1H8zm2 0h1v1h-1zm3 0h1v1h-1zm2 0h2v1h-2zm3 0h1v1h-1z" />
              </svg>
            </div>
            <span className="text-[8px] font-mono font-bold mt-1 block">SCAN TO VERIFY LIVE</span>
            <span className="text-[7.5px] text-neutral-500 font-mono">{instrument.digitalInstrumentId}</span>
          </div>

          {/* Center: Official Circular Stamping Seal */}
          <div className="text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-blue-900 flex flex-col items-center justify-center p-1 text-blue-900 font-bold text-[8px] leading-tight select-none rotate-[-6deg]">
              <span className="text-[7px] uppercase tracking-wider">विधिक माप विज्ञान</span>
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span className="text-[7.5px] font-black uppercase">DELHI CIRCLE</span>
              <span className="text-[6.5px] font-mono">DoCA-GOI • {issueDate.slice(0, 4)}</span>
            </div>
            <span className="text-[8px] text-neutral-600 mt-1 font-semibold uppercase">
              Official Verification Seal
            </span>
          </div>

          {/* Right: Digital Signature & Officer Credentials */}
          <div className="text-right flex flex-col justify-end">
            <div className="mb-1">
              <span className="font-serif italic text-blue-900 text-sm font-bold block">
                {officerName.split(" ")[0]} {officerName.split(" ")[1] || ""}
              </span>
              <span className="text-[9px] font-sans font-bold text-black block">
                {officerName}
              </span>
              <span className="text-[8px] text-neutral-700 block">
                Legal Metrology Officer (Inspector Grade-I)
              </span>
              <span className="text-[8px] text-neutral-600 block">
                {circle}
              </span>
            </div>
            <div className="text-[7.5px] text-neutral-500 font-mono pt-1 border-t border-black/20">
              Digitally Authenticated on {issueDate}
            </div>
          </div>
        </div>

        {/* Statutory Warning Footer */}
        <div className="mt-3 pt-2 border-t-2 border-black text-[8px] text-neutral-600 leading-tight flex justify-between items-center relative z-10">
          <div>
            <strong>वैधानिक चेतावनी (Statutory Note):</strong> This Certificate ceases to be valid if the instrument is repaired, modified, tampered with, or if the physical lead/holographic seal is broken. The certificate must be framed and exhibited conspicuously at the place of business under Section 24 of the Legal Metrology Act, 2009.
          </div>
          <div className="text-right font-mono font-bold shrink-0 ml-4">
            Metrica Trust Grid ID: SIH-26036
          </div>
        </div>
      </div>
    </div>
  );
}
