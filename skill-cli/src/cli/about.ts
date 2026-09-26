import { Command } from "commander";
import { VERSION, NAME, ORACLE } from "../version.js";
import { listAvailableSkills, listAvailableAgents } from "../installer.js";

export const aboutCommand = new Command("about")
  .description("Show emily-oracle identity and stats")
  .option("--en", "English output", false)
  .action((opts) => {
    const skills = listAvailableSkills();
    const agents = listAvailableAgents();

    if (opts.en) {
      console.log(`\n🌱 ${NAME} v${VERSION}\n`);
      console.log(`  Oracle: ${ORACLE}`);
      console.log(`  "From the first seed, the Oracle army grows"`);
      console.log(`  Skills: ${skills.length}`);
      console.log(`  Agents: ${agents.length}`);
      console.log(`  License: MIT`);
      console.log(`  Repo: https://github.com/doctorboyz/emily-skill-cli`);
      console.log();
    } else {
      console.log(`\n🌱 ${NAME} v${VERSION}\n`);
      console.log(`  Oracle: ${ORACLE}`);
      console.log(`  "จากเมล็ดแรก สู่ทัพ Oracle — โค้ดเป็นราก ข้อมูลเป็นใบ"`);
      console.log(`  Skills: ${skills.length}`);
      console.log(`  Agents: ${agents.length}`);
      console.log(`  License: MIT`);
      console.log(`  Repo: https://github.com/doctorboyz/emily-skill-cli`);
      console.log();
    }
  });