import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { appendHistory, readHistory, writeManifest, readManifest } from "../src/installer.js";
import type { AgentTarget } from "../src/cli/agents.js";

function makeAgent(dir: string): AgentTarget {
  return {
    name: "test-agent",
    displayName: "Test Agent",
    skillsDir: ".test/skills",
    globalSkillsDir: join(dir, "skills"),
    agentsDir: join(dir, "agents"),
    useFlatFiles: false,
    commandFormat: "md",
    commandsOptIn: false,
    detectPath: dir,
    detectInstalled: () => existsSync(dir),
  };
}

let tmpDir: string;
let agent: AgentTarget;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "emily-test-"));
  agent = makeAgent(tmpDir);
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("appendHistory + readHistory", () => {
  test("creates history file on first append", () => {
    appendHistory(agent, {
      action: "install",
      type: "skill",
      name: "recap",
      timestamp: "2026-04-22T00:00:00.000Z",
    });

    const historyPath = join(agent.globalSkillsDir, ".emily-skill-cli-history.jsonl");
    expect(existsSync(historyPath)).toBe(true);
  });

  test("reads entries in order", () => {
    appendHistory(agent, {
      action: "install",
      type: "skill",
      name: "recap",
      timestamp: "2026-04-22T00:00:00.000Z",
    });
    appendHistory(agent, {
      action: "install",
      type: "skill",
      name: "graphify",
      timestamp: "2026-04-22T00:01:00.000Z",
    });

    const history = readHistory(agent);
    expect(history).toHaveLength(2);
    expect(history[0].name).toBe("recap");
    expect(history[1].name).toBe("graphify");
  });

  test("returns empty array when no history file", () => {
    const history = readHistory(agent);
    expect(history).toEqual([]);
  });

  test("handles corrupt history file gracefully", () => {
    mkdirSync(agent.globalSkillsDir, { recursive: true });
    const historyPath = join(agent.globalSkillsDir, ".emily-skill-cli-history.jsonl");
    writeFileSync(historyPath, "bad json\n{also bad\n", "utf-8");

    const history = readHistory(agent);
    expect(history).toEqual([]);
  });
});

describe("writeManifest with history", () => {
  test("sets updatedAt timestamp", () => {
    writeManifest(agent, {
      version: "1.0.0",
      installedAt: "2026-04-22T00:00:00.000Z",
      skills: ["recap"],
      agents: [],
    });

    const manifest = readManifest(agent);
    expect(manifest!.updatedAt).toBeDefined();
    expect(new Date(manifest!.updatedAt!).getTime()).not.toBeNaN();
  });

  test("embeds last 50 history entries in manifest", () => {
    // Append 55 entries
    for (let i = 0; i < 55; i++) {
      appendHistory(agent, {
        action: "install",
        type: "skill",
        name: `skill-${i}`,
        timestamp: `2026-04-22T00:${String(i).padStart(2, "0")}:00.000Z`,
      });
    }

    writeManifest(agent, {
      version: "1.0.0",
      installedAt: "2026-04-22T00:00:00.000Z",
      skills: [],
      agents: [],
    });

    const manifest = readManifest(agent);
    expect(manifest!.history).toHaveLength(50);
    // Last 50 entries: skill-5 through skill-54
    expect(manifest!.history![0].name).toBe("skill-5");
    expect(manifest!.history![49].name).toBe("skill-54");
  });

  test("backward compat: manifest without history still readable", () => {
    // Write a plain manifest without history field
    mkdirSync(agent.globalSkillsDir, { recursive: true });
    const manifestPath = join(agent.globalSkillsDir, ".emily-skill-cli.json");
    writeFileSync(manifestPath, JSON.stringify({
      version: "1.0.0",
      installedAt: "2026-04-22T00:00:00.000Z",
      skills: ["recap"],
      agents: [],
    }, null, 2), "utf-8");

    const manifest = readManifest(agent);
    expect(manifest).not.toBeNull();
    expect(manifest!.skills).toEqual(["recap"]);
    expect(manifest!.history).toBeUndefined();
  });
});