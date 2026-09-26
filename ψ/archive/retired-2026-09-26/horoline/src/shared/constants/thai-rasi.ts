// Thai Rasi Calculator
// Computes Thai zodiac sign, Western sign, Chinese zodiac, Life Path number,
// day of week, elements (Thai & Chinese) from a birth date.
// This is the core Tier 1 calculation — requires ONLY birth date.

export interface RasiResult {
  thaiRasi: string;
  thaiRasiEn: string;
  westernSign: string;
  westernSignEn: string;
  chineseZodiac: string;
  chineseZodiacEn: string;
  lifePathNumber: number;
  birthDayOfWeek: string;
  birthDayOfWeekEn: string;
  elementThai: string;
  elementChinese: string;
  personalYear: number;
}

// Thai Rasi (sidereal, shifted ~24 days from Western)
// Thai system uses sidereal zodiac with Ayanamsa offset
export const THAI_RASI: Array<{
  nameTh: string;
  nameEn: string;
  startMonth: number; // 1-12
  startDay: number;
  endMonth: number;
  endDay: number;
  element: string;
  modality: string;
  ruler: string;
  luckyColors: string[];
}> = [
  {
    nameTh: "เมษ",
    nameEn: "Aries",
    startMonth: 4,
    startDay: 14,
    endMonth: 5,
    endDay: 14,
    element: "ไฟ",
    modality: "จรัติ",
    ruler: "อังคาร",
    luckyColors: ["แดง", "ขาว"],
  },
  {
    nameTh: "พฤษภ",
    nameEn: "Taurus",
    startMonth: 5,
    startDay: 15,
    endMonth: 6,
    endDay: 14,
    element: "ดิน",
    modality: "ถิ่นฐาน",
    ruler: "ศุกร์",
    luckyColors: ["เขียว", "ชมพู"],
  },
  {
    nameTh: "เมถุน",
    nameEn: "Gemini",
    startMonth: 6,
    startDay: 15,
    endMonth: 7,
    endDay: 16,
    element: "ลม",
    modality: "เปลี่ยนแปลง",
    ruler: "พุธ",
    luckyColors: ["เหลือง", "เขียว"],
  },
  {
    nameTh: "กรกฎ",
    nameEn: "Cancer",
    startMonth: 7,
    startDay: 17,
    endMonth: 8,
    endDay: 16,
    element: "น้ำ",
    modality: "ถิ่นฐาน",
    ruler: "จันทร์",
    luckyColors: ["ขาว", "เหลือง"],
  },
  {
    nameTh: "สิงห์",
    nameEn: "Leo",
    startMonth: 8,
    startDay: 17,
    endMonth: 9,
    endDay: 16,
    element: "ไฟ",
    modality: "จรัติ",
    ruler: "อาทิตย์",
    luckyColors: ["ส้ม", "ทอง"],
  },
  {
    nameTh: "กันย์",
    nameEn: "Virgo",
    startMonth: 9,
    startDay: 17,
    endMonth: 10,
    endDay: 16,
    element: "ดิน",
    modality: "เปลี่ยนแปลง",
    ruler: "พุธ",
    luckyColors: ["เขียว", "น้ำตาล"],
  },
  {
    nameTh: "ตุลย์",
    nameEn: "Libra",
    startMonth: 10,
    startDay: 17,
    endMonth: 11,
    endDay: 15,
    element: "ลม",
    modality: "จรัติ",
    ruler: "ศุกร์",
    luckyColors: ["ฟ้า", "ชมพู"],
  },
  {
    nameTh: "พิจิก",
    nameEn: "Scorpio",
    startMonth: 11,
    startDay: 16,
    endMonth: 12,
    endDay: 15,
    element: "น้ำ",
    modality: "ถิ่นฐาน",
    ruler: "มฤตยู/อังคาร",
    luckyColors: ["แดง", "ดำ"],
  },
  {
    nameTh: "ธนู",
    nameEn: "Sagittarius",
    startMonth: 12,
    startDay: 16,
    endMonth: 1,
    endDay: 14,
    element: "ไฟ",
    modality: "เปลี่ยนแปลง",
    ruler: "พฤหัสบดี",
    luckyColors: ["ม่วง", "น้ำเงิน"],
  },
  {
    nameTh: "มังกร",
    nameEn: "Capricorn",
    startMonth: 1,
    startDay: 15,
    endMonth: 2,
    endDay: 13,
    element: "ดิน",
    modality: "จรัติ",
    ruler: "เสาร์",
    luckyColors: ["ดำ", "น้ำตาลแดง"],
  },
  {
    nameTh: "กุมภ์",
    nameEn: "Aquarius",
    startMonth: 2,
    startDay: 14,
    endMonth: 3,
    endDay: 14,
    element: "ลม",
    modality: "ถิ่นฐาน",
    ruler: "เสาร์",
    luckyColors: ["ฟ้า", "เขียว"],
  },
  {
    nameTh: "มีน",
    nameEn: "Pisces",
    startMonth: 3,
    startDay: 15,
    endMonth: 4,
    endDay: 13,
    element: "น้ำ",
    modality: "เปลี่ยนแปลง",
    ruler: "พฤหัสบดี",
    luckyColors: ["เหลือง", "ขาว"],
  },
];

