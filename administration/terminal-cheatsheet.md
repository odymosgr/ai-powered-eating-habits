# Connect Android Phone to Expo for Development
Oct 2026
1. Terminal, in the repo: `npx expo start`
1. Kill stale adb server: `adb kill-server`
1. Phone, Settings, Developer Options, Wireless Debugging -> Open & Pair Device with Pairing Code
1. In another Terminal `adb pair <ip>:<port>`, then type the code (all info from the pairing dialog). `adb devices` lists the devices if needed.
1. Phone: scan the QR code from step 1 with the camera

# Useful Commands
- `adb` Android Debug Bridge
  - `kill-server`
  - `devices`
  - `pair <ip>:<port>`
- `npx` Node Package eXecute
  - `expo start`
  - `supabase`
    - `status`
    - `stop`
    - `start`
    - `db pull <name>`: save Studio's changes as a migration
    - `db reset`: rebuild the database from the migrations (wipes the data)
    - `test new <name>`: a new test file in `supabase/tests/`
- `npm` Node Package Manager
  - `run check`: type check, then lint, then the app's tests
  - `run lint`
  - `test`: the app's tests (Jest)
  - `test -- day-screen`: only the app's test files whose name matches
  - `run test:db`: the database tests (pgTAP)
- `docker`
  - `info`
  - `ps`: the running containers
