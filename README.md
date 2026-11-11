# AI-Powered Eating Habits

A mobile app that turns quick voice, text or photo logs into a clear weekly view of your eating habits, with an AI dietitian that helps you change them one small step at a time. A solo project, built to learn AI software engineering, maybe even produce money.

[Product plan](administration/docs/product-plan.md) · [Tech stack and codebase](administration/docs/tech-stack.md) 

## Building Log

What I did, week by week. Start date: 6 Oct 2026.

- **Weeks 1–2:** put all my ideas on paper to get a complete view of the project, even a basic homepage design. Transcribed them with Claude into a product plan.
- **Week 3:** rest, and review of the product plan details.
- **Week 4:** continued with long-term decisions, made the Weight Room wireframes and the voice-to-meal-logging flow. Also initialized react-native setup.
- **Week 5:** Learned react-native basics. ESLint, Prettier & Jest. Personal artistic preparations.
- **Week 6:** Supabase w/ Docker setup.

## Decision Log

- **27 Oct 2026:** Chose React Native + Expo as the client technology: well documented and long-lived, strong for agentic development (coding agents write TypeScript and React best), one codebase for iOS and Android, and Expo's tooling makes testing on a real phone easy.
- **27 Oct 2026:** Chose a relational database, Postgres, hosted on Supabase. Relational for data cohesion, and it scales to planetary size by sharding on user ID. Supabase because it's open source and self-hostable, so moving to our own servers or to AWS later stays possible.


Copyright © 2026 Odysseas Moschidis. All rights reserved.
