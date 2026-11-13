# Connect Android Phone to Expo for Development
Two paths. Pairing uses the IP and port from the pairing dialog; connecting uses the ones on the main Wireless Debugging screen.

## Path 1: Pair Only, to Open the App
1. Terminal, in the repo: `npx expo start`
1. Kill stale adb server: `adb kill-server`
1. Phone, Settings, Developer Options, Wireless Debugging -> Open & Pair Device with Pairing Code
1. In another Terminal `adb pair <ip>:<port>`, then type the code (all info from the pairing dialog; the IP in numbers, not the `.local` name)
1. Phone: scan the QR code from step 1 with the camera

## Path 2: Pair and Connect, to Install a New Build
1. Pair: steps 2 to 4 of path 1
1. `adb connect <ip>:<port>`, with the IP and port from the main Wireless Debugging screen
1. `adb devices` lists the phone as `device`. An `offline` entry means you used the pairing port: `adb disconnect`, then connect again
1. Only if app.json's plugins, icon or splash changed: `rm -rf android`, so it gets regenerated (it's generated and git-ignored)
1. In the repo: `npx expo run:android --device`, pick the phone, and wait for "Installing" and "Opening"

# Useful Commands
- `adb` Android Debug Bridge
  - `kill-server`
  - `devices`
  - `pair <ip>:<port>`
  - `connect <ip>:<port>`
- `npx` Node Package eXecute
  - `expo start`
  - `expo run:android --device`: build the native app, install it on the phone, start Metro
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
