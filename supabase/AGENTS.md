# Database rules

Read before any database task. The Supabase skills in `.claude/skills/` cover general practice. These are the project's own rules, and they win where the skills differ. Why Postgres on Supabase: [ADR 0002](../docs/adr/0002-postgres-on-supabase.md).

## Where we differ from the skills

- **IDs are UUIDv7, made by the app:** `id uuid` with no default, never `identity`. The phone makes the ID before sending, so a retry after bad signal can't create a duplicate row, and IDs need no central counter. With no default, an insert that forgot its ID fails at once instead of silently losing that protection.
- **The primary key is `(user_id, id)`, and `user_id` comes first in every index.** Citus, our first option for sharding by user, needs `user_id` in every primary key, and changing a primary key on big tables is one of the costliest migrations. The same index also serves RLS and the foreign key.
- **No MCP setup, and nothing against the cloud project (`link`, `db push`), without Odysseas's OK.** An agent can be steered by text it reads (prompt injection), and the cloud holds real data.

## What the skills can't know

- **Access model:** a user reaches only their own rows, and no query reads across users. So every table of user data has `user_id uuid not null default auth.uid()`, referencing `auth.users (id) on delete cascade`, and its policies check it. Deleting an account deletes its data. Shared reference data, like a future food database, gets copied, and analytics go to a warehouse.
- **No signed-out access:** `revoke all` from `anon` and `authenticated`, then grant `authenticated` only the commands it needs. The local defaults grant everything, including `truncate`, which skips RLS.
- **RLS on every table,** views with `security_invoker`, and the Security Advisor in CI. An event trigger that turns RLS on for new tables is planned, not built.
- **Writes:** clients write only raw inputs, and AI outputs arrive only through server functions. A write that spans tables is one RPC function.
- **Migrations:** never edit a committed one, because databases that already ran it won't run it again; add a new one instead. Before calling the work done, run `npx supabase db advisors`, `npx supabase db reset` and `npm run test:db`.
- **Tests:** every table of user data has a pgTAP test in `supabase/tests/`: the owner sees and changes their rows, a second user sees and changes none, and a signed-out request gets nothing.
- **Backups:** once the cloud project holds real data, a nightly database dump, and the Pro plan once others rely on the app.
