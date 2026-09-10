"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useMetrica } from "@/lib/store";
import { Instrument, Complaint } from "@/lib/types";

// District circles and APMC hub center coordinates in Delhi NCR
interface MandiHubCoord {
  name: string;
  circle: string;
  lat: number;
  lng: number;
  pincode: string;
  description: string;
}

const MANDI_HUBS: Record<string, MandiHubCoord> = {
  AZADPUR: {
    name: "Azadpur APMC Fruit & Vegetable Mandi",
    circle: "Delhi North District Circle",
    lat: 28.7130,
    lng: 77.1770,
    pincode: "110033",
    description: "Asia's largest wholesale produce market (High density of commercial scales)",
  },
  CHANDNI_CHOWK: {
    name: "Chandni Chowk & Daryaganj Trade Hub",
    circle: "Delhi Central District Circle",
    lat: 28.6507,
    lng: 77.2334,
    pincode: "110006",
    description: "Gold, jewelry, spices, and legacy dry fruit commercial establishments",
  },
  GHAZIPUR: {
    name: "Ghazipur Wholesale Mandi & Mayur Vihar",
    circle: "Delhi East District Circle",
    lat: 28.6258,
    lng: 77.3275,
    pincode: "110096",
    description: "Dairy, livestock, poultry, and eastern perimeter weighbridges",
  },
  OKHLA: {
    name: "Okhla Industrial & APMC Grain Hub",
    circle: "Delhi South District Circle",
    lat: 28.5355,
    lng: 77.2732,
    pincode: "110020",
    description: "Grain wholesale traders, vehicle weighbridges, cold storage scales",
  },
  NAJAFGARH: {
    name: "Najafgarh Grain Mandi & Punjabi Bagh Hub",
    circle: "Delhi West District Circle",
    lat: 28.6127,
    lng: 76.9855,
    pincode: "110043",
    description: "Western agrarian trade node, bulk agricultural scales, platform weighers",
  },
};

// Offset generator to place individual instruments within their Mandi hub radius
function getCoordinatesForInstrument(inst: Instrument, index: number): [number, number] {
  let base = MANDI_HUBS.AZADPUR;
  const circle = (inst.jurisdictionCircle || "").toLowerCase();
  const address = (inst.ownerAddress || "").toLowerCase();
  const pin = inst.pincode || "";

  if (circle.includes("east") || pin === "110096" || pin === "110092" || address.includes("ghazipur")) {
    base = MANDI_HUBS.GHAZIPUR;
  } else if (circle.includes("central") || pin === "110006" || address.includes("chandni") || address.includes("daryaganj")) {
    base = MANDI_HUBS.CHANDNI_CHOWK;
  } else if (circle.includes("south") || pin === "110020" || pin === "110019" || address.includes("okhla")) {
    base = MANDI_HUBS.OKHLA;
  } else if (circle.includes("west") || pin === "110043" || pin === "110026" || address.includes("najafgarh")) {
    base = MANDI_HUBS.NAJAFGARH;
  }

  // Jitter slightly based on index so pins don't overlap exactly
  const angle = (index * 137.5 * Math.PI) / 180; // Golden angle dispersion
  const radius = 0.003 + (index % 5) * 0.0018; // ~300 to 900 meters radius
  const lat = base.lat + radius * Math.cos(angle);
  const lng = base.lng + (radius * Math.sin(angle)) * 1.1; // adjust for longitude aspect ratio

  return [lat, lng];
}

