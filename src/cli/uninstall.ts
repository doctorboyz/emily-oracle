import { Command } from "commander";
import { uninstallAll } from "../installer.js";
import { DEFAULT_AGENTS } from "./agents.js";

export const uninstallCommand = new Command("uninstall")
  .description("Uninstall skills and agents")
  .option("-a, --agent <agents...>", "target agent platforms", DEFAULT_AGENTS)
  .option("-s, --skill <skills...>", "uninstall specific skills")
  .option("--all", "uninstall everything", false)
  .action(async (opts) => {
    console.log(`\n🗑 emily-skill-cli uninstall\n`);

    if (!opts.skill && !opts.all) {
      console.log("  Specify --skill <names...> or --all to uninstall");
      return;
    }

    const result = await uninstallAll({
      agentNames: opts.agent,
      skills: opts.skill,
      all: opts.all,
    });

    console.log(`\n  📊 ${result.skillsRemoved} skills, ${result.agentsRemoved} agents removed`);
    if (result.errors.length > 0) {
      console.log(`  ⚠ ${result.errors.length} errors`);
      result.errors.forEach((e) => console.log(`    - ${e}`));
    }
    console.log();
  });