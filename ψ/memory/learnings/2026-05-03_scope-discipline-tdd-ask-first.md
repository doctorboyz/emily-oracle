---
name: scope-discipline-and-tdd
description: Lessons about scope discipline, TDD necessity, and asking before building from Synapse v1 session
type: learning
---

# Scope Discipline + TDD + Ask First

## Lessons

### 1. Scope First, Act Second

เมื่อ user ระบุว่าให้แก้ไฟล์ไหน ให้แก้แค่ไฟล์นั้น อย่าไปตามใจตัวเองแก้ไฟล์อื่น

**Why**: ใน session นี้ user บอกแก้เฉพาะ README.md แต่ไปแก้ source code ด้วย → user หงุดหงิด ต้อง revert เสียเวลา

**How to apply**: ถ้า user ระบุ scope (ไฟล์/folder/งาน) ให้อยู่ใน scope นั้นเท่านั้น ถ้าอยากขยาย scope ต้องถามก่อน

### 2. TDD ไม่ใช่ Optional

Code ที่ไม่มี test = code ที่ไม่ verified ใน Synapse v1 push.py มี CRITICAL bug (NoneType crash) ที่จะเจอทันทีถ้าเขียน test ก่อน

**Why**: code review พบ CRITICAL + HIGH bugs 5 จุด ทั้งหมดเกิดจากการไม่มี test coverage ถ้าเขียน test ก่อน implement จะเจอทันที

**How to apply**: สำหรับทุก module ที่ implement ใหม่ เขียน test ก่อน (RED) แล้ว implement (GREEN) แม้จะเป็น skill/prototype

### 3. ถามก่อนสร้าง

ถ้า user ขออะไรที่ ambiguous (เช่น ASCII art "ทำให้สวย") ให้ถามให้ชัดหรือทำ minimal version ก่อน

**Why**: เสียเวลา 3-4 รอบกับ ASCII art ที่ user ไม่ชอบ แต่ละรอบสร้าง-ลบ-สร้างใหม่

**How to apply**: สำหรับงาน creative/visual ให้ทำ minimal version ก่อน ถาม feedback แล้วค่อยขยาย อย่าลงมือทำแบบเต็มรูปแบบทันที

## Tags

- scope-discipline
- tdd
- ask-first
- synapse
- retrospective