# Talk to Ira - React Native App

A clean, minimal chat application built with Expo and React Native for conversing with Ira, your AI companion.

## Features

- **Onboarding Flow**: Welcome screen with phone login or guest access
- **Mock Authentication**: 10-digit phone number + 6-digit OTP 
- **Chat Interface**: Clean message bubbles with auto-scroll
- **Message Limits**: Guests limited to 10 messages, logged-in users unlimited
- **Persistent Storage**: Chat history and login state saved with AsyncStorage
- **API Integration**: Connected to https://rumik-ai.vercel.app

## Tech Stack

- Expo (managed workflow)
- React Navigation (Stack + Modal)
- AsyncStorage
- Axios
- React Native Safe Area Context

## Installation

```bash
cd talk-to-ira
npm install
```

## Running the App

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

## Project Structure

```
talk-to-ira/
├── src/
│   ├── screens/
│   │   ├── WelcomeScreen.js
│   │   ├── PhoneLoginScreen.js
│   │   ├── OTPScreen.js
│   │   └── ChatScreen.js
│   └── components/
│       └── MessageLimitModal.js
├── App.js
└── app.json
```

## Design

- Background: #FCFAF7
- Primary: #000000
- Accent: #E5E0CD
- User Messages: #f4f0de
- Ira Messages: Black with cream text

