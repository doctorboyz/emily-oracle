// CalVer version bump script
// Format: YY.MM.PATCH (e.g., 26.4.1)

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const now = new Date();
const yy = String(now.getFullYear()).slice(2);
const mm = now.getMonth() + 1;
const dd = now.getDate();

const versionPath = resolve(import.meta.dir, "..", "src", "version.ts");
const pkgPath = resolve(import.meta.dir, "..", "package.json");

// Read current version
const versionContent = readFileSync(versionPath, "utf-8");
const currentMatch = versionContent.match(/VERSION = "([^"]+)"/);
const currentVersion = currentMatch ? currentMatch[1] : "0.0.0";

// Calculate new version
const [currentYy, currentMm, currentPatch] = currentVersion.split(".").map(Number);
let newVersion: string;

if (currentYy === Number(yy) && currentMm === mm) {
  // Same month — bump patch
  newVersion = `${yy}.${mm}.${(currentPatch || 0) + 1}`;
} else {
  // New month — reset patch
  newVersion = `${yy}.${mm}.1`;
}

console.log(`CalVer: ${currentVersion} → ${newVersion}`);

// Update version.ts
const newVersionContent = versionContent.replace(
  /VERSION = "[^"]+"/,
  `VERSION = "${newVersion}"`
);
writeFileSync(versionPath, newVersionContent, "utf-8");

// Update package.json
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
pkg.version = newVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");

console.log(`✓ Updated version to ${newVersion}`);