"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Language = "en" | "hi";
export type FontSize = "small" | "normal" | "large";

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Top Bar
    "gov.title": "भारत सरकार | Government of India",
    "gov.dept": "उपभोक्ता मामले विभाग | Department of Consumer Affairs",
    "gov.motto": "Satyameva Jayate • Legal Metrology Regulatory Integrity Network",
    "lang.english": "English",
    "lang.hindi": "हिन्दी",

    // Universal Header
    "header.portals": "Portals",
    "header.search_placeholder": "Search scale ID, serial, merchant, circle...",
    "header.notifications": "Regulatory Notifications",
    "header.mark_all_read": "Mark all read",
    "header.no_notifications": "No new regulatory notifications",
    "header.profile": "Officer Profile",
    "header.logout": "Sign Out",
    "header.jurisdiction": "Jurisdiction Circle",
    "header.badge": "Officer Badge ID",

    // Portals
    "portal.admin": "Command Center",
    "portal.admin_desc": "Statewide inspection triage, anomaly radar & statutory oversight",
    "portal.lmo": "Field Inspections (LMO)",
    "portal.lmo_desc": "On-site verification terminal, camera OCR & holographic sealing",
    "portal.owner": "Merchant Instruments",
    "portal.owner_desc": "Scale registration, reverification applications & Form-A vault",
    "portal.manufacturer": "Manufacturer Registry",
    "portal.manufacturer_desc": "Batch minting, model birth registry & supply tracking",
    "portal.qr": "Public Citizen Portal",
    "portal.qr_desc": "Zero-login stamp verification & short-weight grievance lodging",

    // Common Tabs
    "tab.overview": "Overview",
    "tab.assignments": "Assignment Queue",
    "tab.flags": "Priority Flags",
    "tab.complaints": "Citizen Grievances",
    "tab.workload": "Officer Workload",
    "tab.heatmap": "GIS Compliance Heatmap",
    "tab.network_graph": "Fraud Ring Network Graph",
    "tab.batch_analytics": "Batch Model Failure Analytics",

    // Statuses
    "status.verified_active": "VERIFIED ACTIVE",
    "status.expired": "EXPIRED",
    "status.critical": "CRITICAL / TAMPERED",
    "status.expiring_soon": "EXPIRING SOON",
    "status.registered_pending": "PENDING VERIFICATION",
    "status.suspended_tampered": "SUSPENDED / TAMPERED",

    // Actions
    "btn.search": "Search",
    "btn.filter": "Filter",
    "btn.all": "All",
    "btn.view_qr": "View Public QR",
    "btn.audit_docket": "Audit Docket",
    "btn.close": "Close",
    "btn.save": "Save",
    "btn.cancel": "Cancel",
  },
  hi: {
    // Top Bar
    "gov.title": "भारत सरकार | Government of India",
    "gov.dept": "उपभोक्ता मामले विभाग | Department of Consumer Affairs",
    "gov.motto": "सत्यमेव जयते • विधिक मापविज्ञान विनियामक अखंडता नेटवर्क",
    "lang.english": "English",
    "lang.hindi": "हिन्दी",

    // Universal Header
    "header.portals": "पोर्टल",
    "header.search_placeholder": "माप उपकरण आईडी, क्रमांक, व्यापारी या मंडल खोजें...",
    "header.notifications": "विनियामक सूचनाएं",
    "header.mark_all_read": "सभी पढ़ी गई चिह्नित करें",
    "header.no_notifications": "कोई नई विनियामक सूचना नहीं",
    "header.profile": "अधिकारी प्रोफ़ाइल",
    "header.logout": "लॉग आउट करें",
    "header.jurisdiction": "अधिकार क्षेत्र मंडल",
    "header.badge": "अधिकारी बैज संख्या",

    // Portals
    "portal.admin": "कमांड सेंटर (प्रशासक)",
    "portal.admin_desc": "राज्यव्यापी निरीक्षण प्राथमिकता, विसंगति रडार एवं विधिक निगरानी",
    "portal.lmo": "क्षेत्रीय निरीक्षण (एलएमओ)",
    "portal.lmo_desc": "ऑन-साइट सत्यापन टर्मिनल, कैमरा ओसीआर एवं मुहर प्रमाणीकरण",
    "portal.owner": "व्यापारी माप उपकरण",
    "portal.owner_desc": "उपकरण पंजीकरण, पुनर्सत्यापन आवेदन एवं फॉर्म-ए प्रमाणपत्र",
    "portal.manufacturer": "निर्माता विनिर्माण रजिस्ट्री",
    "portal.manufacturer_desc": "बैच सीरियल मिंटिंग, मॉडल अनुमोदन एवं आपूर्ति ट्रैकिंग",
    "portal.qr": "नागरिक सत्यापन पोर्टल",
    "portal.qr_desc": "बिना लॉगिन मुहर सत्यापन एवं कम वजन शिकायत दर्ज करें",

    // Common Tabs
    "tab.overview": "सिंहावलोकन",
    "tab.assignments": "आवंटन कतार",
    "tab.flags": "प्राथमिकता चेतावनियां",
    "tab.complaints": "नागरिक शिकायतें",
    "tab.workload": "अधिकारी कार्यभार",
    "tab.heatmap": "जीआईएस अनुपालन हीटमैप",
    "tab.network_graph": "धोखाधड़ी नेटवर्क ग्राफ",
    "tab.batch_analytics": "बैच मॉडल विफलता विश्लेषण",

    // Statuses
    "status.verified_active": "सत्यापित सक्रिय",
    "status.expired": "मुहर समाप्त",
    "status.critical": "अतिसंवेदनशील / छेड़छाड़",
    "status.expiring_soon": "शीघ्र समाप्त होने वाला",
    "status.registered_pending": "सत्यापन लंबित",
    "status.suspended_tampered": "निलंबित / छेड़छाड़",

    // Actions
    "btn.search": "खोजें",
    "btn.filter": "फ़िल्टर",
    "btn.all": "सभी",
    "btn.view_qr": "सार्वजनिक क्यूआर देखें",
    "btn.audit_docket": "ऑडिट डॉकेट",
    "btn.close": "बंद करें",
    "btn.save": "सुरक्षित करें",
    "btn.cancel": "रद्द करें",
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [fontSize, setFontSizeState] = useState<FontSize>("normal");

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedLang = localStorage.getItem("metrica_language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "hi")) {
      setLanguageState(savedLang);
      document.documentElement.lang = savedLang;
    }

    const savedFontSize = localStorage.getItem("metrica_font_size") as FontSize;
    if (savedFontSize && (savedFontSize === "small" || savedFontSize === "normal" || savedFontSize === "large")) {
      setFontSizeState(savedFontSize);
      applyFontSizeToDOM(savedFontSize);
    }
  }, []);

  const applyFontSizeToDOM = (size: FontSize) => {
    if (typeof document === "undefined") return;
    if (size === "small") {
      document.documentElement.style.fontSize = "14px";
    } else if (size === "large") {
      document.documentElement.style.fontSize = "18px";
    } else {
      document.documentElement.style.fontSize = "16px";
    }
  };

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("metrica_language", lang);
      document.documentElement.lang = lang;
    }
  }, []);

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size);
    if (typeof window !== "undefined") {
      localStorage.setItem("metrica_font_size", size);
      applyFontSizeToDOM(size);
    }
  }, []);

  const t = useCallback(
    (key: string) => {
      const dict = translations[language] || translations.en;
      return dict[key] || translations.en[key] || key;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, fontSize, setFontSize, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
