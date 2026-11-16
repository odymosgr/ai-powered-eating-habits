# Poteto's AI SWE Workshop: what's left

Source: Odysseas's notes from poteto's AI SWE workshop on X (Oct 2026). Parts marked *My reading* are the Software Architect's interpretation, to check against the source.

Most of the workshop now lives elsewhere: the feature map and the folder layering in [tech-stack.md §4](../../../docs/tech-stack.md#4-folders), and the checks, rules, review and codebase gardening in [Matt Pocock's skills](../matt-pococks-guidance/skills.md). What's left is the Dune framework.

## The Dune framework

Five parts; Odysseas's guess is that it's harness-related.

| Part | Meaning (notes) | *My reading* for our app |
| --- | --- | --- |
| Feature | One folder per product UI feature | `features/weight-room/`, `features/meal-log/` |
| Entrypoint | One view a user can open (a route) | A screen, i.e. an Expo Router route |
| Transcript card | A feature-owned body for one entry point (unclear in the notes) | Content a feature renders inside a shared surface, e.g. an advice bubble on the homepage or a card in the dietitian chat |
| Client | State behind hooks and commands, with one writer | A store per feature: screens read it through hooks and change it only through commands |
| Host | Always-on behaviour behind a typed contract | Backend functions and schedules (weekly analysis, reminders) behind typed APIs |

Example vertical slice in a React app:

| Layer | Path |
| --- | --- |
| Feature UI | `features/<name>/workspace/entrypoint.ts` |
| Client | `client/<name>-store.ts` |
| Shared edge | `shared/<name>-rpc.ts` |
| Host extension | `extensions/<name>/extension.ts` |

Each feature lives in known places with typed edges, so agents can work on different features in parallel without touching the same files. We take the ideas, not the exact layout: tech-stack.md §4 already has the feature folders and typed edges. The transcript card, the one-writer client and the typed host wait for the features that need them.
