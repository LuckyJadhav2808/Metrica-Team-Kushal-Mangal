"use client";

import React, { useState } from "react";
import { InstitutionalNavigation } from "@/components/navigation";
import { InstitutionalHeader } from "@/components/header";
import { useMetrica } from "@/lib/store";
import { InstrumentCategory, AccuracyClass, MeasurementUnit, Instrument } from "@/lib/types";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

export default function ManufacturerDashboard() {
  const { instruments, addInstrument, claimInstrument } = useMetrica();
  const toast = useToast();

  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [modelApprovalNum, setModelApprovalNum] = useState("IND/09/2026/88");
  const [modelName, setModelName] = useState("Apex Counter Pro 30");
  const [category, setCategory] = useState<InstrumentCategory>("ELECTRONIC_COUNTER_SCALE");
  const [accuracyClass, setAccuracyClass] = useState<AccuracyClass>("CLASS_III");
  const [unit, setUnit] = useState<MeasurementUnit>("KG");
  const [capacity, setCapacity] = useState("30");
  const [batchCount, setBatchCount] = useState("3");
  const [serialPrefix, setSerialPrefix] = useState("SN-APX");

  // Claim scale modal for quick testing
  const [claimTarget, setClaimTarget] = useState<Instrument | null>(null);
  const [claimMerchantName, setClaimMerchantName] = useState("Green Valley Groceries");
  const [claimAddress, setClaimAddress] = useState("Shop 4, APMC Market Yard");
  const [claimPincode, setClaimPincode] = useState("110001");

  const unclaimedItems = instruments.filter(
    (i) => i.status === "MANUFACTURED_UNCLAIMED" || !i.ownerName
  );
  const claimedItems = instruments.filter((i) => !!i.ownerName);

  const handleBatchMint = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(batchCount) || 1;

    for (let i = 1; i <= count; i++) {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      addInstrument({
        serialNumber: `${serialPrefix}-${randomId}`,
        modelName: modelName,
        category: category,
        accuracyClass: accuracyClass,
        nominalUnit: unit,
        maxCapacity: parseFloat(capacity) || 30,
        minCapacity: 0.1,
        verificationInterval: 0.005,
        manufacturerName: "Apex Metrology Instruments India Ltd",
        jurisdictionCircle: "National Manufacturing Division",
        pincode: "110001",
        status: "MANUFACTURED_UNCLAIMED",
      });
    }

    toast.success(
      "Batch Digital IDs Minted Successfully",
      `${count} instrument birth identities generated under Approval ${modelApprovalNum}. Ready for factory dispatch.`
    );

    setIsMintModalOpen(false);
  };

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimTarget) return;

    claimInstrument(claimTarget.serialNumber, claimMerchantName, claimAddress, claimPincode);
    toast.info(
      "Commercial Custody Transferred",
      `Instrument ${claimTarget.serialNumber} claimed by ${claimMerchantName} (${claimAddress})`
    );
    setClaimTarget(null);
  };

  return (
    <div className="bg-surface h-screen flex overflow-hidden font-sans">
      <InstitutionalNavigation activeSection="manufacturer" role="MANUFACTURER" />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden md:ml-[260px] bg-background min-w-0 pt-16 md:pt-0">
        <InstitutionalHeader title="Manufacturer & Importer Portal" />

        {/* Title & Action Strip */}
        <div className="px-margin-mobile md:px-margin-desktop py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline-variant bg-surface z-10 shrink-0 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-tertiary text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                National Birth Registry
              </span>
              <span className="text-xs text-on-surface-variant font-mono">License: DoCA-MFR-2026-IND-88</span>
            </div>
            <h2 className="font-display text-xl font-bold text-on-surface mt-1">
              Apex Metrology Instruments India Ltd
            </h2>
            <p className="text-xs text-on-surface-variant">
              Mint official Digital Twin Identities under approved Central Model Approvals before market dispatch.
            </p>
          </div>

          <button
            onClick={() => setIsMintModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-container transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">precision_manufacturing</span>
            Mint Batch Digital IDs
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-margin-mobile md:px-margin-desktop py-6">
          {/* Statutory Boundary Alert (per PRD Section 8 Guardrails) */}
          <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant text-xs mb-6 flex items-start gap-3 shadow-sm">
            <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">verified</span>
            <p className="text-on-surface leading-relaxed">
              <strong>Statutory Guardrail (Legal Metrology Act, 2009):</strong> Manufacturer registration creates the permanent <strong>birth identity</strong> of the physical scale. It does <em>not</em> constitute legal verification or physical stamping. Official stamping requires physical inspection by an authorized LMO/GATC officer.
            </p>
          </div>

          {/* Top Summary Strip (KPI Cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mb-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col shadow-card">
              <span className="text-[11px] font-semibold text-on-surface-variant block uppercase tracking-wider mb-1">
                Approved Models
              </span>
              <div className="text-2xl font-bold text-on-surface mt-auto">3</div>
              <span className="text-[10px] text-outline">Central Approvals active</span>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col shadow-card">
              <span className="text-[11px] font-semibold text-on-surface-variant block uppercase tracking-wider mb-1">
                Minted Units
              </span>
              <div className="text-2xl font-bold text-primary mt-auto">{instruments.length}</div>
              <span className="text-[10px] text-outline">Serial identities born</span>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col shadow-card">
              <span className="text-[11px] font-semibold text-on-surface-variant block uppercase tracking-wider mb-1">
                Unclaimed in Supply
              </span>
              <div className="text-2xl font-bold text-tertiary mt-auto">{unclaimedItems.length}</div>
              <span className="text-[10px] text-outline">Awaiting merchant retail claim</span>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col shadow-card">
              <span className="text-[11px] font-semibold text-on-surface-variant block uppercase tracking-wider mb-1">
                Claimed & Verified
              </span>
              <div className="text-2xl font-bold text-secondary mt-auto">{claimedItems.length}</div>
              <span className="text-[10px] text-outline">Active commercial custody</span>
            </div>
          </div>

          {/* Catalog of Manufactured Instruments */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
              <div>
                <h3 className="font-bold text-sm text-on-surface">Manufactured Instrument Birth Registry</h3>
                <p className="text-xs text-on-surface-variant">
                  Lifecycle status of minted units in the national supply chain.
                </p>
              </div>
              <div className="text-xs text-outline font-mono">
                Model: {modelApprovalNum}
              </div>
            </div>

            {instruments.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">precision_manufacturing</span>
                <div className="font-bold text-sm text-on-surface">No serial batches minted yet</div>
                <p className="text-xs mt-1 mb-4 text-on-surface-variant max-w-sm mx-auto">
                  Mint your first batch of digital twins under Model Approval IND/09/2026/88 before packaging and dispatch.
                </p>
                <button
                  onClick={() => setIsMintModalOpen(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-container"
                >
                  Mint First Batch
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant">
                      <th className="py-3 px-4 font-semibold text-on-surface-variant uppercase">Digital ID</th>
                      <th className="py-3 px-4 font-semibold text-on-surface-variant uppercase">Stamped Serial</th>
                      <th className="py-3 px-4 font-semibold text-on-surface-variant uppercase">Model & Capacity</th>
                      <th className="py-3 px-4 font-semibold text-on-surface-variant uppercase">Supply Chain Status</th>
                      <th className="py-3 px-4 font-semibold text-on-surface-variant uppercase">Owner Custody</th>
                      <th className="py-3 px-4 font-semibold text-on-surface-variant uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant font-body-md">
                    {instruments.map((inst) => {
                      const isUnclaimed = inst.status === "MANUFACTURED_UNCLAIMED" || !inst.ownerName;

                      return (
                        <tr key={inst.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-primary">
                            {inst.digitalInstrumentId}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {inst.serialNumber}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-on-surface block">{inst.modelName}</span>
                            <span className="text-[11px] text-outline">Max: {inst.maxCapacity} {inst.nominalUnit} (Class III)</span>
                          </td>
                          <td className="py-3 px-4">
                            {isUnclaimed ? (
                              <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-medium">
                                UNCLAIMED (Factory Floor)
                              </span>
                            ) : inst.status === "VERIFIED_ACTIVE" ? (
                              <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[11px] font-medium">
                                VERIFIED IN TRADE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant text-[11px] font-medium">
                                CLAIMED BY MERCHANT
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {inst.ownerName ? (
                              <div>
                                <span className="font-medium text-on-surface block">{inst.ownerName}</span>
                                <span className="text-[10px] text-outline">{inst.ownerAddress}</span>
                              </div>
                            ) : (
                              <span className="text-outline italic">Unsold / In Transit</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isUnclaimed ? (
                              <button
                                onClick={() => {
                                  setClaimTarget(inst);
                                }}
                                className="px-2.5 py-1 bg-surface-container-low border border-primary text-primary hover:bg-primary hover:text-white rounded text-[11px] font-medium transition-colors"
                              >
                                Simulate Merchant Claim
                              </button>
                            ) : (
                              <a
                                href={`/qr/${inst.digitalInstrumentId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline text-[11px] inline-flex items-center gap-1"
                              >
                                View QR &rarr;
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mint Batch Modal */}
      <Modal
        isOpen={isMintModalOpen}
        onClose={() => setIsMintModalOpen(false)}
        title="Mint Batch Digital Instrument IDs"
        subtitle="Generates cryptographic birth identities before factory dispatch"
      >
        <form onSubmit={handleBatchMint} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-on-surface mb-1">Central Model Approval Certificate</label>
            <input
              type="text"
              value={modelApprovalNum}
              onChange={(e) => setModelApprovalNum(e.target.value)}
              className="w-full p-2.5 border border-outline-variant rounded bg-surface-container-lowest font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-on-surface mb-1">Model Name</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full p-2.5 border border-outline-variant rounded bg-surface-container-lowest"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-on-surface mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InstrumentCategory)}
                className="w-full p-2.5 border border-outline-variant rounded bg-surface-container-lowest"
              >
                <option value="ELECTRONIC_COUNTER_SCALE">Electronic Counter Scale</option>
                <option value="PLATFORM_SCALE">Platform Weighing Scale</option>
                <option value="WEIGHBRIDGE">Heavy Weighbridge</option>
                <option value="JEWELRY_PRECISION_BALANCE">Precision Balance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-on-surface mb-1">Max Capacity (kg)</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full p-2.5 border border-outline-variant rounded bg-surface-container-lowest"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-on-surface mb-1">Serial Prefix</label>
              <input
                type="text"
                value={serialPrefix}
                onChange={(e) => setSerialPrefix(e.target.value)}
                className="w-full p-2.5 border border-outline-variant rounded bg-surface-container-lowest font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-on-surface mb-1">Batch Count</label>
              <input
                type="number"
                min="1"
                max="20"
                value={batchCount}
                onChange={(e) => setBatchCount(e.target.value)}
                className="w-full p-2.5 border border-outline-variant rounded bg-surface-container-lowest"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsMintModalOpen(false)}
              className="px-4 py-2 border border-outline text-on-surface rounded text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded text-xs font-semibold hover:bg-primary-container"
            >
              Mint {batchCount} Digital IDs
            </button>
          </div>
        </form>
      </Modal>

      {/* Merchant Claim Modal */}
      <Modal
        isOpen={!!claimTarget}
        onClose={() => setClaimTarget(null)}
        title="Simulate Merchant Retail Purchase & Custody Claim"
        subtitle={`Instrument: ${claimTarget?.modelName} (Serial: ${claimTarget?.serialNumber})`}
      >
        <form onSubmit={handleClaimSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-on-surface mb-1">Purchasing Merchant / Store Name</label>
            <input
              type="text"
              value={claimMerchantName}
              onChange={(e) => setClaimMerchantName(e.target.value)}
              className="w-full p-2.5 border border-outline-variant rounded bg-surface-container-lowest"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-on-surface mb-1">Store Address / Mandi</label>
              <input
                type="text"
                value={claimAddress}
                onChange={(e) => setClaimAddress(e.target.value)}
                className="w-full p-2.5 border border-outline-variant rounded bg-surface-container-lowest"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-on-surface mb-1">PIN Code</label>
              <input
                type="text"
                value={claimPincode}
                onChange={(e) => setClaimPincode(e.target.value)}
                className="w-full p-2.5 border border-outline-variant rounded bg-surface-container-lowest font-mono"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setClaimTarget(null)}
              className="px-4 py-2 border border-outline text-on-surface rounded text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-secondary text-white rounded text-xs font-semibold hover:bg-secondary/90"
            >
              Transfer Custody to Merchant
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
