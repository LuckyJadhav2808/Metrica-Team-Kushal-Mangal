"use client";

import React, { useState, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";

export type MascotState = "idle" | "explaining" | "warning" | "celebration" | "thinking";

interface Message {
  id: string;
  sender: "user" | "mascot";
  text: string;
  timestamp: string;
  source?: "OPENROUTER_AI" | "DOMAIN_KNOWLEDGE_BASE";
}

interface MascotCompanionProps {
  initialState?: MascotState;
  customTip?: string;
  customTipHi?: string;
  scaleStatus?: string;
  scaleId?: string;
  className?: string;
}

const STATUTORY_TIPS = [
  {
    en: "Always ensure the merchant's digital scale displays exactly 0.000 kg before any goods are placed on the pan.",
    hi: "सामान रखने से पहले हमेशा सुनिश्चित करें कि डिजिटल तराजू पर ठीक 0.000 कि.ग्रा. दिख रहा हो।",
    badge: "Zero Tracking Rule",
  },
  {
    en: "Look for the holographic tamper seal or lead seal stamped with the year on the side or bottom plate.",
    hi: "तराजू के किनारे या निचले हिस्से पर वर्ष मुद्रित होलोग्राम या सीसा सील (Lead Seal) की जांच करें।",
    badge: "Seal Inspection",
  },
  {
    en: "Pre-packaged commodities must clearly declare Net Quantity, Maximum Retail Price (MRP), and Packer Details.",
    hi: "पैकेटबंद वस्तुओं पर शुद्ध मात्रा (Net Quantity), अधिकतम खुदरा मूल्य (MRP) और पैकर का विवरण अनिवार्य है।",
    badge: "Packaged Goods Act",
  },
  {
    en: "Commercial weighing scales must be verified & stamped annually by the District Legal Metrology Officer.",
    hi: "व्यापारिक तौल उपकरणों का जिला विधिक मापविज्ञान अधिकारी द्वारा वार्षिक सत्यापन और मुहर लगवाना अनिवार्य है।",
    badge: "Annual Verification",
  },
  {
    en: "Suspect inaccurate weighing or broken seal? You can file an instant geo-tagged consumer complaint right here!",
    hi: "कम तौल या टूटी सील का संदेह है? आप यहीं से सीधे जियो-टैग्ड उपभोक्ता शिकायत दर्ज कर सकते हैं!",
    badge: "Consumer Protection",
  },
];

const SUGGESTED_QUESTIONS = [
  {
    en: "What is the Zero-Tracking Rule?",
    hi: "जीरो-ट्रैकिंग नियम क्या है?",
  },
  {
    en: "How do I check the Lead Seal on a scale?",
    hi: "तराजू पर सीसा सील (Lead Seal) कैसे जांचें?",
  },
  {
    en: "How do I report short weight or cheating?",
    hi: "कम तौल या धोखाधड़ी की शिकायत कैसे करें?",
  },
  {
    en: "What is Maximum Permissible Error (MPE)?",
    hi: "अधिकतम अनुमेय त्रुटि (MPE) क्या होती है?",
  },
  {
    en: "What is Form-A verification certificate?",
    hi: "फॉर्म-ए (Form-A) सत्यापन प्रमाण पत्र क्या है?",
  },
];

// Lightweight synthetic audio feedback using Web Audio API
function playChime(type: "pop" | "sparkle" | "alert") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "pop") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "sparkle") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.06); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.12); // D6
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "alert") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(240, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch {
    // AudioContext blocked or not allowed by policy
  }
}

