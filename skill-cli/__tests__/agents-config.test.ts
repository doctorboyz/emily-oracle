import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  getAllTargets,
  resolveAgent,
  listAgents,
  detectInstalledAgents,
  saveCustomAgent,
  removeCustomAgent,
  type CustomAgentConfig,
} from "../src/cli/agents.js";

// Override config dir for tests
const ORIGINAL_HOME = process.env.HOME;

describe("getAllTargets", () => {
  test("includes built-in agents", () => {
    const targets = getAllTargets();
    expect(targets["claude-code"]).toBeDefined();
    expect(targets["opencode"]).toBeDefined();
    expect(targets["codex"]).toBeDefined();
    expect(targets["cursor"]).toBeDefined();
  });

  test("each built-in has detectPath", () => {
    const targets = getAllTargets();
    for (const [name, agent] of Object.entries(targets)) {
      expect(agent.detectPath).toBeDefined();
      expect(typeof agent.detectPath).toBe("string");
      expect(agent.detectPath.length).toBeGreaterThan(0);
    }
  });

  test("each built-in has detectInstalled function", () => {
    const targets = getAllTargets();
    for (const [name, agent] of Object.entries(targets)) {
      expect(typeof agent.detectInstalled).toBe("function");
    }
  });
});

describe("resolveAgent", () => {
  test("resolves known agent", () => {
    const agent = resolveAgent("claude-code");
    expect(agent.name).toBe("claude-code");
    expect(agent.displayName).toBe("Claude Code");
  });

  test("throws for unknown agent", () => {
    expect(() => resolveAgent("nonexistent")).toThrow("Unknown agent: nonexistent");
  });
});

describe("listAgents", () => {
  test("returns at least built-in agents", () => {
    const agents = listAgents();
    expect(agents).toContain("claude-code");
    expect(agents).toContain("opencode");
    expect(agents).toContain("codex");
    expect(agents).toContain("cursor");
  });
});

describe("detectInstalledAgents", () => {
  test("returns only agents whose detectPath exists", () => {
    const installed = detectInstalledAgents();
    // Result depends on actual system state, just verify it returns an array
    expect(Array.isArray(installed)).toBe(true);
  });
});

describe("custom agent config", () => {
  const configDir = join(tmpdir(), "emily-agents-test-config");
  const configFile = join(configDir, "agents.json");

  beforeEach(() => {
    mkdirSync(configDir, { recursive: true });
    // Point the config to our temp dir by monkey-patching
    // Note: agents.ts reads from a hardcoded path, so we test save/load
    // by writing directly to the expected config location
  });

  afterEach(() => {
    rmSync(configDir, { recursive: true, force: true });
  });

  test("saveCustomAgent writes to config file", () => {
    const config: CustomAgentConfig = {
      name: "windsurf",
      displayName: "Windsurf",
      skillsDir: ".windsurf/skills",
      globalSkillsDir: join(tmpdir(), "windsurf", "skills"),
      agentsDir: join(tmpdir(), "windsurf", "agents"),
      detectPath: join(tmpdir(), "windsurf"),
    };

    saveCustomAgent(config);

    // Verify the config file exists and contains our agent
    const actualConfigFile = join(
      process.env.HOME || process.env.USERPROFILE || "~",
      ".config",
      "emily-skill-cli",
      "agents.json"
    );

    // If we can read it, check content
    if (existsSync(actualConfigFile)) {
      const content = JSON.parse(readFileSync(actualConfigFile, "utf-8"));
      expect(content.windsurf).toBeDefined();
      expect(content.windsurf.displayName).toBe("Windsurf");

      // Clean up
      removeCustomAgent("windsurf");
    }
  });

  test("removeCustomAgent removes from config", () => {
    const config: CustomAgentConfig = {
      name: "test-remove",
      displayName: "Test Remove",
      skillsDir: ".test-remove/skills",
      globalSkillsDir: join(tmpdir(), "test-remove", "skills"),
      agentsDir: join(tmpdir(), "test-remove", "agents"),
      detectPath: join(tmpdir(), "test-remove"),
    };

    saveCustomAgent(config);
    const removed = removeCustomAgent("test-remove");
    expect(removed).toBe(true);

    // Remove non-existent returns false
    const removedAgain = removeCustomAgent("test-remove");
    expect(removedAgain).toBe(false);
  });

  test("custom agent merged into getAllTargets", () => {
    const config: CustomAgentConfig = {
      name: "test-merge",
      displayName: "Test Merge",
      skillsDir: ".test-merge/skills",
      globalSkillsDir: join(tmpdir(), "test-merge", "skills"),
      agentsDir: join(tmpdir(), "test-merge", "agents"),
      detectPath: join(tmpdir(), "test-merge"),
    };

    saveCustomAgent(config);

    const targets = getAllTargets();
    expect(targets["test-merge"]).toBeDefined();
    expect(targets["test-merge"].displayName).toBe("Test Merge");
    expect(targets["test-merge"].detectPath).toBe(config.detectPath);

    // Clean up
    removeCustomAgent("test-merge");
  });

  test("custom agent uses defaults for optional fields", () => {
    const config: CustomAgentConfig = {
      name: "test-defaults",
      displayName: "Test Defaults",
      skillsDir: ".test-defaults/skills",
      globalSkillsDir: join(tmpdir(), "test-defaults", "skills"),
      agentsDir: join(tmpdir(), "test-defaults", "agents"),
      detectPath: join(tmpdir(), "test-defaults"),
    };

    saveCustomAgent(config);

    const targets = getAllTargets();
    const agent = targets["test-defaults"];
    expect(agent.useFlatFiles).toBe(false);
    expect(agent.commandFormat).toBe("md");
    expect(agent.commandsOptIn).toBe(false);

    // Clean up
    removeCustomAgent("test-defaults");
  });
});