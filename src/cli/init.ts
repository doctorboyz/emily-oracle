import { Command } from "commander";
import { mkdirSync, existsSync, writeFileSync } from "fs";
import { join } from "path";

export const initCommand = new Command("init")
  .description("Initialize a project with CLAUDE.md and psi/ structure")
  .option("--name <name>", "project name", "emily-oracle")
  .action((opts) => {
    const cwd = process.cwd();
    const claudeMdPath = join(cwd, "CLAUDE.md");
    const psiDir = join(cwd, "ψ");

    if (existsSync(claudeMdPath)) {
      console.log(`  CLAUDE.md already exists — skipping`);
    } else {
      writeFileSync(claudeMdPath, `# ${opts.name}\n\n> "จากเมล็ดแรก สู่ทัพ Oracle"\n\nInitialized by emily-skill-cli\n`, "utf-8");
      console.log(`  ✓ created CLAUDE.md`);
    }

    // Create psi/ brain structure
    const psiDirs = [
      "inbox", "memory/resonance", "memory/learnings", "memory/retrospectives",
      "writing", "lab", "learn", "active", "archive", "outbox",
    ];
    for (const dir of psiDirs) {
      const fullPath = join(psiDir, dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
    }
    console.log(`  ✓ created ψ/ brain structure (${psiDirs.length} directories)`);

    // Create .claude/settings.local.json
    const claudeDir = join(cwd, ".claude");
    if (!existsSync(claudeDir)) {
      mkdirSync(claudeDir, { recursive: true });
    }
    const settingsPath = join(claudeDir, "settings.local.json");
    if (!existsSync(settingsPath)) {
      writeFileSync(settingsPath, JSON.stringify({
        permissions: {
          deny: [
            "rm -rf", "git push --force", "DROP TABLE", "chmod 777",
          ],
        },
      }, null, 2), "utf-8");
      console.log(`  ✓ created .claude/settings.local.json`);
    }

    console.log(`\n  🌱 Project initialized! Run: emily-skill-cli install -g -y\n`);
  });