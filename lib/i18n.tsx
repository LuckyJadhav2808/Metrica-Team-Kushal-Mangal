"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export type Language = "en" | "hi";

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  fontScale: number; // 70 to 160%
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  t: (key: string) => string;
}

// Comprehensive Government Metrology Terminology Dictionary
const HINDI_REPLACEMENTS: [RegExp, string][] = [
  // Titles & Portals
  [/Administrator Command Center/gi, "प्रशासक नियंत्रण कक्ष"],
  [/Command Center Oversight/gi, "कमांड सेंटर निरीक्षण एवं विनियामक निगरानी"],
  [/Command Center/gi, "कमांड सेंटर"],
  [/National Regulatory Oversight Active/gi, "राष्ट्रीय विनियामक निगरानी सक्रिय"],
  [/Central Directorate, Krishi Bhawan/gi, "केंद्रीय निदेशालय, कृषि भवन"],
  [/Central Directorate/gi, "केंद्रीय निदेशालय"],
  [/Government of India/gi, "भारत सरकार"],
  [/Department of Consumer Affairs/gi, "उपभोक्ता मामले विभाग"],
  [/Ministry of Consumer Affairs, Food & Public Distribution/gi, "उपभोक्ता मामले, खाद्य एवं सार्वजनिक वितरण मंत्रालय"],
  [/Legal Metrology Regulatory Integrity Network/gi, "विधिक मापविज्ञान विनियामक अखंडता नेटवर्क"],
  [/Legal Metrology Act, 2009/gi, "विधिक मापविज्ञान अधिनियम, 2009"],
  [/Model Approval Rules/gi, "मॉडल अनुमोदन नियम"],
  [/Field Inspections \(LMO\)/gi, "क्षेत्रीय निरीक्षण (एलएमओ)"],
  [/Merchant Instruments/gi, "व्यापारी माप उपकरण"],
  [/Manufacturer Registry/gi, "निर्माता विनिर्माण रजिस्ट्री"],
  [/Public Citizen Portal/gi, "सार्वजनिक नागरिक पोर्टल"],
  [/Public Citizen QR Trust Page/gi, "सार्वजनिक नागरिक क्यूआर ट्रस्ट पोर्टल"],

  // Tabs & Views
  [/Assignment Queue/gi, "आवंटन कतार"],
  [/Unassigned Application Queue/gi, "अनआवंटित आवेदन कतार"],
  [/Master Regulatory Case Queue/gi, "मुख्य विनियामक मामला कतार"],
  [/Priority Anomaly Flags/gi, "प्राथमिकता विसंगति चेतावनियां"],
  [/Priority Flags/gi, "प्राथमिकता चेतावनियां"],
  [/Citizen Grievances/gi, "नागरिक शिकायतें"],
  [/Officer Workload/gi, "अधिकारी कार्यभार"],
  [/GIS Compliance Heatmap/gi, "जीआईएस अनुपालन हीटमैप"],
  [/Fraud Ring Network Graph/gi, "धोखाधड़ी नेटवर्क ग्राफ"],
  [/Batch Failure Analytics/gi, "बैच विफलता विश्लेषण"],
  [/Batch Model Failure Analytics/gi, "बैच मॉडल विफलता विश्लेषण"],
  [/Overview/gi, "सिंहावलोकन"],

  // Statuses & Badges
  [/VERIFIED ACTIVE/gi, "सत्यापित सक्रिय"],
  [/Verified Active/gi, "सत्यापित सक्रिय"],
  [/ACTIVE VALID/gi, "सक्रिय वैध"],
  [/Active Valid/gi, "सक्रिय वैध"],
  [/EXPIRED STAMPING/gi, "मुहर समाप्त"],
  [/EXPIRED SEAL/gi, "मुहर समाप्त"],
  [/EXPIRED/gi, "समाप्त"],
  [/Expired/gi, "समाप्त"],
  [/CRITICAL \/ TAMPERED \/ RAID/gi, "अतिसंवेदनशील / छेड़छाड़ / छापा"],
  [/CRITICAL FRAUD RISK/gi, "गंभीर धोखाधड़ी जोखिम"],
  [/CRITICAL/gi, "अतिसंवेदनशील"],
  [/Critical/gi, "अतिसंवेदनशील"],
  [/TAMPERED \/ SUSPENDED/gi, "छेड़छाड़ / निलंबित"],
  [/SUSPENDED_TAMPERED/gi, "निलंबित (छेड़छाड़)"],
  [/SUSPENDED/gi, "निलंबित"],
  [/Suspended/gi, "निलंबित"],
  [/ATTENTION REQUIRED/gi, "कार्रवाई आवश्यक"],
  [/REGISTERED_PENDING_VERIFICATION/gi, "सत्यापन लंबित"],
  [/PENDING VERIFICATION/gi, "सत्यापन लंबित"],
  [/Pending Verification/gi, "सत्यापन लंबित"],
  [/ACTION TAKEN RAID/gi, "छापा कार्रवाई की गई"],
  [/Action Taken/gi, "कार्रवाई की गई"],
  [/UNDER INVESTIGATION/gi, "जांच जारी"],
  [/Under Investigation/gi, "जांच जारी"],
  [/RESOLVED/gi, "निस्तारित"],
  [/Resolved/gi, "निस्तारित"],
  [/Compliant/gi, "अनुपालन पूर्ण"],
  [/Under Surveillance/gi, "निगरानी में"],
  [/Recall Recommended/gi, "वापसी (रिकॉल) अनुशंसित"],
  [/Recall Active/gi, "सक्रिय वापसी आदेश"],

  // Common Labels & Card Text
  [/Search ID or Owner\.\.\./gi, "आईडी या व्यापारी खोजें..."],
  [/Search Scale ID or Merchant\.\.\./gi, "माप उपकरण आईडी या व्यापारी खोजें..."],
  [/Search scale ID, serial, merchant, circle\.\.\./gi, "आईडी, क्रमांक, व्यापारी या मंडल खोजें..."],
  [/All Scales/gi, "सभी माप उपकरण"],
  [/All/gi, "सभी"],
  [/Pending/gi, "लंबित"],
  [/Actions/gi, "कार्रवाइयां"],
  [/Establishment/gi, "व्यावसायिक प्रतिष्ठान"],
  [/Merchant Establishment/gi, "व्यापारी प्रतिष्ठान"],
  [/Merchant/gi, "व्यापारी"],
  [/Risk Index/gi, "जोखिम सूचकांक"],
  [/Trust Score/gi, "विश्वास स्कोर"],
  [/Valid Until/gi, "वैधता तिथि"],
  [/Serial Number/gi, "क्रमांक"],
  [/Serial No/gi, "क्रमांक"],
  [/Digital Instrument ID/gi, "डिजिटल माप उपकरण आईडी"],
  [/Jurisdiction Circle/gi, "अधिकार क्षेत्र मंडल"],
  [/Officer Badge ID/gi, "अधिकारी बैज संख्या"],
  [/Officer Profile/gi, "अधिकारी प्रोफ़ाइल"],
  [/Regulatory Notifications/gi, "विनियामक सूचनाएं"],
  [/Mark all read/gi, "सभी पढ़ी गई चिह्नित करें"],
  [/Sign Out/gi, "लॉग आउट करें"],
  [/Logout/gi, "लॉग आउट"],
  [/Close/gi, "बंद करें"],
  [/Cancel/gi, "रद्द करें"],
  [/Confirm/gi, "पुष्टि करें"],
  [/Submit/gi, "जमा करें"],
  [/View Public QR/gi, "सार्वजनिक क्यूआर देखें"],
  [/Inspect QR/gi, "क्यूआर जांचें"],
  [/Audit Docket/gi, "ऑडिट डॉकेट"],
  [/Quick Focus:/gi, "त्वरित केंद्र:"],
  [/Pune Places:/gi, "पुणे क्षेत्र:"],
  [/Compliance Key/gi, "अनुपालन कुंजी"],
  [/Active Mandi Docket/gi, "सक्रिय मंडी डॉकेट"],
  [/Live GIS Sync/gi, "लाइव जीआईएस समन्वय"],
  [/Live GPS Radar ON/gi, "लाइव जीपीएस रडार चालू"],
  [/Radar Paused/gi, "रडार रुका हुआ"],
  [/Voyager/gi, "मानचित्र"],
  [/Satellite/gi, "उपग्रह दृश्य (सैटेलाइट)"],

  // Pune GIS and Mandi Terms
  [/Pune Scales/gi, "पुणे माप उपकरण"],
  [/Click to show all/gi, "सभी दिखाने के लिए क्लिक करें"],
  [/Click to show/gi, "दिखाने के लिए क्लिक करें"],
  [/Click to filter/gi, "फ़िल्टर करने के लिए क्लिक करें"],
  [/Filter active/gi, "फ़िल्टर सक्रिय"],
  [/Active Grievances/gi, "सक्रिय शिकायतें"],
  [/Pune Division:/gi, "पुणे संभाग:"],
  [/Pune Division/gi, "पुणे संभाग"],
  [/Add Map API Key/gi, "मानचित्र एपीआई कुंजी जोड़ें"],
  [/API Key Configured/gi, "एपीआई कुंजी कॉन्फ़िगर है"],
  [/Mapbox Live/gi, "मैपबॉक्स लाइव"],
  [/Pune Mandi Docket/gi, "पुणे मंडी डॉकेट"],
  [/Live Pune Sync/gi, "लाइव पुणे समन्वय"],
  [/Live GPS Radar ON/gi, "लाइव जीपीएस रडार चालू"],
  [/Radar Paused/gi, "रडार रुका हुआ"],
  [/Statewide Portals/gi, "राज्यव्यापी पोर्टल"],
  [/Command Oversight \(Strictly Admin\)/gi, "कमांड नियंत्रण (केवल प्रशासक)"],
  [/Command Oversight/gi, "कमांड नियंत्रण"],
  [/New Case File/gi, "+ नया मामला दर्ज करें"],
  [/New Case/gi, "नया मामला"],
  [/Showing \d+ geocoded scales/gi, "भू-स्थानिक तराजू प्रदर्शित"],
  [/geocoded scales/gi, "भू-स्थानिक तराजू"],
  [/Compliance Key \(Pune\)/gi, "अनुपालन कुंजी (पुणे)"],
  [/Compliance Key/gi, "अनुपालन कुंजी"],
  [/Attention Required \(30 Days\)/gi, "कार्रवाई आवश्यक (30 दिन शेष)"],
  [/Form-A Verified Active/gi, "प्रपत्र-क सत्यापित सक्रिय"],
  [/Expired Stamping Overdue/gi, "मुहर वैधता समाप्त"],
  [/Expired Stamping/gi, "मुहर समाप्त"],
  [/Kothrud & Karve Rd \(Pune West\)/gi, "कोथरूड एवं कर्वे रोड (पुणे पश्चिम)"],
  [/Baner & Balewadi \(Pune North-West\)/gi, "बानेर एवं बालेवाड़ी (पुणे उत्तर-पश्चिम)"],
  [/Hadapsar APMC Mandi \(Pune East\)/gi, "हडपसर एपीएमसी मंडी (पुणे पूर्व)"],
  [/Aundh & University Sector \(Pune North\)/gi, "औंध एवं विश्वविद्यालय क्षेत्र (पुणे उत्तर)"],
  [/Sinhgad Road & Dhayari \(Pune South\)/gi, "सिंहगढ़ रोड एवं धायरी (पुणे दक्षिण)"],
  [/All Pune Mandi Hubs \(5 Divisions\)/gi, "सभी पुणे मंडी केंद्र (5 संभाग)"],
  [/Kothrud/gi, "कोथरूड"],
  [/Baner/gi, "बानेर"],
  [/Hadapsar/gi, "हडपसर"],
  [/Aundh/gi, "औंध"],
  [/Sinhgad/gi, "सिंहगढ़"],
  [/Sign Out to SSO Gateway/gi, "लॉग आउट करें"],
  [/Sign Out/gi, "लॉग आउट करें"],
  [/Log Out/gi, "लॉग आउट"],
  [/Logout/gi, "लॉग आउट"],
  [/Controller/gi, "नियंत्रक"],
  [/Merchant Unknown/gi, "व्यापारी प्रतिष्ठान"],
  [/Model/gi, "मॉडल"],
  [/Risk Index/gi, "जोखिम सूचकांक"],
  [/Valid Until/gi, "वैधता तिथि"],
  [/Not Set/gi, "अनिर्धारित"],
  [/Grievance/gi, "शिकायत"],
  [/Grievances/gi, "शिकायतें"],
  [/Sandbox: 16 Mandi Scales/gi, "सैंडबॉक्स: 16 मंडी तराजू"],

  // Administrative Actions
  [/Commission New Officer/gi, "नया अधिकारी नियुक्त करें"],
  [/Dispatch Surprise Enforcement Raid/gi, "आकस्मिक प्रवर्तन छापा भेजें"],
  [/Issue Statutory Batch Recall Notice/gi, "विधिक बैच वापसी नोटिस जारी करें"],
  [/Mandate Re-Verification Drive/gi, "अनिवार्य पुनर्सत्यापन अभियान आदेश दें"],
  [/Export CSIR-NPL Dossier/gi, "सीएसआईआर-एनपीएल तकनीकी रिपोर्ट निर्यात करें"],
  [/Print Departmental Record/gi, "विभागीय रिकॉर्ड प्रिंट करें"],
  [/Real-time statutory verification monitoring, anomaly triage, citizen grievance redressal, and officer capacity\./gi, "वास्तविक समय विधिक सत्यापन निगरानी, विसंगति निवारण, नागरिक शिकायत निवारण एवं अधिकारी क्षमता प्रबंधन।"],
];

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [fontScale, setFontScaleState] = useState<number>(100); // percentage 70% to 160%
  const originalTextMapRef = useRef<Map<Node, string>>(new Map());
  const observerRef = useRef<MutationObserver | null>(null);
  const isTranslatingRef = useRef<boolean>(false);

  // Apply font scale dynamically to document root
  const applyFontScaleToDOM = (scale: number) => {
    if (typeof document === "undefined") return;
    const basePx = 16;
    const computedPx = (basePx * scale) / 100;
    document.documentElement.style.fontSize = `${computedPx}px`;
  };

  // Zoom In Handler (+10%)
  const zoomIn = useCallback(() => {
    setFontScaleState((prev) => {
      const next = Math.min(prev + 10, 160);
      if (typeof window !== "undefined") {
        localStorage.setItem("metrica_font_scale", next.toString());
      }
      applyFontScaleToDOM(next);
      return next;
    });
  }, []);

  // Zoom Out Handler (-10%)
  const zoomOut = useCallback(() => {
    setFontScaleState((prev) => {
      const next = Math.max(prev - 10, 70);
      if (typeof window !== "undefined") {
        localStorage.setItem("metrica_font_scale", next.toString());
      }
      applyFontScaleToDOM(next);
      return next;
    });
  }, []);

  // Reset Zoom Handler (100%)
  const zoomReset = useCallback(() => {
    setFontScaleState(100);
    if (typeof window !== "undefined") {
      localStorage.setItem("metrica_font_scale", "100");
    }
    applyFontScaleToDOM(100);
  }, []);

  // Recursive DOM text translator for complete page transformation
  const translateNode = useCallback((node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // Check parent element - NEVER translate Material Symbols, icon ligatures, or translate="no" elements!
      const parent = node.parentElement;
      if (parent) {
        const pClass = (parent.className && typeof parent.className === "string") ? parent.className : "";
        if (
          pClass.includes("material-symbols") ||
          pClass.includes("material-icons") ||
          pClass.includes("fa-") ||
          parent.tagName === "SCRIPT" ||
          parent.tagName === "STYLE" ||
          parent.tagName === "NOSCRIPT" ||
          parent.tagName === "CODE" ||
          parent.tagName === "PRE" ||
          parent.getAttribute("translate") === "no" ||
          parent.hasAttribute("data-no-translate")
        ) {
          return;
        }
      }

      const text = node.nodeValue;
      if (!text || !text.trim()) return;

      // Skip text nodes that already contain pure Hindi (Devanagari)
      if (/[\u0900-\u097F]/.test(text) && !/[a-zA-Z]{3,}/.test(text)) {
        return;
      }

      // Save original English text if not saved
      if (!originalTextMapRef.current.has(node)) {
        originalTextMapRef.current.set(node, text);
      }

      const orig = originalTextMapRef.current.get(node) || text;
      let translated = orig;

      HINDI_REPLACEMENTS.forEach(([regex, replacement]) => {
        translated = translated.replace(regex, replacement);
      });

      if (translated !== node.nodeValue) {
        isTranslatingRef.current = true;
        node.nodeValue = translated;
        isTranslatingRef.current = false;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const elClass = (el.className && typeof el.className === "string") ? el.className : "";

      // Skip script, style, and icon elements
      if (
        el.tagName === "SCRIPT" ||
        el.tagName === "STYLE" ||
        el.tagName === "NOSCRIPT" ||
        el.tagName === "CODE" ||
        el.tagName === "PRE" ||
        elClass.includes("material-symbols") ||
        elClass.includes("material-icons") ||
        elClass.includes("fa-") ||
        el.getAttribute("translate") === "no" ||
        el.hasAttribute("data-no-translate")
      ) {
        return;
      }

      // Translate placeholder attribute only if not already Hindi
      if (el.getAttribute && el.getAttribute("placeholder")) {
        const placeholder = el.getAttribute("placeholder")!;
        if (!/[\u0900-\u097F]/.test(placeholder)) {
          let translatedPh = placeholder;
          HINDI_REPLACEMENTS.forEach(([regex, replacement]) => {
            translatedPh = translatedPh.replace(regex, replacement);
          });
          el.setAttribute("placeholder", translatedPh);
        }
      }

      // Recursively translate child nodes
      for (let i = 0; i < node.childNodes.length; i++) {
        translateNode(node.childNodes[i]);
      }
    }
  }, []);

  // Restore original English text
  const restoreOriginalDOM = useCallback(() => {
    originalTextMapRef.current.forEach((origText, node) => {
      try {
        if (node && node.parentNode) {
          isTranslatingRef.current = true;
          node.nodeValue = origText;
          isTranslatingRef.current = false;
        }
      } catch {
        // Ignore disconnected nodes
      }
    });
    originalTextMapRef.current.clear();
  }, []);

  // Translate Entire DOM tree
  const translateEntirePage = useCallback(() => {
    if (typeof document === "undefined") return;
    translateNode(document.body);
  }, [translateNode]);

  // Real-time Neural Translation Bridge Trigger
  const triggerGoogleTranslate = useCallback((targetLang: string) => {
    if (typeof window === "undefined") return false;
    try {
      const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (select) {
        select.value = targetLang;
        select.dispatchEvent(new Event("change"));
        return true;
      }
    } catch (e) {
      console.warn("Translation bridge trigger note:", e);
    }
    return false;
  }, []);

  // Set Language Handler
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("metrica_language", lang);
      document.documentElement.lang = lang;

      // Synchronize standard sovereign Google Translate cookies
      if (lang === "hi") {
        document.cookie = "googtrans=/en/hi; path=/";
        document.cookie = `googtrans=/en/hi; path=/; domain=${window.location.hostname}`;
        const ok = triggerGoogleTranslate("hi");
        if (!ok) {
          const timer = setInterval(() => {
            if (triggerGoogleTranslate("hi")) {
              clearInterval(timer);
            }
          }, 250);
          setTimeout(() => clearInterval(timer), 3500);
        }
      } else {
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
        const ok = triggerGoogleTranslate("en");
        if (!ok) {
          restoreOriginalDOM();
        }
      }
    }

    if (lang === "hi") {
      translateEntirePage();
    } else {
      restoreOriginalDOM();
    }
  }, [translateEntirePage, restoreOriginalDOM, triggerGoogleTranslate]);

  // Setup DOM MutationObserver to auto-translate dynamically rendered content when in Hindi
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (language === "hi") {
      translateEntirePage();

      if (!observerRef.current) {
        observerRef.current = new MutationObserver((mutations) => {
          if (isTranslatingRef.current) return;
          isTranslatingRef.current = true;
          try {
            mutations.forEach((mutation) => {
              if (mutation.type === "childList") {
                mutation.addedNodes.forEach((node) => {
                  translateNode(node);
                });
              } else if (mutation.type === "characterData" && mutation.target) {
                translateNode(mutation.target);
              }
            });
          } finally {
            isTranslatingRef.current = false;
          }
        });

        observerRef.current.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }
    } else {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      restoreOriginalDOM();
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [language, translateEntirePage, translateNode, restoreOriginalDOM]);

  // Continuously protect icon fonts, SVG symbols, and code elements from ligature translation
  // Defer execution until post-hydration to eliminate React hydration mismatch errors
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (language !== "hi") return;

    let iconProtectionObserver: MutationObserver | null = null;

    // Defer DOM mutation until after React has completed initial hydration
    const timer = setTimeout(() => {
      const protectElements = (root: ParentNode = document) => {
        if (!root || !root.querySelectorAll) return;
        try {
          const selectors = [
            ".material-symbols-outlined",
            ".material-symbols",
            ".material-icons",
            '[class*="material-symbols"]',
            '[class*="material-icons"]',
            "svg",
            "code",
            "pre",
            ".font-mono",
          ];
          const els = root.querySelectorAll<HTMLElement>(selectors.join(","));
          els.forEach((el) => {
            if (!el.classList.contains("notranslate")) {
              el.classList.add("notranslate");
            }
            if (el.getAttribute("translate") !== "no") {
              el.setAttribute("translate", "no");
            }
          });
        } catch {
          // Ignore query selector errors on fragments
        }
      };

      // Initial post-hydration protection pass
      protectElements(document);

      // MutationObserver to protect dynamically rendered icons and prevent body shift
      iconProtectionObserver = new MutationObserver((mutations) => {
        // Force sovereign zero-offset on body
        if (document.body.style.top && document.body.style.top !== "0px") {
          document.body.style.top = "0px";
        }

        mutations.forEach((m) => {
          if (m.type === "childList") {
            m.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                const cl = typeof el.className === "string" ? el.className : "";
                if (
                  cl.includes("material-symbols") ||
                  cl.includes("material-icons") ||
                  el.tagName === "CODE" ||
                  el.tagName === "SVG"
                ) {
                  if (!el.classList.contains("notranslate")) el.classList.add("notranslate");
                  if (el.getAttribute("translate") !== "no") el.setAttribute("translate", "no");
                }
                protectElements(el);
              }
            });
          }
        });
      });

      iconProtectionObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      if (iconProtectionObserver) {
        iconProtectionObserver.disconnect();
      }
    };
  }, [language]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load saved font scale
    const savedScale = localStorage.getItem("metrica_font_scale");
    if (savedScale) {
      const parsedScale = parseInt(savedScale, 10);
      if (!isNaN(parsedScale) && parsedScale >= 70 && parsedScale <= 160) {
        setFontScaleState(parsedScale);
        applyFontScaleToDOM(parsedScale);
      }
    }

    // Load saved language
    const savedLang = localStorage.getItem("metrica_language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "hi")) {
      setLanguageState(savedLang);
      document.documentElement.lang = savedLang;
      if (savedLang === "hi") {
        document.cookie = "googtrans=/en/hi; path=/";
        document.cookie = `googtrans=/en/hi; path=/; domain=${window.location.hostname}`;
        const timer = setInterval(() => {
          if (triggerGoogleTranslate("hi")) {
            clearInterval(timer);
          }
        }, 300);
        setTimeout(() => clearInterval(timer), 3500);
        setTimeout(() => {
          translateEntirePage();
        }, 100);
      }
    }
  }, [translateEntirePage, triggerGoogleTranslate]);

  // Comprehensive key-value translation helper
  const t = useCallback(
    (key: string): string => {
      const DICT: Record<string, { en: string; hi: string }> = {
        "gov.title": { en: "भारत सरकार | Government of India", hi: "भारत सरकार | Government of India" },
        "gov.dept": { en: "उपभोक्ता मामले विभाग | Department of Consumer Affairs", hi: "उपभोक्ता मामले विभाग | Department of Consumer Affairs" },
        "header.portals": { en: "Portals", hi: "विनियामक पोर्टल" },
        "header.search_placeholder": { en: "Search scale ID, serial, merchant, circle...", hi: "माप उपकरण आईडी, क्रमांक, व्यापारी या मंडल खोजें..." },
      };
      const found = DICT[key];
      if (found) {
        return language === "hi" ? found.hi : found.en;
      }
      return key;
    },
    [language]
  );

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        fontScale,
        zoomIn,
        zoomOut,
        zoomReset,
        t,
      }}
    >
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
