---
domain: chinese-zodiac
topic: Chinese Zodiac (ปีนักษัตร)
tier: 2
priority: P1
version: 1.0
updated: 2026-05-23
source: research
convergence_tags: [chinese-zodiac, animal-sign, five-elements, compatibility]
ai_usage: ทำนายตามปีเกิด เชื่อมกับระบบไทย (นักษัตรปี) หาจุดร่วม
---

# Chinese Zodiac (ปีนักษัตร)

## 12 Animals

| # | Animal | Chinese | Yin/Yang | Fixed Element | Hours |
|---|--------|---------|----------|---------------|-------|
| 1 | Rat | Shu | Yang | Water | 23:00-01:00 |
| 2 | Ox | Niu | Yin | Earth | 01:00-03:00 |
| 3 | Tiger | Hu | Yang | Wood | 03:00-05:00 |
| 4 | Rabbit | Tu | Yin | Wood | 05:00-07:00 |
| 5 | Dragon | Long | Yang | Earth | 07:00-09:00 |
| 6 | Snake | She | Yin | Fire | 09:00-11:00 |
| 7 | Horse | Ma | Yang | Fire | 11:00-13:00 |
| 8 | Goat | Yang | Yin | Earth | 13:00-15:00 |
| 9 | Monkey | Hou | Yang | Metal | 15:00-17:00 |
| 10 | Rooster | Ji | Yin | Metal | 17:00-19:00 |
| 11 | Dog | Gou | Yang | Earth | 19:00-21:00 |
| 12 | Pig | Zhu | Yin | Water | 21:00-23:00 |

## 60-Year Cycle Formula

```
position = (year - 3) mod 60
animal_index = (year - 4) mod 12
element_index = floor((year - 4) mod 10 / 2)  // 0=Wood,1=Fire,2=Earth,3=Metal,4=Water
yin_yang = (year - 4) mod 2  // 0=Yang, 1=Yin
```

**สำคัญ**: ตรวจปีใหม่จีน (ม.ค.-ก.พ.) — เกิดก่อนปีใหม่จีนใช้ปีก่อนหน้า

## Five Elements (Wu Xing)

| Element | Generates | Destroyed By | Quality |
|---------|-----------|-------------|---------|
| Wood | Fire | Metal | Growth, creativity |
| Fire | Earth | Water | Passion, transformation |
| Earth | Metal | Wood | Stability, patience |
| Metal | Water | Fire | Strength, determination |
| Water | Wood | Earth | Wisdom, adaptability |

## Compatibility

**Triangle Affinity (San He)** — Best matches:
- Rat + Dragon + Monkey (Water triad)
- Ox + Snake + Rooster (Metal triad)
- Tiger + Horse + Dog (Fire triad)
- Rabbit + Goat + Pig (Wood triad)

**Clashes (Liu Chong)** — Direct opposition:
- Rat↔Horse, Ox↔Goat, Tiger↔Monkey, Rabbit↔Rooster, Dragon↔Dog, Snake↔Pig

## Convergence with Thai System

Thai นักษัตรปี ตรงกับ Chinese Zodiac แทบทั้งหมด (ต่างที่ Dragon→Naga/งูใหญ่ เท่านั้น) → ใช้ข้อมูลเดียวกันได้เลย

**ธาตุไทย vs ธาตุจีน**: โครงสร้างเดียวกัน (ไฟ ดิน ลม/ไม้ น้ำ ทอง) → เชื่อมกันได้โดยตรง