import { Instrument } from "./types";

export interface MandiHub {
  id: string;
  name: string;
  shortName: string;
  cityId: CityId;
  circle: string;
  lat: number;
  lng: number;
  pincode: string;
  description: string;
  radiusMeters?: number;
}

export type CityId = "ALL_INDIA" | "DELHI" | "MUMBAI" | "PUNE";

export interface CityConfig {
  id: CityId;
  name: string;
  label: string;
  state: string;
  center: [number, number];
  zoom: number;
  hubs: MandiHub[];
}

export const INDIAN_CITIES: Record<CityId, CityConfig> = {
  ALL_INDIA: {
    id: "ALL_INDIA",
    name: "All India (Pan-India)",
    label: "🇮🇳 All India (National Overview)",
    state: "National Directorate",
    center: [21.7679, 78.8718],
    zoom: 5,
    hubs: [], // Populated dynamically or aggregated
  },
  DELHI: {
    id: "DELHI",
    name: "Delhi NCR",
    label: "📍 Delhi NCR (5 Mandi Hubs)",
    state: "National Capital Territory of Delhi",
    center: [28.6350, 77.1850],
    zoom: 11,
    hubs: [
      {
        id: "AZADPUR",
        name: "Azadpur APMC Fruit & Vegetable Mandi",
        shortName: "Azadpur",
        cityId: "DELHI",
        circle: "Delhi North District Circle",
        lat: 28.7130,
        lng: 77.1770,
        pincode: "110033",
        description: "Asia's largest wholesale produce market (High density of commercial scales)",
        radiusMeters: 1800,
      },
      {
        id: "CHANDNI_CHOWK",
        name: "Chandni Chowk & Daryaganj Trade Hub",
        shortName: "Chandni",
        cityId: "DELHI",
        circle: "Delhi Central District Circle",
        lat: 28.6507,
        lng: 77.2334,
        pincode: "110006",
        description: "Gold, jewelry, spices, and legacy dry fruit commercial establishments",
        radiusMeters: 1600,
      },
      {
        id: "GHAZIPUR",
        name: "Ghazipur Wholesale Mandi & Mayur Vihar",
        shortName: "Ghazipur",
        cityId: "DELHI",
        circle: "Delhi East District Circle",
        lat: 28.6258,
        lng: 77.3275,
        pincode: "110096",
        description: "Dairy, livestock, poultry, and eastern perimeter weighbridges",
        radiusMeters: 1700,
      },
      {
        id: "OKHLA",
        name: "Okhla Industrial & APMC Grain Hub",
        shortName: "Okhla",
        cityId: "DELHI",
        circle: "Delhi South District Circle",
        lat: 28.5355,
        lng: 77.2732,
        pincode: "110020",
        description: "Grain wholesale traders, vehicle weighbridges, cold storage scales",
        radiusMeters: 1900,
      },
      {
        id: "NAJAFGARH",
        name: "Najafgarh Grain Mandi & Punjabi Bagh Hub",
        shortName: "Najafgarh",
        cityId: "DELHI",
        circle: "Delhi West District Circle",
        lat: 28.6127,
        lng: 76.9855,
        pincode: "110043",
        description: "Western agrarian trade node, bulk agricultural scales, platform weighers",
        radiusMeters: 2000,
      },
    ],
  },
  MUMBAI: {
    id: "MUMBAI",
    name: "Mumbai MMR",
    label: "📍 Mumbai MMR (4 Mandi Hubs)",
    state: "Maharashtra",
    center: [19.0760, 72.8777],
    zoom: 11,
    hubs: [
      {
        id: "VASHI_APMC",
        name: "Vashi APMC Mega Wholesale Market (Turbhe)",
        shortName: "Vashi APMC",
        cityId: "MUMBAI",
        circle: "Navi Mumbai & Konkan Circle",
        lat: 19.0760,
        lng: 73.0033,
        pincode: "400703",
        description: "Largest grain, onion-potato, spice & fruit terminal in Western India",
        radiusMeters: 2200,
      },
      {
        id: "CRAWFORD",
        name: "Crawford Market & Kalbadevi Bullion Bazaar",
        shortName: "Crawford",
        cityId: "MUMBAI",
        circle: "South Mumbai District Circle",
        lat: 18.9472,
        lng: 72.8335,
        pincode: "400001",
        description: "Historical trading quarter, precious metals, spices, and provisions",
        radiusMeters: 1500,
      },
      {
        id: "DADAR_MANDI",
        name: "Dadar Wholesale Flower & Produce Market",
        shortName: "Dadar",
        cityId: "MUMBAI",
        circle: "Central Mumbai District Circle",
        lat: 19.0178,
        lng: 72.8478,
        pincode: "400028",
        description: "High-throughput perishable goods, platform scales, rapid retail turnover",
        radiusMeters: 1400,
      },
      {
        id: "ANDHERI_MIDC",
        name: "Andheri East & Marol Industrial Commercial Corridor",
        shortName: "Andheri MIDC",
        cityId: "MUMBAI",
        circle: "Mumbai Suburban Western Circle",
        lat: 19.1136,
        lng: 72.8697,
        pincode: "400069",
        description: "Packaging units, courier weighers, food processing, industrial weighing",
        radiusMeters: 1800,
      },
    ],
  },
  PUNE: {
    id: "PUNE",
    name: "Pune District",
    label: "📍 Pune District (8 Mandi Hubs)",
    state: "Maharashtra",
    center: [18.5204, 73.8567],
    zoom: 12,
    hubs: [
      {
        id: "KOTHRUD",
        name: "Kothrud & Karve Road Commercial Circle",
        shortName: "Kothrud",
        cityId: "PUNE",
        circle: "Pune West District Circle",
        lat: 18.5074,
        lng: 73.8077,
        pincode: "411038",
        description: "Retail markets, Paud Road commercial establishments, gold jewellers & retail counter scales",
        radiusMeters: 1800,
      },
      {
        id: "BANER",
        name: "Baner & Balewadi Trade Hub",
        shortName: "Baner",
        cityId: "PUNE",
        circle: "Pune North-West District Circle",
        lat: 18.5590,
        lng: 73.7868,
        pincode: "411045",
        description: "High-density retail supermarkets, logistics centers & IT corridor commercial balances",
        radiusMeters: 1800,
      },
      {
        id: "HADAPSAR",
        name: "Hadapsar APMC Wholesale Mandi",
        shortName: "Hadapsar",
        cityId: "PUNE",
        circle: "Pune East Circle",
        lat: 18.5089,
        lng: 73.9259,
        pincode: "411028",
        description: "Pune East primary agro-produce APMC wholesale market, grain elevators & heavy weighbridges",
        radiusMeters: 1900,
      },
      {
        id: "AUNDH",
        name: "Aundh & University Sector",
        shortName: "Aundh",
        cityId: "PUNE",
        circle: "Pune North District Circle",
        lat: 18.5580,
        lng: 73.8075,
        pincode: "411007",
        description: "Departmental chains, analytical balances & pharmaceutical precision measuring devices",
        radiusMeters: 1700,
      },
      {
        id: "SINHGAD",
        name: "Sinhgad Road & Dhayari Agro-Belt",
        shortName: "Sinhgad",
        cityId: "PUNE",
        circle: "Pune South District Circle",
        lat: 18.4715,
        lng: 73.8242,
        pincode: "411051",
        description: "Wholesale produce distribution, building material weighbridges & agro-feed centers",
        radiusMeters: 1800,
      },
      {
        id: "GULTEKDI",
        name: "Shri Chhatrapati Shivaji Market Yard (Gultekdi)",
        shortName: "Gultekdi",
        cityId: "PUNE",
        circle: "Pune Central Circle",
        lat: 18.4892,
        lng: 73.8647,
        pincode: "411037",
        description: "Major agro terminal for Western Maharashtra fruits, vegetables & grains",
        radiusMeters: 2000,
      },
      {
        id: "PIMPRI_MIDC",
        name: "Pimpri-Chinchwad APMC & Bhosari MIDC Weighbridges",
        shortName: "Pimpri-Bhosari",
        cityId: "PUNE",
        circle: "Pimpri-Chinchwad Industrial Circle",
        lat: 18.6279,
        lng: 73.8131,
        pincode: "411018",
        description: "Automotive & engineering fabrication weighbridges, heavy platform scales",
        radiusMeters: 2200,
      },
      {
        id: "SWARGATE_KATRAJ",
        name: "Swargate & Katraj Dairy/Wholesale Corridor",
        shortName: "Swargate",
        cityId: "PUNE",
        circle: "Pune South Circle",
        lat: 18.4575,
        lng: 73.8553,
        pincode: "411009",
        description: "Dairy bulk tank scales, cold chain distribution, inter-district cargo",
        radiusMeters: 1700,
      },
    ],
  },
};

