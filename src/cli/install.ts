import { Command } from "commander";
import { installAll } from "../installer.js";
import { listAgents, detectInstalledAgents, DEFAULT_AGENTS } from "./agents.js";
import { listProfiles, resolveProfile } from "./profiles.js";

export const installCommand = new Command("install")
  .description("Install skills and agents")
  .option("-g, --global", "install globally (default)", true)
  .option("-p, --profile <profile>", "install profile (seed/standard/full)", "standard")
  .option("-s, --skill <skills...>", "install specific skills by name")
  .option("-a, --agent <agents...>", "target agent platforms", detectInstalledAgents().length > 0 ? detectInstalledAgents() : DEFAULT_AGENTS)
  .option("-y, --yes", "skip confirmation", false)
  .option("--force", "overwrite existing installations", false)
  .option("--dry-run", "preview without installing", false)
  .action(async (opts) => {
    console.log(`\n🌱 emily-skill-cli install\n`);

    if (opts.skill) {
      console.log(`  installing specific skills: ${opts.skill.join(", ")}\n`);
    } else {
      const profile = resolveProfile(opts.profile);
      console.log(`  profile: ${profile.name} (${profile.description})\n`);
    }

    console.log(`  target agents: ${opts.agent.join(", ")}\n`);

    if (opts.dryRun) {
      console.log(`  [dry-run mode — no files will be written]\n`);
    }

    if (!opts.yes && !opts.dryRun) {
      // In non-interactive mode, proceed. Interactive confirmation via @clack later.
      console.log(`  Installing... (use -y to skip this message)\n`);
    }

    const result = await installAll({
      profile: opts.skill ? undefined : opts.profile,
      skills: opts.skill,
      agentNames: opts.agent,
      force: opts.force,
      yes: opts.yes,
      dryRun: opts.dryRun,
    });

    console.log(`\n  📊 ${result.skillsInstalled} skills, ${result.agentsInstalled} agents installed`);
    if (result.errors.length > 0) {
      console.log(`  ⚠ ${result.errors.length} errors`);
      result.errors.forEach((e) => console.log(`    - ${e}`));
    }
    console.log();
  });