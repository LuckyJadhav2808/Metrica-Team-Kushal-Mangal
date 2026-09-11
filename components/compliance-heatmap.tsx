"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useMetrica } from "@/lib/store";
import { Instrument } from "@/lib/types";

// District circles and APMC hub center coordinates in Pune, Maharashtra
export interface MandiHubCoord {
  id: string;
  name: string;
  circle: string;
  lat: number;
  lng: number;
  pincode: string;
  description: string;
  activeScalesCount: number;
}

export const PUNE_HUBS: Record<string, MandiHubCoord> = {
  KOTHRUD: {
    id: "KOTHRUD",
    name: "Kothrud & Karve Road Commercial Circle",
    circle: "Pune West District Circle",
    lat: 18.5074,
    lng: 73.8077,
    pincode: "411038",
    description: "Retail markets, Paud Road commercial establishments, gold jewellers & retail counter scales",
    activeScalesCount: 4,
  },
  BANER: {
    id: "BANER",
    name: "Baner & Balewadi Trade Hub",
    circle: "Pune North-West District Circle",
    lat: 18.5590,
    lng: 73.7868,
    pincode: "411045",
    description: "High-density retail supermarkets, logistics centers & IT corridor commercial balances",
    activeScalesCount: 3,
  },
  HADAPSAR: {
    id: "HADAPSAR",
    name: "Hadapsar APMC Wholesale Mandi",
    circle: "Pune East District Circle",
    lat: 18.5089,
    lng: 73.9259,
    pincode: "411028",
    description: "Pune East primary agro-produce APMC wholesale market, grain elevators & heavy weighbridges",
    activeScalesCount: 4,
  },
  AUNDH: {
    id: "AUNDH",
    name: "Aundh & University Sector",
    circle: "Pune North District Circle",
    lat: 18.5580,
    lng: 73.8075,
    pincode: "411007",
    description: "Departmental chains, analytical balances & pharmaceutical precision measuring devices",
    activeScalesCount: 3,
  },
  SINHGAD: {
    id: "SINHGAD",
    name: "Sinhgad Road & Dhayari Agro-Belt",
    circle: "Pune South District Circle",
    lat: 18.4715,
    lng: 73.8242,
    pincode: "411051",
    description: "Wholesale produce distribution, building material weighbridges & agro-feed centers",
    activeScalesCount: 2,
  },
};

// Offset generator to place individual instruments within their Pune hub radius
function getCoordinatesForInstrument(inst: Instrument, index: number): [number, number] {
  const hubsList = Object.values(PUNE_HUBS);
  let base = hubsList[index % hubsList.length];

  const circle = (inst.jurisdictionCircle || "").toLowerCase();
  const address = (inst.ownerAddress || "").toLowerCase();
  const id = (inst.digitalInstrumentId || "").toLowerCase();
  const pin = inst.pincode || "";

  if (address.includes("kothrud") || circle.includes("west") || pin === "411038" || id.includes("az01") || id.includes("az02")) {
    base = PUNE_HUBS.KOTHRUD;
  } else if (address.includes("baner") || circle.includes("north-west") || pin === "411045" || id.includes("az03") || id.includes("55201")) {
    base = PUNE_HUBS.BANER;
  } else if (address.includes("hadapsar") || circle.includes("east") || pin === "411028" || id.includes("az04") || id.includes("50t")) {
    base = PUNE_HUBS.HADAPSAR;
  } else if (address.includes("aundh") || circle.includes("north") || pin === "411007" || id.includes("plt") || id.includes("carat")) {
    base = PUNE_HUBS.AUNDH;
  } else if (address.includes("sinhgad") || circle.includes("south") || pin === "411051" || id.includes("grain") || id.includes("dispenser")) {
    base = PUNE_HUBS.SINHGAD;
  }

  // Jitter slightly based on golden angle dispersion so markers don't stack
  const angle = (index * 137.5 * Math.PI) / 180;
  const radius = 0.0035 + (index % 5) * 0.002; // ~350 to 950 meters radius
  const lat = base.lat + radius * Math.cos(angle);
  const lng = base.lng + (radius * Math.sin(angle)) * 1.05;

  return [lat, lng];
}

