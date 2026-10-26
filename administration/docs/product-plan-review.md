# Product Plan — Council Review

**21 Oct 2026; round 1 answered 23–26 Oct.** Review of [product-plan.md](product-plan.md).
**Speaking:** Software Architect (mentor). **Consulted:** Dietitian Expert, Designer, Sales Expert.
Proposals only. Accepted ones move into the plan; this file shrinks until it can be deleted.

## Contents

1. [Round 1 outcome](#1-round-1-outcome)
2. [Top proposals](#2-top-proposals): all in the plan
3. [Data foundations](#3-data-foundations): one row left
4. [Behaviour and nutrition](#4-behaviour-and-nutrition): on hold
5. [UX](#5-ux): on hold
6. [Research you missed](#6-research-you-missed): on hold
7. [Decisions for you](#7-decisions-for-you): on hold
8. [Next steps](#8-next-steps)

## 1. Round 1 outcome

- **Confirmed:** I1–I9.
- **Moved into the plan:** P1 → [§10.1](product-plan.md#101-mvp-slices), P2 → [§9.1](product-plan.md#91-the-ai-extracts-code-scores), P3 → [§2.4](product-plan.md#24-habit-trends), P4 → [§4.2](product-plan.md#42-measuring-progress) in your words, P5 → [§3.5](product-plan.md#35-reminders) with your consent rule, the data foundations → [§9.2–9.3](product-plan.md#92-data-rules) with your additions.
- **Still open:** the usefulness scale (§3).
- **On hold for your next pass:** §4–7. N11 is new, from your satiety idea.

## 2. Top proposals

All five are in the plan now (§1).

## 3. Data foundations

One row left. It needs research, and your review of the whole scoring system, first:

| Topic | Proposal | Why |
| --- | --- | --- |
| Usefulness | Put every goal's usefulness on one scale (e.g. 0–100) before weighting | Otherwise the weights mean nothing. With factor 2, goal 1 always outweighs all lower goals combined: the strict priority you wanted |

## 4. Behaviour and nutrition

Already well supported, keep them: self-monitoring, your p26 pivot, is one of the best-evidenced techniques for weight change (Burke et al., J Am Diet Assoc 2011). Changing the food environment, your supply focus, beats relying on willpower (Wood, *Good Habits, Bad Habits*, 2019).

| ID | Notes say | Proposal | Start reading |
| --- | --- | --- | --- |
| N1 | Low carb is "best for fat loss" (p23) | Healthy low-carb and low-fat diets lost similar weight over a year; the deficit and adherence do the work. Offer low carb as a style some users prefer, and let the bodyweight goal carry fat loss | DIETFITS: Gardner et al., JAMA 2018 |
| N2 | hp macros (p27) | Protein 1.8 g/kg is inside the usual 1.6–2.2 range. Check fat against 20–35% of energy: 0.65 g/kg falls below 20% at high intakes. ≥ 100 g carbs is a floor, not a training target. The insulin → anabolism reason is weak once protein is adequate; fuelling training is the solid one | Morton et al., BJSM 2018; ISSN protein position stand, 2017 |
| N3 | +275 kcal ≈ +0.25 kg/week (p27) | Fine to start, but static rules drift. Let the observed bodyweight trend correct the calorie goal each week | Hall et al., Lancet 2011 |
| N4 | Fluctuations shouldn't discourage (p18) | Show a smoothed trend weight, not the raw number. A week of weights is too noisy for a trend, so the first expenditure estimate is the onboarding intake under your stable-weight assumption, refined over the next weeks | Walker, *The Hacker's Diet* |
| N5 | The onboarding week leaves habits unchanged (p24) | Logging alone changes behaviour (measurement reactivity). Good news for the core, but week 1 isn't a pure baseline | Search "self-monitoring reactivity" |
| N6 | Weekly commitments (p11) | Phrase each as an if-then plan on a habit's trigger: "When [trigger], I [new meal]". Strong evidence, and checkable from the logs, since a habit's identity is its trigger ([plan §2.4](product-plan.md#24-habit-trends)) | Gollwitzer & Sheeran, 2006 meta-analysis |
| N7 | Sales: objection handling, "compliance" (p10–11) | Use Motivational Interviewing as the backbone: users voice their own reasons and keep autonomy, matching "the user has the final say". NEPQ-style questions fit inside it. Say "agreement", not "compliance" | Miller & Rollnick, *Motivational Interviewing* |
| N8 | Visible results within a month (p0) | Habits take about two months on average to become automatic, with a wide range. Promise visibility and first changes in month 1, and time Maintenance later | Lally et al., Eur J Soc Psychol 2010 |
| N9 | Eating-disorder recovery as a longshot (p0) | Don't target it. Daily weighing and calorie focus can harm people with an eating-disorder history. Add a screening question and a stop-and-refer rule; no deficit for underweight users; adults only | — |
| N10 | Hydration is later (p0) | Log caloric drinks and alcohol as items from day 1; they're often whole habits (beer with friends). Water tracking stays later | — |
| N11 | Satiety = high volume + low calories; volume is the primary metric (23 Oct) | Right at its core: people tend to eat a fairly constant volume of food, so low energy density (kcal per gram) fills on fewer calories. But protein and fiber add satiety beyond volume, and drinks barely register. Store estimated grams per item as the practical volume proxy (food data is per 100 g); score satiety from energy density, protein and fiber. Your size scale is already a coarse volume scale | Rolls, *Volumetrics*; Holt et al., Eur J Clin Nutr 1995 (satiety index) |

## 5. UX

- **U1. Visible fallbacks for gestures.** Hold and tap-4× are hidden, and a one-time tutorial gets forgotten. Keep the fun, but tapping a bubble should open a sheet with visible Done and Dismiss buttons. Respect the OS "reduce motion" setting. Prototype 2–3 homepage variants before deciding (Matt's prototype step).
- **U2. Assumptions as removable chips.** Show a parsed log as chips (items, size, part of day, context); inferred chips look different from stated ones; tap × to delete. That's your "propose assumptions for deletion" with zero questions, the lowest-ComRisk default. Ask only when a missing detail changes the score.
- **U3. Logging speed is the metric.** A repeat meal in about two taps (common meals), a new one in one spoken sentence. Save instantly and parse in the background, so a slow AI never blocks logging.
- **U4. Names users understand.** "Limiting dietitian beliefs" → "boundaries" (in psychology, limiting beliefs are beliefs that hold a person back). "d.d.p." → "diet share", shown as plain "% of this week's calories", with no ×5 unit to learn.

## 6. Research you missed

| Area | Question |
| --- | --- |
| Prior work | What do Noom (psychology coaching), MacroFactor (adaptive expenditure, trend weight), Ate (photo journal without calories), MyFitnessPal or Cronometer, and photo-AI calorie apps do well and badly? Use 2–3 for a week |
| Language | Greek, English or both? Speech-to-text and LLM quality in Greek; Greek dishes |
| First users | Who first? Decides the language, the diets and which onboarding path to build first |
| Cost | Cost per active user per day (about 5 parses and 5 comments, plus the weekly analysis and session), before choosing models |
| History recall | How the app's AI recalls a user's history in a session: your open homework (agentic retrieval vs vector RAG) |
| Eating out | Shared plates (meze), restaurant portions |
| Session design | COM-B and the Behaviour Change Technique Taxonomy (Michie et al. 2013), to design sessions systematically |
| Diet-rule granularity | How a daily rule (g/kg/day) judges a single meal or a habit |

## 7. Decisions for you

**Architecture.** Per my persona, you answer first: your pick and why. Then I give mine and we grill.

| Decision | Options | Trade-offs |
| --- | --- | --- |
| Client | Native iOS (SwiftUI) · cross-platform (React Native/Expo, Flutter) · PWA | Native: best feel, home-screen widgets, on-device speech; Android means a second codebase. Cross-platform: one codebase, near-native; widgets need native code. PWA: fastest iteration, no app store; no home-screen widgets, and iOS push only after "Add to Home Screen" |
| Backend | Backend-as-a-service (e.g. Supabase) · own API (e.g. FastAPI, as in the README template) | BaaS: auth, storage and database on day 1; vendor coupling. Own API: full control and Python AI tooling; more to build and host |
| Database | Relational (Postgres, SQLite) · document (e.g. Firestore) | Relational: joins across events, habits and goals; schema migrations. Document: flexible and quick to start; queries across entities are harder |
| LLM | One provider · a thin abstraction over several; a model per job ([plan §9.1](product-plan.md#91-the-ai-extracts-code-scores)) | Simplicity vs swapping models per job on cost and quality |
| Offline | Offline-first (local store + sync) · online-only | Offline-first: logging never fails (metro, gym), but sync and conflicts to build. Online-only: simpler; a failed log is a lost log |

**Product** (my recommendation in brackets): how a habit's bodyweight effect is scored, open in [plan §11](product-plan.md#11-open-questions) [score bodyweight per day and week only for now; habits get d.d.p. and diet adherence].

## 8. Next steps

1. Answer §4–7 when you're ready.
2. Then run Matt's pipeline on MVP-slice-1: `grill with docs` → `to spec` → `to tickets` → `implement`. The grilling also starts the glossary.
3. Meanwhile, use 2–3 of the prior-work apps for a week.
