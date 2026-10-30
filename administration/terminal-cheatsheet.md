# Connect Android Phone to Expo for Development
Oct 2026
1. Terminal, in the repo: `npx expo start`
2. Phone, Settings, Developer Options, Wireless Debugging -> Open & Pair Device with Pairing Code
3. In another Terminal `adb pair <ip>:<port>`, then type the code (all info from the pairing dialog). `adb devices` lists the devices if needed.
4. Phone: scan the QR code from step 1 with the camera
