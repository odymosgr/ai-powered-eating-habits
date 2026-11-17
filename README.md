# AI-Powered Eating Habits

A mobile app that turns quick voice, text or photo logs into a clear weekly view of your eating habits, with an AI dietitian that helps you change them one small step at a time. A solo project, built to learn AI software engineering, maybe even produce money.

[Product plan](docs/product-plan.md) · [Tech stack and codebase](docs/tech-stack.md) 

## Building Log

What I did, week by week. Start date: 6 Oct 2026.

- **Weeks 1–2:** put all my ideas on paper to get a complete view of the project, even a basic homepage design. Transcribed them with Claude into a product plan.
- **Week 3:** rest, and review of the product plan details.
- **Week 4:** continued with long-term decisions, made the Weight Room wireframes and the voice-to-meal-logging flow. Also initialized react-native setup.
- **Week 5:** Learned react-native basics. ESLint, Prettier & Jest. Personal artistic preparations.
- **Week 6:** Supabase w/ Docker setup. More learning react-native & supabase. Basic sign-in screen.
- **Week 7:** Matt Pocock's Skills: Introduction, Set-Up

## Decision Log

Copied from [docs/adr/](docs/adr/), the source of truth.

- **27 Oct 2026, [React Native and Expo for the client](docs/adr/0001-react-native-and-expo.md):** We build the app with React Native and Expo, so one TypeScript codebase serves both iOS and Android. Both are well documented and long-lived, coding agents write TypeScript and React best, and Expo's tooling makes testing on a real phone easy.
- **27 Oct 2026, [Postgres on Supabase](docs/adr/0002-postgres-on-supabase.md):** Our data lives in Postgres, a relational database hosted on Supabase, instead of a document store like Firebase's Firestore. Postgres checks every write, which matters when an LLM and coding agents make the riskiest writes, and it reaches planetary scale by sharding on user ID, since no daily query reads across users. Supabase is open source and self-hostable, so moving to our own servers or to AWS later stays possible. We'd reconsider if offline logging became a hard requirement.
- **27 Oct 2026, [Online only](docs/adr/0003-online-only.md):** The app needs a connection to work: offline-first, where the phone keeps its own copy of the data and syncs it later, costs too much for a first app. A small outbox on the phone still retries a log sent on bad signal, so nothing is lost.


Copyright © 2026 Odysseas Moschidis. All rights reserved.
