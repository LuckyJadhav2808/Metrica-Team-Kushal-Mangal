"use client";

import React, { useRef, useState, useMemo } from "react";
import { useMetrica } from "@/lib/store";
import { useToast } from "@/components/ui/toast";

// Graph Entity & Link Types
export type EntityType = "TRADER" | "SCALE" | "CIRCLE" | "COMPLAINT" | "CLONE";

export interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  type: EntityType;
  radius: number;
  color: string;
  strokeColor: string;
  riskScore: number;
  x: number;
  y: number;
  details?: any;
  isFlagged?: boolean;
}

export interface GraphLink {
  source: string;
  target: string;
  type: "OWNS" | "OPERATES_IN" | "COMPLAINED_AGAINST" | "SUSPICIOUS_CLONE" | "BENAMI_LINK";
  label: string;
  isAnomaly?: boolean;
  color?: string;
  dashed?: boolean;
}

export function FraudNetworkGraph() {
  const { instruments, complaints } = useMetrica();
  const toast = useToast();

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active View Filter
  const [viewMode, setViewMode] = useState<"FRAUD_ONLY" | "ALL" | "CLONES" | "BENAMI">("FRAUD_ONLY");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // Custom node positions if dragged
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({});

  // 1. Build the graph topology
  const { allNodes, allLinks } = useMemo(() => {
    const nodesMap = new Map<string, GraphNode>();
    const links: GraphLink[] = [];

    const addNode = (node: GraphNode) => {
      if (!nodesMap.has(node.id)) {
        nodesMap.set(node.id, node);
      }
    };

    // Mandi Hubs
    const hubs = [
      { id: "circle-haryana", name: "Haryana Border Hub", x: 100, y: 400 },
      { id: "circle-north", name: "Azadpur Mandi Hub", x: 340, y: 400 },
      { id: "circle-east", name: "Ghazipur Mandi Hub", x: 700, y: 400 },
      { id: "circle-central", name: "Chandni Chowk Hub", x: 440, y: 530 },
      { id: "circle-south", name: "Okhla Mandi Hub", x: 600, y: 530 },
    ];

    hubs.forEach((h) => {
      addNode({
        id: h.id,
        label: h.name,
        type: "CIRCLE",
        radius: 20,
        color: "#1e293b",
        strokeColor: "#64748b",
        riskScore: 0,
        x: h.x,
        y: h.y,
      });
    });

    // --- FRAUD SYNDICATE MEMBERS ---
    // 1. Azadpur Compromised Scale AZ02
    const az02Inst = instruments.find((i) => i.digitalInstrumentId.includes("AZ02")) || instruments[0];
    const az02Id = "scale-az02";
    addNode({
      id: az02Id,
      label: az02Inst?.digitalInstrumentId || "IND-MET-2026-AZ02",
      sublabel: "Tampered Counter Scale (Azadpur)",
      type: "SCALE",
      radius: 22,
      color: "#dc2626",
      strokeColor: "#f87171",
      riskScore: 88,
      x: 340,
      y: 250,
      details: az02Inst || { digitalInstrumentId: "IND-MET-2026-AZ02", riskScore: 88, status: "SUSPENDED_TAMPERED" },
      isFlagged: true,
    });

    // 2. Azadpur Syndicate Trader: Kailash Mandi Traders
    const kailashId = "trader-kailash";
    addNode({
      id: kailashId,
      label: "Kailash Mandi Traders",
      sublabel: "APMC Sub-Yard 4, Azadpur",
      type: "TRADER",
      radius: 22,
      color: "#991b1b",
      strokeColor: "#ef4444",
      riskScore: 85,
      x: 340,
      y: 130,
      details: {
        ownerName: "Kailash Mandi Traders",
        ownerAddress: "Shop 44, Sub-Yard 4, Azadpur Mandi",
        phone: "+91 98110-84729",
        gstin: "07AAACR12841Z5",
        riskScore: 85,
      },
      isFlagged: true,
    });

    links.push({
      source: kailashId,
      target: az02Id,
      type: "OWNS",
      label: "Custody",
      color: "#64748b",
    });

    links.push({
      source: az02Id,
      target: "circle-north",
      type: "OPERATES_IN",
      label: "Circle Jurisdiction",
      color: "#334155",
      dashed: true,
    });

    // 3. Ghazipur Compromised Scale GZ02
    const gz02Inst = instruments.find((i) => i.digitalInstrumentId.includes("GZ02"));
    const gz02Id = "scale-gz02";
    addNode({
      id: gz02Id,
      label: gz02Inst?.digitalInstrumentId || "IND-MET-2026-GZ02",
      sublabel: "Tampered Weighbridge (Ghazipur)",
      type: "SCALE",
      radius: 22,
      color: "#dc2626",
      strokeColor: "#f87171",
      riskScore: 88,
      x: 700,
      y: 250,
      details: gz02Inst || { digitalInstrumentId: "IND-MET-2026-GZ02", riskScore: 88, status: "SUSPENDED_TAMPERED" },
      isFlagged: true,
    });

    // 4. Ghazipur Syndicate Trader: Baldev Wholesalers
    const baldevId = "trader-baldev";
    addNode({
      id: baldevId,
      label: "Baldev Wholesalers",
      sublabel: "Terminal Block C, Ghazipur",
      type: "TRADER",
      radius: 22,
      color: "#991b1b",
      strokeColor: "#ef4444",
      riskScore: 85,
      x: 700,
      y: 130,
      details: {
        ownerName: "Baldev Wholesalers",
        ownerAddress: "Shed 12, Terminal Block C, Ghazipur Mandi",
        phone: "+91 98110-84729", // Shared phone!
        gstin: "07AABCB99211Z8",
        riskScore: 85,
      },
      isFlagged: true,
    });

    links.push({
      source: baldevId,
      target: gz02Id,
      type: "OWNS",
      label: "Custody",
      color: "#64748b",
    });

    links.push({
      source: gz02Id,
      target: "circle-east",
      type: "OPERATES_IN",
      label: "Circle Jurisdiction",
      color: "#334155",
      dashed: true,
    });

    // 5. Cloned Serial Twin (Haryana Border Transit)
    const cloneId = "clone-AZP-992-twin";
    addNode({
      id: cloneId,
      label: "CLONE-AZP-YRD-2024-992",
      sublabel: "Counterfeit Twin (Kundli Border)",
      type: "CLONE",
      radius: 22,
      color: "#7e22ce",
      strokeColor: "#c084fc",
      riskScore: 98,
      x: 100,
      y: 250,
      details: {
        digitalInstrumentId: "CLONE-AZP-YRD-2024-992",
        serialNumber: "AZP-YRD-2024-992 (DUPLICATE)",
        ownerName: "Apex Agro Logistics (Unregistered)",
        ownerAddress: "Plot 12, Kundli-Haryana Border",
        alertReason: "Serial number AZP-YRD-2024-992 duplicated from Kailash Mandi. Fraudulent duplicate stamp detected.",
        riskScore: 98,
      },
      isFlagged: true,
    });

    // 🚨 KEY FRAUD LINK 1: Duplicate Serial Clone Collision Link
    links.push({
      source: cloneId,
      target: az02Id,
      type: "SUSPICIOUS_CLONE",
      label: "🚨 DUPLICATE SERIAL CLONE COLLISION",
      isAnomaly: true,
      color: "#ef4444",
      dashed: true,
    });

    links.push({
      source: cloneId,
      target: "circle-haryana",
      type: "OPERATES_IN",
      label: "Cross-Border Transit",
      color: "#a855f7",
      dashed: true,
    });

    // ⚡ KEY FRAUD LINK 2: Benami Shared Phone Syndicate Ring Link
    links.push({
      source: kailashId,
      target: baldevId,
      type: "BENAMI_LINK",
      label: "⚡ BENAMI PROXY TELECOM RING (+91 98110-84729)",
      isAnomaly: true,
      color: "#f59e0b",
      dashed: true,
    });

    // Citizen Complaints for the Fraud Scales
    const cmpAZ = {
      id: "cmp-az-8fbb",
      label: "CMP-2026-8fbb",
      sublabel: "Short-Weight Complaint (400g deficient)",
      type: "COMPLAINT" as EntityType,
      radius: 13,
      color: "#be123c",
      strokeColor: "#f43f5e",
      riskScore: 88,
      x: 450,
      y: 250,
      details: {
        complaintNumber: "CMP-2026-8fbb",
        complaintType: "SHORT_WEIGHT",
        description: "Retail vendor short weight discrepancy verified by consumer.",
        impactOnRiskScore: 35,
      },
      isFlagged: true,
    };
    addNode(cmpAZ);
    links.push({
      source: cmpAZ.id,
      target: az02Id,
      type: "COMPLAINED_AGAINST",
      label: "Citizen Grievance",
      color: "#f43f5e",
      dashed: true,
    });

    const cmpGZ = {
      id: "cmp-gz-0bb6",
      label: "CMP-2026-0bb6",
      sublabel: "Lead Seal Broken Tamper Report",
      type: "COMPLAINT" as EntityType,
      radius: 13,
      color: "#be123c",
      strokeColor: "#f43f5e",
      riskScore: 85,
      x: 830,
      y: 250,
      details: {
        complaintNumber: "CMP-2026-0bb6",
        complaintType: "BROKEN_SEAL",
        description: "Statutory lead seal found cut and replaced with dummy wire.",
        impactOnRiskScore: 35,
      },
      isFlagged: true,
    };
    addNode(cmpGZ);
    links.push({
      source: cmpGZ.id,
      target: gz02Id,
      type: "COMPLAINED_AGAINST",
      label: "Citizen Grievance",
      color: "#f43f5e",
      dashed: true,
    });

    // --- OTHER COMPLIANT SCALES (Shown in "All Entities" view) ---
    const compliantScales = [
      // Azadpur
      { id: "scale-az01", label: "IND-MET-2026-AZ01", owner: "Ramesh Patel", sx: 210, sy: 340, ox: 150, oy: 395, hub: "circle-north" },
      { id: "scale-az03", label: "IND-MET-2026-AZ03", owner: "Subhash Onion", sx: 310, sy: 480, ox: 310, oy: 535, hub: "circle-north" },
      { id: "scale-55201", label: "IND-MET-2026-55201", owner: "Sunshine Groceries", sx: 210, sy: 480, ox: 150, oy: 535, hub: "circle-north" },
      // Ghazipur
      { id: "scale-gz03", label: "IND-MET-2026-GZ03", owner: "Ghazipur Livestock", sx: 830, sy: 340, ox: 890, oy: 395, hub: "circle-east" },
      { id: "scale-gz04", label: "IND-MET-2026-GZ04", owner: "Krishna Fruit Co", sx: 700, sy: 480, ox: 700, oy: 535, hub: "circle-east" },
      { id: "scale-gz05", label: "IND-MET-2026-GZ05", owner: "Anand Vihar Freight", sx: 830, sy: 480, ox: 890, oy: 535, hub: "circle-east" },
      // Central & South
      { id: "scale-ch03", label: "IND-MET-2026-CH03", owner: "Chandni Jewellers", sx: 380, sy: 580, ox: 330, oy: 620, hub: "circle-central" },
      { id: "scale-jw01", label: "IND-MET-2026-JW01", owner: "Daryaganj Traders", sx: 660, sy: 580, ox: 710, oy: 620, hub: "circle-south" },
    ];

    compliantScales.forEach((cs) => {
      addNode({
        id: cs.id,
        label: cs.label,
        type: "SCALE",
        radius: 14,
        color: "#16a34a",
        strokeColor: "#4ade80",
        riskScore: 12,
        x: cs.sx,
        y: cs.sy,
      });

      links.push({
        source: cs.id,
        target: cs.hub,
        type: "OPERATES_IN",
        label: "Jurisdiction",
        color: "#1e293b",
        dashed: true,
      });

      const ownerId = `trader-${cs.id}`;
      addNode({
        id: ownerId,
        label: cs.owner,
        type: "TRADER",
        radius: 14,
        color: "#1e40af",
        strokeColor: "#60a5fa",
        riskScore: 10,
        x: cs.ox,
        y: cs.oy,
      });

      links.push({
        source: ownerId,
        target: cs.id,
        type: "OWNS",
        label: "Custody",
        color: "#334155",
      });
    });

    return {
      allNodes: Array.from(nodesMap.values()),
      allLinks: links,
    };
  }, [instruments]);

  // Apply custom dragged positions if any
  const nodes = useMemo(() => {
    return allNodes.map((n) => {
      if (customPositions[n.id]) {
        return { ...n, x: customPositions[n.id].x, y: customPositions[n.id].y };
      }
      return n;
    });
  }, [allNodes, customPositions]);

  // Filter nodes & links based on view mode
  const { displayNodes, displayLinks } = useMemo(() => {
    let filteredNodes = nodes;

    if (viewMode === "FRAUD_ONLY") {
      filteredNodes = nodes.filter(
        (n) =>
          n.isFlagged ||
          n.type === "CLONE" ||
          n.type === "COMPLAINT" ||
          n.id === "trader-kailash" ||
          n.id === "trader-baldev" ||
          n.id === "scale-az02" ||
          n.id === "scale-gz02" ||
          n.id === "circle-north" ||
          n.id === "circle-east" ||
          n.id === "circle-haryana"
      );
    } else if (viewMode === "CLONES") {
      filteredNodes = nodes.filter(
        (n) =>
          n.type === "CLONE" ||
          n.id === "scale-az02" ||
          n.id === "trader-kailash" ||
          n.id === "circle-haryana" ||
          n.id === "circle-north"
      );
    } else if (viewMode === "BENAMI") {
      filteredNodes = nodes.filter(
        (n) =>
          n.id === "trader-kailash" ||
          n.id === "trader-baldev" ||
          n.id === "scale-az02" ||
          n.id === "scale-gz02" ||
          n.id === "circle-north" ||
          n.id === "circle-east"
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredNodes = filteredNodes.filter(
        (n) =>
          n.label.toLowerCase().includes(q) ||
          (n.sublabel && n.sublabel.toLowerCase().includes(q))
      );
    }

    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = allLinks.filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target));

    return { displayNodes: filteredNodes, displayLinks: filteredLinks };
  }, [nodes, allLinks, viewMode, searchQuery]);

  const nodePositionMap = useMemo(() => {
    return new Map(displayNodes.map((n) => [n.id, n]));
  }, [displayNodes]);

  // Connected neighbors for hover/focus spotlighting
  const activeConnectedIds = useMemo(() => {
    const focusId = selectedNode?.id || hoveredNodeId;
    if (!focusId) return null;

    const set = new Set<string>([focusId]);
    allLinks.forEach((l) => {
      if (l.source === focusId) set.add(l.target);
      if (l.target === focusId) set.add(l.source);
    });
    return set;
  }, [selectedNode, hoveredNodeId, allLinks]);

  // Pan & Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.15, 2.2));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.15, 0.6));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setCustomPositions({});
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "circle" || (e.target as HTMLElement).tagName === "text") return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeId) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
      const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;

      setCustomPositions((prev) => ({
        ...prev,
        [draggedNodeId]: { x: Math.round(x), y: Math.round(y) },
      }));
      return;
    }

    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  // Statutory enforcement action triggers
  const handleFreezePassport = (node: GraphNode) => {
    toast.error(
      "Digital Twin Frozen (Sovereign Override)",
      `Digital Identity ${node.label} has been revoked across all national verification QR endpoints.`
    );
  };

  const handleDispatchSyndicateRaid = (node: GraphNode) => {
    toast.info(
      "Multi-Point Section 25 Raid Authorized",
      `Simultaneous enforcement team dispatched across Azadpur & Ghazipur Mandi dockets for ${node.label}.`
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4 font-sans text-slate-800">
      {/* Top Forensic Intelligence KPI Strip (Clickable Buttons) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Card 1: Visible Entities */}
        <button
          onClick={() => {
            setViewMode("ALL");
            setSelectedNode(null);
          }}
          className={`text-left rounded-xl p-3 shadow-xs border transition-all cursor-pointer ${
            viewMode === "ALL"
              ? "bg-blue-50/80 border-primary ring-2 ring-primary/30"
              : "bg-surface-container-lowest border-outline-variant/30 hover:border-primary/40 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Visible Entities</span>
            <span className="material-symbols-outlined text-primary text-lg">device_hub</span>
          </div>
          <p className="text-xl font-extrabold text-on-surface mt-1">{displayNodes.length}</p>
          <span className="text-[10px] text-primary font-semibold flex items-center gap-1 mt-0.5">
            {viewMode === "ALL" ? "● Active: All Mandi Entities" : "Click to view full network →"}
          </span>
        </button>

        {/* Card 2: Cloned Serial Twins (Clickable) */}
        <button
          onClick={() => {
            setViewMode("CLONES");
            const cloneNode = nodes.find((n) => n.type === "CLONE");
            if (cloneNode) setSelectedNode(cloneNode);
          }}
          className={`text-left rounded-xl p-3 shadow-xs border transition-all cursor-pointer ${
            viewMode === "CLONES"
              ? "bg-purple-100 border-purple-600 ring-2 ring-purple-600/30"
              : "bg-purple-50/30 border-purple-500/30 hover:bg-purple-50/70 hover:border-purple-500 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Cloned Serial Twins</span>
            <span className="material-symbols-outlined text-purple-600 text-lg animate-pulse">content_copy</span>
          </div>
          <p className="text-xl font-extrabold text-purple-700 mt-1">1 Collision</p>
          <span className="text-[10px] text-purple-700 font-semibold flex items-center gap-1 mt-0.5">
            {viewMode === "CLONES" ? "● Focused on Counterfeit Twin" : "Click to isolate & inspect →"}
          </span>
        </button>

        {/* Card 3: Benami Proxy Rings (Clickable) */}
        <button
          onClick={() => {
            setViewMode("BENAMI");
            const kailashNode = nodes.find((n) => n.id.includes("kailash"));
            if (kailashNode) setSelectedNode(kailashNode);
          }}
          className={`text-left rounded-xl p-3 shadow-xs border transition-all cursor-pointer ${
            viewMode === "BENAMI"
              ? "bg-amber-100 border-amber-600 ring-2 ring-amber-600/30"
              : "bg-amber-50/30 border-amber-500/30 hover:bg-amber-50/70 hover:border-amber-500 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Benami Proxy Rings</span>
            <span className="material-symbols-outlined text-amber-600 text-lg">join_inner</span>
          </div>
          <p className="text-xl font-extrabold text-amber-800 mt-1">2 Mandi Entities</p>
          <span className="text-[10px] text-amber-800 font-semibold flex items-center gap-1 mt-0.5">
            {viewMode === "BENAMI" ? "● Focused on Shared Telecom" : "Click to isolate & inspect →"}
          </span>
        </button>

        {/* Card 4: Critical Risk Nodes (Clickable) */}
        <button
          onClick={() => {
            setViewMode("FRAUD_ONLY");
            const az02 = nodes.find((n) => n.id.includes("az02"));
            if (az02) setSelectedNode(az02);
          }}
          className={`text-left rounded-xl p-3 shadow-xs border transition-all cursor-pointer ${
            viewMode === "FRAUD_ONLY"
              ? "bg-red-100 border-error ring-2 ring-error/30"
              : "bg-error/5 border-error/20 hover:bg-error/15 hover:border-error hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-error uppercase tracking-wider">Critical Risk Nodes</span>
            <span className="material-symbols-outlined text-error text-lg">crisis_alert</span>
          </div>
          <p className="text-xl font-extrabold text-error mt-1">
            {displayNodes.filter((n) => n.riskScore >= 75 || n.isFlagged).length}
          </p>
          <span className="text-[10px] text-error font-semibold flex items-center gap-1 mt-0.5">
            {viewMode === "FRAUD_ONLY" ? "● Active: Fraud Radar" : "Click to isolate fraud →"}
          </span>
        </button>

        {/* Card 5: Active Graph Links */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Active Links</span>
            <span className="material-symbols-outlined text-emerald-600 text-lg">share</span>
          </div>
          <p className="text-xl font-extrabold text-on-surface mt-1">{displayLinks.length}</p>
          <span className="text-[10px] text-on-surface-variant/70">Topological connections</span>
        </div>
      </div>

      {/* Clean, Intuitive View Switcher Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* View Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => {
              setViewMode("FRAUD_ONLY");
              setSelectedNode(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "FRAUD_ONLY"
                ? "bg-error text-white shadow-sm"
                : "bg-error/10 hover:bg-error/20 text-error"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
            <span>🚨 Isolated Fraud Syndicate Only</span>
          </button>

          <button
            onClick={() => {
              setViewMode("ALL");
              setSelectedNode(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "ALL"
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
            }`}
          >
            🌐 All Mandi Entities ({allNodes.length})
          </button>

          <button
            onClick={() => {
              setViewMode("CLONES");
              const cloneNode = nodes.find((n) => n.type === "CLONE");
              if (cloneNode) setSelectedNode(cloneNode);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "CLONES"
                ? "bg-purple-700 text-white shadow-sm"
                : "bg-purple-50 hover:bg-purple-100 text-purple-700"
            }`}
          >
            <span className="material-symbols-outlined text-xs">content_copy</span>
            <span>Cloned Serial Collision</span>
          </button>

          <button
            onClick={() => {
              setViewMode("BENAMI");
              const kailashNode = nodes.find((n) => n.id.includes("kailash"));
              if (kailashNode) setSelectedNode(kailashNode);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "BENAMI"
                ? "bg-amber-700 text-white shadow-sm"
                : "bg-amber-50 hover:bg-amber-100 text-amber-800"
            }`}
          >
            <span className="material-symbols-outlined text-xs">join_inner</span>
            <span>Benami Phone Syndicate</span>
          </button>
        </div>

        {/* View Controls & Search */}
        <div className="flex items-center space-x-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-surface-container rounded-lg p-0.5 border border-outline-variant/30">
            <button
              onClick={handleZoomIn}
              className="w-7 h-7 flex items-center justify-center hover:bg-surface-container-high rounded text-slate-700 cursor-pointer"
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-sm">zoom_in</span>
            </button>
            <button
              onClick={handleZoomOut}
              className="w-7 h-7 flex items-center justify-center hover:bg-surface-container-high rounded text-slate-700 cursor-pointer"
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-sm">zoom_out</span>
            </button>
            <button
              onClick={handleResetZoom}
              className="w-7 h-7 flex items-center justify-center hover:bg-surface-container-high rounded text-slate-700 cursor-pointer"
              title="Reset Layout"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
            </button>
          </div>

          {/* Search Entity */}
          <div className="relative min-w-[200px]">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              placeholder="Search Entity, Scale ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface-container border border-outline-variant/40 rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Main Canvas & Evidence Dossier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-[580px]">
        {/* Interactive SVG Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="lg:col-span-3 bg-slate-950 rounded-2xl overflow-hidden shadow-inner relative flex flex-col border border-slate-800 cursor-grab active:cursor-grabbing select-none"
        >
          {/* Header watermark */}
          <div className="absolute top-3 left-4 z-10 pointer-events-none flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase">
              METRICA • Fraud & Syndicate Radar
            </span>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
              (Drag any node to reposition • Click to inspect)
            </span>
          </div>

          {/* Floating Graph Legend */}
          <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 text-[11px] space-y-1.5 text-slate-300 pointer-events-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Entity Key</span>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-600 border border-red-400"></span>
              <span>Tampered Scale / Syndicate Merchant</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-purple-600 border border-purple-400"></span>
              <span>Counterfeit Cloned Twin</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 border border-emerald-400"></span>
              <span>Certified Mandi Scale</span>
            </div>
            <div className="flex items-center space-x-2 pt-1 border-t border-slate-800">
              <span className="w-4 border-t-2 border-dashed border-red-500"></span>
              <span className="text-red-400 font-bold">Serial Clone Collision</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 border-t-2 border-dashed border-amber-500"></span>
              <span className="text-amber-400 font-bold">Benami Phone Ring</span>
            </div>
          </div>

          {/* Interactive SVG Render Canvas */}
          <svg
            ref={svgRef}
            className="w-full h-full min-h-[580px]"
            viewBox="0 0 1000 620"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Arrow markers */}
              <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
              </marker>
              <marker id="arrow-red" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
              </marker>
              <marker id="arrow-amber" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
              </marker>
              <filter id="glow-red" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ef4444" />
              </filter>
              <filter id="glow-purple" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#a855f7" />
              </filter>
            </defs>

            <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}>
              {/* 1. Render Topological Links */}
              {displayLinks.map((link, idx) => {
                const src = nodePositionMap.get(link.source);
                const tgt = nodePositionMap.get(link.target);
                if (!src || !tgt) return null;

                const isHighlight =
                  activeConnectedIds && activeConnectedIds.has(link.source) && activeConnectedIds.has(link.target);
                const isDimmed = activeConnectedIds && !isHighlight;

                const strokeColor = link.color || "#334155";
                const strokeWidth = link.isAnomaly ? 2.5 : 1.2;
                const strokeDash = link.dashed ? "6, 4" : "none";

                // Curve the Benami link cleanly over the top
                const isBenami = link.type === "BENAMI_LINK";
                const isCloneCollision = link.type === "SUSPICIOUS_CLONE";

                const midX = (src.x + tgt.x) / 2;
                const midY = isBenami ? 60 : (src.y + tgt.y) / 2;

                return (
                  <g key={`link-${idx}`} opacity={isDimmed ? 0.12 : 1}>
                    {isBenami ? (
                      <path
                        d={`M ${src.x} ${src.y} Q ${midX} 40 ${tgt.x} ${tgt.y}`}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDash}
                        markerEnd="url(#arrow-amber)"
                      />
                    ) : (
                      <line
                        x1={src.x}
                        y1={src.y}
                        x2={tgt.x}
                        y2={tgt.y}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDash}
                        markerEnd={
                          isCloneCollision
                            ? "url(#arrow-red)"
                            : "url(#arrow)"
                        }
                      />
                    )}

                    {/* Prominent badge for key fraud syndicate anomalies */}
                    {isBenami && (
                      <g transform={`translate(${midX}, 40)`}>
                        <rect
                          x="-175"
                          y="-10"
                          width="350"
                          height="20"
                          rx="4"
                          fill="#090d16"
                          stroke="#f59e0b"
                          strokeWidth="1.2"
                        />
                        <text
                          y="4"
                          fill="#fbbf24"
                          fontSize="9.5"
                          fontWeight="800"
                          textAnchor="middle"
                          className="font-mono tracking-wider pointer-events-none select-none"
                        >
                          ⚡ BENAMI PROXY TELECOM RING (+91 98110-84729)
                        </text>
                      </g>
                    )}

                    {isCloneCollision && (
                      <g transform={`translate(${midX}, ${midY - 14})`}>
                        <rect
                          x="-115"
                          y="-10"
                          width="230"
                          height="20"
                          rx="4"
                          fill="#090d16"
                          stroke="#ef4444"
                          strokeWidth="1.2"
                        />
                        <text
                          y="4"
                          fill="#f87171"
                          fontSize="9"
                          fontWeight="800"
                          textAnchor="middle"
                          className="font-mono tracking-wider pointer-events-none select-none"
                        >
                          🚨 DUPLICATE SERIAL CLONE
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* 2. Render Nodes */}
              {displayNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isHovered = hoveredNodeId === node.id;
                const isConnected = activeConnectedIds ? activeConnectedIds.has(node.id) : true;
                const opacity = activeConnectedIds ? (isConnected ? 1 : 0.25) : 1;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    opacity={opacity}
                    cursor="pointer"
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggedNodeId(node.id);
                    }}
                  >
                    {/* Calm, static highlighted ring for flagged nodes */}
                    {node.isFlagged && (
                      <circle
                        r={node.radius + 6}
                        fill="none"
                        stroke={node.type === "CLONE" ? "#c084fc" : "#ef4444"}
                        strokeWidth="2"
                        strokeDasharray="4, 3"
                        opacity="0.85"
                      />
                    )}

                    {/* Node Circle */}
                    <circle
                      r={node.radius}
                      fill={node.color}
                      stroke={isSelected ? "#ffffff" : isHovered ? "#38bdf8" : node.strokeColor}
                      strokeWidth={isSelected ? 3.5 : 2}
                      filter={
                        node.type === "CLONE"
                          ? "url(#glow-purple)"
                          : node.isFlagged
                          ? "url(#glow-red)"
                          : "none"
                      }
                    />

                    {/* Node Type Glyph */}
                    <text
                      textAnchor="middle"
                      dy="4"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="900"
                      className="pointer-events-none select-none font-mono"
                    >
                      {node.type === "CLONE"
                        ? "CLONE"
                        : node.type === "TRADER"
                        ? "BIZ"
                        : node.type === "COMPLAINT"
                        ? "!"
                        : node.type === "CIRCLE"
                        ? "HUB"
                        : "SCALE"}
                    </text>

                    {/* Clean Node Label Below */}
                    <g transform={`translate(0, ${node.radius + 14})`}>
                      <text
                        textAnchor="middle"
                        fill={isSelected ? "#38bdf8" : "#f1f5f9"}
                        fontSize={isSelected ? "11" : "9.5"}
                        fontWeight={isSelected ? "800" : "600"}
                        className="pointer-events-none select-none drop-shadow-md"
                      >
                        {node.label.length > 22 ? node.label.slice(0, 20) + "..." : node.label}
                      </text>
                    </g>

                    {/* Risk Tag */}
                    {node.riskScore > 0 && (
                      <text
                        textAnchor="middle"
                        dy={node.radius + 26}
                        fill={node.riskScore >= 70 ? "#f87171" : "#38bdf8"}
                        fontSize="8.5"
                        fontWeight="700"
                        className="pointer-events-none select-none font-mono"
                      >
                        Risk: {node.riskScore}/100
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Right Forensic Evidence Dossier */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-sm flex flex-col space-y-3.5 overflow-hidden">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
            <div>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">security</span>
                <span>Forensic Intelligence Dossier</span>
              </h3>
              <p className="text-[11px] text-on-surface-variant">Topological Fraud & Syndicate Radar</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
              RADAR
            </span>
          </div>

          {selectedNode ? (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {/* Header Box */}
              <div
                className={`p-3 rounded-xl border space-y-1.5 ${
                  selectedNode.type === "CLONE"
                    ? "bg-purple-50/50 border-purple-300"
                    : selectedNode.isFlagged
                    ? "bg-error/10 border-error/30"
                    : "bg-surface-container border-outline-variant/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white font-mono">
                    {selectedNode.type}
                  </span>
                  <span
                    className={`text-xs font-extrabold ${
                      selectedNode.riskScore >= 70 ? "text-error" : "text-emerald-700"
                    }`}
                  >
                    Risk Score: {selectedNode.riskScore}/100
                  </span>
                </div>
                <h4 className="text-sm font-bold text-on-surface">{selectedNode.label}</h4>
                {selectedNode.sublabel && (
                  <p className="text-xs text-on-surface-variant leading-snug">{selectedNode.sublabel}</p>
                )}
              </div>

              {/* Forensic Anomaly Alert Callout */}
              {selectedNode.type === "CLONE" && (
                <div className="p-3 bg-purple-900 text-purple-100 rounded-xl space-y-2 border border-purple-700">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-200">
                    <span className="material-symbols-outlined text-base text-purple-300">warning</span>
                    CRIMINAL CLONED TWIN COLLISION
                  </div>
                  <p className="text-[11px] leading-relaxed text-purple-200">
                    Serial number collision detected across state lines. This hardware scale is utilizing a photocopied
                    stamped digital identity registered to <b>Kailash Mandi Traders</b> in Azadpur.
                  </p>
                  <div className="bg-black/30 p-2 rounded-lg font-mono text-[10px] text-purple-300">
                    Collision Link: AZP-YRD-2024-992 &harr; IND-MET-2026-AZ02
                  </div>
                </div>
              )}

              {selectedNode.id.includes("kailash") && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5 text-amber-950">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <span className="material-symbols-outlined text-base text-amber-700">join_inner</span>
                    BENAMI BENEFICIAL PROXY SYNDICATE
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-900">
                    Graph traversal detected shared telecom credentials (+91 98110-84729) and shell address linkages
                    between <b>Kailash Mandi Traders</b> (Azadpur) and <b>Baldev Wholesalers</b> (Ghazipur).
                  </p>
                </div>
              )}

              {selectedNode.id.includes("baldev") && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5 text-amber-950">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <span className="material-symbols-outlined text-base text-amber-700">join_inner</span>
                    BENAMI BENEFICIAL PROXY SYNDICATE
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-900">
                    Linked to <b>Kailash Mandi Traders</b> via identical telecom contact records (+91 98110-84729) and proxy ownership chains.
                  </p>
                </div>
              )}

              {/* Entity Attribute Grid */}
              <div className="bg-surface-container rounded-xl p-3 space-y-2 text-xs border border-outline-variant/30">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Registry Telemetry
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-on-surface-variant/70 text-[10px] block">Degree Ties</span>
                    <span className="font-bold text-on-surface">
                      {allLinks.filter((l) => l.source === selectedNode.id || l.target === selectedNode.id).length} Links
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant/70 text-[10px] block">Jurisdiction</span>
                    <span className="font-bold text-on-surface">
                      {selectedNode.details?.jurisdictionCircle || "National Network"}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant/70 text-[10px] block">Serial Stamp</span>
                    <span className="font-bold font-mono text-on-surface truncate block">
                      {selectedNode.details?.serialNumber || selectedNode.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant/70 text-[10px] block">Statutory Seal</span>
                    <span className="font-bold text-on-surface">
                      {selectedNode.details?.currentSealNumber || "SEAL-MET-2026-X"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statutory Enforcement Actions */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Enforcement Actions (Legal Metrology Act 2009)
                </span>
                <button
                  onClick={() => handleDispatchSyndicateRaid(selectedNode)}
                  className="w-full py-2 px-3 rounded-xl bg-error hover:bg-error/90 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">local_police</span>
                  Dispatch Dual Section 25 Raid
                </button>
                <button
                  onClick={() => handleFreezePassport(selectedNode)}
                  className="w-full py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Freeze Digital Twin QR Seal
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-on-surface-variant space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 shadow-sm">
                <span className="material-symbols-outlined text-3xl">hub</span>
              </div>
              <h4 className="font-bold text-sm text-on-surface">Select Any Graph Node</h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Click any merchant, scale, cloned twin, or hub in the topological map to review multi-hop fraud links and enforcement actions.
              </p>
              <div className="w-full pt-4 border-t border-outline-variant/20 text-left space-y-2 text-[11px]">
                <b className="text-on-surface block">Active Fraud Hotspots to inspect:</b>
                <div
                  onClick={() => {
                    setViewMode("CLONES");
                    const clone = nodes.find((n) => n.type === "CLONE");
                    if (clone) setSelectedNode(clone);
                  }}
                  className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 cursor-pointer font-medium flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-700 text-base">content_copy</span>
                    <div>
                      <span className="font-bold block text-xs text-purple-950">🚨 Cloned Serial Collision</span>
                      <span className="text-[10px] text-purple-700">AZP-YRD-2024-992 Duplicate Twin</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-800">&rarr;</span>
                </div>

                <div
                  onClick={() => {
                    setViewMode("BENAMI");
                    const kailash = nodes.find((n) => n.id.includes("kailash"));
                    if (kailash) setSelectedNode(kailash);
                  }}
                  className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 cursor-pointer font-medium flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-700 text-base">join_inner</span>
                    <div>
                      <span className="font-bold block text-xs text-amber-950">⚡ Benami Syndicate Ring</span>
                      <span className="text-[10px] text-amber-800">Shared Phone: +91 98110-84729</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-800">&rarr;</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