export function ComplianceHeatmap() {
  const { instruments, complaints } = useMetrica();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  // Filter states
  const [selectedCircle, setSelectedCircle] = useState<string>("ALL");
  const [selectedLayer, setSelectedLayer] = useState<"ALL" | "CRITICAL" | "EXPIRED" | "COMPLAINTS" | "VERIFIED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [isLeafletReady, setIsLeafletReady] = useState(false);

  // Compute spatial statistics
  const spatialStats = useMemo(() => {
    const total = instruments.length;
    const critical = instruments.filter(
      (i) => i.priorityFlag === "CRITICAL" || i.status === "SUSPENDED_TAMPERED" || i.riskScore >= 75
    ).length;
    const expired = instruments.filter(
      (i) => i.status === "EXPIRED" || (i.validUntil && new Date(i.validUntil) < new Date())
    ).length;
    const complaintsCount = complaints.filter(
      (c) => c.status === "LOGGED" || c.status === "UNDER_INVESTIGATION"
    ).length;
    const verifiedActive = instruments.filter((i) => i.status === "VERIFIED_ACTIVE").length;
    return { total, critical, expired, complaintsCount, verifiedActive };
  }, [instruments, complaints]);

  // Filter instruments based on user selection
  const filteredInstruments = useMemo(() => {
    return instruments.filter((inst) => {
      // 1. Circle filter
      if (selectedCircle !== "ALL") {
        const circleKey = selectedCircle.toLowerCase();
        if (circleKey === "north" && !inst.jurisdictionCircle.toLowerCase().includes("north")) return false;
        if (circleKey === "central" && !inst.jurisdictionCircle.toLowerCase().includes("central")) return false;
        if (circleKey === "east" && !inst.jurisdictionCircle.toLowerCase().includes("east")) return false;
        if (circleKey === "south" && !inst.jurisdictionCircle.toLowerCase().includes("south")) return false;
        if (circleKey === "west" && !inst.jurisdictionCircle.toLowerCase().includes("west")) return false;
      }

      // 2. Layer filter
      if (selectedLayer === "CRITICAL") {
        if (inst.priorityFlag !== "CRITICAL" && inst.status !== "SUSPENDED_TAMPERED" && inst.riskScore < 70) return false;
      } else if (selectedLayer === "EXPIRED") {
        const isPast = inst.validUntil ? new Date(inst.validUntil) < new Date() : false;
        if (inst.status !== "EXPIRED" && !isPast) return false;
      } else if (selectedLayer === "VERIFIED") {
        if (inst.status !== "VERIFIED_ACTIVE") return false;
      } else if (selectedLayer === "COMPLAINTS") {
        const hasComplaint = complaints.some(
          (c) => c.digitalInstrumentId === inst.digitalInstrumentId || c.instrumentId === inst.id
        );
        if (!hasComplaint) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = inst.digitalInstrumentId.toLowerCase().includes(q);
        const matchesOwner = (inst.ownerName || "").toLowerCase().includes(q);
        const matchesSerial = inst.serialNumber.toLowerCase().includes(q);
        const matchesAddress = (inst.ownerAddress || "").toLowerCase().includes(q);
        if (!matchesId && !matchesOwner && !matchesSerial && !matchesAddress) return false;
      }

      return true;
    });
  }, [instruments, complaints, selectedCircle, selectedLayer, searchQuery]);

  // Load Leaflet dynamically on the client
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      // Inject Leaflet CSS if not present
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const L = await import("leaflet");

      if (!isMounted) return;

      if (!mapInstanceRef.current && mapContainerRef.current) {
        // Initialize Map centered on Delhi NCR (28.6300, 77.1800)
        const map = L.map(mapContainerRef.current, {
          center: [28.6350, 77.1850],
          zoom: 11,
          zoomControl: false,
        });

        // Add custom Zoom control at top-right
        L.control.zoom({ position: "topright" }).addTo(map);

        // CartoDB Voyager Tile Layer (clean, high-legibility institutional styling)
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        }).addTo(map);

        // Group layer for markers
        const markersLayer = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
        markersLayerRef.current = markersLayer;
        setIsLeafletReady(true);
      }
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map markers whenever filteredInstruments changes or Leaflet becomes ready
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current || !markersLayerRef.current) return;

    let isMounted = true;

    async function updateMarkers() {
      const L = await import("leaflet");
      if (!isMounted) return;

      const markersLayer = markersLayerRef.current;
      markersLayer.clearLayers();

      // 1. Add Mandi Regional Hub Perimeter Circles
      Object.values(MANDI_HUBS).forEach((hub) => {
        const hubCircle = L.circle([hub.lat, hub.lng], {
          radius: 1200,
          color: "#1a4d8f",
          weight: 1.5,
          dashArray: "4, 6",
          fillColor: "#1a4d8f",
          fillOpacity: 0.05,
        });

        const hubTooltip = `
          <div style="font-family: inherit; font-size: 11px; padding: 2px;">
            <b style="color: #00366f;">${hub.name}</b><br/>
            <span style="color: #555;">${hub.circle} (PIN: ${hub.pincode})</span>
          </div>
        `;
        hubCircle.bindTooltip(hubTooltip, { sticky: true, className: "mandi-hub-tooltip" });
        markersLayer.addLayer(hubCircle);
      });

      // 2. Add Instrument Markers with status colors
      filteredInstruments.forEach((inst, index) => {
        const [lat, lng] = getCoordinatesForInstrument(inst, index);

        const isCritical = inst.priorityFlag === "CRITICAL" || inst.status === "SUSPENDED_TAMPERED" || inst.riskScore >= 70;
        const isExpired = inst.status === "EXPIRED" || (inst.validUntil && new Date(inst.validUntil) < new Date());
        const isWarning = inst.priorityFlag === "HIGH" || inst.status === "EXPIRING_SOON" || inst.riskScore >= 45;

        let markerColor = "#16a34a"; // Green (Verified Active)
        let pulseClass = "";
        let statusText = "VERIFIED ACTIVE";

        if (isCritical) {
          markerColor = "#dc2626"; // Red (Critical / Tampered)
          pulseClass = "leaflet-marker-pulse-critical";
          statusText = inst.status === "SUSPENDED_TAMPERED" ? "TAMPERED / SUSPENDED" : "CRITICAL FRAUD RISK";
        } else if (isExpired) {
          markerColor = "#ea580c"; // Orange (Expired)
          pulseClass = "leaflet-marker-pulse-warning";
          statusText = "EXPIRED SEAL";
        } else if (isWarning) {
          markerColor = "#d97706"; // Amber (High Risk)
          pulseClass = "leaflet-marker-pulse-warning";
          statusText = "ATTENTION REQUIRED";
        }

        // Custom HTML DivIcon
        const customIcon = L.divIcon({
          className: "custom-metrica-pin",
          html: `
            <div style="position: relative; width: 28px; height: 28px;">
              ${
                isCritical
                  ? `<div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(220, 38, 38, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                  : ""
              }
              <div style="
                width: 28px;
                height: 28px;
                border-radius: 9999px;
                background: ${markerColor};
                border: 2.5px solid #ffffff;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25);
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                font-size: 13px;
                font-weight: 700;
              ">
                ${isCritical ? "!" : isExpired ? "✕" : "✓"}
              </div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        // Build rich interactive popup
        const popupContent = `
          <div style="font-family: inherit; width: 240px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
              <span style="font-weight: 800; font-size: 12px; color: #00366f; letter-spacing: 0.5px;">${inst.digitalInstrumentId}</span>
              <span style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${
                isCritical ? "#fee2e2; color: #b91c1c;" : isExpired ? "#ffedd5; color: #c2410c;" : "#dcfce7; color: #15803d;"
              }">${statusText}</span>
            </div>
            <div style="font-size: 11px; color: #1e293b; margin-bottom: 4px;">
              <b>Establishment:</b> ${inst.ownerName || "Unassigned"}
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 6px; line-height: 1.3;">
              <b>Location:</b> ${inst.ownerAddress || inst.jurisdictionCircle}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; background: #f8fafc; padding: 6px; border-radius: 6px; font-size: 10px; margin-bottom: 8px;">
              <div>
                <span style="color: #64748b; display: block;">Risk Index</span>
                <b style="font-size: 12px; color: ${inst.riskScore >= 70 ? "#dc2626" : inst.riskScore >= 40 ? "#d97706" : "#16a34a"};">${inst.riskScore}/100</b>
              </div>
              <div>
                <span style="color: #64748b; display: block;">Trust Score</span>
                <b style="font-size: 12px; color: #0284c7;">${inst.trustScore}%</b>
              </div>
            </div>
            <div style="display: flex; gap: 6px;">
              <a href="/qr/${encodeURIComponent(inst.digitalInstrumentId)}" target="_blank" style="flex: 1; text-align: center; background: #00366f; color: #ffffff; text-decoration: none; padding: 5px 8px; border-radius: 6px; font-size: 10px; font-weight: 600;">
                Inspect QR
              </a>
              <a href="/admin?filter=HIGH_RISK" style="flex: 1; text-align: center; background: #e2e8f0; color: #1e293b; text-decoration: none; padding: 5px 8px; border-radius: 6px; font-size: 10px; font-weight: 600;">
                Audit Docket
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 280, className: "custom-leaflet-popup" });

        marker.on("click", () => {
          setSelectedInstrument(inst);
        });

        markersLayer.addLayer(marker);
      });
    }

    updateMarkers();

    return () => {
      isMounted = false;
    };
  }, [filteredInstruments, isLeafletReady]);

  // Center map on a specific Mandi hub
  const handleFocusMandi = (mandiKey: keyof typeof MANDI_HUBS) => {
    if (!mapInstanceRef.current) return;
    const hub = MANDI_HUBS[mandiKey];
    mapInstanceRef.current.flyTo([hub.lat, hub.lng], 14, { duration: 1.2 });
  };

  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([28.6350, 77.1850], 11, { duration: 1.0 });
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Spatial KPI Summary Bar (Interactive Filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setSelectedLayer("ALL")}
          className={`text-left bg-surface-container-lowest border rounded-xl p-3 shadow-xs transition-all cursor-pointer hover:scale-[1.01] ${
            selectedLayer === "ALL"
              ? "border-primary ring-2 ring-primary/20 bg-primary/5"
              : "border-outline-variant/30 hover:border-primary/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Geocoded Scales</span>
            <span className="material-symbols-outlined text-primary text-lg">pin_drop</span>
          </div>
          <p className="text-xl font-extrabold text-on-surface mt-1">{spatialStats.total}</p>
          <span className="text-[10px] text-primary font-medium">Click to show all (16)</span>
        </button>

        <button
          onClick={() => setSelectedLayer(selectedLayer === "CRITICAL" ? "ALL" : "CRITICAL")}
          className={`text-left bg-surface-container-lowest border rounded-xl p-3 shadow-xs transition-all cursor-pointer hover:scale-[1.01] ${
            selectedLayer === "CRITICAL"
              ? "border-error ring-2 ring-error/30 bg-error/10"
              : "border-error/20 hover:border-error/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-error uppercase tracking-wider">Critical / Tampered</span>
            <span className="material-symbols-outlined text-error text-lg animate-pulse">warning</span>
          </div>
          <p className="text-xl font-extrabold text-error mt-1">{spatialStats.critical}</p>
          <span className="text-[10px] text-error font-medium">
            {selectedLayer === "CRITICAL" ? "✓ Filter active (2)" : "Click to filter (2)"}
          </span>
        </button>

        <button
          onClick={() => setSelectedLayer(selectedLayer === "EXPIRED" ? "ALL" : "EXPIRED")}
          className={`text-left bg-surface-container-lowest border rounded-xl p-3 shadow-xs transition-all cursor-pointer hover:scale-[1.01] ${
            selectedLayer === "EXPIRED"
              ? "border-amber-600 ring-2 ring-amber-500/30 bg-amber-50"
              : "border-amber-500/20 hover:border-amber-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Expired Stamping</span>
            <span className="material-symbols-outlined text-amber-600 text-lg">event_busy</span>
          </div>
          <p className="text-xl font-extrabold text-amber-700 mt-1">{spatialStats.expired}</p>
          <span className="text-[10px] text-amber-700 font-medium">
            {selectedLayer === "EXPIRED" ? "✓ Filter active (5)" : "Click to filter (5)"}
          </span>
        </button>

        <button
          onClick={() => setSelectedLayer(selectedLayer === "COMPLAINTS" ? "ALL" : "COMPLAINTS")}
          className={`text-left bg-surface-container-lowest border rounded-xl p-3 shadow-xs transition-all cursor-pointer hover:scale-[1.01] ${
            selectedLayer === "COMPLAINTS"
              ? "border-rose-600 ring-2 ring-rose-500/30 bg-rose-50"
              : "border-rose-500/20 hover:border-rose-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Active Grievances</span>
            <span className="material-symbols-outlined text-rose-600 text-lg">report_problem</span>
          </div>
          <p className="text-xl font-extrabold text-rose-700 mt-1">{spatialStats.complaintsCount}</p>
          <span className="text-[10px] text-rose-700 font-medium">
            {selectedLayer === "COMPLAINTS" ? "✓ Filter active (4)" : "Click to filter (4)"}
          </span>
        </button>

        <button
          onClick={() => setSelectedLayer(selectedLayer === "VERIFIED" ? "ALL" : "VERIFIED")}
          className={`text-left bg-surface-container-lowest border rounded-xl p-3 shadow-xs transition-all cursor-pointer hover:scale-[1.01] ${
            selectedLayer === "VERIFIED"
              ? "border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50"
              : "border-emerald-500/20 hover:border-emerald-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Verified Active</span>
            <span className="material-symbols-outlined text-emerald-600 text-lg">verified</span>
          </div>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">{spatialStats.verifiedActive}</p>
          <span className="text-[10px] text-emerald-700 font-medium">
            {selectedLayer === "VERIFIED" ? "✓ Filter active" : "Click to filter"}
          </span>
        </button>
      </div>

      {/* Control Strip: Circles, Layer Toggles, Search & Hub Jump Buttons */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Circle Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-primary">location_on</span>
            Jurisdiction:
          </span>
          <select
            value={selectedCircle}
            onChange={(e) => setSelectedCircle(e.target.value)}
            className="text-xs bg-surface-container border border-outline-variant/40 rounded-lg px-2.5 py-1.5 font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Delhi NCR Mandis (5 Circles)</option>
            <option value="north">Delhi North (Azadpur APMC Hub)</option>
            <option value="central">Delhi Central (Chandni Chowk Hub)</option>
            <option value="east">Delhi East (Ghazipur Mandi Hub)</option>
            <option value="south">Delhi South (Okhla Industrial Hub)</option>
            <option value="west">Delhi West (Najafgarh Grain Hub)</option>
          </select>
        </div>

        {/* Risk Layer Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedLayer("ALL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              selectedLayer === "ALL"
                ? "bg-primary text-on-primary shadow-xs"
                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
            }`}
          >
            All Scales ({instruments.length})
          </button>
          <button
            onClick={() => setSelectedLayer("CRITICAL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              selectedLayer === "CRITICAL"
                ? "bg-error text-white shadow-xs"
                : "bg-error/10 hover:bg-error/20 text-error"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
            Critical / Tampered ({spatialStats.critical})
          </button>
          <button
            onClick={() => setSelectedLayer("EXPIRED")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              selectedLayer === "EXPIRED"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700"
            }`}
          >
            Expired ({spatialStats.expired})
          </button>
          <button
            onClick={() => setSelectedLayer("COMPLAINTS")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              selectedLayer === "COMPLAINTS"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-700"
            }`}
          >
            Grievances ({spatialStats.complaintsCount})
          </button>
          <button
            onClick={() => setSelectedLayer("VERIFIED")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              selectedLayer === "VERIFIED"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700"
            }`}
          >
            Verified Active ({spatialStats.verifiedActive})
          </button>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[200px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Search Scale ID or Merchant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface-container border border-outline-variant/40 rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Main Map Container & Quick Jump Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-[580px]">
        {/* Leaflet Map Visual Canvas */}
        <div className="lg:col-span-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm relative flex flex-col">
          {/* Quick Mandi Jump Buttons Floating Bar */}
          <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md border border-outline-variant/40 rounded-xl p-1.5 shadow-md flex items-center space-x-1">
            <span className="text-[10px] font-bold text-slate-500 px-2 uppercase tracking-wider">Quick Focus:</span>
            <button
              onClick={() => handleFocusMandi("AZADPUR")}
              className="text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Azadpur
            </button>
            <button
              onClick={() => handleFocusMandi("CHANDNI_CHOWK")}
              className="text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Chandni Chowk
            </button>
            <button
              onClick={() => handleFocusMandi("GHAZIPUR")}
              className="text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Ghazipur
            </button>
            <button
              onClick={() => handleFocusMandi("OKHLA")}
              className="text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Okhla
            </button>
            <button
              onClick={() => handleFocusMandi("NAJAFGARH")}
              className="text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Najafgarh
            </button>
            <button
              onClick={handleResetView}
              title="Reset Statewide View"
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
            </button>
          </div>

          {/* Map Container */}
          <div ref={mapContainerRef} className="w-full h-full min-h-[550px] z-0 flex-1"></div>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md border border-outline-variant/40 rounded-xl p-2.5 shadow-md text-xs space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Compliance Key</span>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-600 border border-white shadow-xs"></span>
              <span className="text-slate-700 font-medium">Critical / Tampered / Raid</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 border border-white shadow-xs"></span>
              <span className="text-slate-700 font-medium">Expired Stamping Overdue</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-xs"></span>
              <span className="text-slate-700 font-medium">Attention Required (30 Days)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white shadow-xs"></span>
              <span className="text-slate-700 font-medium">Form-A Verified Active</span>
            </div>
          </div>
        </div>

        {/* Right Detail / Hotspot List Drawer */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-sm flex flex-col space-y-3 overflow-hidden">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
            <div>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">analytics</span>
                <span>Active Mandi Docket</span>
              </h3>
              <p className="text-[11px] text-on-surface-variant">Showing {filteredInstruments.length} geocoded scales</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/30">
              Live GIS Sync
            </span>
          </div>

          {/* Selected Instrument Inspector Card */}
          {selectedInstrument ? (
            <div className="bg-primary-container/10 border border-primary/20 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-primary">{selectedInstrument.digitalInstrumentId}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  selectedInstrument.priorityFlag === "CRITICAL"
                    ? "bg-error/20 text-error"
                    : selectedInstrument.status === "EXPIRED"
                    ? "bg-amber-500/20 text-amber-700"
                    : "bg-emerald-500/20 text-emerald-700"
                }`}>
                  {selectedInstrument.status}
                </span>
              </div>
              <p className="text-xs font-bold text-on-surface">{selectedInstrument.ownerName || "Merchant Unknown"}</p>
              <p className="text-[11px] text-on-surface-variant leading-snug">{selectedInstrument.ownerAddress}</p>
              
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-outline-variant/20 text-[11px]">
                <div>
                  <span className="text-on-surface-variant/70 text-[10px] block">Model</span>
                  <span className="font-semibold text-on-surface">{selectedInstrument.modelName}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant/70 text-[10px] block">Serial No</span>
                  <span className="font-semibold text-on-surface">{selectedInstrument.serialNumber}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant/70 text-[10px] block">Risk Index</span>
                  <span className={`font-extrabold ${selectedInstrument.riskScore >= 70 ? "text-error" : "text-emerald-700"}`}>
                    {selectedInstrument.riskScore}/100
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant/70 text-[10px] block">Valid Until</span>
                  <span className="font-semibold text-on-surface">{selectedInstrument.validUntil || "Not Set"}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <a
                  href={`/qr/${encodeURIComponent(selectedInstrument.digitalInstrumentId)}`}
                  target="_blank"
                  className="flex-1 text-center py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-colors"
                >
                  View Public QR
                </a>
                <button
                  onClick={() => setSelectedInstrument(null)}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface-variant"
                >
                  Close
                </button>
              </div>
            </div>
          ) : null}

          {/* Scrollable list of filtered instruments */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[420px]">
            {filteredInstruments.length === 0 ? (
              <div className="text-center py-8 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-2xl text-on-surface-variant/50 mb-1 block">filter_alt_off</span>
                No scales match the active spatial filters.
              </div>
            ) : (
              filteredInstruments.map((inst) => {
                const isCrit = inst.priorityFlag === "CRITICAL" || inst.status === "SUSPENDED_TAMPERED" || inst.riskScore >= 70;
                const isExp = inst.status === "EXPIRED" || (inst.validUntil && new Date(inst.validUntil) < new Date());
                const instComplaints = complaints.filter(
                  (c) => c.digitalInstrumentId === inst.digitalInstrumentId || c.instrumentId === inst.id
                );

                return (
                  <div
                    key={inst.id}
                    onClick={() => setSelectedInstrument(inst)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer hover:border-primary/50 ${
                      selectedInstrument?.id === inst.id
                        ? "bg-primary-container/15 border-primary"
                        : "bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-on-surface">{inst.digitalInstrumentId}</span>
                      <div className="flex items-center gap-1.5">
                        {isCrit && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-error/15 text-error">
                            CRITICAL
                          </span>
                        )}
                        {isExp && !isCrit && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700">
                            EXPIRED
                          </span>
                        )}
                        {instComplaints.length > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-700">
                            {instComplaints.length} Grievance{instComplaints.length > 1 ? "s" : ""}
                          </span>
                        )}
                        <span className={`w-2 h-2 rounded-full ${isCrit ? "bg-red-600 animate-pulse" : isExp ? "bg-orange-500" : "bg-emerald-600"}`}></span>
                      </div>
                    </div>
                    <p className="text-[11px] text-on-surface-variant font-medium mt-0.5 truncate">{inst.ownerName}</p>
                    <div className="flex items-center justify-between text-[10px] text-on-surface-variant/70 mt-1">
                      <span>{inst.jurisdictionCircle.replace("Delhi ", "")}</span>
                      <span className="font-semibold">Risk: {inst.riskScore}/100</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
