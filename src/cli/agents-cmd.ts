import { Command } from "commander";
import { AGENT_TARGETS, listAgents, detectInstalledAgents } from "./agents.js";

export const agentsCommand = new Command("agents")
  .description("List supported agent platforms")
  .action(() => {
    console.log(`\n🤖 Supported agent platforms\n`);
    const installed = detectInstalledAgents();
    for (const [name, agent] of Object.entries(AGENT_TARGETS)) {
      const isInstalled = installed.includes(name);
      console.log(`  ${isInstalled ? "✓" : "○"} ${agent.displayName} (${name})`);
      console.log(`    skills: ${agent.globalSkillsDir}`);
      console.log(`    agents: ${agent.agentsDir}`);
      console.log();
    }
  });