export function ComplianceHeatmap() {
  const { instruments, complaints } = useMetrica();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  // Filter states
  const [selectedCircle, setSelectedCircle] = useState<string>("ALL");
  const [selectedLayer, setSelectedLayer] = useState<"ALL" | "CRITICAL" | "EXPIRED" | "COMPLAINTS" | "VERIFIED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [isLeafletReady, setIsLeafletReady] = useState(false);

  // Real-Time GIS & API Key states
  const [mapApiKey, setMapApiKey] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("metrica_map_api_key") ||
        process.env.NEXT_PUBLIC_MAP_API_KEY ||
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
        ""
      );
    }
    return process.env.NEXT_PUBLIC_MAP_API_KEY || "";
  });
  const [activeLayerType, setActiveLayerType] = useState<"CARTO" | "SATELLITE_HYBRID" | "MAPBOX_REALTIME">("CARTO");
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(mapApiKey);
  const [isRealTimeRadarActive, setIsRealTimeRadarActive] = useState(true);
  const [lastTelemetryTimestamp, setLastTelemetryTimestamp] = useState<string>("Just now");

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
      // 1. Circle filter (Pune Divisions)
      if (selectedCircle !== "ALL") {
        const circleKey = selectedCircle.toUpperCase();
        const hub = PUNE_HUBS[circleKey];
        if (hub) {
          const matchCircle = inst.jurisdictionCircle?.toLowerCase().includes(selectedCircle.toLowerCase());
          const matchAddress = inst.ownerAddress?.toLowerCase().includes(selectedCircle.toLowerCase());
          const matchPincode = inst.pincode === hub.pincode;
          if (!matchCircle && !matchAddress && !matchPincode) return false;
        }
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

  // Periodic Telemetry Simulation
  useEffect(() => {
    if (!isRealTimeRadarActive) return;
    const interval = setInterval(() => {
      const now = new Date();
      setLastTelemetryTimestamp(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 8000);
    return () => clearInterval(interval);
  }, [isRealTimeRadarActive]);

  // Update Tile Layer dynamically when activeLayerType or mapApiKey changes
  const applyTileLayer = async (L: any, map: any, layerType: string, apiKey: string) => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    let layer: any;

    if (layerType === "SATELLITE_HYBRID") {
      // High-resolution Satellite Imagery (Esri World Imagery) with street overlay
      layer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
          maxZoom: 19,
        }
      );
    } else if (layerType === "MAPBOX_REALTIME" && apiKey.trim()) {
      // Mapbox / Vector Real-Time Tile Service with API Key
      layer = L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${apiKey.trim()}`,
        {
          attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
          tileSize: 512,
          zoomOffset: -1,
          maxZoom: 20,
        }
      );
    } else {
      // Clean Institutional CartoDB Voyager Tile Layer
      layer = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      });
    }

    layer.addTo(map);
    tileLayerRef.current = layer;
  };

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
        // Initialize Map centered on Pune, Maharashtra (18.5204, 73.8567)
        const map = L.map(mapContainerRef.current, {
          center: [18.5204, 73.8467],
          zoom: 12,
          zoomControl: false,
        });

        // Add custom Zoom control at top-right
        L.control.zoom({ position: "topright" }).addTo(map);

        // Apply selected tile layer
        await applyTileLayer(L, map, activeLayerType, mapApiKey);

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

  // Effect to change tile layer when user toggles or changes API key
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current) return;
    import("leaflet").then((L) => {
      applyTileLayer(L, mapInstanceRef.current, activeLayerType, mapApiKey);
    });
  }, [activeLayerType, mapApiKey, isLeafletReady]);

  // Update map markers whenever filteredInstruments changes or Leaflet becomes ready
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current || !markersLayerRef.current) return;

    let isMounted = true;

    async function updateMarkers() {
      const L = await import("leaflet");
      if (!isMounted) return;

      const markersLayer = markersLayerRef.current;
      markersLayer.clearLayers();

      // 1. Add Pune Regional Hub Perimeter Circles
      Object.values(PUNE_HUBS).forEach((hub) => {
        const hubCircle = L.circle([hub.lat, hub.lng], {
          radius: 1400,
          color: "#1e3a8a",
          weight: 1.5,
          dashArray: "5, 6",
          fillColor: "#3b82f6",
          fillOpacity: 0.06,
        });

        const hubTooltip = `
          <div style="font-family: inherit; font-size: 11px; padding: 2px;">
            <b style="color: #1e3a8a;">${hub.name}</b><br/>
            <span style="color: #475569;">${hub.circle} • PIN: ${hub.pincode}</span><br/>
            <span style="color: #64748b; font-size: 10px;">${hub.description}</span>
          </div>
        `;
        hubCircle.bindTooltip(hubTooltip, { sticky: true, className: "pune-hub-tooltip" });
        markersLayer.addLayer(hubCircle);

        // Concentric live pulse radar ring if real-time radar is active
        if (isRealTimeRadarActive) {
          const radarRing = L.circle([hub.lat, hub.lng], {
            radius: 2000,
            color: "#60a5fa",
            weight: 1,
            dashArray: "2, 8",
            fillColor: "#93c5fd",
            fillOpacity: 0.02,
          });
          markersLayer.addLayer(radarRing);
        }
      });

      // 2. Add Instrument Markers with status colors
      filteredInstruments.forEach((inst, index) => {
        const [lat, lng] = getCoordinatesForInstrument(inst, index);

        const isCritical = inst.priorityFlag === "CRITICAL" || inst.status === "SUSPENDED_TAMPERED" || inst.riskScore >= 70;
        const isExpired = inst.status === "EXPIRED" || (inst.validUntil && new Date(inst.validUntil) < new Date());
        const isWarning = inst.priorityFlag === "HIGH" || inst.status === "EXPIRING_SOON" || inst.riskScore >= 45;

        let markerColor = "#16a34a"; // Green (Verified Active)
        let statusText = "VERIFIED ACTIVE";

        if (isCritical) {
          markerColor = "#dc2626"; // Red (Critical / Tampered)
          statusText = inst.status === "SUSPENDED_TAMPERED" ? "TAMPERED / SUSPENDED" : "CRITICAL FRAUD RISK";
        } else if (isExpired) {
          markerColor = "#ea580c"; // Orange (Expired)
          statusText = "EXPIRED SEAL";
        } else if (isWarning) {
          markerColor = "#d97706"; // Amber (High Risk)
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
              <span style="font-weight: 800; font-size: 12px; color: #1e3a8a; letter-spacing: 0.5px;">${inst.digitalInstrumentId}</span>
              <span style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${
                isCritical ? "#fee2e2; color: #b91c1c;" : isExpired ? "#ffedd5; color: #c2410c;" : "#dcfce7; color: #15803d;"
              }">${statusText}</span>
            </div>
            <div style="font-size: 11px; color: #1e293b; margin-bottom: 4px;">
              <b>Establishment:</b> ${inst.ownerName || "Merchant Establishment"}
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
              <a href="/qr/${encodeURIComponent(inst.digitalInstrumentId)}" target="_blank" style="flex: 1; text-align: center; background: #1e3a8a; color: #ffffff; text-decoration: none; padding: 5px 8px; border-radius: 6px; font-size: 10px; font-weight: 600;">
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
  }, [filteredInstruments, isLeafletReady, isRealTimeRadarActive]);

  // Center map on a specific Pune hub
  const handleFocusMandi = (hubKey: keyof typeof PUNE_HUBS) => {
    if (!mapInstanceRef.current) return;
    const hub = PUNE_HUBS[hubKey];
    mapInstanceRef.current.flyTo([hub.lat, hub.lng], 14, { duration: 1.2 });
  };

  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([18.5204, 73.8467], 12, { duration: 1.0 });
  };

  // Save user API key
  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = tempApiKey.trim();
    setMapApiKey(cleanKey);
    if (typeof window !== "undefined") {
      localStorage.setItem("metrica_map_api_key", cleanKey);
    }
    if (cleanKey) {
      setActiveLayerType("MAPBOX_REALTIME");
    }
    setIsApiKeyModalOpen(false);
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
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Pune Scales</span>
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

      {/* Control Strip: Pune Circles, Layer Toggles, Search & Real-Time API Key Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Circle Selector (Pune Local Divisions) */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-primary">location_on</span>
            Pune Division:
          </span>
          <select
            value={selectedCircle}
            onChange={(e) => setSelectedCircle(e.target.value)}
            className="text-xs bg-surface-container border border-outline-variant/40 rounded-lg px-2.5 py-1.5 font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Pune Mandi Hubs (5 Divisions)</option>
            <option value="KOTHRUD">Kothrud & Karve Rd (Pune West)</option>
            <option value="BANER">Baner & Balewadi (Pune North-West)</option>
            <option value="HADAPSAR">Hadapsar APMC Mandi (Pune East)</option>
            <option value="AUNDH">Aundh & University Sector (Pune North)</option>
            <option value="SINHGAD">Sinhgad Road & Dhayari (Pune South)</option>
          </select>
        </div>

        {/* Real-time Map Stream & API Key Controls */}
        <div className="flex items-center space-x-2">
          {/* Tile Layer Selector */}
          <div className="flex items-center bg-surface border border-outline-variant/40 rounded-lg p-0.5 text-[11px] font-semibold">
            <button
              onClick={() => setActiveLayerType("CARTO")}
              className={`px-2 py-1 rounded-md transition-all ${
                activeLayerType === "CARTO" ? "bg-primary text-white shadow-xs" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Voyager
            </button>
            <button
              onClick={() => setActiveLayerType("SATELLITE_HYBRID")}
              className={`px-2 py-1 rounded-md transition-all ${
                activeLayerType === "SATELLITE_HYBRID" ? "bg-primary text-white shadow-xs" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => {
                if (!mapApiKey) {
                  setIsApiKeyModalOpen(true);
                } else {
                  setActiveLayerType("MAPBOX_REALTIME");
                }
              }}
              className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
                activeLayerType === "MAPBOX_REALTIME" ? "bg-primary text-white shadow-xs" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>Mapbox Live</span>
              {mapApiKey ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              ) : (
                <span className="text-[9px] px-1 bg-amber-500/20 text-amber-700 rounded">Key</span>
              )}
            </button>
          </div>

          {/* API Key Modal Button */}
          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            className="px-2.5 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 rounded-lg text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors"
            title="Configure Real-time Map API Key (Mapbox / MapTiler)"
          >
            <span className="material-symbols-outlined text-[15px] text-primary">vpn_key</span>
            <span>{mapApiKey ? "API Key Configured" : "Add Map API Key"}</span>
          </button>

          {/* Real-time Radar Pulse Toggle */}
          <button
            onClick={() => setIsRealTimeRadarActive(!isRealTimeRadarActive)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              isRealTimeRadarActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-surface-container text-on-surface-variant border-outline-variant/40"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isRealTimeRadarActive ? "bg-emerald-600 animate-ping" : "bg-slate-400"}`}></span>
            <span>{isRealTimeRadarActive ? "Live GPS Radar ON" : "Radar Paused"}</span>
          </button>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[200px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Search Pune ID, Shop, Kothrud..."
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
          {/* Quick Pune Places Jump Buttons Floating Bar */}
          <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md border border-outline-variant/40 rounded-xl p-1.5 shadow-md flex items-center space-x-1 flex-wrap gap-y-1">
            <span className="text-[10px] font-bold text-slate-500 px-2 uppercase tracking-wider">Pune Places:</span>
            <button
              onClick={() => handleFocusMandi("KOTHRUD")}
              className="text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Kothrud
            </button>
            <button
              onClick={() => handleFocusMandi("BANER")}
              className="text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Baner
            </button>
            <button
              onClick={() => handleFocusMandi("HADAPSAR")}
              className="text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Hadapsar
            </button>
            <button
              onClick={() => handleFocusMandi("AUNDH")}
              className="text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Aundh
            </button>
            <button
              onClick={() => handleFocusMandi("SINHGAD")}
              className="text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Sinhgad
            </button>
            <button
              onClick={handleResetView}
              title="Reset Pune City Overview"
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors ml-1"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
            </button>
          </div>

          {/* Real-Time Live Status Pill Overlay */}
          <div className="absolute top-3 right-12 z-[400] bg-slate-900/90 text-white backdrop-blur-md border border-slate-700 rounded-xl px-3 py-1.5 shadow-md flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200">Pune GIS Telemetry:</span>
            <span className="font-mono text-emerald-400 font-bold">{lastTelemetryTimestamp}</span>
          </div>

          {/* Map Container */}
          <div ref={mapContainerRef} className="w-full h-full min-h-[550px] z-0 flex-1"></div>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md border border-outline-variant/40 rounded-xl p-2.5 shadow-md text-xs space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Compliance Key (Pune)</span>
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
                <span>Pune Mandi Docket</span>
              </h3>
              <p className="text-[11px] text-on-surface-variant">Showing {filteredInstruments.length} geocoded scales</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/30">
              Live Pune Sync
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
                      <span>{inst.ownerAddress || inst.jurisdictionCircle}</span>
                      <span className="font-semibold">Risk: {inst.riskScore}/100</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Map API Key Configuration Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-2xl">map</span>
                <div>
                  <h3 className="font-bold text-base text-on-surface">GIS Real-Time Map Key</h3>
                  <p className="text-xs text-on-surface-variant">Connect Mapbox, MapTiler, or Geoapify</p>
                </div>
              </div>
              <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveApiKey} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-surface-container rounded-xl text-[11px] text-on-surface-variant leading-relaxed">
                Enter your <strong>Mapbox Access Token</strong> (or MapTiler key). The map will immediately switch to live high-definition vector tiles. If left empty, the map runs on CartoDB / Esri Satellite zero-config streams.
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">
                  API Key / Access Token:
                </label>
                <input
                  type="text"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="pk.eyJ1IjoieW91ci11c2VyIi..."
                  className="w-full px-3 py-2 border border-outline-variant rounded-xl bg-surface text-on-surface text-xs font-mono outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTempApiKey("");
                    setMapApiKey("");
                    if (typeof window !== "undefined") localStorage.removeItem("metrica_map_api_key");
                    setActiveLayerType("CARTO");
                    setIsApiKeyModalOpen(false);
                  }}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Clear Key (Use Default)
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsApiKeyModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/90"
                  >
                    Save & Stream
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
