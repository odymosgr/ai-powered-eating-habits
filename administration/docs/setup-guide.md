# Setup Guide

**28 Oct 2026.** From your Mac as it is today to a walking skeleton: your phone signs in and logs a bodyweight through every layer of the [codebase](tech-stack.md#4-folders), with checks and CI around it. Each step has:

- **Do:** what you run and build.
- **Borrow:** what to take from the references, and nothing more.
- **Check:** how to see for yourself that it works.

Commands were checked against the official docs on 28 Oct 2026. Open each step's docs first anyway: Expo and Supabase change often. When a step's checks pass, tick it and commit it.

## Progress

- [ ] [0. Tools on your Mac](#0-tools-on-your-mac)
- [ ] [1. The Expo app, inside the repo](#1-the-expo-app-inside-the-repo)
- [ ] [2. The app on your phone](#2-the-app-on-your-phone)
- [ ] [3. First screen, the Obytes way](#3-first-screen-the-obytes-way)
- [ ] [4. One command checks everything](#4-one-command-checks-everything)
- [ ] [5. Supabase on your Mac](#5-supabase-on-your-mac)
- [ ] [6. First table, locked down and tested](#6-first-table-locked-down-and-tested)
- [ ] [7. The phone signs in](#7-the-phone-signs-in)
- [ ] [8. Tracer bullet: log your weight](#8-tracer-bullet-log-your-weight)
- [ ] [9. First Edge Function](#9-first-edge-function)
- [ ] [10. The cloud project](#10-the-cloud-project)
- [ ] [11. CI on GitHub](#11-ci-on-github)

## 0. Tools on your Mac

Already installed: Homebrew, git, Docker Desktop, Android Studio with Android SDK 36, and JDK 21. Missing: Node. Your `gh` login has expired. Watchman isn't needed since SDK 56.

**Do**

1. Node, through fnm. fnm switches to the version in a repo's `.nvmrc` when you `cd` into it.
   ```bash
   brew install fnm
   ```
   Add `eval "$(fnm env --use-on-cd --shell zsh)"` to `~/.zshrc`, open a new terminal, then:
   ```bash
   fnm install 26
   fnm default 26
   ```
2. Android tools on your PATH: add these three lines from the Expo docs to `~/.zshrc`.
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
3. On the phone:
   1. Settings → About phone: tap **Build number** seven times. The path varies by brand.
   2. In Developer options, turn on **USB debugging**.
   3. Connect the phone with a USB data cable and allow debugging when it asks.
4. Run `gh auth login`.
5. Open Docker Desktop once. Supabase runs in it.

**Check**, in a new terminal:

```bash
node -v          # v26.x
adb devices      # your phone, marked "device"
gh auth status   # logged in to github.com
docker info      # server details, no error
```

**Docs:** [Expo: set up your environment][expo-env] · [fnm](https://github.com/Schniz/fnm)

## 1. The Expo app, inside the repo

`create-expo-app` refuses a folder that already holds files. So it builds the app in a subfolder, and you move the app up.

**Do**, from the repo root:

```bash
echo 26 > .nvmrc
npx create-expo-app@latest eating-habits --template default@sdk-58 --no-install --no-agents-md
rm -f eating-habits/LICENSE
rsync -a --ignore-existing eating-habits/ ./
rm -rf eating-habits
npm install
npm run reset-project
```

- `--template default@sdk-58`: `@latest` alone still makes an SDK 57 app, until Expo Go supports SDK 58.
- `--no-agents-md`: skips Expo's agent files. We keep our own `AGENTS.md`.
- `rm -f eating-habits/LICENSE`: that file is the template's open-source licence. This repo is all rights reserved ([README](../../README.md)).
- `--ignore-existing`: keeps our `README.md`.
- `reset-project`: answer **n**, so the example app is deleted. It stays readable in [Expo's repo](https://github.com/expo/expo/tree/sdk-58/templates/expo-template-default). Then delete the `reset-project` line from `package.json`.

**Borrow:** nothing yet. The Expo template is the base.

**Check**

- `git status` lists new files (`src/`, `app.json`, `package.json`, `.gitignore`…). `README.md`, `AGENTS.md` and `administration/` are unchanged.
- `npx expo-doctor` passes all its checks.

**Docs:** [Expo: create a project](https://docs.expo.dev/get-started/create-a-project/)

## 2. The app on your phone

A development build is your own Expo Go. It holds the app's native code, is installed once, and loads your TypeScript from the Mac ([tech-stack.md §1](tech-stack.md#1-the-picture)). You build it on your Mac, since Android Studio is already there, so you need no Expo account.

**Do**, with the phone connected:

```bash
npx expo install expo-dev-client
npx expo run:android --device
```

- Pick your phone from the list. The first build takes several minutes.
- When asked for an Android package name, choose one like `com.odysseas.eatinghabits`. It only becomes permanent once the app is on the Play Store.
- From then on, run `npx expo start` and open the app, with the phone and the Mac on the same Wi-Fi. Rebuild with `run:android` only after adding a library that has native code.
- If Gradle fails on a Java version: the docs use JDK 17. Install it with `brew install --cask zulu@17`, then build with `JAVA_HOME=$(/usr/libexec/java_home -v 17) npx expo run:android --device`. Your global JDK 21 stays as it is.

**Check**

- The phone shows "Edit src/app/index.tsx to edit this screen."
- Change that text and save: the phone updates within about a second.
- Shake the phone: the developer menu opens.
- An `android/` folder now exists, and git ignores it. Expo generates it from `app.json`.

**Docs:** [Expo: set up your environment][expo-env] (Android device · development build · build locally) · [Start developing](https://docs.expo.dev/get-started/start-developing/)

## 3. First screen, the Obytes way

Route files stay one line; screens live in their feature ([tech-stack.md §4](tech-stack.md#4-folders)).

**Do**

- Create `src/features/day/day-screen.tsx`, with a `DayScreen` component that shows "Today".
- Replace `src/app/index.tsx` with one line:
  ```tsx
  export { DayScreen as default } from '@/features/day/day-screen';
  ```

**Borrow:** two Obytes files: [a one-line route][obytes-route] and [the feed feature folder][obytes-feed]. Take the pattern only: no Tailwind, no Zustand.

**Check**

- The phone shows "Today".
- Rename the export in `day-screen.tsx` only: the phone shows an error about the missing export. Undo it.

**Docs:** [Expo Router: core concepts](https://docs.expo.dev/router/basics/core-concepts/)

## 4. One command checks everything

The command every agent runs before calling work done ([tech-stack.md §5](tech-stack.md#5-working-with-agents)).

**Do**

```bash
npx expo lint
npx expo install prettier eslint-config-prettier eslint-plugin-prettier --dev
npx expo install jest-expo jest @types/jest @testing-library/react-native --dev
```

- `expo lint` installs ESLint and writes `eslint.config.js`. Add Prettier to it as the ESLint docs show.
- In `package.json`, add `"jest": { "preset": "jest-expo" }` and these scripts:
  ```json
  "type-check": "tsc --noEmit",
  "test": "jest",
  "check": "npm run type-check && npm run lint && npm run test"
  ```
- Write `src/features/day/day-screen.test.tsx`. It renders `DayScreen` and finds "Today".
- `tsc` needs `expo-env.d.ts`, which the dev server writes. You've run the dev server since step 2.

**Borrow:** from Obytes, [the scripts in `package.json`][obytes-package] (`type-check`, `check-all`) and [a test beside its component][obytes-test].

**Check**

- `npm run check` passes.
- Break it three ways, one at a time:
  1. A type error, such as `const n: number = 'a'`.
  2. Messy formatting.
  3. A wrong expected text in the test.

  Each one makes `npm run check` fail with a message pointing at the line. Undo each, and it passes again. `npx expo lint --fix` fixes formatting for you.

**Docs:** [ESLint and Prettier](https://docs.expo.dev/guides/using-eslint/) · [Unit testing with Jest](https://docs.expo.dev/develop/unit-testing/)

## 5. Supabase on your Mac

**Do**, with Docker Desktop running:

```bash
npm install supabase --save-dev
npx supabase init
npx supabase start
```

- The CLI is a dev dependency, so every worktree and CI use the same version, through `npx supabase`.
- `init` creates `supabase/`. Answer no to the editor-settings questions.
- The first `start` downloads the services, which takes several minutes.

**Check**

- `npx supabase status` shows:
  - the API on port 54321;
  - the database on port 54322;
  - Studio on port 54323;
  - two keys, `sb_publishable_…` and `sb_secret_…`.
- Studio, at http://127.0.0.1:54323, shows an empty database.
- `npx supabase stop`, then `start` again: fast this time.

**Docs:** [Supabase CLI: getting started](https://supabase.com/docs/guides/local-development/cli/getting-started). It suggests OrbStack over Docker Desktop on a Mac; Docker Desktop works too.

## 6. First table, locked down and tested

The `bodyweights` table: the simplest slice-1 table, and the pattern every table copies.

**Do**

```bash
npx supabase migration new create_bodyweights
npx supabase test new bodyweights_rls.test
```

- **The migration** follows the guardrails that apply here ([database-analysis.md §6](database-analysis.md#6-proposal), 3 and 10–11):
  - `user_id` on every row, and first in its index;
  - explicit grants to `authenticated`;
  - RLS, with one policy per action;
  - a range check on the weight.

  The one-per-day rule and the edit window ([plan §3.1](product-plan.md#31-bodyweight)) come with the bodyweight feature.
- **The test** (pgTAP):
  - you see and add your own rows;
  - a second user sees none of them and can't change them;
  - a signed-out request gets nothing.
- **Folder rules:** write the database rules in `supabase/AGENTS.md`, beside a `supabase/CLAUDE.md` holding `@AGENTS.md` ([tech-stack.md §5](tech-stack.md#5-working-with-agents)).
- **Script:** add `"test:db": "supabase test db"` to `package.json`.

Then rebuild the local database from the migrations and run the test:

```bash
npx supabase db reset
npm run test:db
```

**Borrow:**

- the two-user RLS test in Supabase's [testing overview][sb-testing];
- the shape of a policy from the Supabase example's [migration][sb-sql].

**Check**

- Studio shows the table, with RLS enabled.
- `npm run test:db` reports all tests successful.
- Remove the select policy, then run `db reset` and the test again: the test fails. Restore the policy.

## 7. The phone signs in

**Do**

```bash
npx expo install @supabase/supabase-js react-native-url-polyfill expo-sqlite
npx expo run:android --device
```

- **Rebuild:** `expo-sqlite`, which stores the session, has native code, so the app is rebuilt once.
- **`.env.local`** (git ignores it) gets the values from `npx supabase status`:
  ```bash
  EXPO_PUBLIC_SUPABASE_URL=http://<your Mac's IP>:54321
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
  ```
  - Use the Mac's IP, not `127.0.0.1`: on the phone, `127.0.0.1` is the phone itself. `ipconfig getifaddr en0` prints the Mac's IP.
  - Restart `npx expo start` after editing the file.
- **`src/lib/supabase.ts`:** the quickstart's client, the only place one is created. Enforce it with a lint rule (`no-restricted-imports`): only `src/lib/` may import `@supabase/supabase-js`.
- **`src/lib/auth.ts`:** sign in, sign out, and the current session.
- **Sign-ups off:**
  1. Set `enable_signup = false` under `[auth]` in `supabase/config.toml`.
  2. Restart the stack with `npx supabase stop && npx supabase start`.
  3. Add your user in Studio → Authentication.
- **Sign-in screen:**
  - `src/features/auth/sign-in-screen.tsx`, with a one-line route, `src/app/sign-in.tsx`;
  - `src/app/_layout.tsx` keeps signed-out users on that screen with `Stack.Protected`.

**Borrow:**

- the client from the [Supabase quickstart][sb-quickstart];
- the sign-in call from the Supabase example's [`Auth.tsx`][sb-auth];
- the auth feature folder from [Obytes][obytes-auth];
- the screen guard from [Expo Router's authentication docs](https://docs.expo.dev/router/advanced/authentication/), which are newer than Obytes' redirect.

**Check**

- A wrong password shows an error. The right one opens the day screen.
- Close the app fully and reopen it: you're still signed in.
- Import `@supabase/supabase-js` in `day-screen.tsx`: `npm run lint` fails. Undo it.
- If the phone can't connect: are the phone and the Mac on the same Wi-Fi? Is the macOS firewall blocking it?

**Docs:** [Environment variables in Expo](https://docs.expo.dev/guides/environment-variables/)

## 8. Tracer bullet: log your weight

A tracer bullet is Matt's term for the thinnest slice through every layer, proving the layers connect. The bodyweight feature grows from it.

**Do**

```bash
npx expo install @tanstack/react-query
npx supabase gen types typescript --local > src/lib/data/database.types.ts
```

- **Types script:** save the type generation as a script, `gen:types`, and rerun it after every migration.
- **`src/lib/data/bodyweight.ts`:** save and list, as plain functions that return our own types.
- **`src/app/_layout.tsx`:** add the query client provider.
- **`src/features/bodyweight/`:**
  - its hooks, in `api.ts`;
  - a bare screen: a number field, a Save button and today's entries.

**Borrow:** two Obytes files:

- [the provider][obytes-provider];
- [the hooks in `feed/api.ts`][obytes-api]. Ours call `src/lib/data/` instead of axios.

**Check**

- Save 80.5: it shows in the list, and in Studio with your user ID.
- Save 5000: the database refuses it, and the screen says so.
- In airplane mode, Save fails visibly. The app is online-only ([plan §9.4](product-plan.md#94-stack)).

**Docs:** [Generating types](https://supabase.com/docs/guides/api/rest/generating-types) · [TanStack Query in React Native](https://tanstack.com/query/latest/docs/framework/react/react-native)

## 9. First Edge Function

**Do**

```bash
npx supabase functions new parse-log
npx supabase functions serve parse-log
```

- **Thin wrapper:** `index.ts` only wraps a plain module beside it (guardrail 13). For now, the module echoes back the words it receives.
- **The risk from [tech-stack.md §4](tech-stack.md#4-folders):** import a type from `src/shared/` into that module. If the import fails here or at deploy (step 10), move `src/shared/` to `supabase/functions/_shared/`.

**Check**

- Call the function with the `curl` command from the quickstart, using your publishable key: your words come back as JSON.
- Change the reply and call again: the change shows without a restart.

**Docs:** [Edge Functions quickstart](https://supabase.com/docs/guides/functions/quickstart)

## 10. The cloud project

**Do**

1. At supabase.com, create a free project in an EU region near you, such as Frankfurt. Moving it later is hard.
2. Connect the repo to it and push the schema and the function:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project ref>
   npx supabase db push
   npx supabase functions deploy parse-log
   ```
3. In the dashboard: Authentication → turn off new sign-ups, then add your user.
4. In `.env.local`, use the cloud URL and publishable key from Project Settings → API Keys. Restart `npx expo start`.

**Check**

- With Wi-Fi off, on mobile data, sign in and log a weight. The row appears in the dashboard's Table Editor.
- The Security Advisor shows no errors.

**Docs:** [Managing environments](https://supabase.com/docs/guides/deployment/managing-environments)

## 11. CI on GitHub

**Do:** add `.github/workflows/check.yml`. It runs on every pull request and every push to `main`, with two jobs:

- `check`:
  1. check out the repo;
  2. `actions/setup-node`, with `node-version-file: .nvmrc`;
  3. `npm ci`;
  4. `npm run check`.
- `db`:
  1. check out the repo;
  2. set up Node the same way;
  3. `npm ci`;
  4. `npx supabase db start`;
  5. `npm run test:db`.

If `type-check` fails in CI on missing Expo types, generate them first with `npx expo customize tsconfig.json` ([TypeScript docs](https://docs.expo.dev/guides/typescript/)).

**Borrow:**

- Obytes' [workflows][obytes-ci]: lint, type check and test merge into our one `check` job;
- the workflow in Supabase's [testing overview][sb-testing].

**Check**

- Push a branch and open a pull request: both jobs pass.
- Push a commit that breaks a test: the job fails, and its log shows the test. Revert it: both jobs pass.

## After setup

- **Feature work starts by grilling the log thread.** GitHub Issues log its tickets ([decision log](building-log.md#decision-log)).
- **The 2-week test needs a release build:** one that runs without your Mac, against the cloud project. It's a ticket near the end of slice 1.

[expo-env]: https://docs.expo.dev/get-started/set-up-your-environment/?platform=android&device=physical&mode=development-build&buildEnv=local
[sb-quickstart]: https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native
[sb-testing]: https://supabase.com/docs/guides/local-development/testing/overview
[sb-auth]: https://github.com/supabase/supabase/blob/2a8dc75e3d89f590cdc427a1f65273c910508575/examples/user-management/expo-user-management/components/Auth.tsx
[sb-sql]: https://github.com/supabase/supabase/blob/2a8dc75e3d89f590cdc427a1f65273c910508575/examples/user-management/expo-user-management/supabase/migrations/20240403090422_init.sql
[obytes-route]: https://github.com/obytes/react-native-template-obytes/blob/fd9b358ed11913d2a49fd9ffa6582fe03ba130e7/src/app/feed/%5Bid%5D.tsx
[obytes-feed]: https://github.com/obytes/react-native-template-obytes/tree/fd9b358ed11913d2a49fd9ffa6582fe03ba130e7/src/features/feed
[obytes-package]: https://github.com/obytes/react-native-template-obytes/blob/fd9b358ed11913d2a49fd9ffa6582fe03ba130e7/package.json
[obytes-test]: https://github.com/obytes/react-native-template-obytes/blob/fd9b358ed11913d2a49fd9ffa6582fe03ba130e7/src/components/ui/button.test.tsx
[obytes-auth]: https://github.com/obytes/react-native-template-obytes/tree/fd9b358ed11913d2a49fd9ffa6582fe03ba130e7/src/features/auth
[obytes-provider]: https://github.com/obytes/react-native-template-obytes/blob/fd9b358ed11913d2a49fd9ffa6582fe03ba130e7/src/lib/api/provider.tsx
[obytes-api]: https://github.com/obytes/react-native-template-obytes/blob/fd9b358ed11913d2a49fd9ffa6582fe03ba130e7/src/features/feed/api.ts
[obytes-ci]: https://github.com/obytes/react-native-template-obytes/tree/fd9b358ed11913d2a49fd9ffa6582fe03ba130e7/.github/workflows
