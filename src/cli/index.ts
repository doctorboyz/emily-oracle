#!/usr/bin/env bun
import { Command } from "commander";
import { VERSION, NAME } from "../version.js";
import { installCommand } from "./install.js";
import { uninstallCommand } from "./uninstall.js";
import { listCommand } from "./list.js";
import { profilesCommand } from "./profiles-cmd.js";
import { agentsCommand } from "./agents-cmd.js";
import { aboutCommand } from "./about.js";
import { initCommand } from "./init.js";
import { xrayCommand } from "./xray.js";

const program = new Command();

program
  .name(NAME)
  .description("Install Oracle skills to Claude Code and AI coding agents — emily-oracle edition")
  .version(VERSION);

program.addCommand(installCommand);
program.addCommand(uninstallCommand);
program.addCommand(listCommand);
program.addCommand(profilesCommand);
program.addCommand(agentsCommand);
program.addCommand(aboutCommand);
program.addCommand(initCommand);
program.addCommand(xrayCommand);

program.parse();