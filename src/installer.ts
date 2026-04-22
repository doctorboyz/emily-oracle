// Core install/uninstall logic for emily-skill-cli
// Copies skills and agents to target directories, tracks installed state

import { cpSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, basename, resolve } from "path";
import { homedir } from "os";
import { VERSION, NAME } from "./version.js";
import { resolveProfile } from "./cli/profiles.js";
import { resolveAgent, type AgentTarget } from "./cli/agents.js";

const home = homedir();

interface InstallManifest {
  version: string;
  installedAt: string;
  skills: string[];
  agents: string[];
  profile?: string;
}

const MANIFEST_FILE = ".emily-skill-cli.json";

function getManifestPath(agent: AgentTarget): string {
  return join(agent.globalSkillsDir, MANIFEST_FILE);
}

export function readManifest(agent: AgentTarget): InstallManifest | null {
  const path = getManifestPath(agent);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export function writeManifest(agent: AgentTarget, manifest: InstallManifest): void {
  const path = getManifestPath(agent);
  mkdirSync(agent.globalSkillsDir, { recursive: true });
  writeFileSync(path, JSON.stringify(manifest, null, 2), "utf-8");
}

// Resolve skill source directory
function getSkillSourceDir(): string {
  // From installer.ts (in src/), skills are in src/skills/
  return resolve(import.meta.dir, "skills");
}

function getAgentSourceDir(): string {
  return resolve(import.meta.dir, "agents");
}

// List available skills from source
export function listAvailableSkills(): string[] {
  const skillDir = getSkillSourceDir();
  if (!existsSync(skillDir)) return [];
  return readdirSync(skillDir).filter((name) => {
    const skillPath = join(skillDir, name);
    return statSync(skillPath).isDirectory() && existsSync(join(skillPath, "SKILL.md"));
  });
}

// List available agents from source
export function listAvailableAgents(): string[] {
  const agentDir = getAgentSourceDir();
  if (!existsSync(agentDir)) return [];
  return readdirSync(agentDir).filter((name) => name.endsWith(".md"));
}

// Install a single skill
export async function installSkill(
  skillName: string,
  agent: AgentTarget,
  options: { force?: boolean } = {}
): Promise<{ installed: boolean; reason?: string }> {
  const sourceDir = join(getSkillSourceDir(), skillName);
  const targetDir = join(agent.globalSkillsDir, skillName);

  if (!existsSync(sourceDir) || !existsSync(join(sourceDir, "SKILL.md"))) {
    return { installed: false, reason: `skill not found: ${skillName}` };
  }

  // Skip if already installed and not forcing
  if (existsSync(targetDir) && !options.force) {
    return { installed: false, reason: "already installed" };
  }

  // Remove old if force
  if (existsSync(targetDir)) {
    rmSync(targetDir, { recursive: true, force: true });
  }

  // Copy skill directory
  mkdirSync(agent.globalSkillsDir, { recursive: true });
  cpSync(sourceDir, targetDir, { recursive: true });

  // Inject installer metadata into SKILL.md
  const skillMdPath = join(targetDir, "SKILL.md");
  if (existsSync(skillMdPath)) {
    let content = readFileSync(skillMdPath, "utf-8");
    // Add installer field to frontmatter if not present
    if (!content.includes("installer:")) {
      content = content.replace(/^---\n/, `---\ninstaller: ${NAME} v${VERSION}\n`);
    } else {
      content = content.replace(/installer:.*\n/, `installer: ${NAME} v${VERSION}\n`);
    }
    writeFileSync(skillMdPath, content, "utf-8");
  }

  return { installed: true };
}

// Install a single agent
export async function installAgent(
  agentFile: string,
  target: AgentTarget,
  options: { force?: boolean } = {}
): Promise<{ installed: boolean; reason?: string }> {
  const sourcePath = join(getAgentSourceDir(), agentFile);
  const targetPath = join(target.agentsDir, agentFile);

  if (!existsSync(sourcePath)) {
    return { installed: false, reason: `agent not found: ${agentFile}` };
  }

  // Skip if already installed and not forcing
  if (existsSync(targetPath) && !options.force) {
    return { installed: false, reason: "already installed" };
  }

  mkdirSync(target.agentsDir, { recursive: true });
  cpSync(sourcePath, targetPath);

  return { installed: true };
}

// Uninstall a single skill
export async function uninstallSkill(
  skillName: string,
  agent: AgentTarget
): Promise<{ removed: boolean; reason?: string }> {
  const targetDir = join(agent.globalSkillsDir, skillName);
  if (!existsSync(targetDir)) {
    return { removed: false, reason: "not installed" };
  }
  rmSync(targetDir, { recursive: true, force: true });
  return { removed: true };
}

// Uninstall a single agent
export async function uninstallAgent(
  agentFile: string,
  target: AgentTarget
): Promise<{ removed: boolean; reason?: string }> {
  const targetPath = join(target.agentsDir, agentFile);
  if (!existsSync(targetPath)) {
    return { removed: false, reason: "not installed" };
  }
  rmSync(targetPath, { force: true });
  return { removed: true };
}

// Full install: profile or specific skills
export async function installAll(options: {
  profile?: string;
  skills?: string[];
  agentNames?: string[];
  force?: boolean;
  yes?: boolean;
  dryRun?: boolean;
}): Promise<{ skillsInstalled: number; agentsInstalled: number; errors: string[] }> {
  const agentTargets = (options.agentNames || ["claude-code"]).map(resolveAgent);
  const errors: string[] = [];
  let skillsInstalled = 0;
  let agentsInstalled = 0;

  // Resolve skill list
  let skillNames: string[];
  if (options.skills && options.skills.length > 0) {
    skillNames = options.skills;
  } else if (options.profile) {
    const profile = resolveProfile(options.profile);
    if (profile.skills.includes("*")) {
      skillNames = listAvailableSkills();
    } else {
      skillNames = profile.skills;
    }
  } else {
    // Default to standard profile
    const profile = resolveProfile("standard");
    skillNames = profile.skills;
  }

  // Resolve agent list
  let agentFiles: string[];
  if (options.profile) {
    const profile = resolveProfile(options.profile);
    if (profile.agents.includes("*")) {
      agentFiles = listAvailableAgents();
    } else {
      agentFiles = profile.agents.map((a) => (a.endsWith(".md") ? a : `${a}.md`));
    }
  } else {
    const profile = resolveProfile("standard");
    agentFiles = profile.agents.map((a) => (a.endsWith(".md") ? a : `${a}.md`));
  }

  // Install skills for each agent target
  for (const agent of agentTargets) {
    for (const skillName of skillNames) {
      if (options.dryRun) {
        console.log(`  [dry-run] would install skill: ${skillName}`);
        skillsInstalled++;
        continue;
      }
      const result = await installSkill(skillName, agent, { force: options.force });
      if (result.installed) {
        console.log(`  ✓ installed skill: ${skillName}`);
        skillsInstalled++;
      } else if (result.reason !== "already installed") {
        console.log(`  ✗ ${skillName}: ${result.reason}`);
        errors.push(`${skillName}: ${result.reason}`);
      } else {
        console.log(`  → already installed: ${skillName}`);
      }
    }

    // Install agents
    for (const agentFile of agentFiles) {
      if (options.dryRun) {
        console.log(`  [dry-run] would install agent: ${agentFile}`);
        agentsInstalled++;
        continue;
      }
      const result = await installAgent(agentFile, agent, { force: options.force });
      if (result.installed) {
        console.log(`  ✓ installed agent: ${agentFile}`);
        agentsInstalled++;
      } else if (result.reason !== "already installed") {
        console.log(`  ✗ ${agentFile}: ${result.reason}`);
        errors.push(`${agentFile}: ${result.reason}`);
      } else {
        console.log(`  → already installed: ${agentFile}`);
      }
    }

    // Write manifest
    if (!options.dryRun) {
      const manifest: InstallManifest = {
        version: VERSION,
        installedAt: new Date().toISOString(),
        skills: skillNames,
        agents: agentFiles,
        profile: options.profile,
      };
      writeManifest(agent, manifest);
    }
  }

  return { skillsInstalled, agentsInstalled, errors };
}

// Full uninstall
export async function uninstallAll(options: {
  agentNames?: string[];
  skills?: string[];
  all?: boolean;
}): Promise<{ skillsRemoved: number; agentsRemoved: number; errors: string[] }> {
  const agentTargets = (options.agentNames || ["claude-code"]).map(resolveAgent);
  const errors: string[] = [];
  let skillsRemoved = 0;
  let agentsRemoved = 0;

  for (const agent of agentTargets) {
    if (options.all) {
      // Remove entire skills and agents directories
      const manifest = readManifest(agent);
      const skillsToRemove = manifest?.skills || listAvailableSkills();
      const agentsToRemove = manifest?.agents || listAvailableAgents();

      for (const skillName of skillsToRemove) {
        const result = await uninstallSkill(skillName, agent);
        if (result.removed) {
          console.log(`  ✓ removed skill: ${skillName}`);
          skillsRemoved++;
        }
      }

      for (const agentFile of agentsToRemove) {
        const result = await uninstallAgent(agentFile, agent);
        if (result.removed) {
          console.log(`  ✓ removed agent: ${agentFile}`);
          agentsRemoved++;
        }
      }

      // Remove manifest
      const manifestPath = getManifestPath(agent);
      if (existsSync(manifestPath)) {
        rmSync(manifestPath, { force: true });
      }
    } else if (options.skills) {
      // Remove specific skills
      for (const skillName of options.skills) {
        const result = await uninstallSkill(skillName, agent);
        if (result.removed) {
          console.log(`  ✓ removed skill: ${skillName}`);
          skillsRemoved++;
        } else {
          errors.push(`${skillName}: ${result.reason}`);
        }
      }
    }
  }

  return { skillsRemoved, agentsRemoved, errors };
}