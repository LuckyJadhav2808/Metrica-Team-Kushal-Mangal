"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useMetrica } from "@/lib/store";
import { Instrument } from "@/lib/types";
import {
  INDIAN_CITIES,
  CityId,
  MandiHub,
  getCityForInstrument,
  getCoordinatesForInstrument,
  getAllMandiHubs,
} from "@/lib/geo-config";

export function ComplianceHeatmap() {
  const { instruments, complaints } = useMetrica();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  // Filter states
  const [selectedCity, setSelectedCity] = useState<CityId>("DELHI");
  const [selectedCircle, setSelectedCircle] = useState<string>("ALL");
  const [selectedLayer, setSelectedLayer] = useState<"ALL" | "CRITICAL" | "EXPIRED" | "COMPLAINTS" | "VERIFIED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [isLeafletReady, setIsLeafletReady] = useState(false);
  const [baseMapStyle, setBaseMapStyle] = useState<"osm" | "esri_gray" | "esri_street">("osm");

  // Active Mandi Hubs based on selected city
  const activeHubs: MandiHub[] = useMemo(() => {
    if (selectedCity === "ALL_INDIA") {
      return getAllMandiHubs();
    }
    return INDIAN_CITIES[selectedCity]?.hubs || [];
  }, [selectedCity]);

  // Filter instruments by active City first
  const cityInstruments = useMemo(() => {
    if (selectedCity === "ALL_INDIA") {
      return instruments;
    }
    return instruments.filter((inst) => getCityForInstrument(inst) === selectedCity);
  }, [instruments, selectedCity]);

  const cityComplaints = useMemo(() => {
    if (selectedCity === "ALL_INDIA") {
      return complaints;
    }
    const cityInstIds = new Set(cityInstruments.map((i) => i.id));
    const cityInstDigitalIds = new Set(cityInstruments.map((i) => i.digitalInstrumentId));
    return complaints.filter(
      (c) =>
        (c.instrumentId && cityInstIds.has(c.instrumentId)) ||
        (c.digitalInstrumentId && cityInstDigitalIds.has(c.digitalInstrumentId))
    );
  }, [complaints, cityInstruments, selectedCity]);

  // Compute spatial statistics for active view
  const spatialStats = useMemo(() => {
    const total = cityInstruments.length;
    const critical = cityInstruments.filter(
      (i) => i.priorityFlag === "CRITICAL" || i.status === "SUSPENDED_TAMPERED" || i.riskScore >= 75
    ).length;
    const expired = cityInstruments.filter(
      (i) => i.status === "EXPIRED" || (i.validUntil && new Date(i.validUntil) < new Date())
    ).length;
    const complaintsCount = cityComplaints.filter(
      (c) => c.status === "LOGGED" || c.status === "UNDER_INVESTIGATION"
    ).length;
    const verifiedActive = cityInstruments.filter((i) => i.status === "VERIFIED_ACTIVE").length;
    return { total, critical, expired, complaintsCount, verifiedActive };
  }, [cityInstruments, cityComplaints]);

  // Filter instruments based on user selection (Circle, Layer, Search)
  const filteredInstruments = useMemo(() => {
    return cityInstruments.filter((inst) => {
      // 1. Circle / Mandi filter
      if (selectedCircle !== "ALL") {
        const circleKey = selectedCircle.toLowerCase();
        const instCircle = (inst.jurisdictionCircle || "").toLowerCase();
        const instAddress = (inst.ownerAddress || "").toLowerCase();
        const instPin = (inst.pincode || "").trim();

        const matchedHub = activeHubs.find((h) => h.id === selectedCircle);
        if (matchedHub) {
          const matchesHub =
            instCircle.includes(matchedHub.shortName.toLowerCase()) ||
            instCircle.includes(matchedHub.circle.toLowerCase()) ||
            instAddress.includes(matchedHub.shortName.toLowerCase()) ||
            instPin === matchedHub.pincode;
          if (!matchesHub) return false;
        } else {
          if (!instCircle.includes(circleKey)) return false;
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
        const hasComplaint = cityComplaints.some(
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
  }, [cityInstruments, cityComplaints, selectedCircle, selectedLayer, searchQuery, activeHubs]);

  // Dynamic Tile Layer Switcher
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current || !tileLayerRef.current) return;
    let isMounted = true;

    async function changeTileLayer() {
      const L = await import("leaflet");
      if (!isMounted || !mapInstanceRef.current || !tileLayerRef.current) return;

      try {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);

        let tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
        let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

        if (baseMapStyle === "esri_gray") {
          tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";
          attribution = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ';
        } else if (baseMapStyle === "esri_street") {
          tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
          attribution = 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS';
        }

        const newTileLayer = L.tileLayer(tileUrl, { attribution, maxZoom: 19 });
        newTileLayer.addTo(mapInstanceRef.current);
        tileLayerRef.current = newTileLayer;
      } catch (err) {
        console.warn("Tile layer transition notice:", err);
      }
    }

    changeTileLayer();

    return () => {
      isMounted = false;
    };
  }, [baseMapStyle, isLeafletReady]);

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
        const defaultCity = INDIAN_CITIES.DELHI;
        const map = L.map(mapContainerRef.current, {
          center: defaultCity.center,
          zoom: defaultCity.zoom,
          zoomControl: false,
        });

        // Add custom Zoom control at top-right
        L.control.zoom({ position: "topright" }).addTo(map);

        // OpenStreetMap Standard Tiles (100% Free, Zero Key Required, Open-Source)
        const initialTileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        tileLayerRef.current = initialTileLayer;

        // Group layer for markers & circles
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

  // Update map markers whenever filteredInstruments changes or city changes
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current || !markersLayerRef.current) return;

    let isMounted = true;

    async function updateMarkers() {
      const L = await import("leaflet");
      if (!isMounted) return;

      const markersLayer = markersLayerRef.current;
      markersLayer.clearLayers();

      // 1. Add Mandi Regional Hub Perimeter Circles for active view
      activeHubs.forEach((hub) => {
        const hubCircle = L.circle([hub.lat, hub.lng], {
          radius: hub.radiusMeters || 1600,
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
                pulseClass
                  ? `<span class="marker-radar-ping" style="background-color: ${markerColor};"></span>`
                  : ""
              }
              <div style="
                width: 28px;
                height: 28px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                background: ${markerColor};
                border: 2px solid #ffffff;
                box-shadow: 0 4px 10px rgba(0,0,0,0.35);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <span style="
                  transform: rotate(45deg);
                  color: #ffffff;
                  font-size: 13px;
                  font-weight: 800;
                  font-family: monospace;
                ">
                  ${isCritical ? "!" : isExpired ? "X" : "✓"}
                </span>
              </div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -28],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        // Rich statutory popup
        const popupContent = `
          <div style="font-family: inherit; min-width: 220px; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 700; color: ${markerColor}; text-transform: uppercase;">
                ${statusText}
              </span>
              <span style="font-size: 10px; color: #64748b; font-family: monospace;">
                ${inst.accuracyClass}
              </span>
            </div>

            <h4 style="margin: 0 0 2px 0; font-size: 13px; font-weight: 700; color: #0f172a;">
              ${inst.digitalInstrumentId}
            </h4>

            <p style="margin: 0 0 6px 0; font-size: 11px; color: #334155; font-weight: 500;">
              ${inst.ownerName || "Commercial Establishment"}
            </p>

            <div style="font-size: 10px; color: #64748b; margin-bottom: 8px; line-height: 1.4;">
              <b>Address:</b> ${inst.ownerAddress || "N/A"}<br/>
              <b>Circle:</b> ${inst.jurisdictionCircle}<br/>
              <b>Capacity:</b> ${inst.maxCapacity} ${inst.nominalUnit} (e=${inst.verificationInterval})
            </div>

            <div style="display: flex; gap: 4px;">
              <a 
                href="/qr/${encodeURIComponent(inst.digitalInstrumentId)}" 
                target="_blank"
                style="
                  flex: 1;
                  text-align: center;
                  background-color: #00366f;
                  color: #ffffff;
                  font-size: 10px;
                  font-weight: 600;
                  padding: 4px 6px;
                  border-radius: 4px;
                  text-decoration: none;
                "
              >
                Scan Certificate
              </a>
              <a 
                href="/admin" 
                style="
                  flex: 1;
                  text-align: center;
                  background-color: #f1f5f9;
                  color: #334155;
                  font-size: 10px;
                  font-weight: 600;
                  padding: 4px 6px;
                  border-radius: 4px;
                  text-decoration: none;
                  border: 1px solid #cbd5e1;
                "
              >
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
  }, [filteredInstruments, activeHubs, isLeafletReady]);

  // Handle City Change (fly to coordinates & reset circle)
  const handleCityChange = (cityId: CityId) => {
    setSelectedCity(cityId);
    setSelectedCircle("ALL");
    const city = INDIAN_CITIES[cityId];
    if (city && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(city.center, city.zoom, { duration: 1.4 });
    }
  };

  // Center map on a specific Mandi hub
  const handleFocusMandi = (hub: MandiHub) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([hub.lat, hub.lng], 14, { duration: 1.2 });
  };

  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    const currentCity = INDIAN_CITIES[selectedCity] || INDIAN_CITIES.DELHI;
    mapInstanceRef.current.flyTo(currentCity.center, currentCity.zoom, { duration: 1.0 });
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
          <span className="text-[10px] text-primary font-medium">Click to show all ({spatialStats.total})</span>
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
            {selectedLayer === "CRITICAL" ? `✓ Filter active (${spatialStats.critical})` : `Click to filter (${spatialStats.critical})`}
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
            {selectedLayer === "EXPIRED" ? `✓ Filter active (${spatialStats.expired})` : `Click to filter (${spatialStats.expired})`}
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
            {selectedLayer === "COMPLAINTS" ? `✓ Filter active (${spatialStats.complaintsCount})` : `Click to filter (${spatialStats.complaintsCount})`}
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
            {selectedLayer === "VERIFIED" ? `✓ Filter active (${spatialStats.verifiedActive})` : `Click to filter (${spatialStats.verifiedActive})`}
          </span>
        </button>
      </div>

      {/* Control Strip: City, Circle, Layer Toggles, Search */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left cluster: City Selector + Circle Selector */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* City / State Regional Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">apartment</span>
              City:
            </span>
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value as CityId)}
              className="text-xs bg-surface-container border border-outline-variant/40 rounded-lg px-2.5 py-1.5 font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs cursor-pointer"
            >
              {Object.values(INDIAN_CITIES).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Jurisdiction Circle Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">location_on</span>
              Circle / Hub:
            </span>
            <select
              value={selectedCircle}
              onChange={(e) => setSelectedCircle(e.target.value)}
              className="text-xs bg-surface-container border border-outline-variant/40 rounded-lg px-2.5 py-1.5 font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">
                {selectedCity === "ALL_INDIA"
                  ? "All Regional Mandi Hubs (National)"
                  : `All ${INDIAN_CITIES[selectedCity]?.name} Mandis (${activeHubs.length} Hubs)`}
              </option>
              {activeHubs.map((hub) => (
                <option key={hub.id} value={hub.id}>
                  {hub.name} ({hub.circle})
                </option>
              ))}
            </select>
          </div>
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
            All Scales ({spatialStats.total})
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
            Critical ({spatialStats.critical})
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
          {/* Quick Mandi Jump & Tile Switcher Floating Bar */}
          <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md border border-outline-variant/40 rounded-xl p-1.5 shadow-md flex items-center space-x-1 flex-wrap gap-y-1 max-w-[calc(100%-120px)]">
            <span className="text-[10px] font-bold text-slate-500 px-1.5 uppercase tracking-wider">
              {selectedCity === "ALL_INDIA" ? "Cities:" : "Focus:"}
            </span>
            {selectedCity === "ALL_INDIA" ? (
              <>
                <button
                  onClick={() => handleCityChange("DELHI")}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  Delhi NCR
                </button>
                <button
                  onClick={() => handleCityChange("MUMBAI")}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  Mumbai MMR
                </button>
                <button
                  onClick={() => handleCityChange("PUNE")}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  Pune District
                </button>
              </>
            ) : (
              activeHubs.map((hub) => (
                <button
                  key={hub.id}
                  onClick={() => handleFocusMandi(hub)}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  {hub.shortName}
                </button>
              ))
            )}
            <button
              onClick={handleResetView}
              title="Reset View"
              className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-xs">restart_alt</span>
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1"></div>

            <span className="text-[10px] font-bold text-slate-500 px-1 uppercase tracking-wider">Tiles:</span>
            <button
              onClick={() => setBaseMapStyle("osm")}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                baseMapStyle === "osm" ? "bg-primary text-white shadow-xs" : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              OSM (Free)
            </button>
            <button
              onClick={() => setBaseMapStyle("esri_gray")}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                baseMapStyle === "esri_gray" ? "bg-primary text-white shadow-xs" : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              Gov Gray
            </button>
            <button
              onClick={() => setBaseMapStyle("esri_street")}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                baseMapStyle === "esri_street" ? "bg-primary text-white shadow-xs" : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              Streets
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
              <span className="text-slate-700 font-medium">Attention Required (Score &ge;45)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-green-600 border border-white shadow-xs"></span>
              <span className="text-slate-700 font-medium">Verified Active Scale</span>
            </div>
          </div>
        </div>

        {/* Selected Scale Detail / Spatial Docket Sidebar */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-xs flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
            <div>
              <h3 className="font-bold text-sm text-on-surface">Spatial Registry</h3>
              <p className="text-[11px] text-on-surface-variant">
                {selectedCity === "ALL_INDIA" ? "Pan-India Directorate" : INDIAN_CITIES[selectedCity]?.name} ({filteredInstruments.length} visible)
              </p>
            </div>
            <span className="material-symbols-outlined text-primary text-xl">map</span>
          </div>

          {/* Selected Instrument Detail Card (If Clicked) */}
          {selectedInstrument ? (
            <div className="bg-surface-container p-3 rounded-xl border border-primary/30 space-y-2 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-on-primary">
                  {selectedInstrument.category.replace(/_/g, " ")}
                </span>
                <span className="text-xs font-mono font-bold text-on-surface">
                  {selectedInstrument.digitalInstrumentId}
                </span>
              </div>

              <h4 className="font-bold text-sm text-on-surface pt-1">{selectedInstrument.ownerName}</h4>
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
                      <span className="truncate max-w-[150px]">{inst.jurisdictionCircle}</span>
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
