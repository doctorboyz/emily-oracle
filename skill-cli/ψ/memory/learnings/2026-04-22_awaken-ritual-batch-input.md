---
pattern: Trust ritual batch input over multi-step prompts
concepts: [awaken, ux, batch-freetext, askuserquestion]
source: "rrr: emily-skill-cli"
---

# Lesson: Trust Ritual Batch Input

The /awaken ritual is designed with batch freetext input for a reason — users can provide rich context in one message. Breaking it into multiple AskUserQuestion steps creates friction and frustration.

**Why**: Users who know what they want find multi-step confirmation tedious. The ritual's design already handles parsing freetext into fields.

**How to apply**: When running /awaken or similar rituals, combine related questions into one prompt. Only ask for missing required fields individually. Trust the user's raw input over parsed summaries.
