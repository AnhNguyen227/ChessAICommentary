# Chess Commentary App — Project Specification

## Overview

A web-based chess platform where players can compete in unrated games against each other or Stockfish, with live AI-powered commentary and position evaluation. Built with the MERN stack, Socket.io, and the Claude API.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, `react-chessboard`, `chess.js` |
| Backend | Node.js, Express |
| Database | MongoDB (Atlas) |
| Real-time | Socket.io |
| Auth | Google OAuth (Passport.js) |
| Chess Engine | Stockfish (via `stockfish` npm package) |
| AI Commentary | ChatGPT API |
| Deployment | Docker → Railway / Render + MongoDB Atlas |

---

## User Types

### Guest
- No account required
- Can create or join rooms
- Can play vs Stockfish
- No match history saved
- Can optionally link a Chess.com username (session only, not persisted)

### Registered User
- Google OAuth login
- Persistent profile
- Match history saved
- Can link Chess.com account anytime from profile settings (cosmetic — displays Chess.com ELO as a badge)
- Macro analytics on match history

---

## Authentication

- **Google OAuth** via Passport.js
- Guest play is fully supported without login
- Chess.com account linking is optional and purely cosmetic
  - Can be done at any time from profile settings
  - Pulls and displays Chess.com ELO as a visual badge on the profile

---

## Game Modes

### Time Controls

| Category | Options |
|---|---|
| Blitz | 3 min, 3+2, 5 min |
| Rapid | 10 min, 15+10, 30 min |

No custom time controls. The host selects the time control when creating a room.

---

## Room System

### Main Menu
On entering the game section, the player is presented with two options:
- **Join a Room**
- **Create a Room**

---

### Creating a Room (Host)

1. Host selects a **time control**
2. Host selects a **color preference**: White, Black, or Random
3. Host is shown a **room link** with a **copy-to-clipboard** button
4. A **"Play vs Stockfish"** checkbox is available
   - If checked, a **difficulty slider** appears (Easy → Hard, mapping to Stockfish search depth)
   - Host can adjust the slider freely before starting
5. A **Start** button appears only when:
   - A human player has joined the room, **OR**
   - The Stockfish difficulty slider has been set
6. The game cannot start until one of the above conditions is met
7. Once a human player joins, the room is no longer joinable by others
8. **Room codes expire automatically after 10 minutes** of inactivity (no one joining)

**Host can discard the room at any time:**
- Before game starts → no match history recorded
- During a live game → counted as a **forfeit**

---

### Joining a Room (Away)

1. Away player enters a valid room link
2. A valid room is one that:
   - Is actively hosted by another player
   - Has not yet been filled (no opponent present, game not started)
3. Away player can see the host's chosen color and time control before the game starts
4. **Away can leave the room at any time:**
   - Before game starts → no match history recorded
   - During a live game → counted as a **forfeit**

---

### Terminology
- **Host** — the player who created the room
- **Away** — the player who joined the room

---

## Gameplay

### Board & Rules
- Standard chess rules via `chess.js`
- Full move validation on the client and server
- Standard draw conditions:
  - Stalemate
  - Insufficient material
  - Threefold repetition
  - 50-move rule
  - Draw by timeout (a player's flag falls with insufficient mating material on the other side)
- Draw by agreement: one player offers, the other accepts or declines; if declined, the game continues normally
- Resign button available at any time

### Color Assignment
- Host selects White, Black, or Random at room creation
- Color assignment is shown to the Away player in the lobby
- Color rules apply equally when playing vs Stockfish

### Disconnect Handling
- If either player disconnects mid-game → **auto-forfeit**
- No reconnection window; disconnected player is returned to the main menu

---

## Live Evaluation & AI Commentary

### Stockfish Evaluation
- Continuous position evaluation runs via Stockfish after every move
- Displayed as a **live eval bar** on the board UI

### AI Commentary (Claude API)
Commentary is triggered on **significant moments**, defined as:

| Trigger | Description |
|---|---|
| Opening moves | Commentary on the first few moves to set the scene |
| Eval shift ≥ ±1.0 pawn | A move significantly changes the position's assessment |
| Blunder / Brilliant move | Detected via large eval swings |
| Draw offer | Commentary reacts to the offer |
| Checkmate | Commentary on the game's conclusion |

**Commentary Style Prompt** — Players can optionally set a **commentary voice/style** before the game starts (e.g., *"Evaluate the game in the voice of an Englishman from the 1800s"*). This is injected into the Claude system prompt for the session.

---

## Results Screen

After a game ends (checkmate, forfeit, draw, timeout, resign), players are shown a **results screen** with:
- Outcome (Win / Loss / Draw)
- Method (Checkmate, Forfeit, Timeout, etc.)
- Time control and color played
- A **"Back to Menu"** button

No rematch option. Players must create a new room to play again.

---

## Match History (Registered Users Only)

- All completed games are saved to MongoDB
- Guests have no match history
- Each match record stores:
  - Date & time
  - Opponent (username or "Stockfish")
  - Time control
  - Color played
  - Result
  - Move list (PGN)

### Analytics Dashboard
High-level stats shown on the user profile:

| Stat | Description |
|---|---|
| Win % as White | Across all games |
| Win % as Black | Across all games |
| Win % by time control | Broken down per time control category |
| Total games played | Overall count |

No opening analysis or deep game breakdowns in v1.

---

## Profile Page

- Display name + avatar (from Google OAuth)
- Chess.com ELO badge (if linked)
- Match history table (filterable by result, time control)
- Analytics dashboard

---

## Deployment Architecture

```
[ React Frontend ]  →  Vercel / Netlify
[ Express Backend ] →  Docker → Railway / Render
[ MongoDB ]         →  MongoDB Atlas
[ Stockfish ]       →  Runs as child process on backend server
[ Claude API ]      →  Called from backend on commentary triggers
```

---

## Out of Scope (v1)

- Post-game analysis
- Opening explorer / book analysis
- ELO / rating system
- Tournaments or ladders
- Spectator mode
- Chat
- Rematch functionality

---

## Key Resume Talking Points

- **OAuth** authentication flow (Google)
- **WebSocket** architecture (Socket.io) for real-time game state
- **External API integrations** (Chess.com, Claude, Stockfish engine)
- **AI agent** with context-aware triggers (not just a chatbot)
- **MongoDB** data modeling for users, rooms, and match history
- **Dockerized** and cloud-deployable
- **Role-based UX** (Guest vs Authenticated user)
