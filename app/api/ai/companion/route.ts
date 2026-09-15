import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are "MetriPrahari" (मेत्री प्रहरी), the vigilant and friendly official Legal Metrology AI Guardian & Companion of the Government of India (Department of Consumer Affairs, DoCA - Metrica Sovereign Legal Metrology Network).

YOUR STRICT MISSION:
- Answer citizens', merchants', and inspectors' questions concisely, accurately, and authoritatively.
- Focus EXCLUSIVELY on topics related to:
  1. Legal Metrology Act 2009 & Legal Metrology (General) Rules 2011.
  2. Commercial weighing scales, weighbridges, fuel dispensers, jewelry balances, and verification standards.
  3. Form-A certificates, Form-B rejection notices, lead wire seals, holographic tamper security, and calibration validity.
  4. Consumer rights (Zero-tracking rule, right to inspect stamps, net quantity on packaged goods, reporting short weights).
  5. Maximum Permissible Error (MPE) tolerances for Class I, II, III, and IV scales.
  6. The Metrica platform features (QR passports, anti-cloning geo-anomalies, Bharatkosh e-Challan payments, LMO field inspection dockets).

RESPONSE GUIDELINES:
- Keep answers concise and direct (2-3 crisp sentences max, ideally under 60 words).
- If the user asks in Hindi, answer in clear, respectful Hindi. If in English, answer in English.
- If a question is NOT related to Legal Metrology, weights/measures, consumer protection, or Metrica, politely decline: "I am MetriPrahari, your Legal Metrology Guardian. I can only assist with questions regarding weighing scales, calibration stamps, consumer measurement rights, and the Metrica platform."
- Always maintain an authentic, sovereign, and helpful tone.`;

const DOMAIN_FALLBACK_ANSWERS: Record<string, { en: string; hi: string }> = {
  zero: {
    en: "Under Rule 11, every digital commercial scale must read exactly 0.000 kg before any merchandise is placed on the pan. The merchant must tare out the weight of containers.",
    hi: "नियम 11 के तहत, सामान रखने से पहले तराजू पर ठीक 0.000 कि.ग्रा. होना अनिवार्य है। व्यापारी को डिब्बे या थैले का वजन शून्य (Tare) करना चाहिए।",
  },
  seal: {
    en: "Authentic scales feature a state Legal Metrology lead wire seal or tamper-evident holographic sticker displaying the stamping year. Tampering or breaking this seal is a cognizable offense under Section 25.",
    hi: "सत्यापित तराजू पर वर्ष मुद्रित सीसा सील (Lead Seal) या होलोग्राम लगा होता है। इस सील को तोड़ना या छेड़छाड़ करना धारा 25 के तहत दंडनीय अपराध है।",
  },
  complaint: {
    en: "You can file an immediate short-weight grievance on the Metrica portal or dial National Consumer Helpline 1915. An LMO inspector will be dispatched to conduct an on-site calibration check.",
    hi: "आप मेट्रिका पोर्टल पर तत्काल शिकायत दर्ज कर सकते हैं या राष्ट्रीय उपभोक्ता हेल्पलाइन 1915 पर कॉल कर सकते हैं। निरीक्षक मौके पर जांच करेगा।",
  },
  validity: {
    en: "Commercial weighing instruments must undergo mandatory statutory re-verification every 12 months under Section 24 of the Legal Metrology Act, 2009.",
    hi: "विधिक माप विज्ञान अधिनियम 2009 की धारा 24 के तहत वाणिज्यिक तराजू का प्रत्येक 12 माह में पुन: सत्यापन कराना कानूनी रूप से अनिवार्य है।",
  },
  mpe: {
    en: "Maximum Permissible Error (MPE) is the statutory tolerance limit (e.g. ±5g for Class III 10kg scales). Any deviation beyond MPE results in scale suspension under Section 25.",
    hi: "अधिकतम अनुमेय त्रुटि (MPE) कानूनी सहनशीलता सीमा है (जैसे 10 किग्रा तराजू के लिए ±5 ग्राम)। सीमा से अधिक अंतर होने पर धारा 25 में जब्ती होती है।",
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, language = "en", scaleStatus, scaleId } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY || "";

    // Attempt OpenRouter AI Request
    if (apiKey) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://metrica.gov.in",
            "X-Title": "Metrica Legal Metrology AI Companion",
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: `[Context: Active Language=${language}, Current Scale Status=${scaleStatus || "N/A"}, Scale ID=${scaleId || "N/A"}]\n\nUser Question: ${message}`,
              },
            ],
            temperature: 0.3,
            max_tokens: 150,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content?.trim();
          if (reply) {
            return NextResponse.json({
              reply,
              source: "OPENROUTER_AI",
              model: data.model || "gemini-2.0-flash",
            });
          }
        } else {
          console.warn("OpenRouter API returned status:", response.status, await response.text());
        }
      } catch (aiErr) {
        console.warn("OpenRouter fetch error, switching to fallback:", aiErr);
      }
    }

    // High-Precision Domain Fallback Engine
    const lower = message.toLowerCase();
    let selectedReply = language === "hi"
      ? "नमस्ते! मैं मेत्री प्रहरी हूँ। मैं आपके तराजू, विधिक माप विज्ञान, सील सत्यापन और उपभोक्ता अधिकारों के प्रश्नों में सहायता कर सकता हूँ।"
      : "Hello! I am MetriPrahari, your Legal Metrology Guardian. How can I assist you with scale calibration, seal verification, or consumer rights today?";

    if (lower.includes("zero") || lower.includes("tare") || lower.includes("शून्य")) {
      selectedReply = language === "hi" ? DOMAIN_FALLBACK_ANSWERS.zero.hi : DOMAIN_FALLBACK_ANSWERS.zero.en;
    } else if (lower.includes("seal") || lower.includes("lead") || lower.includes("सील") || lower.includes("hologram")) {
      selectedReply = language === "hi" ? DOMAIN_FALLBACK_ANSWERS.seal.hi : DOMAIN_FALLBACK_ANSWERS.seal.en;
    } else if (lower.includes("complaint") || lower.includes("cheat") || lower.includes("fraud") || lower.includes("शिकायत") || lower.includes("report")) {
      selectedReply = language === "hi" ? DOMAIN_FALLBACK_ANSWERS.complaint.hi : DOMAIN_FALLBACK_ANSWERS.complaint.en;
    } else if (lower.includes("valid") || lower.includes("expire") || lower.includes("year") || lower.includes("महीने") || lower.includes("अवधि")) {
      selectedReply = language === "hi" ? DOMAIN_FALLBACK_ANSWERS.validity.hi : DOMAIN_FALLBACK_ANSWERS.validity.en;
    } else if (lower.includes("mpe") || lower.includes("error") || lower.includes("tolerance") || lower.includes("त्रुटि")) {
      selectedReply = language === "hi" ? DOMAIN_FALLBACK_ANSWERS.mpe.hi : DOMAIN_FALLBACK_ANSWERS.mpe.en;
    }

    return NextResponse.json({
      reply: selectedReply,
      source: "DOMAIN_KNOWLEDGE_BASE",
    });
  } catch (error) {
    console.error("Companion API error:", error);
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
  }
}
