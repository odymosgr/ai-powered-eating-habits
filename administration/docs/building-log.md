# Building & Decision Log

## Building Log

What I did, week by week. Start date: 6 Oct 2026.

- **Weeks 1–2:** put all my ideas on paper to get a complete view of the project, even a basic homepage design. Transcribed them with Claude into a product plan.
- **Week 3:** rest, and review of the product plan details.
- **Week 4:** continued with long-term decisions, made the Weight Room wireframes and the voice-to-meal-logging flow.

## Decision Log

- **27 Oct 2026:** Chose React Native + Expo as the client technology: well documented and long-lived, strong for agentic development (coding agents write TypeScript and React best), one codebase for iOS and Android, and Expo's tooling makes testing on a real phone easy.
- **27 Oct 2026:** Chose a relational database, Postgres, hosted on Supabase. Relational for data cohesion, and it scales to planetary size by sharding on user ID. Supabase because it's open source and self-hostable, so moving to our own servers or to AWS later stays possible.
- **28 Oct 2026:** Chose the codebase layout for MVP-slice-1: one Expo project at the repo root with Supabase inside, laid out so agents can work in parallel without touching the same files. A feature's code may span several folders, and data access sits in `src/lib/data/`, so Supabase stays replaceable. The Obytes template and Supabase's Expo example give ideas; the official docs decide ([layout](tech-stack.md#4-folders)).
- **28 Oct 2026:** Chose one real account for slice 1, made by hand and signed in once. A hard-wired user would need RLS off or the secret key in the app. An anonymous sign-in dies with a reinstall, orphaning its logs. Users still see no account features.
- **28 Oct 2026:** Chose GitHub Issues as the initial ticket logger, once feature work starts (Matt Pocock's flow). Until then, the setup guide's checklist.