// Western Zodiac (tropical, standard dates)
export const WESTERN_SIGNS: Array<{
  nameEn: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  element: string;
  modality: string;
  ruler: string;
}> = [
  {
    nameEn: "Aries",
    startMonth: 3,
    startDay: 21,
    endMonth: 4,
    endDay: 19,
    element: "Fire",
    modality: "Cardinal",
    ruler: "Mars",
  },
  {
    nameEn: "Taurus",
    startMonth: 4,
    startDay: 20,
    endMonth: 5,
    endDay: 20,
    element: "Earth",
    modality: "Fixed",
    ruler: "Venus",
  },
  {
    nameEn: "Gemini",
    startMonth: 5,
    startDay: 21,
    endMonth: 6,
    endDay: 20,
    element: "Air",
    modality: "Mutable",
    ruler: "Mercury",
  },
  {
    nameEn: "Cancer",
    startMonth: 6,
    startDay: 21,
    endMonth: 7,
    endDay: 22,
    element: "Water",
    modality: "Cardinal",
    ruler: "Moon",
  },
  {
    nameEn: "Leo",
    startMonth: 7,
    startDay: 23,
    endMonth: 8,
    endDay: 22,
    element: "Fire",
    modality: "Fixed",
    ruler: "Sun",
  },
  {
    nameEn: "Virgo",
    startMonth: 8,
    startDay: 23,
    endMonth: 9,
    endDay: 22,
    element: "Earth",
    modality: "Mutable",
    ruler: "Mercury",
  },
  {
    nameEn: "Libra",
    startMonth: 9,
    startDay: 23,
    endMonth: 10,
    endDay: 22,
    element: "Air",
    modality: "Cardinal",
    ruler: "Venus",
  },
  {
    nameEn: "Scorpio",
    startMonth: 10,
    startDay: 23,
    endMonth: 11,
    endDay: 21,
    element: "Water",
    modality: "Fixed",
    ruler: "Pluto",
  },
  {
    nameEn: "Sagittarius",
    startMonth: 11,
    startDay: 22,
    endMonth: 12,
    endDay: 21,
    element: "Fire",
    modality: "Mutable",
    ruler: "Jupiter",
  },
  {
    nameEn: "Capricorn",
    startMonth: 12,
    startDay: 22,
    endMonth: 1,
    endDay: 19,
    element: "Earth",
    modality: "Cardinal",
    ruler: "Saturn",
  },
  {
    nameEn: "Aquarius",
    startMonth: 1,
    startDay: 20,
    endMonth: 2,
    endDay: 18,
    element: "Air",
    modality: "Fixed",
    ruler: "Uranus",
  },
  {
    nameEn: "Pisces",
    startMonth: 2,
    startDay: 19,
    endMonth: 3,
    endDay: 20,
    element: "Water",
    modality: "Mutable",
    ruler: "Neptune",
  },
];