// Returns all hubs across all configured cities
export function getAllMandiHubs(): MandiHub[] {
  return Object.values(INDIAN_CITIES).flatMap((city) => city.hubs);
}

// Detect which city an instrument belongs to based on address, circle, or pincode
export function getCityForInstrument(inst: Partial<Instrument>): CityId {
  const pin = (inst.pincode || "").trim();
  const address = (inst.ownerAddress || "").toLowerCase();
  const circle = (inst.jurisdictionCircle || "").toLowerCase();

  // 1. Check Mumbai MMR
  if (
    pin.startsWith("400") ||
    address.includes("mumbai") ||
    address.includes("vashi") ||
    address.includes("navi mumbai") ||
    address.includes("crawford") ||
    address.includes("dadar") ||
    address.includes("andheri") ||
    address.includes("kalbadevi") ||
    circle.includes("mumbai") ||
    circle.includes("konkan")
  ) {
    return "MUMBAI";
  }

  // 2. Check Pune District
  if (
    pin.startsWith("411") ||
    pin.startsWith("412") ||
    address.includes("pune") ||
    address.includes("pcmc") ||
    address.includes("kothrud") ||
    address.includes("baner") ||
    address.includes("hadapsar") ||
    address.includes("aundh") ||
    address.includes("sinhgad") ||
    address.includes("gultekdi") ||
    address.includes("pimpri") ||
    address.includes("bhosari") ||
    address.includes("swargate") ||
    address.includes("katraj") ||
    circle.includes("pune") ||
    circle.includes("pimpri")
  ) {
    return "PUNE";
  }

  // Default to Delhi NCR
  return "DELHI";
}

