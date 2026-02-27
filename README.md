# ♟️ CAIC — Chess with Live AI Commentary

A real-time chess platform where players compete in unrated games against each other or Stockfish, with live position evaluation and AI-powered commentary. Built with the MERN stack, Socket.io, and the Claude API.

> **Status:** 🚧 In active development

---

## Features

- **Play vs a Friend or Stockfish** — Create a room, share the link, and play. No account needed.
- **Live Eval Bar** — Stockfish evaluates the position after every move in real time.
- **AI Commentary** — Claude generates contextual commentary on significant moments (blunders, brilliant moves, checkmate, and more) in a customizable voice/style.
- **Google OAuth** — Optional sign-in to unlock match history and a persistent profile.
- **Chess.com Integration** — Link your Chess.com account to display your ELO as a profile badge.
- **Match History & Analytics** — Win rate by color and time control across all your games.
- **Multiple Time Controls** — Blitz (3min, 3+2, 5min) and Rapid (10min, 15+10, 30min).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, `react-chessboard`, `chess.js` |
| Backend | Node.js, Express |
| Database | MongoDB (Atlas) |
| Real-time | Socket.io |
| Auth | Google OAuth via Passport.js |
| Chess Engine | Stockfish |
| AI Commentary | Claude API (Anthropic) |
| Deployment | Docker, Railway, MongoDB Atlas |

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas connection string)
- Anthropic API key
- Google OAuth credentials

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/caic.git
cd caic

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### Environment Variables

Create a `.env` file in `/server`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
ANTHROPIC_API_KEY=your_anthropic_api_key
CLIENT_URL=http://localhost:5173
```

Create a `.env` file in `/client`:

```env
VITE_SERVER_URL=http://localhost:5000
```

### Running Locally

```bash
# Start the server (from /server)
npm run dev

# Start the client (from /client)
npm run dev
```

Client runs on `http://localhost:5173`, server on `http://localhost:5000`.

---

## Project Structure

```
caic/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── socket/         # Socket.io client setup
│   └── ...
├── server/                 # Express backend
│   ├── routes/             # REST API routes
│   ├── controllers/        # Route handlers
│   ├── models/             # Mongoose schemas
│   ├── socket/             # Socket.io event handlers
│   ├── services/           # Stockfish, Claude API integrations
│   └── ...
└── README.md
```

---

## How It Works

### Room Flow
1. Host creates a room, selects time control and color preference, and shares the generated link.
2. Away player joins via the link. Once joined, the room is closed to others.
3. Host starts the game. If playing vs Stockfish, a difficulty slider sets the engine depth.
4. Rooms expire automatically after **10 minutes** if unfilled.

### Commentary
AI commentary is triggered by significant game moments:
- Opening moves
- Eval shifts of ±1.0 pawn or more
- Draw offers
- Checkmate

Players can set a **commentary style** before the game (e.g. *"Commentate like an English gentleman from the 1800s"*).

### Guest vs Registered Users
| Feature | Guest | Registered |
|---|---|---|
| Create / Join rooms | ✅ | ✅ |
| Play vs Stockfish | ✅ | ✅ |
| Match history | ❌ | ✅ |
| Analytics dashboard | ❌ | ✅ |
| Chess.com ELO badge | ❌ | ✅ |

---

## Roadmap

- [x] Project spec & architecture
- [ ] Project scaffolding & repo setup
- [ ] Google OAuth & user model
- [ ] Room creation & Socket.io game loop
- [ ] Stockfish integration (eval bar + difficulty)
- [ ] Claude API commentary
- [ ] Match history & analytics
- [ ] Chess.com API linking
- [ ] Docker + cloud deployment

---

## License

MIT
