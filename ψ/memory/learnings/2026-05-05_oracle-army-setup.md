# Oracle Army Setup — Lesson Learned

**Date**: 2026-05-05
**Source**: rrr: emily-oracle

## Fork + Upstream Pattern for Oracle Repos

เมื่อ fork repo จาก Soul-Brews-Studio ให้ตั้งค่า:
- `origin` → fork ของตัวเอง (doctorboyz/*)
- `upstream` → Soul-Brews-Studio/*

วิธีทำ:
```bash
gh repo fork Soul-Brews-Studio/REPO --clone=false
gh repo clone doctorboyz/REPO
cd REPO && git remote add upstream https://github.com/Soul-Brews-Studio/REPO.git
```

**ทำไม**: push custom changes ได้ และยัง sync กับ upstream ได้เสมอ

## Branch Versioning ดีกว่า Separate Repo

ไม่ควรสร้าง repo ใหม่สำหรับแต่ละ version — ใช้ branch แทน:
- `main` = v1 (stable)
- `v2` = v2 (service mode)
- `v3` = v3 (new stack)

**ทำไม**: รักษา git history ทั้งหมด และเปรียบเทียบข้าม version ได้ง่าย

## Oracle Vault เป็น Central Knowledge Hub

สร้าง private repo `doctorboyz/oracle-vault` เป็นที่เก็บความรู้ร่วม:
- Philosophy books จาก Soul-Brews-Studio
- Learnings/retrospectives จากแต่ละ Oracle
- Intrinsic knowledge (principles, identity)

**ทำไม**: ทุก Oracle ในทัพ search ความรู้ข้าม project ได้ ผ่าน arra-oracle-v3 vault CLI

## GitHub delete_repo Scope

การลบ GitHub repo ต้องการ scope `delete_repo` ที่ต้อง approve ผ่าน browser:
```bash
gh auth refresh -h github.com -s delete_repo
gh repo delete OWNER/REPO --yes
```

**ทำไม**: security measure — ป้องกันการลบ repo โดยไม่ตั้งใจ

## Concepts

- fork-upstream-pattern
- branch-versioning
- oracle-vault
- knowledge-consolidation