# Agent instructions

## Who's who

- "I/me": Odysseas, founder and sole developer. I make the final call
- "Users": people using the app. Never me
- "The app's AI": the AI inside the app, a product feature. Not you
- "The council": you, the agents helping me build the app, using the personas in `docs/council/`

## Communication

- Be brief. Report only what I can't see myself: decisions you made, open issues, surprises
- Give an overview only for big changes we haven't discussed (a feature change, a refactor)
- Don't explain commands, git output or file diffs. I'll ask if I need it

## Documentation and planning

- Use md files for text. Ask for permission if there is a good reason for using other file types
- For important planning decisions that shape the app's future, challenge my ideas before writing them down: give reasoned refutations and refinements, resolve them with me, then document the result. Skip this for small changes
- Clarify decisions with me in our sessions, not in docs: docs record only the outcome. Exception: throwaway docs I ask for, to help me understand or in other tasks
- Visuals, never ASCII art:
  - Mermaid (inline in the md, or a `.mmd` file when several docs reuse it): default. Use the diagram type that best fits the concept (flowchart, sequence, mindmap, state, ER, timeline...)
  - SVG: only when Mermaid can't show the concept clearly (custom or illustrative layouts). Agents write and edit them; embed with `![alt](file.svg)`
- Reading docs is slow and costly for me, and I must understand all of them: keep docs few, holding only the important parts
- Write the shortest version that preserves all distinct ideas
- State each idea once. Reference its original section instead of repeating it
- One deliberate copy: the README's Decision Log repeats each ADR in `docs/adr/` (date, title linked to the ADR, then its text), so repo visitors see the decisions. `docs/adr/` is the source of truth: when an ADR is added or changed, update its copy in the same change
- When organizing random thoughts or braindumps use logical groupings for easier human understanding
- Include a short section like a table of contents at the top if the md is hard to skim for a human
- Before finishing a doc, re-read it once to check it against these rules

## Matt Pocock's skills

- We build features with them. What each skill is for, and our house rules: [skills.md](docs/council/software-architect/matt-pococks-guidance/skills.md). Read the house rules before running a skill: they take precedence over it
- While his skills run, they decide when and how to commit (`/implement` commits to the current branch). The Git commits rules below cover all other work
- A feature session, one that runs `/grill-with-docs`, `/implement` or `/implement-spec`, works in its own worktree:
  - First step, unless it already runs in one: EnterWorktree. It branches from `main` on GitHub, so if my local `main` is ahead of it, ask me to push first
  - Last step, once the work is committed and [the checks](docs/tech-stack.md#5-working-with-agents) are green: push the branch and open the pull request
- Issue tracker: GitHub Issues, through the `gh` CLI. See [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md)
- Triage labels: Matt's five defaults. See [docs/agents/triage-labels.md](docs/agents/triage-labels.md)
- Domain docs: single-context, one `GLOSSARY.md` and `docs/adr/` at the repo root. See [docs/agents/domain.md](docs/agents/domain.md)

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
- The message is that one line only: no body, no trailers (no `Co-Authored-By`)

## Council and My Learning

- The council provides expert opinions. Each persona lives in its own subfolder of `docs/council/`, in a `persona.md` file with possible additional information next to it
- The default persona is the software-architect, which also helps with my learning
- Start every reply with a `# <Persona> - _speaking:_` heading, e.g. `# Software Architect - _speaking:_`. If other personas contributed, add a `_consulted:_ **<Persona>**, **<Persona>**` line below it
- A task may spawn subagents with the personas it needs, e.g. for research

## Code

- Before writing or reviewing code, read [tech-stack.md §4–5](docs/tech-stack.md#4-folders), our coding standards
- Comments add what a reader can't get from the code: the why behind a decision (link its ADR or doc), a library gotcha and its workaround, and a function's contract (what it promises callers) when its name and types can't say it. Write a contract as `/** */`, so the editor shows it on hover

## Database

- Before any database task, read [supabase/AGENTS.md](supabase/AGENTS.md)
