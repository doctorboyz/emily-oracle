import { Command } from "commander";
import { readManifest } from "../installer.js";
import { getAllTargets } from "./agents.js";
import { existsSync } from "fs";
import { join } from "path";

export const xrayCommand = new Command("xray")
  .description("Diagnostic scan of installed skills and agents")
  .action(() => {
    console.log(`\n🔍 emily-skill-cli xray\n`);

    const allTargets = getAllTargets();
    for (const [name, agent] of Object.entries(allTargets)) {
      const manifest = readManifest(agent);
      const skillsDir = agent.globalSkillsDir;
      const agentsDir = agent.agentsDir;

      console.log(`  ${agent.displayName}:`);
      console.log(`    skills dir: ${skillsDir} ${existsSync(skillsDir) ? "✓" : "✗"}`);
      console.log(`    agents dir: ${agentsDir} ${existsSync(agentsDir) ? "✓" : "✗"}`);

      if (manifest) {
        console.log(`    version: ${manifest.version}`);
        console.log(`    installed: ${manifest.installedAt}`);
        console.log(`    profile: ${manifest.profile || "custom"}`);

        // Check for orphaned skills (installed but not in manifest)
        if (existsSync(skillsDir)) {
          const { readdirSync } = require("fs");
          const onDisk = readdirSync(skillsDir).filter(
            (n: string) => !n.startsWith(".") && existsSync(join(skillsDir, n, "SKILL.md"))
          );
          const tracked = manifest.skills;
          const orphans = onDisk.filter((s: string) => !tracked.includes(s));
          if (orphans.length > 0) {
            console.log(`    ⚠ orphaned skills: ${orphans.join(", ")}`);
          }
        }
      } else {
        console.log(`    not installed`);
      }
      console.log();
    }
  });