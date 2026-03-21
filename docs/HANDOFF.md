# CAIC — Handoff Document
> Use this to resume the project in a new chat. Paste this file and say: "I'm building CAIC, a MERN chess app. Here's my handoff doc — let's continue where we left off."

---

## What CAIC Is
A real-time chess platform where players compete in unrated games against each other or Stockfish, with live Stockfish evaluation and AI commentary via the Claude API. Built with MERN + Socket.io + TypeScript.

---

## Tech Stack
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + react-chessboard@5.x + chess.js
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB Atlas + Mongoose
- **Real-time:** Socket.io
- **Auth:** Google OAuth via Passport.js + connect-mongo
- **Chess Engine:** Stockfish (npm package, runs on backend)
- **AI Commentary:** ChatGPT API

---

## Project Structure
```
CAIC/
├── client/                        # Vite + React + TypeScript
│   ├── src/
│   │   ├── components/game/
│   │   │   ├── GameMenu.tsx       # ✅ Done
│   │   │   ├── GameLobby.tsx      # ✅ Done
│   │   │   ├── GameBoard.tsx      # ✅ Done
│   │   │   └── GameResult.tsx     # ✅ Done
│   │   ├── context/
│   │   │   ├── AuthContext.tsx    # ✅ Done
│   │   │   └── GameContext.tsx    # ✅ Done
│   │   ├── pages/
│   │   │   ├── Home.tsx           # ✅ Done
│   │   │   ├── Dashboard.tsx      # ✅ Placeholder
│   │   │   ├── Game.tsx           # ✅ Done
│   │   │   └── NotFound.tsx       # ✅ Done
│   │   ├── socket/index.ts        # ✅ Done
│   │   ├── App.tsx                # ✅ Done
│   │   └── main.tsx               # ✅ Done
│   ├── .env
│   └── vite.config.ts
│
└── server/                        # Express + TypeScript
    ├── src/
    │   ├── config/
    │   │   ├── db.ts              # ✅ Done
    │   │   └── passport.ts        # ✅ Done
    │   ├── controllers/
    │   │   └── authController.ts  # ✅ Done
    │   ├── middleware/
    │   │   └── requireAuth.ts     # ✅ Done
    │   ├── models/
    │   │   ├── User.ts            # ✅ Done
    │   │   └── Game.ts            # ✅ Done
    │   ├── routes/
    │   │   └── auth.ts            # ✅ Done
    │   ├── services/
    │   │   └── roomStore.ts       # ✅ Done
    │   ├── socket/
    │   │   └── index.ts           # ✅ Done
    │   └── index.ts               # ✅ Done
    ├── tsconfig.json
    └── package.json
```

---

## What's Done
- ✅ Server scaffolded with Express + TypeScript
- ✅ MongoDB connected via Mongoose
- ✅ Google OAuth working end to end (sessions persist in MongoDB)
- ✅ Auth context on client (rehydrates login state on refresh)
- ✅ User model + Game model
- ✅ Socket.io room lifecycle (create, join, leave, discard, start)
- ✅ Game loop (moves, clocks, resign, draw offer/accept/decline, forfeit on disconnect)
- ✅ Client game context (GameContext.tsx) wired to all socket events
- ✅ Game UI components (GameMenu, GameLobby, GameBoard, GameResult) — unstyled

---

## What's Left (In Order)

### 🟡 Next Up — Room expiry
Add 10-minute auto-expiry in `server/src/socket/index.ts` inside the `room:create` handler:
```typescript
setTimeout(async () => {
  const room = getRoom(roomId);
  if (room && room.game.status === "waiting") {
    await Game.findOneAndDelete({ roomId });
    deleteRoom(roomId);
  }
}, 10 * 60 * 1000);
```

### 🟡 Next Up — Stockfish integration
- Install `stockfish` on the server: `npm install stockfish`
- Create `server/src/services/stockfish.ts`
- Stockfish runs as a child process, communicates via UCI protocol
- After each move in `socket/index.ts`, send position to Stockfish, get eval back, emit `game:eval` to clients
- For Stockfish games, after the player's move, get Stockfish's response move and emit it as `game:move`

### 🟡 Next Up — ChatGPT commentary
- Add `OPENAI_API_KEY` to `/server/.env`
- Create `server/src/services/commentary.ts`
- Trigger commentary on: opening moves, eval shift ≥ ±1.0, checkmate, draw offers
- Players can set a commentary style string before the game (injected into ChatGPT system prompt)
- Emit `game:commentary` event to clients with the generated text

### 🟡 Next Up — Match history & analytics
- Add routes: `GET /api/games` (user's game history), `GET /api/stats` (win rate analytics)
- Create `server/src/routes/games.ts` and `server/src/controllers/gamesController.ts`
- Dashboard page on client shows match history table + win % by color and time control

### 🟡 Next Up — Chess.com linking
- `PUT /auth/chess-com` route already exists in `authController.ts`
- Add profile settings UI on client to enter Chess.com username
- Display Chess.com ELO badge on profile

### 🟡 Next Up — Styling
- All game components are functional but completely unstyled
- Use Tailwind to style: dark chess theme, clean board UI, timer display, lobby, result screen

### 🟡 Last — Deployment
- Dockerize server and client
- Deploy server to Railway or Render
- Deploy client to Vercel
- Point to MongoDB Atlas (already set up)

---

## Key Env Variables

### `/server/.env`
```env
PORT=5000
MONGO_URI=<atlas connection string>
GOOGLE_CLIENT_ID=<from google cloud console>
GOOGLE_CLIENT_SECRET=<from google cloud console>
SESSION_SECRET=<random 32 byte hex>
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=<openai api key>
```

### `/client/.env`
```env
VITE_SERVER_URL=http://localhost:5000
```

---

## Key Decisions Made
- Games are **unrated** — no ELO system
- Guests can play but have no match history
- Disconnect = auto forfeit, no reconnection
- Room codes expire after 10 minutes
- Move validation is **server-side** (chess.js on server)
- Commentary triggers: opening moves, eval shift ≥ ±1.0, checkmate, draw offers
- No post-game analysis in v1
- No rematch — players create a new room
- Stockfish difficulty = search depth (1-20)
- Chess.com linking is cosmetic only (shows ELO badge)

---

## Git
- Repo has `main` and `dev` branches
- Work on feature branches, merge to `dev`
- Conventional commits: `feat:`, `fix:`, `chore:`
- Last commit: `feat: implement Socket.io room and game logic with clock management`
