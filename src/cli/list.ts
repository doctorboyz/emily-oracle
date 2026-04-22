import { Command } from "commander";
import { readManifest } from "../installer.js";
import { listAvailableSkills, listAvailableAgents } from "../installer.js";
import { AGENT_TARGETS, DEFAULT_AGENTS } from "./agents.js";

export const listCommand = new Command("list")
  .description("List installed skills and agents")
  .option("-a, --agent <agent>", "target agent platform", "claude-code")
  .option("--available", "list available (not yet installed) skills", false)
  .option("--json", "JSON output", false)
  .action((opts) => {
    const agent = AGENT_TARGETS[opts.agent];
    if (!agent) {
      console.error(`Unknown agent: ${opts.agent}`);
      return;
    }

    if (opts.available) {
      const skills = listAvailableSkills();
      const agents = listAvailableAgents();
      if (opts.json) {
        console.log(JSON.stringify({ skills, agents }, null, 2));
      } else {
        console.log(`\n📋 Available skills (${skills.length}):\n`);
        skills.forEach((s) => console.log(`  - ${s}`));
        console.log(`\n📋 Available agents (${agents.length}):\n`);
        agents.forEach((a) => console.log(`  - ${a}`));
        console.log();
      }
      return;
    }

    const manifest = readManifest(agent);
    if (!manifest) {
      console.log(`\n  No emily-skill-cli installation found for ${opts.agent}`);
      console.log(`  Run: emily-skill-cli install -g -y\n`);
      return;
    }

    if (opts.json) {
      console.log(JSON.stringify(manifest, null, 2));
    } else {
      console.log(`\n📋 Installed — emily-skill-cli v${manifest.version}\n`);
      console.log(`  Profile: ${manifest.profile || "custom"}`);
      console.log(`  Installed at: ${manifest.installedAt}`);
      console.log(`\n  Skills (${manifest.skills.length}):\n`);
      manifest.skills.forEach((s) => console.log(`    - ${s}`));
      console.log(`\n  Agents (${manifest.agents.length}):\n`);
      manifest.agents.forEach((a) => console.log(`    - ${a}`));
      console.log();
    }
  });