// Chinese Zodiac
export const CHINESE_ZODIAC: Array<{
  nameTh: string;
  nameEn: string;
  element: string;
  yinYang: string;
  emoji: string;
}> = [
  { nameTh: "ชวด", nameEn: "Rat", element: "น้ำ", yinYang: "หยาง", emoji: "🐀" },
  { nameTh: "ฉลู", nameEn: "Ox", element: "ดิน", yinYang: "หยิน", emoji: "🐂" },
  { nameTh: "ขาล", nameEn: "Tiger", element: "ไม้", yinYang: "หยาง", emoji: "🐅" },
  { nameTh: "เถาะ", nameEn: "Rabbit", element: "ไม้", yinYang: "หยิน", emoji: "🐇" },
  { nameTh: "มะโรง", nameEn: "Dragon", element: "ดิน", yinYang: "หยาง", emoji: "🐉" },
  { nameTh: "มะเส็ง", nameEn: "Snake", element: "ไฟ", yinYang: "หยิน", emoji: "🐍" },
  { nameTh: "มะเมีย", nameEn: "Horse", element: "ไฟ", yinYang: "หยาง", emoji: "🐴" },
  { nameTh: "มะแม", nameEn: "Goat", element: "ดิน", yinYang: "หยิน", emoji: "🐐" },
  { nameTh: "วอก", nameEn: "Monkey", element: "โลหะ", yinYang: "หยาง", emoji: "🐵" },
  { nameTh: "ระกา", nameEn: "Rooster", element: "โลหะ", yinYang: "หยิน", emoji: "🐓" },
  { nameTh: "จอ", nameEn: "Dog", element: "ดิน", yinYang: "หยาง", emoji: "🐕" },
  { nameTh: "กุน", nameEn: "Pig", element: "น้ำ", yinYang: "หยิน", emoji: "🐖" },
];

// Thai day-of-week system
export const THAI_DAYS: Record<
  string,
  {
    nameTh: string;
    element: string;
    luckyColors: { sri: string; moli: string; mantri: string; kalakini: string };
    rulingPlanet: string;
  }
> = {
  Sunday: {
    nameTh: "อาทิตย์",
    element: "ไฟ",
    luckyColors: { sri: "เขียว", moli: "ส้ม", mantri: "ชมพู", kalakini: "น้ำเงิน/ดำ" },
    rulingPlanet: "อาทิตย์",
  },
  Monday: {
    nameTh: "จันทร์",
    element: "ดิน",
    luckyColors: { sri: "เหลือง", moli: "ชมพู", mantri: "เขียวอ่อน", kalakini: "แดง" },
    rulingPlanet: "จันทร์",
  },
  Tuesday: {
    nameTh: "อังคาร",
    element: "ไฟ",
    luckyColors: { sri: "ชมพู", moli: "แดง", mantri: "ม่วง", kalakini: "เหลือง/ขาว" },
    rulingPlanet: "อังคาร",
  },
  Wednesday: {
    nameTh: "พุธ (กลางวัน)",
    element: "ดิน",
    luckyColors: { sri: "เขียวมืด", moli: "น้ำตาลแดง", mantri: "ส้มเข้ม", kalakini: "ขาว" },
    rulingPlanet: "พุธ",
  },
  WednesdayNight: {
    nameTh: "พุธ (กลางคืน)",
    element: "ลม",
    luckyColors: { sri: "ม่วงแดง", moli: "ดำ", mantri: "น้ำเงินเข้ม", kalakini: "เขียว" },
    rulingPlanet: "ราหู",
  },
  Thursday: {
    nameTh: "พฤหัสบดี",
    element: "ดิน",
    luckyColors: { sri: "เหลืองม่วง", moli: "แดงเข้ม", mantri: "ส้ม", kalakini: "น้ำเงิน" },
    rulingPlanet: "พฤหัสบดี",
  },
  Friday: {
    nameTh: "ศุกร์",
    element: "น้ำ",
    luckyColors: { sri: "ฟ้า", moli: "ขาว", mantri: "ทอง", kalakini: "เขียวเข้ม" },
    rulingPlanet: "ศุกร์",
  },
  Saturday: {
    nameTh: "เสาร์",
    element: "ดิน",
    luckyColors: { sri: "ม่วง", moli: "น้ำเงิน", mantri: "ดำ", kalakini: "เขียว" },
    rulingPlanet: "เสาร์",
  },
};

// Life Path Number calculation
export function calculateLifePathNumber(birthDate: Date): number {
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();
  const year = birthDate.getFullYear();

  const reduce = (n: number): number => {
    let val = n;
    while (val > 9 && val !== 11 && val !== 22 && val !== 33) {
      val = String(val)
        .split("")
        .reduce((sum, d) => sum + Number(d), 0);
    }
    return val;
  };

  const result = reduce(month) + reduce(day) + reduce(year);
  return reduce(result);
}

// Personal Year calculation
export function calculatePersonalYear(birthDate: Date, currentYear: number): number {
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();
  const sum = reduceDigit(month) + reduceDigit(day) + reduceDigit(currentYear);
  return reduceDigit(sum);
}

