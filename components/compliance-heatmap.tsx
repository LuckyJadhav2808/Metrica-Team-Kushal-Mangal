"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useMetrica } from "@/lib/store";
import { Instrument } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
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
  const { language } = useI18n();
  const isHi = language === "hi";
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  // Filter states
  const [selectedCity, setSelectedCity] = useState<CityId>("PUNE");
  const [selectedCircle, setSelectedCircle] = useState<string>("ALL");
  const [selectedLayer, setSelectedLayer] = useState<"ALL" | "CRITICAL" | "EXPIRED" | "COMPLAINTS" | "VERIFIED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [isLeafletReady, setIsLeafletReady] = useState(false);
  const [baseMapStyle, setBaseMapStyle] = useState<"voyager" | "osm" | "esri_gray" | "satellite" | "mapbox">("voyager");

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
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(mapApiKey);
  const [isRealTimeRadarActive, setIsRealTimeRadarActive] = useState(true);
  const [lastTelemetryTimestamp, setLastTelemetryTimestamp] = useState<string>("Just now");

  // City configuration and active hubs
  const activeCityConfig = INDIAN_CITIES[selectedCity] || INDIAN_CITIES.PUNE;
  const activeHubs = useMemo(() => {
    return selectedCity === "ALL_INDIA" ? getAllMandiHubs() : activeCityConfig.hubs;
  }, [selectedCity, activeCityConfig]);

  // Instruments scoped to selected city
  const cityInstruments = useMemo(() => {
    if (selectedCity === "ALL_INDIA") return instruments;
    return instruments.filter((inst) => getCityForInstrument(inst) === selectedCity);
  }, [instruments, selectedCity]);

  // Complaints scoped to selected city
  const cityComplaints = useMemo(() => {
    if (selectedCity === "ALL_INDIA") return complaints;
    const validInstrumentIds = new Set(cityInstruments.map((i) => i.digitalInstrumentId));
    return complaints.filter((c) => Boolean(c.instrumentId && validInstrumentIds.has(c.instrumentId)));
  }, [complaints, cityInstruments, selectedCity]);

  // Spatial Statistics
  const spatialStats = useMemo(() => {
    const total = cityInstruments.length;
    const critical = cityInstruments.filter(
      (i) => i.priorityFlag === "CRITICAL" || i.status === "SUSPENDED_TAMPERED" || i.riskScore >= 70
    ).length;
    const expired = cityInstruments.filter((i) => {
      return i.validUntil ? new Date(i.validUntil) < new Date() : false;
    }).length;
    const verifiedActive = cityInstruments.filter((i) => i.status === "VERIFIED_ACTIVE").length;
    const complaintsCount = cityComplaints.length;

    return { total, critical, expired, verifiedActive, complaintsCount };
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
        if (!isPast && inst.status !== "EXPIRED") return false;
      } else if (selectedLayer === "VERIFIED") {
        if (inst.status !== "VERIFIED_ACTIVE") return false;
      } else if (selectedLayer === "COMPLAINTS") {
        const hasComplaint = cityComplaints.some((c) => c.instrumentId === inst.digitalInstrumentId);
        if (!hasComplaint && inst.priorityFlag !== "CRITICAL") return false;
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

  // Periodic Telemetry Simulation
  useEffect(() => {
    if (!isRealTimeRadarActive) return;
    const interval = setInterval(() => {
      const now = new Date();
      setLastTelemetryTimestamp(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 8000);
    return () => clearInterval(interval);
  }, [isRealTimeRadarActive]);

  // Dynamic Tile Layer Switcher (100% Zero-Config / No API Key Required)
  const applyTileLayer = async (L: any, map: any, style: string) => {
    if (tileLayerRef.current) {
      try {
        map.removeLayer(tileLayerRef.current);
      } catch {}
      tileLayerRef.current = null;
    }

    let layer: any;

    if (style === "satellite") {
      // High-Resolution Esri Satellite Imagery (100% Free / Zero Key)
      layer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Earthstar Geographics',
          maxZoom: 19,
        }
      );
    } else if (style === "esri_gray") {
      // Clean Topographic / Canvas Gray (100% Free / Zero Key)
      layer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
          maxZoom: 19,
        }
      );
    } else if (style === "osm") {
      // OpenStreetMap Standard Tile Servers (100% Free / Zero Key)
      layer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        subdomains: ["a", "b", "c"],
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      });
    } else {
      // Default: Clean CartoDB Voyager Tile Server (100% Free / Zero Key)
      layer = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        subdomains: ["a", "b", "c", "d"],
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      });
    }

    layer.addTo(map);
    tileLayerRef.current = layer;

    // Trigger map redraw so tiles snap into position immediately
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  };

  // Load Leaflet dynamically on client mount
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

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
        const defaultCity = INDIAN_CITIES.PUNE;
        const map = L.map(mapContainerRef.current, {
          center: defaultCity.center,
          zoom: defaultCity.zoom,
          zoomControl: false,
        });

        L.control.zoom({ position: "topright" }).addTo(map);

        await applyTileLayer(L, map, baseMapStyle);

        const markersLayer = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
        markersLayerRef.current = markersLayer;
        setIsLeafletReady(true);

        // Crucial for mobile/responsive viewports: recalculate map container bounds
        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      }
    }

    initLeaflet();

    const handleWindowResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener("resize", handleWindowResize);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleWindowResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when style changes
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current) return;
    import("leaflet").then((L) => {
      applyTileLayer(L, mapInstanceRef.current, baseMapStyle);
    });
  }, [baseMapStyle, isLeafletReady]);

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
          fillColor: "#1a4d8f",
          fillOpacity: 0.04,
          weight: 1.5,
          dashArray: "4, 6",
        });

        const pulseCircle = L.circleMarker([hub.lat, hub.lng], {
          radius: 8,
          color: "#1a4d8f",
          fillColor: "#3b82f6",
          fillOpacity: 0.35,
          weight: 2,
        });

        const tooltipContent = `
          <div style="font-family: inherit; font-size: 11px; padding: 2px;">
            <b style="color: #1a4d8f; font-size: 12px;">${hub.name}</b><br/>
            <span style="color: #64748b;">${hub.circle}</span><br/>
            <span style="color: #475569; font-size: 10px;">${hub.description}</span>
          </div>
        `;
        hubCircle.bindTooltip(tooltipContent, { sticky: true });
        pulseCircle.bindTooltip(tooltipContent, { sticky: true });

        markersLayer.addLayer(hubCircle);
        markersLayer.addLayer(pulseCircle);
      });

      // 2. Add individual instruments markers with statutory compliance badges
      filteredInstruments.forEach((inst, idx) => {
        const [lat, lng] = getCoordinatesForInstrument(inst, idx);

        const isCritical = inst.priorityFlag === "CRITICAL" || inst.status === "SUSPENDED_TAMPERED" || inst.riskScore >= 70;
        const isExpired = inst.status === "EXPIRED" || (inst.validUntil && new Date(inst.validUntil) < new Date());

        let markerColor = "#16a34a"; // Green (Compliant)
        let statusText = isHi ? "सत्यापित सक्रिय" : "Verified Active";

        if (isCritical) {
          markerColor = "#dc2626"; // Red (Critical)
          statusText = isHi ? "गंभीर / छेड़छाड़" : "Critical Tamper";
        } else if (isExpired) {
          markerColor = "#d97706"; // Amber (Expired)
          statusText = isHi ? "मुहर समाप्त" : "Stamping Expired";
        }

        const customIcon = L.divIcon({
          className: "custom-leaflet-marker",
          html: `
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background-color: ${markerColor};
              border: 2px solid #ffffff;
              box-shadow: 0 2px 5px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: transform 0.15s ease;
            ">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #ffffff;"></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -14],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        const popupContent = `
          <div style="font-family: inherit; min-width: 230px; padding: 3px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 700; color: ${markerColor}; text-transform: uppercase;">
                ${statusText}
              </span>
              <span style="font-size: 10px; color: #64748b; font-family: monospace;">
                ${inst.digitalInstrumentId}
              </span>
            </div>

            <h4 style="margin: 0 0 2px 0; font-size: 12px; font-weight: 700; color: #0f172a;">
              ${inst.ownerName || (isHi ? "व्यापारी प्रतिष्ठान" : "Commercial Establishment")}
            </h4>

            <p style="margin: 0 0 6px 0; font-size: 11px; color: #334155; line-height: 1.3;">
              ${inst.ownerAddress || inst.jurisdictionCircle}
            </p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; background: #f8fafc; padding: 6px; border-radius: 6px; font-size: 10px; margin-bottom: 8px;">
              <div>
                <span style="color: #64748b; display: block;">${isHi ? "जोखिम सूचकांक" : "Risk Index"}</span>
                <b style="font-size: 12px; color: ${inst.riskScore >= 70 ? "#dc2626" : inst.riskScore >= 40 ? "#d97706" : "#16a34a"};">${inst.riskScore}/100</b>
              </div>
              <div>
                <span style="color: #64748b; display: block;">${isHi ? "विश्वास स्कोर" : "Trust Score"}</span>
                <b style="font-size: 12px; color: #0284c7;">${inst.trustScore}%</b>
              </div>
            </div>

            <div style="display: flex; gap: 6px;">
              <a href="/qr/${encodeURIComponent(inst.digitalInstrumentId)}" target="_blank" style="flex: 1; text-align: center; background: #1a4d8f; color: #ffffff; text-decoration: none; padding: 5px 8px; border-radius: 6px; font-size: 10px; font-weight: 600;">
                ${isHi ? "क्यूआर जांचें" : "Inspect QR"}
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
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
  }, [filteredInstruments, activeHubs, isLeafletReady, isHi]);

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
    const currentCity = INDIAN_CITIES[selectedCity] || INDIAN_CITIES.PUNE;
    mapInstanceRef.current.flyTo(currentCity.center, currentCity.zoom, { duration: 1.0 });
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
      setBaseMapStyle("mapbox");
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
              ? "border-primary ring-2 ring-primary/30 bg-primary-container/20"
              : "border-outline-variant/30 hover:border-outline"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              {isHi ? "सभी माप उपकरण" : "All Scales"}
            </span>
            <span className="material-symbols-outlined text-primary text-lg">pin_drop</span>
          </div>
          <p className="text-xl font-extrabold text-on-surface mt-1">{spatialStats.total}</p>
          <span className="text-[10px] text-primary font-medium">
            {isHi ? `सभी (${spatialStats.total}) दिखाने के लिए क्लिक करें` : `Click to show all (${spatialStats.total})`}
          </span>
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
            <span className="text-[11px] font-semibold text-error uppercase tracking-wider">
              {isHi ? "गंभीर / छेड़छाड़" : "Critical / Tampered"}
            </span>
            <span className="material-symbols-outlined text-error text-lg animate-pulse">warning</span>
          </div>
          <p className="text-xl font-extrabold text-error mt-1">{spatialStats.critical}</p>
          <span className="text-[10px] text-error font-medium">
            {selectedLayer === "CRITICAL"
              ? (isHi ? `✓ फ़िल्टर सक्रिय (${spatialStats.critical})` : `✓ Filter active (${spatialStats.critical})`)
              : (isHi ? `फ़िल्टर करने के लिए क्लिक करें (${spatialStats.critical})` : `Click to filter (${spatialStats.critical})`)}
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
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
              {isHi ? "मुहर समाप्त" : "Expired Stamping"}
            </span>
            <span className="material-symbols-outlined text-amber-600 text-lg">event_busy</span>
          </div>
          <p className="text-xl font-extrabold text-amber-700 mt-1">{spatialStats.expired}</p>
          <span className="text-[10px] text-amber-700 font-medium">
            {selectedLayer === "EXPIRED"
              ? (isHi ? `✓ फ़िल्टर सक्रिय (${spatialStats.expired})` : `✓ Filter active (${spatialStats.expired})`)
              : (isHi ? `फ़िल्टर करने के लिए क्लिक करें (${spatialStats.expired})` : `Click to filter (${spatialStats.expired})`)}
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
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
              {isHi ? "सक्रिय शिकायतें" : "Active Grievances"}
            </span>
            <span className="material-symbols-outlined text-rose-600 text-lg">report_problem</span>
          </div>
          <p className="text-xl font-extrabold text-rose-700 mt-1">{spatialStats.complaintsCount}</p>
          <span className="text-[10px] text-rose-700 font-medium">
            {selectedLayer === "COMPLAINTS"
              ? (isHi ? `✓ फ़िल्टर सक्रिय (${spatialStats.complaintsCount})` : `✓ Filter active (${spatialStats.complaintsCount})`)
              : (isHi ? `फ़िल्टर करने के लिए क्लिक करें (${spatialStats.complaintsCount})` : `Click to filter (${spatialStats.complaintsCount})`)}
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
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              {isHi ? "सत्यापित सक्रिय" : "Verified Active"}
            </span>
            <span className="material-symbols-outlined text-emerald-600 text-lg">verified</span>
          </div>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">{spatialStats.verifiedActive}</p>
          <span className="text-[10px] text-emerald-700 font-medium">
            {selectedLayer === "VERIFIED"
              ? (isHi ? "✓ फ़िल्टर सक्रिय" : "✓ Filter active")
              : (isHi ? "फ़िल्टर करने के लिए क्लिक करें" : "Click to filter")}
          </span>
        </button>
      </div>

      {/* Control Strip: City Selector, Mandi Circle Dropdown, Real-time API Key, Search */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* City & Circle Selectors */}
        <div className="flex items-center flex-wrap gap-2">
          {/* City Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">location_city</span>
              <span>{isHi ? "शहर / संभाग:" : "City Jurisdiction:"}</span>
            </span>
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value as CityId)}
              className="text-xs bg-surface-container border border-outline-variant/40 rounded-lg px-2.5 py-1.5 font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="PUNE">📍 Pune District (8 Mandis)</option>
              <option value="DELHI">📍 Delhi NCR (5 Mandis)</option>
              <option value="MUMBAI">📍 Mumbai MMR (4 Mandis)</option>
              <option value="ALL_INDIA">🇮🇳 Pan-India Directorate</option>
            </select>
          </div>

          {/* Mandi Circle Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">storefront</span>
              <span>{isHi ? "मंडी मंडल:" : "Mandi Circle:"}</span>
            </span>
            <select
              value={selectedCircle}
              onChange={(e) => setSelectedCircle(e.target.value)}
              className="text-xs bg-surface-container border border-outline-variant/40 rounded-lg px-2.5 py-1.5 font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">{isHi ? "सभी मंडी मंडल" : "All Mandi Circles"}</option>
              {activeHubs.map((hub) => (
                <option key={hub.id} value={hub.id}>
                  {hub.shortName} ({hub.circle})
                </option>
              ))}
            </select>
          </div>

          {/* Live Radar Pulse Indicator */}
          <button
            onClick={() => setIsRealTimeRadarActive(!isRealTimeRadarActive)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              isRealTimeRadarActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-surface-container text-on-surface-variant border-outline-variant/40"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isRealTimeRadarActive ? "bg-emerald-600 animate-ping" : "bg-slate-400"}`}></span>
            <span>{isRealTimeRadarActive ? (isHi ? "लाइव जीपीएस रडार चालू" : "Live GPS Radar ON") : (isHi ? "रडार रुका हुआ" : "Radar Paused")}</span>
          </button>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[220px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none select-none z-10" translate="no">
            search
          </span>
          <input
            type="text"
            placeholder={isHi ? "आईडी, दुकान या क्षेत्र खोजें..." : "Search Scale ID, Shop, Area..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface-container border border-outline-variant/40 rounded-lg text-on-surface focus:outline-none focus:ring-1 focus:ring-primary truncate"
          />
        </div>
      </div>

      {/* Main Map Container & Quick Jump Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
        {/* Leaflet Map Visual Canvas */}
        <div className="lg:col-span-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm relative flex flex-col h-[450px] sm:h-[550px] lg:h-[620px]">
          {/* Quick Hub Places Floating Bar (Visible on tablet & desktop) */}
          <div className="hidden md:flex absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md border border-outline-variant/40 rounded-xl p-1.5 shadow-md items-center space-x-1 flex-wrap gap-y-1 max-w-[60%]">
            <span className="text-[10px] font-bold text-slate-500 px-2 uppercase tracking-wider">
              {selectedCity === "PUNE" ? (isHi ? "पुणे क्षेत्र:" : "Pune Places:") : (isHi ? "मंडी क्षेत्र:" : "Mandi Hubs:")}
            </span>
            {activeHubs.slice(0, 5).map((hub) => (
              <button
                key={hub.id}
                onClick={() => handleFocusMandi(hub)}
                className="text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
              >
                {hub.shortName}
              </button>
            ))}
          </div>

          {/* Map Controls: Reset View & Tile Style Switcher */}
          <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md border border-outline-variant/40 rounded-xl p-1 shadow-md flex items-center space-x-1">
            <button
              onClick={handleResetView}
              title={isHi ? "दृश्य रीसेट करें" : "Reset View"}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-xs sm:text-sm" translate="no">restart_alt</span>
            </button>

            <div className="h-3.5 w-px bg-slate-200 mx-0.5"></div>

            <button
              onClick={() => setBaseMapStyle("voyager")}
              className={`text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-md transition-colors ${
                baseMapStyle === "voyager" ? "bg-primary text-white shadow-xs" : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              Voyager
            </button>
            <button
              onClick={() => setBaseMapStyle("osm")}
              className={`text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-md transition-colors ${
                baseMapStyle === "osm" ? "bg-primary text-white shadow-xs" : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              OSM
            </button>
            <button
              onClick={() => setBaseMapStyle("satellite")}
              className={`text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-md transition-colors ${
                baseMapStyle === "satellite" ? "bg-primary text-white shadow-xs" : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              {isHi ? "उपग्रह" : "Satellite"}
            </button>
            <button
              onClick={() => setBaseMapStyle("esri_gray")}
              className={`text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-md transition-colors ${
                baseMapStyle === "esri_gray" ? "bg-primary text-white shadow-xs" : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              {isHi ? "भू-भाग" : "Terrain"}
            </button>
          </div>

          {/* The Leaflet Canvas Map */}
          <div ref={mapContainerRef} className="w-full h-full min-h-[420px] flex-1 z-0" />

          {/* Bottom Overlay Legend */}
          <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md border border-outline-variant/40 rounded-xl p-2 shadow-md flex items-center flex-wrap gap-2 text-[10px] sm:text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[9px] sm:text-[10px]">
              {isHi ? "कुंजी:" : "Key:"}
            </span>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white shadow-xs"></span>
              <span className="text-slate-700 font-medium">{isHi ? "गंभीर" : "Critical"}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white shadow-xs"></span>
              <span className="text-slate-700 font-medium">{isHi ? "समाप्त" : "Expired"}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white shadow-xs"></span>
              <span className="text-slate-700 font-medium">{isHi ? "सत्यापित" : "Verified"}</span>
            </div>
          </div>
        </div>

        {/* Selected Scale Detail / Spatial Docket Sidebar */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-xs flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
            <div>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary" translate="no">analytics</span>
                <span>{selectedCity === "PUNE" ? (isHi ? "पुणे मंडी डॉकेट" : "Pune Mandi Docket") : (isHi ? "स्थानिक डॉकेट" : "Spatial Docket")}</span>
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                {isHi ? `${filteredInstruments.length} भू-स्थानिक तराजू प्रदर्शित` : `Showing ${filteredInstruments.length} geocoded scales`}
              </p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/30">
              {isHi ? "लाइव समन्वय" : "Live Sync"}
            </span>
          </div>

          {/* Selected Instrument Detail Card */}
          {selectedInstrument ? (
            <div className="bg-surface-container p-3.5 rounded-xl border border-primary/30 space-y-2 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-primary">{selectedInstrument.digitalInstrumentId}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  selectedInstrument.priorityFlag === "CRITICAL"
                    ? "bg-error/20 text-error"
                    : selectedInstrument.status === "EXPIRED"
                    ? "bg-amber-500/20 text-amber-700"
                    : "bg-emerald-500/20 text-emerald-700"
                }`}>
                  {isHi
                    ? (selectedInstrument.priorityFlag === "CRITICAL" ? "अतिसंवेदनशील" : selectedInstrument.status === "EXPIRED" ? "समाप्त" : "सत्यापित सक्रिय")
                    : selectedInstrument.status}
                </span>
              </div>
              <p className="text-xs font-bold text-on-surface">{selectedInstrument.ownerName || (isHi ? "व्यापारी प्रतिष्ठान" : "Merchant Unknown")}</p>
              <p className="text-[11px] text-on-surface-variant leading-snug">{selectedInstrument.ownerAddress}</p>
              
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-outline-variant/20 text-[11px]">
                <div>
                  <span className="text-on-surface-variant/70 text-[10px] block">{isHi ? "मॉडल" : "Model"}</span>
                  <span className="font-semibold text-on-surface">{selectedInstrument.modelName}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant/70 text-[10px] block">{isHi ? "क्रमांक" : "Serial No"}</span>
                  <span className="font-semibold text-on-surface">{selectedInstrument.serialNumber}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant/70 text-[10px] block">{isHi ? "जोखिम सूचकांक" : "Risk Index"}</span>
                  <span className={`font-extrabold ${selectedInstrument.riskScore >= 70 ? "text-error" : "text-emerald-700"}`}>
                    {selectedInstrument.riskScore}/100
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant/70 text-[10px] block">{isHi ? "विश्वास स्कोर" : "Trust Score"}</span>
                  <span className="font-extrabold text-primary">{selectedInstrument.trustScore}%</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <a
                  href={`/qr/${encodeURIComponent(selectedInstrument.digitalInstrumentId)}`}
                  target="_blank"
                  className="flex-1 text-center py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {isHi ? "सार्वजनिक क्यूआर देखें" : "View Public QR"}
                </a>
                <button
                  onClick={() => setSelectedInstrument(null)}
                  className="px-2.5 py-1.5 bg-surface-container-high text-on-surface text-xs font-semibold rounded-lg hover:bg-surface-container-highest transition-colors"
                >
                  {isHi ? "बंद करें" : "Close"}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-outline-variant/50 text-center text-on-surface-variant text-xs">
              <span className="material-symbols-outlined text-2xl text-outline mb-1" translate="no">touch_app</span>
              <p>{isHi ? "मानचित्र पर किसी भी मार्कर पर क्लिक करके उसका कानूनी सत्यापन विवरण देखें" : "Click any map marker to view statutory calibration dossier"}</p>
            </div>
          )}

          {/* Quick List of Filtered Scales */}
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[360px] pr-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
              {isHi ? `सूचीबद्ध इकाइयाँ (${filteredInstruments.length})` : `Ranked Units (${filteredInstruments.length})`}
            </span>
            {filteredInstruments.slice(0, 15).map((inst) => (
              <div
                key={inst.id}
                onClick={() => setSelectedInstrument(inst)}
                className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                  selectedInstrument?.id === inst.id
                    ? "bg-primary-container/20 border-primary shadow-xs"
                    : "bg-surface-container/50 border-outline-variant/20 hover:border-outline-variant/60"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-on-surface">{inst.digitalInstrumentId}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    inst.priorityFlag === "CRITICAL"
                      ? "bg-error/20 text-error"
                      : inst.status === "EXPIRED"
                      ? "bg-amber-500/20 text-amber-700"
                      : "bg-emerald-500/20 text-emerald-700"
                  }`}>
                    {inst.riskScore}/100
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant font-medium mt-0.5 truncate">{inst.ownerName}</p>
                <div className="flex items-center justify-between text-[10px] text-on-surface-variant/70 mt-1">
                  <span className="truncate max-w-[150px]">{inst.ownerAddress || inst.jurisdictionCircle}</span>
                  <span className="font-semibold">Trust: {inst.trustScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Map API Key Configuration Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl" translate="no">vpn_key</span>
                <h3 className="font-bold text-sm text-on-surface">
                  {isHi ? "मानचित्र एपीआई कुंजी कॉन्फ़िगरेशन" : "Map API Key Configuration"}
                </h3>
              </div>
              <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg" translate="no">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              {isHi
                ? "उच्च-रिज़ॉल्यूशन वेक्टर टाइल्स और वास्तविक समय उपग्रह दृश्य को सक्रिय करने के लिए अपनी Mapbox या MapTiler सार्वजनिक टोकन दर्ज करें।"
                : "Enter your public Mapbox or MapTiler token to activate high-resolution dynamic vector tiles and real-time live satellite layers."}
            </p>

            <form onSubmit={handleSaveApiKey} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">
                  {isHi ? "मैपबॉक्स एक्सेस टोकन (pk.xxx):" : "Mapbox Access Token (pk.xxx):"}
                </label>
                <input
                  type="text"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSI..."
                  className="w-full text-xs p-2.5 bg-surface-container border border-outline-variant/50 rounded-xl text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTempApiKey("");
                    setMapApiKey("");
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("metrica_map_api_key");
                    }
                    setBaseMapStyle("voyager");
                    setIsApiKeyModalOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/10 rounded-lg transition-colors"
                >
                  {isHi ? "कुंजी हटाएं" : "Clear Key"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
                >
                  {isHi ? "रद्द करें" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary/90 rounded-lg shadow-xs transition-colors"
                >
                  {isHi ? "सहेजें और कनेक्ट करें" : "Save & Connect"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
