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
- `npm` Node Package Manager
  - `run check`: type check, then lint, then tests
  - `run lint`
  - `test`: all tests
  - `test -- day-screen`: only the test files whose name matches
- `docker`
  - `info`
  - `ps`: the running containers
