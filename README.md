# Tic-Tac-Toe Frontend

This is a real-time multiplayer frontend for the Tic-Tac-Toe game, built using **React**, **TypeScript**, and **Vite**. It connects to the local Nakama server to handle authentication, matchmaking, and multiplayer interactions.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- npm (comes with Node.js)
- A running instance of the **Backend** Nakama server (see `../backend/README.md`)

## Getting Started

### 1. Install Dependencies

Navigate to this directory and install the required npm packages:

```bash
cd frontend
npm install
```

### 2. Start the Development Server

Start Vite's live-reloading dev server:

```bash
npm run dev
```

You can now open the app in your browser (usually at [http://localhost:5173](http://localhost:5173)). 

To test multiplayer logic locally, you can open the same URL in an **Incognito window** or a secondary browser.

## Project Structure

- `src/App.tsx`: Main application wrapper and React Router setup.
- `src/nakama.ts`: Instantiates the Nakama Client, socket connection, and holds session state.
- `src/screens/`:
  - `LoginScreen.tsx`: Handles Device ID-based account creation and login.
  - `MainMenuScreen.tsx`: Allows players to search the Matchmaker and view the Global Leaderboard.
  - `GameScreen.tsx`: Represents the server-authoritative multiplayer match, rendering the board and timers.
- `index.css`: Global styles and UI variables.

## Building for Production

To create a minified production build:

```bash
npm run build
```

This outputs static files into the `dist/` directory, which can then be deployed to services like Vercel, Netlify, or standard web hosting. You can preview the minified build at any time with:

```bash
npm run preview
```
