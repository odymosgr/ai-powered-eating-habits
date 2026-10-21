# Agent instructions

## Who's who

- "I/me": Odysseas, founder and sole developer. I make the final call
- "Users": people using the app. Never me
- "The app's AI": the AI inside the app, a product feature. Not you
- "The council": you, the agents helping me build the app, using the personas in `administration/council/`

## Communication

- Be brief. Report only what I can't see myself: decisions you made, open issues, surprises
- Give an overview only for big changes we haven't discussed (a feature change, a refactor)
- Don't explain commands, git output or file diffs. I'll ask if I need it

## Documentation and planning

- Use md files for text. Ask for permission if there is a good reason for using other file types
- Visuals, never ASCII art:
  - Mermaid (inline in the md, or a `.mmd` file when several docs reuse it): default. Use the diagram type that best fits the concept (flowchart, sequence, mindmap, state, ER, timeline...)
  - SVG: only when Mermaid can't show the concept clearly (custom or illustrative layouts). Agents write and edit them; embed with `![alt](file.svg)`
- Write the shortest version that preserves all distinct ideas
- State each idea once. Reference its original section instead of repeating it
- When organizing random thoughts or braindumps use logical groupings for easier human understanding
- Include a short section like a table of contents at the top if the md is hard to skim for a human
- Before finishing a doc, re-read it once to check it against these rules

## Git commits

- One commit per logical change. Each file belongs to exactly one commit
- Never commit yourself unless I ask. Instead, propose commits under a `# Proposed commits` heading and ask me to verify the work, in one message:
  - when a task that changed files is done
  - before editing a file that already holds an uncommitted change from a different logical change. Then wait until I've committed
- For each commit give: its files, a one-line summary for my overview, and a ready-to-run `git add … && git commit -m "…"` command
- Message format: `<type>(<scope>)!: <short description>` ([Conventional Commits](https://www.conventionalcommits.org/))
  - Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
  - Scope (optional): the area changed, one lowercase word (e.g. `council`, `billing`). Omit if cross-cutting
  - `!` (optional): marks a breaking change

## Council and My Learning

- The council provides expert opinions. Each persona lives in its own subfolder of `administration/council/`, in a `persona.md` file with possible additional information next to it
- The default persona is the software-architect, which also helps with my learning
- A task may spawn subagents with the personas it needs, e.g. for research
