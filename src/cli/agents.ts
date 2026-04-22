// Agent target definitions — where skills/agents get installed for each platform
// Modeled after arra-oracle-skills-cli but simplified for initial release

import { homedir } from "os";
import { join } from "path";
import { existsSync } from "fs";

export interface AgentTarget {
  name: string;
  displayName: string;
  skillsDir: string;       // project-local skills directory
  globalSkillsDir: string; // user-global skills directory
  agentsDir: string;       // global agents directory
  commandsDir?: string;     // project-local commands directory
  globalCommandsDir?: string; // global commands directory
  useFlatFiles: boolean;   // flat .md files vs directory structure
  commandFormat: "md" | "toml"; // command stub format
  commandsOptIn: boolean;   // require --with-commands flag
  detectInstalled: () => boolean;
}

const home = homedir();

export const AGENT_TARGETS: Record<string, AgentTarget> = {
  "claude-code": {
    name: "claude-code",
    displayName: "Claude Code",
    skillsDir: ".claude/skills",
    globalSkillsDir: join(home, ".claude", "skills"),
    agentsDir: join(home, ".claude", "agents"),
    commandsDir: ".claude/commands",
    globalCommandsDir: join(home, ".claude", "commands"),
    useFlatFiles: false,
    commandFormat: "md",
    commandsOptIn: true,
    detectInstalled: () => existsSync(join(home, ".claude", "skills")),
  },
  opencode: {
    name: "opencode",
    displayName: "OpenCode",
    skillsDir: ".opencode/skills",
    globalSkillsDir: join(home, ".config", "opencode", "skills"),
    agentsDir: join(home, ".config", "opencode", "agents"),
    commandFormat: "md",
    useFlatFiles: false,
    commandsOptIn: false,
    detectInstalled: () => existsSync(join(home, ".config", "opencode")),
  },
  codex: {
    name: "codex",
    displayName: "Codex",
    skillsDir: ".codex/skills",
    globalSkillsDir: join(home, ".codex", "skills"),
    agentsDir: join(home, ".codex", "agents"),
    commandsDir: ".codex/prompts",
    globalCommandsDir: join(home, ".codex", "prompts"),
    useFlatFiles: true,
    commandFormat: "md",
    commandsOptIn: false,
    detectInstalled: () => existsSync(join(home, ".codex")),
  },
  cursor: {
    name: "cursor",
    displayName: "Cursor",
    skillsDir: ".cursor/skills",
    globalSkillsDir: join(home, ".cursor", "skills"),
    agentsDir: join(home, ".cursor", "agents"),
    useFlatFiles: true,
    commandFormat: "md",
    commandsOptIn: false,
    detectInstalled: () => existsSync(join(home, ".cursor")),
  },
};

export const DEFAULT_AGENTS = ["claude-code"];

export function resolveAgent(name: string): AgentTarget {
  const agent = AGENT_TARGETS[name];
  if (!agent) {
    throw new Error(
      `Unknown agent: ${name}. Available: ${Object.keys(AGENT_TARGETS).join(", ")}`
    );
  }
  return agent;
}

export function listAgents(): string[] {
  return Object.keys(AGENT_TARGETS);
}

export function detectInstalledAgents(): string[] {
  return Object.entries(AGENT_TARGETS)
    .filter(([_, agent]) => agent.detectInstalled())
    .map(([name]) => name);
}