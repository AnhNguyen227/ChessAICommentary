# CAIC — Chess with Live AI Commentary

A real-time chess platform where players compete in unrated games against each other or Stockfish, with live position evaluation and AI-powered commentary. Built with the MERN stack, Socket.IO, and the Google Gemini API.

---

## Features

- **Play vs a Friend or Stockfish** — Create a room, share the Match ID, and play. No account needed.
- **Live Eval Bar** — Stockfish (depth 15) evaluates the position after every move in real time.
- **AI Commentary** — Gemini 2.5 Flash generates contextual 1–2 sentence commentary on significant moments (openings, blunders, brilliant moves, eval shifts, checkmate) in a customizable voice/style.
- **Google OAuth** — Optional sign-in to unlock match history and a persistent profile.
- **Chess.com Integration** — Link your Chess.com account to display your ELO in the lobby and on your profile.
- **Match History & Analytics** — Win rate, draw rate, and game count across all your games.
- **Multiple Time Controls** — Blitz (3 min, 3+2, 5 min) and Rapid (10 min, 15+10, 30 min).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, `react-chessboard`, `chess.js` |
| Backend | Node.js, Express 5, TypeScript |
| Database | MongoDB Atlas |
| Real-time | Socket.IO |
| Auth | Google OAuth 2.0 via Passport.js |
| Chess Engine | Stockfish 16.1 (UCI protocol, two processes per room) |
| AI Commentary | Google Gemini API (`gemini-2.5-flash`) |
| Deployment | Render (backend), Vercel (frontend) |

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas connection string)
- Google Gemini API key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey))
- Google OAuth credentials ([console.cloud.google.com](https://console.cloud.google.com))
- Stockfish binary placed in `server/engines/`
  - Windows: download `stockfish.exe` from [stockfishchess.org](https://stockfishchess.org/download/)
  - Linux/Mac: download the appropriate binary and name it `stockfish`

### Installation

```bash
git clone https://github.com/AnhNguyen227/ChessAICommentary.git
cd ChessAICommentary

cd server && npm install
cd ../client && npm install
```

### Environment Variables

`server/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=any_long_random_string
CLIENT_URL=http://localhost:5173
STOCKFISH_PATH=./engines/stockfish.exe
GEMINI_API_KEY=your_gemini_api_key
```

`client/.env`:
```env
VITE_SERVER_URL=http://localhost:5000
```

### Running Locally

```bash
# From /server
npm run dev

# From /client
npm run dev
```

Client: `http://localhost:5173` · Server: `http://localhost:5000`

---

## Project Structure

```
ChessAICommentary/
├── client/                 # React frontend (Vite)
│   └── src/
│       ├── components/     # Game UI (GameMenu, GameLobby, GameBoard, GameResult)
│       ├── pages/          # Route-level pages (Login, Dashboard, Profile)
│       ├── context/        # GameContext, AuthContext
│       └── socket/         # Socket.IO client setup
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # REST API routes (auth, chess-com)
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Mongoose schemas (User, Game)
│   │   ├── socket/         # Socket.IO event handlers & game loop
│   │   ├── services/       # Stockfish & Gemini integrations, room store
│   │   ├── config/         # DB connection, Passport OAuth setup
│   │   └── middleware/     # requireAuth
│   └── engines/            # Stockfish binary (gitignored)
└── README.md
```

---

## How It Works

### Room Flow
1. Host creates a room, selects time control, color, and AI settings.
2. Away player joins via the Match ID. Once joined, the room is closed to others.
3. Host starts the game from the lobby.
4. Rooms expire automatically after **10 minutes** if unfilled.

### Commentary
Gemini 2.5 Flash is triggered by significant moments after each move:

| Trigger | Condition |
|---|---|
| `opening` | First 6 moves of the game |
| `brilliant` | Eval swing ≥ +2.0 pawns |
| `blunder` | Eval swing ≥ −2.0 pawns |
| `eval_shift` | Eval swing ≥ ±0.5 pawns |
| `checkmate` | Game ends in checkmate |

Players can set a **commentary style** before the game (e.g. *"Commentate like an English gentleman from the 1800s"*).

### Stockfish Architecture
Two separate Stockfish processes run per room:

- **Opponent process** — skill-limited (level 0–20) for move generation when playing vs Stockfish
- **Eval process** — full-strength (depth 15) for accurate position evaluation and commentary triggers

This ensures the eval bar and commentary reflect objective board truth, not the handicapped engine's assessment.

### Guest vs Registered Users

| Feature | Guest | Registered |
|---|---|---|
| Create / Join rooms | ✅ | ✅ |
| Play vs Stockfish | ✅ | ✅ |
| Match history | ❌ | ✅ |
| Analytics dashboard | ❌ | ✅ |
| Chess.com ELO display | ❌ | ✅ |

---

## Deployment

The app is deployed with a split architecture:

- **Backend** — [Render](https://render.com) (free tier, Node web service)
  - Build: `npm install && npm run build` (downloads Stockfish Linux binary automatically)
  - Start: `npm start`
- **Frontend** — [Vercel](https://vercel.com) (free tier)
  - Root directory: `client`, auto-detected as Vite

---

## License

MIT
