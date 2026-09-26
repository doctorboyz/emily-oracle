// Profile definitions for emily-skill-cli
// Three tiers reflecting the "First Seed" theme

export interface Profile {
  name: string;
  description: string;
  skills: string[];
  agents: string[];
}

export const PROFILES: Record<string, Profile> = {
  seed: {
    name: "seed",
    description: "Minimal: just enough to be an Oracle — 8 core skills, 5 core agents",
    skills: [
      "awaken",
      "bud",
      "forward",
      "learn",
      "recap-lite",
      "rrr-lite",
      "trace",
      "who-are-you",
    ],
    agents: [
      "planner",
      "code-reviewer",
      "code-implementer",
      "bug-investigator",
      "build-error-resolver",
    ],
  },
  standard: {
    name: "standard",
    description: "Daily driver — 25 skills, 15 agents",
    skills: [
      // seed
      "awaken",
      "bud",
      "forward",
      "learn",
      "recap-lite",
      "rrr-lite",
      "trace",
      "who-are-you",
      // + oracle core
      "about-oracle",
      "dig",
      "forward-lite",
      "go",
      "incubate",
      "oracle-family-scan",
      "philosophy",
      "recap",
      "resonance",
      "rrr",
      "skills-list",
      "standup",
      "talk-to",
      "team-agents",
      "where-we-are",
      "xray",
    ],
    agents: [
      // seed agents
      "planner",
      "code-reviewer",
      "code-implementer",
      "bug-investigator",
      "build-error-resolver",
      // + standard agents
      "architect",
      "code-architect",
      "code-explorer",
      "doc-updater",
      "e2e-runner",
      "performance-optimizer",
      "security-reviewer",
      "tdd-guide",
      "test-writer",
      "typescript-reviewer",
    ],
  },
  full: {
    name: "full",
    description: "Everything — all 68+ skills, all 35+ agents",
    skills: [
      // All skills — populated dynamically at install time
      // When profile is "full", we install everything in src/skills/
      "*",
    ],
    agents: [
      // All agents — populated dynamically at install time
      "*",
    ],
  },
};

export function resolveProfile(name: string): Profile {
  const profile = PROFILES[name];
  if (!profile) {
    throw new Error(`Unknown profile: ${name}. Available: ${Object.keys(PROFILES).join(", ")}`);
  }
  return profile;
}

export function listProfiles(): string[] {
  return Object.keys(PROFILES);
}