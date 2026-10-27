# Building & Decision Log

## Building Log

What I did, week by week. Start date: 6 Oct 2026.

- **Weeks 1–2:** put all my ideas on paper to get a complete view of the project, even a basic homepage design. Transcribed them with Claude into a product plan.
- **Week 3:** rest, and review of the product plan details.
- **Week 4:** continued with long-term decisions, made the Weight Room wireframes and the voice-to-meal-logging flow.

## Decision Log

- **27 Oct 2026:** Chose React Native + Expo as the client technology: well documented and long-lived, strong for agentic development (coding agents write TypeScript and React best), one codebase for iOS and Android, and Expo's tooling makes testing on a real phone easy.
- **27 Oct 2026:** Chose a relational database, Postgres, hosted on Supabase. Relational for data cohesion, and it scales to planetary size by sharding on user ID. Supabase because it's open source and self-hostable, so moving to our own servers or to AWS later stays possible.