// Resolve coordinates [lat, lng] for an instrument placed in its city/mandi hub
export function getCoordinatesForInstrument(inst: Instrument, index: number): [number, number] {
  const cityId = getCityForInstrument(inst);
  const cityConfig = INDIAN_CITIES[cityId] || INDIAN_CITIES.DELHI;
  const hubs = cityConfig.hubs;

  let base = hubs[0]; // fallback to first hub of that city

  const circle = (inst.jurisdictionCircle || "").toLowerCase();
  const address = (inst.ownerAddress || "").toLowerCase();
  const pin = (inst.pincode || "").trim();

  // Match closest Mandi Hub inside this city
  for (const hub of hubs) {
    if (
      (hub.pincode && pin === hub.pincode) ||
      circle.includes(hub.shortName.toLowerCase()) ||
      circle.includes(hub.circle.toLowerCase()) ||
      address.includes(hub.shortName.toLowerCase()) ||
      address.includes(hub.id.toLowerCase())
    ) {
      base = hub;
      break;
    }
  }

  // Secondary specific heuristics per hub
  if (cityId === "MUMBAI") {
    if (address.includes("vashi") || address.includes("turbhe") || pin === "400703") {
      base = hubs.find((h) => h.id === "VASHI_APMC") || base;
    } else if (address.includes("crawford") || address.includes("kalbadevi") || pin === "400001") {
      base = hubs.find((h) => h.id === "CRAWFORD") || base;
    } else if (address.includes("dadar") || pin === "400028") {
      base = hubs.find((h) => h.id === "DADAR_MANDI") || base;
    } else if (address.includes("andheri") || address.includes("marol") || pin === "400069") {
      base = hubs.find((h) => h.id === "ANDHERI_MIDC") || base;
    }
  } else if (cityId === "PUNE") {
    if (address.includes("kothrud") || pin === "411038") {
      base = hubs.find((h) => h.id === "KOTHRUD") || base;
    } else if (address.includes("baner") || pin === "411045") {
      base = hubs.find((h) => h.id === "BANER") || base;
    } else if (address.includes("hadapsar") || pin === "411028") {
      base = hubs.find((h) => h.id === "HADAPSAR") || base;
    } else if (address.includes("aundh") || pin === "411007") {
      base = hubs.find((h) => h.id === "AUNDH") || base;
    } else if (address.includes("sinhgad") || pin === "411051") {
      base = hubs.find((h) => h.id === "SINHGAD") || base;
    } else if (address.includes("gultekdi") || pin === "411037") {
      base = hubs.find((h) => h.id === "GULTEKDI") || base;
    } else if (address.includes("pimpri") || address.includes("bhosari") || pin === "411018") {
      base = hubs.find((h) => h.id === "PIMPRI_MIDC") || base;
    } else if (address.includes("swargate") || address.includes("katraj") || pin === "411009") {
      base = hubs.find((h) => h.id === "SWARGATE_KATRAJ") || base;
    }
  } else {
    // Delhi specific
    if (circle.includes("east") || pin === "110096" || pin === "110092" || address.includes("ghazipur")) {
      base = hubs.find((h) => h.id === "GHAZIPUR") || base;
    } else if (circle.includes("central") || pin === "110006" || address.includes("chandni") || address.includes("daryaganj")) {
      base = hubs.find((h) => h.id === "CHANDNI_CHOWK") || base;
    } else if (circle.includes("south") || pin === "110020" || pin === "110019" || address.includes("okhla")) {
      base = hubs.find((h) => h.id === "OKHLA") || base;
    } else if (circle.includes("west") || pin === "110043" || pin === "110026" || address.includes("najafgarh")) {
      base = hubs.find((h) => h.id === "NAJAFGARH") || base;
    }
  }

  // Golden ratio angle jitter around hub perimeter (~300m - 900m) so scales don't stack on top of each other
  const angle = (index * 137.5 * Math.PI) / 180;
  const radius = 0.003 + (index % 5) * 0.0018;
  const lat = base.lat + radius * Math.cos(angle);
  const lng = base.lng + radius * Math.sin(angle) * 1.1;

  return [lat, lng];
}
