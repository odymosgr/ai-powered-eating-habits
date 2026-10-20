# Matt Pocock's feature workflow

Actionable summary of `video-transcription.txt` (third-party video by Kevin, about skills v1.3, Oct 2026).

- [Pipeline](#pipeline): the steps, in order
- [Rules](#rules): principles behind every step
- [Council roles](#council-roles): which persona joins which step
- [Facts vs hypotheses](#facts-vs-hypotheses)

## Pipeline

| # | Command | What happens | My job | Done when |
|---|---|---|---|---|
| 1 | `grill me` / `grill with docs` | Agent maps the feature as a decision tree and asks every *frontier* decision (parent already settled) in one numbered round, each with a recommended answer. `with docs` also maintains a repo glossary | Answer decisions ("yes, yes, no, end of month") | Frontier empty and we agree we're on the same page |
| 1a | `wait what` | Agent re-explains its last message in plain English using glossary terms | Use whenever a reply is jargon | I understand it |
| 1b | prototype (handoff) | For ungrillable questions (e.g. UI): fresh session builds a throwaway prototype with very different variants | Click through, pick one | Answer fed back into grilling |
| 2 | `to spec` | Same chat. Writes problem, fix, numbered user stories. First agrees the *seams* (where tests poke the feature, ideally one) | Approve the seam | Spec posted as an issue labelled `ready for agent` |
| 3 | `to tickets` | Cuts spec into vertical slices (DB to UI), each fitting one fresh session, with blocking links | Sanity-check slices | Tickets created. Sizing: `estimated tokens / 150k` |
| 4 | `implement` (per ticket, clear chat between) or `implement spec` (one agent per ready ticket, separate repo copies, one branch) | Test first: failing test at the seam, then minimal code to pass | Nothing during the build | Tests pass. No refactor step here |
| 5 | `code review` | Two fresh agents: (a) diff vs spec: missing, unrequested, looks-done-but-wrong; (b) diff vs coding standards + Fowler's code smells. Refactoring happens here | Decide on findings | Findings resolved |
| 6 | `PR` | Description: smallest explanatory picture, before/after proof, *merge danger* (one-way or two-way door, blast radius) | Read merge danger before merging | PR merged |
| 7 | `retro` (before clearing chat) | Agent reviews its own session and *suggests* fixes to the environment: agent instructions, lint rules, checks | Pick which to keep. Never let it auto-apply | Chosen fixes applied |
| 8 | Close issue | Spec is discarded (rule 7) | | Issue closed |

Small enough for one session? Skip 2-3: plan and build in one session.

## Rules

1. **Decisions are mine, facts are the agent's.** If the answer is in the code, the agent reads it (helper agent) instead of asking me.
2. **No code until grilling ends.** One-sentence prompts make the agent guess every gap. Longer prompts only cover the gaps I thought of.
3. **Stay in the smart zone** (why steps 3-4 exist). Quality drops past ~150k tokens of context.
4. **One vocabulary.** Glossary entry per term, with words to avoid (e.g. *pause* vs *skip*, avoid *hold*, *freeze*).
5. **Separate builder and reviewer** (why step 5 uses fresh agents). The author thinks its code is fine. Builders are bad at following "don'ts", so the standards go to the reviewer only.
6. **Machine-detectable mistake → automated check.** Written standards keep only judgment calls.
7. **Specs are temporary.** A spec is a projection of grilling decisions. Once shipped, they live in code, tests and glossary. Prototypes keep it from becoming waterfall.
8. **Delete skills the models outgrow** (v1.3 removed the merge-conflict skill).
