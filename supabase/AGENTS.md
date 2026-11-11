# Database rules

Read before any database task. The Supabase skills in `.claude/skills/` cover general practice. These are the project's own rules, and they win where the skills differ. Background: [database-analysis.md §6](../administration/docs/database-analysis.md#6-proposal).

## Where we differ from the skills

- **IDs are UUIDv7, made by the app:** `id uuid` with no default, never `identity`. The phone makes the ID before sending, so a retry after bad signal can't create a duplicate row (guardrail 6), and IDs need no central counter (guardrail 11). With no default, an insert that forgot its ID fails at once instead of silently losing that protection.
- **The primary key is `(user_id, id)`, and `user_id` comes first in every index.** Citus, our first option for sharding by user, needs `user_id` in every primary key (guardrail 10), and changing a primary key on big tables is one of the costliest migrations. The same index also serves RLS and the foreign key.
- **No MCP setup, and nothing against the cloud project (`link`, `db push`), without Odysseas's OK.** An agent can be steered by text it reads (prompt injection), and the cloud holds real data.

## What the skills can't know

- **Access model:** a user reaches only their own rows, and no query reads across users (guardrail 12). So every table of user data has `user_id uuid not null default auth.uid()`, referencing `auth.users (id) on delete cascade`, and its policies check it. Deleting an account deletes its data.
- **No signed-out access:** `revoke all` from `anon` and `authenticated`, then grant `authenticated` only the commands it needs. The local defaults grant everything, including `truncate`, which skips RLS.
- **Migrations:** never edit a committed one, because databases that already ran it won't run it again; add a new one instead. Before calling the work done, run `npx supabase db advisors`, `npx supabase db reset` and `npm run test:db`.
- **Tests:** every table of user data has a pgTAP test in `supabase/tests/`: the owner sees and changes their rows, a second user sees and changes none, and a signed-out request gets nothing (guardrail 3).