function reduceDigit(n: number): number {
  let val = n;
  while (val > 9) {
    val = String(val)
      .split("")
      .reduce((sum, d) => sum + Number(d), 0);
  }
  return val;
}

// Thai element from birth year (4-element system)
export function getThaiElementFromYear(year: number): string {
  const lastDigit = year % 10;
  // Thai 4-element system based on last digit of birth year
  if ([0, 1].includes(lastDigit)) return "โลหะ";
  if ([2, 3].includes(lastDigit)) return "น้ำ";
  if ([4, 5].includes(lastDigit)) return "ไฟ";
  if ([6, 7].includes(lastDigit)) return "ดิน";
  return "ลม"; // 8, 9
}

// Chinese element from birth year (5-element cycle)
export function getChineseElementFromYear(year: number): string {
  const elementCycle = (year - 4) % 10;
  if (elementCycle < 2) return "ไม้";
  if (elementCycle < 4) return "ไฟ";
  if (elementCycle < 6) return "ดิน";
  if (elementCycle < 8) return "โลหะ";
  return "น้ำ";
}

// Main calculator: compute all Tier 1 data from birth date
export function calculateRasiFromBirthDate(birthDate: Date): RasiResult {
  const month = birthDate.getMonth() + 1; // 1-12
  const day = birthDate.getDate();
  const year = birthDate.getFullYear();
  const dayOfWeek = birthDate.toLocaleDateString("en-US", { weekday: "long" });

  // Find Thai Rasi (sidereal)
  const thaiRasi =
    THAI_RASI.find((r) => {
      if (r.startMonth === r.endMonth)
        return month === r.startMonth && day >= r.startDay && day <= r.endDay;
      if (r.startMonth > r.endMonth) {
        // Crosses year boundary (e.g., Dec 16 - Jan 14)
        return (
          (month === r.startMonth && day >= r.startDay) || (month === r.endMonth && day <= r.endDay)
        );
      }
      return (
        (month === r.startMonth && day >= r.startDay) || (month === r.endMonth && day <= r.endDay)
      );
    }) ?? THAI_RASI[0];

  // Find Western Sign (tropical)
  const westernSign =
    WESTERN_SIGNS.find((s) => {
      if (s.startMonth > s.endMonth) {
        return (
          (month === s.startMonth && day >= s.startDay) || (month === s.endMonth && day <= s.endDay)
        );
      }
      return (
        (month === s.startMonth && day >= s.startDay) ||
        (month === s.endMonth && day <= s.endDay) ||
        (month > s.startMonth && month < s.endMonth)
      );
    }) ?? WESTERN_SIGNS[0];

  // Find Chinese Zodiac — mathematical formula works for any year
  const zodiacIndex = (((year - 4) % 12) + 12) % 12;
  const chineseZodiac = CHINESE_ZODIAC[zodiacIndex];

  // Life Path Number
  const lifePathNumber = calculateLifePathNumber(birthDate);

  // Personal Year
  const personalYear = calculatePersonalYear(birthDate, new Date().getFullYear());

  // Day of week
  const thaiDay = THAI_DAYS[dayOfWeek] ?? THAI_DAYS.Sunday;

  // Elements
  const elementThai = getThaiElementFromYear(year);
  const elementChinese = getChineseElementFromYear(year);

  return {
    thaiRasi: thaiRasi.nameTh,
    thaiRasiEn: thaiRasi.nameEn,
    westernSign: westernSign.nameEn,
    westernSignEn: westernSign.nameEn,
    chineseZodiac: chineseZodiac.nameTh,
    chineseZodiacEn: chineseZodiac.nameEn,
    lifePathNumber,
    birthDayOfWeek: thaiDay.nameTh,
    birthDayOfWeekEn: dayOfWeek,
    elementThai,
    elementChinese,
    personalYear,
  };
}

// Helper: get zodiac info from any Gregorian year (for date picker)
export function getZodiacForYear(year: number) {
  const idx = (((year - 4) % 12) + 12) % 12;
  return CHINESE_ZODIAC[idx];
}

// Thai month names for date picker
export const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
] as const;

// Convert Buddhist era (พ.ศ.) to Gregorian (ค.ศ.) and back
export const beToCe = (be: number) => be - 543;
export const ceToBe = (ce: number) => ce + 543;
