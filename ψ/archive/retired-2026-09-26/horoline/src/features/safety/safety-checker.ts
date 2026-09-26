export interface SafetyCheck {
  hasNegativeContent: boolean;
  hasFearLanguage: boolean;
  hasDeterministicLanguage: boolean;
  hasMedicalClaim: boolean;
  hasFinancialAdvice: boolean;
  hasHarmfulSuggestion: boolean;
  needsCBTReframe: boolean;
  disclaimerNeeded: boolean;
  details?: string;
}

const FEAR_WORDS_TH = [
  "ต้องตาย",
  "จะร้าย",
  "อับจน",
  "ไม่มีทาง",
  "ความหายนะ",
  "วิบัติ",
  "ภัยพิบัติ",
  "ชะตากรรม",
  "โทษ",
  "บาป",
  "ผี",
  "ต้องพลี",
];

const DETERMINISTIC_WORDS_TH = [
  "จะต้อง",
  "แน่นอนว่า",
  "ไม่มีทางเลี่ย",
  "หลีกไม่ได้",
  "ชะตาฟ้าลิขิต",
  "โชคชะตากำหนด",
  "เถียงไม่ได้",
  "อย่างเดียว",
  "ทางเลือกเดียว",
];

const MEDICAL_WORDS_TH = [
  "รักษาโรค",
  "ยา",
  "วินิจฉัย",
  "หมอ",
  "โรค",
  "อาการ",
  "รักษาได้",
  "หายขาด",
  "ทานยา",
];

const FINANCIAL_WORDS_TH = [
  "ลงทุน",
  "หุ้น",
  "ซื้อขาย",
  "กำไรแน่นอน",
  "ผลตอบแทน",
  "แนะนำหุ้น",
  "ซื้อหุ้นตัวนี้",
  "ลงทุนอะไรดี",
];

export function checkSafety(text: string): SafetyCheck {
  const lower = text.toLowerCase();

  const hasFear = FEAR_WORDS_TH.some((w) => lower.includes(w));
  const hasDeterministic = DETERMINISTIC_WORDS_TH.some((w) => lower.includes(w));
  const hasMedical = MEDICAL_WORDS_TH.some((w) => lower.includes(w));
  const hasFinancial = FINANCIAL_WORDS_TH.some((w) => lower.includes(w));

  const hasNegative = hasFear || hasDeterministic;
  const needsCBTReframe = hasFear || hasDeterministic;
  const disclaimerNeeded = hasMedical || hasFinancial || hasNegative;

  let details: string | undefined;
  if (hasFear) details = "Fear language detected";
  if (hasDeterministic)
    details = details
      ? `${details}; Deterministic language detected`
      : "Deterministic language detected";
  if (hasMedical)
    details = details ? `${details}; Medical claim detected` : "Medical claim detected";
  if (hasFinancial)
    details = details ? `${details}; Financial advice detected` : "Financial advice detected";

  return {
    hasNegativeContent: hasNegative,
    hasFearLanguage: hasFear,
    hasDeterministicLanguage: hasDeterministic,
    hasMedicalClaim: hasMedical,
    hasFinancialAdvice: hasFinancial,
    hasHarmfulSuggestion: false, // Would need AI analysis
    needsCBTReframe,
    disclaimerNeeded,
    details,
  };
}

export function insertDisclaimer(text: string, type: "medical" | "financial" | "general"): string {
  const disclaimers = {
    medical: "\n\n🙏 ข้อความนี้เป็นการทำนาย ไม่ใช่คำแนะนำทางการแพทย์ หากมีข้อกังวลด้านสุขภาพ กรุณาปรึกษาแพทย์",
    financial: "\n\n🙏 ข้อความนี้เป็นการทำนาย ไม่ใช่คำแนะนำทางการเงิน การลงทุนมีความเสี่ยง กรุณาตัดสินใจด้วยตนเอง",
    general: "\n\n🙏 การทำนายเป็นทางเลือกเสริมพลังงานบวก ไม่ใช่สิ่งที่กำหนดชีวิตคุณ",
  };

  return text + disclaimers[type];
}

export function reframeWithCBT(text: string): string {
  // CBT reframing: transform fear-based language into empowering language
  let reframed = text;

  const reframings: [string, string][] = [
    ["จะร้าย", "มีโอกาสเปลี่ยนแปลง"],
    ["อับจน", "มีทางออก"],
    ["ไม่มีทาง", "มีหลายทางเลือก"],
    ["ต้องตาย", "สามารถเปลี่ยนได้"],
    ["โชคร้าย", "เป็นบทเรียนที่ทำให้เติบโต"],
    ["ชะตาฟ้าลิขิต", "เป็นแนวทางที่สามารถปรับเปลี่ยนได้"],
    ["แน่นอนว่า", "มีแนวโน้มว่า"],
    ["ไม่มีทางเลี่ย", "มีทางเลือกให้พิจารณา"],
  ];

  for (const [fear, empower] of reframings) {
    reframed = reframed.replace(new RegExp(fear, "g"), empower);
  }

  return reframed;
}
