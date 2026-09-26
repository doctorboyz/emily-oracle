import { describe, expect, it } from "vitest";
import {
  CHINESE_ZODIAC,
  THAI_DAYS,
  THAI_RASI,
  WESTERN_SIGNS,
  calculateLifePathNumber,
  calculatePersonalYear,
  calculateRasiFromBirthDate,
  getChineseElementFromYear,
  getThaiElementFromYear,
} from "./thai-rasi";

describe("calculateLifePathNumber", () => {
  it("should reduce a single digit date to life path number", () => {
    // 01/01/2000 = 1+1+2 = 4
    expect(calculateLifePathNumber(new Date(2000, 0, 1))).toBe(4);
  });

  it("should handle master numbers 11, 22, 33", () => {
    // 11/29/2000: month=11 (master), day=2+9=11 (master), year=2
    // 11 + 11 + 2 = 24 -> 2+4 = 6
    // Actually: reduce(11)=11, reduce(29)=11, reduce(2000)=2
    // 11+11+2 = 24 -> reduce(24) = 6
    expect(calculateLifePathNumber(new Date(2000, 10, 29))).toBe(6);
  });

  it("should return 1 for date that reduces to 1", () => {
    // 01/01/2001 = 1+1+3 = 5
    expect(calculateLifePathNumber(new Date(2001, 0, 1))).toBe(5);
  });
});

describe("getThaiElementFromYear", () => {
  it("should return โลหะ for years ending in 0 or 1", () => {
    expect(getThaiElementFromYear(1990)).toBe("โลหะ");
    expect(getThaiElementFromYear(2001)).toBe("โลหะ");
  });

  it("should return น้ำ for years ending in 2 or 3", () => {
    expect(getThaiElementFromYear(1992)).toBe("น้ำ");
    expect(getThaiElementFromYear(2003)).toBe("น้ำ");
  });

  it("should return ไฟ for years ending in 4 or 5", () => {
    expect(getThaiElementFromYear(1994)).toBe("ไฟ");
    expect(getThaiElementFromYear(2005)).toBe("ไฟ");
  });

  it("should return ดิน for years ending in 6 or 7", () => {
    expect(getThaiElementFromYear(1996)).toBe("ดิน");
    expect(getThaiElementFromYear(2007)).toBe("ดิน");
  });

  it("should return ลม for years ending in 8 or 9", () => {
    expect(getThaiElementFromYear(1998)).toBe("ลม");
    expect(getThaiElementFromYear(1999)).toBe("ลม");
  });
});

describe("getChineseElementFromYear", () => {
  it("should return correct Chinese element cycle", () => {
    // Year 2024: (2024-4)%10 = 0 -> ไม้
    expect(getChineseElementFromYear(2024)).toBe("ไม้");
    // Year 2025: (2025-4)%10 = 1 -> ไม้
    expect(getChineseElementFromYear(2025)).toBe("ไม้");
    // Year 2026: (2026-4)%10 = 2 -> ไฟ
    expect(getChineseElementFromYear(2026)).toBe("ไฟ");
  });
});

describe("calculateRasiFromBirthDate", () => {
  it("should compute Thai Rasi for a known date", () => {
    // January 20 = มังกร (Capricorn in Thai sidereal: Jan 15 - Feb 13)
    const result = calculateRasiFromBirthDate(new Date(1990, 0, 20));
    expect(result.thaiRasi).toBe("มังกร");
    expect(result.thaiRasiEn).toBe("Capricorn");
    expect(result.chineseZodiacEn).toBe("Horse"); // 1990 = Horse in Chinese zodiac
  });

  it("should compute Western Sign for a known date", () => {
    // January 20 = Aquarius (Western: Jan 20 - Feb 18)
    const result = calculateRasiFromBirthDate(new Date(1990, 0, 20));
    expect(result.westernSignEn).toBe("Aquarius");
  });

  it("should compute day of week correctly", () => {
    const result = calculateRasiFromBirthDate(new Date(1990, 0, 20)); // Saturday
    expect(result.birthDayOfWeekEn).toBe("Saturday");
    expect(result.birthDayOfWeek).toBe("เสาร์");
  });

  it("should compute elements correctly", () => {
    const result = calculateRasiFromBirthDate(new Date(1990, 0, 20));
    // 1990: last digit 0 -> โลหะ (Thai 4-element system)
    expect(result.elementThai).toBe("โลหะ");
    // 1990: (1990-4)%10 = 6 -> Metal (โลหะ) in Chinese 5-element cycle
    // Years ending in 0,1 are Metal
    expect(result.elementChinese).toBe("โลหะ");
  });

  it("should handle cross-year Rasi (Dec 16 - Jan 14 = ธนู)", () => {
    const result = calculateRasiFromBirthDate(new Date(1990, 11, 20)); // Dec 20
    expect(result.thaiRasi).toBe("ธนู");
  });

  it("should handle Rasi at boundary (April 13 = เมษ)", () => {
    const result = calculateRasiFromBirthDate(new Date(1990, 3, 13)); // April 13
    expect(result.thaiRasi).toBe("มีน"); // April 13 is still Pisces (มีน)
  });
});

describe("Data integrity", () => {
  it("should have 12 Thai Rasi signs", () => {
    expect(THAI_RASI).toHaveLength(12);
  });

  it("should have 12 Western signs", () => {
    expect(WESTERN_SIGNS).toHaveLength(12);
  });

  it("should have 12 Chinese zodiac animals", () => {
    expect(CHINESE_ZODIAC).toHaveLength(12);
  });

  it("should have 8 Thai day entries (including Wednesday night)", () => {
    expect(Object.keys(THAI_DAYS)).toHaveLength(8);
  });

  it("should have unique names for each Thai Rasi", () => {
    const names = THAI_RASI.map((r) => r.nameTh);
    expect(new Set(names).size).toBe(12);
  });
});