export function MascotCompanion({
  initialState = "idle",
  customTip,
  customTipHi,
  scaleStatus,
  scaleId,
  className = "",
}: MascotCompanionProps) {
  const { language } = useI18n();
  const isHi = language === "hi";

  const [mascotState, setMascotState] = useState<MascotState>(initialState);
  const [tipIndex, setTipIndex] = useState(0);
  const [isBubbleOpen, setIsBubbleOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-greeting",
      sender: "mascot",
      text: isHi
        ? "जय हिन्द! मैं मेत्री प्रहरी हूँ, आपका विधिक मापविज्ञान डिजिटल रक्षक। आप मुझसे तराजू के नियम, सील सत्यापन, शून्य-ट्रैकिंग या शिकायत प्रक्रिया के बारे में कुछ भी पूछ सकते हैं!"
        : "Jai Hind! I am MetriPrahari, your Legal Metrology AI Guardian. Ask me anything about weighing rules, lead seals, zero-tracking, or filing measurement grievances!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Automatically adapt mascot state if scale status changes
  useEffect(() => {
    if (!scaleStatus) return;
    if (scaleStatus === "SUSPENDED_TAMPERED" || scaleStatus === "EXPIRED" || scaleStatus === "REJECTION_NOTICE_ISSUED") {
      setMascotState("warning");
      playChime("alert");
    } else if (scaleStatus === "VERIFIED_ACTIVE") {
      setMascotState("celebration");
      playChime("sparkle");
    }
  }, [scaleStatus]);

  // Scroll chat to bottom when messages change
  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  const handleMascotClick = () => {
    setIsBouncing(true);
    playChime("pop");
    setTimeout(() => setIsBouncing(false), 400);

    // Toggle chat drawer
    setIsChatOpen((prev) => !prev);
    setIsBubbleOpen(false);
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    setInputQuery("");
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setMascotState("thinking");

    try {
      const res = await fetch("/api/ai/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          language: isHi ? "hi" : "en",
          scaleStatus,
          scaleId,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || (isHi ? "क्षमा करें, मुझे इस समय उत्तर देने में समस्या आ रही है।" : "I apologize, I could not process your query right now.");

      const mascotMsg: Message = {
        id: `mascot-${Date.now()}`,
        sender: "mascot",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: data.source,
      };

      setMessages((prev) => [...prev, mascotMsg]);
      playChime("sparkle");
      setMascotState(scaleStatus === "SUSPENDED_TAMPERED" ? "warning" : "explaining");
    } catch {
      const errMsg: Message = {
        id: `mascot-err-${Date.now()}`,
        sender: "mascot",
        text: isHi
          ? "विधिक मापविज्ञान नियम 11 के तहत व्यापारी को हमेशा शून्य वजन से शुरुआत करनी चाहिए। आप कभी भी मेट्रिका पोर्टल पर शिकायत दर्ज कर सकते हैं।"
          : "Under Legal Metrology Rule 11, always verify 0.000 kg tare before weighing. You can file a grievance anytime on the Metrica portal.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
      setMascotState("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const currentTip = STATUTORY_TIPS[tipIndex];

  // Derive dynamic speech content for the floating speech bubble
  let speechTitle = isHi ? "मेत्री प्रहरी (विधिक मापविज्ञान रक्षक)" : "MetriPrahari • Metrology Guide";
  let speechText = isHi ? currentTip.hi : currentTip.en;
  let badgeText = currentTip.badge;
  let auraColor = "from-primary/25 to-sky-500/15";
  let stateBorder = "border-primary/25";

  if (mascotState === "warning") {
    speechTitle = isHi ? "⚠️ सतर्क रहें! अनियमितता पाई गई" : "⚠️ High Alert: Verification Notice";
    speechText = isHi
      ? "यह उपकरण वैध सत्यापित मुहर के बिना संचालित है या शिकायत दर्ज है। उपभोक्ता अधिकार के तहत शिकायत दर्ज करें।"
      : "This instrument has expired certification, broken seals, or active consumer flags. Verify with shopkeeper or lodge report.";
    badgeText = isHi ? "सतर्कता चेतावनी" : "Statutory Caution";
    auraColor = "from-status-red/35 to-rose-500/15";
    stateBorder = "border-status-red/40";
  } else if (mascotState === "celebration") {
    speechTitle = isHi ? "✅ प्रामाणिक एवं सत्यापित तराजू" : "✅ 100% Certified & Stamped Scale";
    speechText = isHi
      ? "यह उपकरण विधिक मापविज्ञान अधिनियम, 2009 के तहत पूर्णतः सत्यापित और डिजिटल रूप से हस्ताक्षरित है।"
      : "Active valid certificate with tamper-evident HMAC-SHA256 signature verified by the District LMO.";
    badgeText = isHi ? "सत्यापित मुहर" : "Verified Authentic";
    auraColor = "from-status-green/35 to-emerald-500/15";
    stateBorder = "border-status-green/40";
  } else if (mascotState === "thinking") {
    speechTitle = isHi ? "🧠 विचार कर रहा हूँ..." : "🧠 Processing legal rules...";
    speechText = isHi ? "विधिक मापविज्ञान अधिनियम 2009 के नियमों का विश्लेषण जारी है..." : "Analyzing Legal Metrology Act rules & tolerances...";
    badgeText = "AI Guardian";
  } else if (customTip) {
    speechText = isHi && customTipHi ? customTipHi : customTip;
  }

  return (
    <div
      className={`fixed bottom-5 right-5 z-40 flex flex-col items-end pointer-events-auto font-sans select-none ${className}`}
      aria-label="MetriPrahari Legal Metrology Companion"
    >
      {/* 1. EXPANDABLE INTERACTIVE AI CHAT DRAWER */}
      {isChatOpen && (
        <div className="relative mb-3 w-[92vw] sm:w-[380px] max-h-[540px] h-[500px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-primary/20 flex flex-col overflow-hidden animate-modal-in transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#00366F] via-[#0A3D62] to-[#002244] text-white px-4 py-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <span className="text-lg">⚖️</span>
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  {isHi ? "मेत्री प्रहरी AI रक्षक" : "MetriPrahari AI Guardian"}
                  <span className="text-[9px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-400/30 font-medium">
                    {isHi ? "सक्रिय" : "ONLINE"}
                  </span>
                </h4>
                <p className="text-[10px] text-white/70">
                  {isHi ? "विधिक मापविज्ञान सहायक • 24x7" : "Legal Metrology Sovereign Assistant"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsChatOpen(false);
                  setIsBubbleOpen(false);
                }}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
                title="Close"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-surface/50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-primary text-white rounded-br-xs"
                      : "bg-white text-neutral-800 border border-border/80 rounded-bl-xs"
                  }`}
                >
                  <p className="font-medium whitespace-pre-wrap">{m.text}</p>
                </div>
                <div className="flex items-center gap-1 mt-1 px-1 text-[9px] text-neutral-400">
                  <span>{m.timestamp}</span>
                  {m.source === "OPENROUTER_AI" && (
                    <span className="text-[8px] bg-sky-100 text-sky-700 px-1 rounded font-semibold">
                      AI Verified
                    </span>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-neutral-500 p-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span className="text-[11px] italic">
                  {isHi ? "मेत्री प्रहरी नियम जांच रहा है..." : "MetriPrahari is consulting metrology rules..."}
                </span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested Quick Question Chips */}
          <div className="px-3 py-2 bg-neutral-50 border-t border-border/50 flex gap-1.5 overflow-x-auto no-scrollbar">
            {SUGGESTED_QUESTIONS.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(isHi ? sq.hi : sq.en)}
                className="whitespace-nowrap text-[10px] font-medium bg-white hover:bg-primary/10 text-neutral-700 hover:text-primary px-2.5 py-1 rounded-full border border-border/80 transition cursor-pointer shadow-2xs shrink-0"
              >
                {isHi ? sq.hi : sq.en}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white border-t border-border/80 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={
                isHi
                  ? "तराजू, सील या नियमों पर प्रश्न पूछें..."
                  : "Ask about scale calibration, seals, or rights..."
              }
              className="flex-1 bg-surface-container text-xs px-3 py-2 rounded-xl border border-border/80 focus:outline-none focus:ring-1.5 focus:ring-primary text-neutral-800 placeholder:text-neutral-400"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="w-8 h-8 rounded-xl bg-primary disabled:opacity-40 hover:bg-primary-hover text-white flex items-center justify-center transition cursor-pointer shadow-sm shrink-0"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </form>
        </div>
      )}

      {/* 2. DYNAMIC TACTILE SPEECH BUBBLE (Quick Tip Mode) */}
      {isBubbleOpen && !isChatOpen && (
        <div
          className={`relative mb-3 max-w-[320px] sm:max-w-[340px] bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border ${stateBorder} transition-all animate-modal-in`}
        >
          {/* Close / Next Pill */}
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-border/70">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] font-bold text-neutral-800 tracking-tight">
                {speechTitle}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTipIndex((prev) => (prev + 1) % STATUTORY_TIPS.length)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high hover:bg-surface-container text-neutral-700 font-medium transition cursor-pointer"
                title="Next Tip"
              >
                {isHi ? "अगला सुझाव" : "Next Tip ↻"}
              </button>
              <button
                type="button"
                onClick={() => setIsBubbleOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded transition cursor-pointer"
                aria-label="Close message"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>

          {/* Speech Body */}
          <p className="text-xs text-neutral-700 leading-relaxed font-medium">
            {speechText}
          </p>

          {/* Badge & Action Footer */}
          <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-neutral-500">
            <span className="font-semibold uppercase tracking-wider text-primary">
              #{badgeText}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsChatOpen(true);
                setIsBubbleOpen(false);
              }}
              className="text-primary hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
            >
              <span>{isHi ? "AI से पूछें" : "Chat with AI"}</span>
              <span className="material-symbols-outlined text-[12px]">chat</span>
            </button>
          </div>

          {/* Speech Bubble Tail Anchor (pointing directly to mascot) */}
          <div
            className={`absolute -bottom-1.5 right-7 w-3.5 h-3.5 bg-white border-r border-b ${stateBorder} rotate-45`}
          />
        </div>
      )}

      {/* 3. MASCOT INTERACTIVE SPRITE AVATAR */}
      <div className="relative group flex items-center justify-center">
        {/* Ambient Radial Aura Glow */}
        <div
          className={`absolute -inset-2.5 rounded-full bg-gradient-to-r ${auraColor} blur-xl opacity-80 group-hover:opacity-100 transition-all`}
        />

        {/* Mascot Body Button */}
        <button
          type="button"
          onClick={handleMascotClick}
          className={`relative w-15 h-15 rounded-full bg-gradient-to-br from-[#0A3D62] via-[#00366F] to-[#002244] border-2 border-white/90 shadow-2xl flex items-center justify-center cursor-pointer transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
            isBouncing ? "scale-90" : "hover:scale-108"
          }`}
          title={isHi ? "मेत्री प्रहरी (विधिक मापविज्ञान रक्षक)" : "MetriPrahari • Click for AI Metrology Companion"}
        >
          {/* Owl & Beam Balance SVG Character */}
          <svg
            className="w-10 h-10 drop-shadow"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Owl Feathers / Body */}
            <circle cx="32" cy="34" r="22" fill="#FFFFFF" />
            <circle cx="32" cy="34" r="20" fill="#E8F1F5" />

            {/* Sovereign Cap */}
            <path
              d="M16 18L32 10L48 18L32 24L16 18Z"
              fill="#FFB957"
              stroke="#B06000"
              strokeWidth="1.5"
            />
            <path d="M44 20V27" stroke="#FFB957" strokeWidth="2" strokeLinecap="round" />
            <circle cx="44" cy="28" r="1.5" fill="#B06000" />

            {/* Owl Spectacles / Big Vigilant Eyes */}
            <circle cx="24" cy="30" r="7" fill="#FFFFFF" stroke="#00366F" strokeWidth="2" />
            <circle cx="40" cy="30" r="7" fill="#FFFFFF" stroke="#00366F" strokeWidth="2" />
            {/* Spectacle Bridge */}
            <path d="M31 30H33" stroke="#00366F" strokeWidth="2" strokeLinecap="round" />
            {/* Animated Pupils */}
            <circle
              cx={mascotState === "thinking" ? "23" : "25"}
              cy="30"
              r="3"
              fill="#002244"
              className={mascotState === "thinking" ? "animate-pulse" : ""}
            />
            <circle
              cx={mascotState === "thinking" ? "39" : "41"}
              cy="30"
              r="3"
              fill="#002244"
              className={mascotState === "thinking" ? "animate-pulse" : ""}
            />
            {/* Catchlight */}
            <circle cx="26" cy="29" r="1" fill="#FFFFFF" />
            <circle cx="42" cy="29" r="1" fill="#FFFFFF" />

            {/* Little Golden Beak */}
            <polygon points="30,36 34,36 32,41" fill="#FFB957" />

            {/* Golden Balance Scales of Justice */}
            <path d="M22 47H42" stroke="#00366F" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M32 44V49" stroke="#00366F" strokeWidth="1.5" />
            {/* Left Pan */}
            <path d="M24 47L22 51H26L24 47Z" fill="#FFB957" stroke="#B06000" strokeWidth="0.8" />
            {/* Right Pan */}
            <path d="M40 47L38 51H42L40 47Z" fill="#FFB957" stroke="#B06000" strokeWidth="0.8" />
          </svg>

          {/* Status Indicator Pip */}
          <span
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
              mascotState === "warning"
                ? "bg-status-red"
                : mascotState === "celebration"
                ? "bg-status-green"
                : mascotState === "thinking"
                ? "bg-amber-400 animate-ping"
                : "bg-[#FFB957]"
            }`}
          />
        </button>

        {/* Tooltip on Hover */}
        <div className="absolute bottom-full mb-3 right-0 hidden group-hover:flex flex-col items-end pointer-events-none z-50 animate-modal-in">
          <div className="bg-neutral-900/95 backdrop-blur-md text-white text-[11px] font-semibold py-1.5 px-3 rounded-xl whitespace-nowrap shadow-2xl border border-white/15 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isHi ? "मेत्री प्रहरी AI • बातचीत के लिए क्लिक करें" : "MetriPrahari AI • Click to Chat"}</span>
          </div>
          <div className="w-2.5 h-2.5 bg-neutral-900 rotate-45 mr-6 -mt-1 border-r border-b border-white/15" />
        </div>
      </div>
    </div>
  );
}
