import { useState } from "react";
import { Chessboard } from "react-chessboard";
import { useGame } from "../../context/GameContext";
import { useAuth } from "../../context/AuthContext";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const TIME_CONTROLS = [
  { key: "blitz-3", label: "3|0", sub: "Blitz" },
  { key: "blitz-3-2", label: "3|2", sub: "Blitz" },
  { key: "blitz-5", label: "5|0", sub: "Blitz" },
  { key: "rapid-10", label: "10|0", sub: "Rapid" },
  { key: "rapid-15-10", label: "15|10", sub: "Rapid" },
  { key: "rapid-30", label: "30|0", sub: "Rapid" },
];

const COLOR_OPTIONS = [
  { value: "white",  label: "White" },
  { value: "random", label: "Random" },
  { value: "black",  label: "Black" },
] as const;

type Mode = "select" | "create" | "join";

// Sicilian Defence, Classical variation
const MENU_FEN = "r1bqkb1r/pp2pppp/2np1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6";

function GameMenu() {
  const { createRoom, joinRoom, error, clearError } = useGame();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("select");

  const [timeControlKey, setTimeControlKey] = useState("blitz-3");
  const [hostColor, setHostColor] = useState<"white" | "black" | "random">("random");
  const [isStockfish, setIsStockfish] = useState(false);
  const [stockfishLevel, setStockfishLevel] = useState(5);
  const [commentaryStyle, setCommentaryStyle] = useState("");
  const [commentaryEnabled, setCommentaryEnabled] = useState(true);
  const [evalEnabled, setEvalEnabled] = useState(true);
  const [roomId, setRoomId] = useState("");

  const handleCreate = () => {
    createRoom({
      timeControlKey,
      hostColor,
      isStockfish,
      stockfishLevel: isStockfish ? stockfishLevel : null,
      commentaryStyle: commentaryStyle.trim() || null,
      commentaryEnabled,
      evalEnabled,
    });
  };

  const handleJoin = () => {
    if (!roomId.trim()) return;
    joinRoom(roomId.trim());
  };

  const difficultyLabel = (level: number) => {
    if (level <= 4) return "Beginner";
    if (level <= 8) return "Casual";
    if (level <= 12) return "Intermediate";
    if (level <= 16) return "Advanced";
    return "Master";
  };

  const ErrorBanner = () =>
    error ? (
      <div className="px-4 py-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm mb-4">
        {error}
      </div>
    ) : null;

  // ── Nav ────────────────────────────────────────────────────────────────────
  const Nav = () => (
    <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href={user ? "/dashboard" : "/login"} className="text-2xl font-bold tracking-tighter text-primary font-headline">CAIC</a>
        {user ? (
          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="flex items-center gap-1.5 px-4 py-2 text-on-surface-variant text-sm font-semibold rounded-lg hover:bg-surface-container hover:text-on-surface transition-all"
            >
              <span className="material-symbols-outlined text-base">dashboard</span>
              Dashboard
            </a>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container border border-outline-variant rounded-lg">
              <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-bold text-on-primary-container">
                {user.displayName?.[0] ?? "?"}
              </div>
              <span className="text-sm text-on-surface-variant font-medium">{user.displayName}</span>
            </div>
          </div>
        ) : (
          <a
            href={`${SERVER_URL}/auth/google`}
            className="px-5 py-2 bg-primary-container text-on-primary-container font-semibold rounded-lg hover:opacity-90 transition-all text-sm"
          >
            Sign In
          </a>
        )}
      </div>
    </header>
  );

  // ── Footer ─────────────────────────────────────────────────────────────────
  const Footer = () => (
    <footer className="border-t border-neutral-800 bg-neutral-950 px-6 py-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm text-neutral-500">Chess AI Commentary</span>
        <div className="flex gap-6 text-sm text-neutral-500">
          <a href="#" className="hover:text-neutral-300 transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );

  // ── Select mode ────────────────────────────────────────────────────────────
  if (mode === "select") {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col">
        <Nav />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container border border-outline-variant rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="mb-4 w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-on-primary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  chess
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight font-headline text-on-surface mb-1">New Game</h1>
              <p className="text-sm text-outline mb-8">Chess · AI Commentary</p>
              <ErrorBanner />
              <div className="w-full flex flex-col gap-3 mt-2">
                <button
                  onClick={() => { clearError(); setMode("create"); }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-container text-on-primary-container font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary-container/20 text-sm"
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                  Create Room
                </button>
                <button
                  onClick={() => { clearError(); setMode("join"); }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-surface-container-high border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-container-highest transition-all text-sm"
                >
                  <span className="material-symbols-outlined text-base">login</span>
                  Join Room
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Join mode ──────────────────────────────────────────────────────────────
  if (mode === "join") {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col">
        <Nav />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container border border-outline-variant rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
            <div className="px-6 pt-6 pb-4 border-b border-outline-variant flex items-center gap-3">
              <button
                onClick={() => setMode("select")}
                className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
              <h2 className="text-lg font-bold font-headline text-on-surface">Join a Room</h2>
            </div>
            <div className="p-6 space-y-4">
              <ErrorBanner />
              <div>
                <label className="block text-xs font-semibold text-outline uppercase tracking-widest mb-2">Room ID</label>
                <input
                  type="text"
                  placeholder="Enter room code..."
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-4 py-3 text-on-surface placeholder-outline focus:outline-none focus:border-primary transition-colors text-sm font-mono tracking-wider"
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={!roomId.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-container text-on-primary-container font-bold rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-container/20 text-sm"
              >
                <span className="material-symbols-outlined text-base">login</span>
                Join Game
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Create mode — Stitch two-column layout ─────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      <Nav />
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left: back button + board + engine card */}
          <div className="lg:col-span-5 flex flex-col gap-4">

            {/* Back button above the board */}
            <button
              onClick={() => setMode("select")}
              className="self-start flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back
            </button>

            {/* Chess board with overlay */}
            <div className="relative rounded-xl overflow-hidden border border-outline-variant aspect-square">
              <Chessboard
                options={{
                  position: MENU_FEN,
                  allowDragging: false,
                  showNotation: false,
                  darkSquareStyle: { backgroundColor: "#2e4d41" },
                  lightSquareStyle: { backgroundColor: "#bec9c2" },
                  boardStyle: { borderRadius: "0" },
                }}
              />
              {/* Dark base overlay */}
              <div className="absolute inset-0 bg-black/50 pointer-events-none" />
              {/* Gradient towards bottom for text */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h1 className="text-4xl font-headline font-bold tracking-tight text-primary leading-none mb-2">
                  New Match
                </h1>
                <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs">
                  Configure your engine environment and prepare for high-fidelity tactical analysis.
                </p>
              </div>
            </div>

            {/* Active engine card */}
            <div className="bg-surface-container-high p-4 rounded-xl border border-outline-variant">
              <span className="material-symbols-outlined text-tertiary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <p className="text-xs text-outline uppercase tracking-widest font-semibold">Active Engine</p>
              <p className="font-headline font-bold text-on-surface mt-0.5">Stockfish 16.1</p>
            </div>
          </div>

          {/* Right: configuration form */}
          <div className="lg:col-span-7 bg-surface-container rounded-2xl border border-outline-variant p-8 shadow-xl space-y-8">
            <ErrorBanner />

            {/* Time Control */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-outline uppercase tracking-widest mb-4">
                <span className="material-symbols-outlined text-sm">schedule</span>
                Time Control
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_CONTROLS.map((tc) => (
                  <button
                    key={tc.key}
                    onClick={() => setTimeControlKey(tc.key)}
                    className={`flex flex-col items-center py-3 px-2 rounded-xl border text-xs font-semibold transition-all ${timeControlKey === tc.key
                      ? "bg-primary-container border-primary-container text-on-primary-container shadow-md"
                      : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:border-primary/50"
                      }`}
                  >
                    <span className="text-sm font-bold font-headline">{tc.label}</span>
                    <span className={`text-[10px] mt-0.5 ${timeControlKey === tc.key ? "text-on-primary-container/70" : "text-outline"}`}>
                      {tc.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Side Selection + Commentary toggle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Side selection */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-outline uppercase tracking-widest mb-4">
                  <span className="material-symbols-outlined text-sm">group</span>
                  Side Selection
                </label>
                <div className="flex p-1 bg-surface-container-lowest rounded-xl border border-outline-variant gap-1">
                  {COLOR_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setHostColor(value)}
                      className={`flex-1 py-2.5 flex flex-col items-center gap-1.5 rounded-lg transition-all ${
                        hostColor === value
                          ? "bg-surface-container-highest border border-outline-variant"
                          : "hover:bg-surface-container-high"
                      }`}
                    >
                      {value === "white" && (
                        <div className="w-5 h-5 rounded-sm bg-white shadow-sm border border-neutral-300" />
                      )}
                      {value === "black" && (
                        <div className="w-5 h-5 rounded-sm bg-neutral-800 border border-neutral-600" />
                      )}
                      {value === "random" && (
                        <span className="material-symbols-outlined text-lg text-on-surface-variant">shuffle</span>
                      )}
                      <span className={`text-[10px] font-semibold ${hostColor === value ? "text-on-surface" : "text-outline"}`}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-outline uppercase tracking-widest mb-3">
                  <span className="material-symbols-outlined text-sm">tune</span>
                  Options
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setCommentaryEnabled(!commentaryEnabled)}
                    className="w-full flex items-center justify-between bg-surface-container-high p-3 rounded-xl border border-outline-variant hover:bg-surface-container-highest transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-outline">record_voice_over</span>
                      <span className="text-sm font-medium text-on-surface">AI Commentary</span>
                    </div>
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${commentaryEnabled ? "bg-primary-container" : "bg-surface-container-highest"}`}>
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${commentaryEnabled ? "translate-x-6" : "translate-x-1"}`} />
                    </div>
                  </button>
                  <button
                    onClick={() => setEvalEnabled(!evalEnabled)}
                    className="w-full flex items-center justify-between bg-surface-container-high p-3 rounded-xl border border-outline-variant hover:bg-surface-container-highest transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-outline">bar_chart</span>
                      <span className="text-sm font-medium text-on-surface">Eval Bar</span>
                    </div>
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${evalEnabled ? "bg-primary-container" : "bg-surface-container-highest"}`}>
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${evalEnabled ? "translate-x-6" : "translate-x-1"}`} />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Opponent toggle */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-outline uppercase tracking-widest mb-4">
                <span className="material-symbols-outlined text-sm">psychology</span>
                Opponent
              </label>
              <button
                onClick={() => setIsStockfish(!isStockfish)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${isStockfish
                  ? "bg-secondary-container/40 border-secondary/40"
                  : "bg-surface-container-high border-outline-variant hover:bg-surface-container-highest"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>memory</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-on-surface">Play vs Stockfish</p>
                    <p className="text-xs text-outline">Computer opponent</p>
                  </div>
                </div>
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isStockfish ? "bg-primary-container" : "bg-surface-container-highest"}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${isStockfish ? "translate-x-6" : "translate-x-1"}`} />
                </div>
              </button>

              {/* Difficulty slider */}
              {isStockfish && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-outline uppercase tracking-widest">
                      <span className="material-symbols-outlined text-sm">tune</span>
                      Stockfish Difficulty
                    </label>
                    <span className="bg-tertiary-container/30 text-tertiary px-3 py-0.5 rounded-full text-xs font-bold font-headline">
                      {difficultyLabel(stockfishLevel)}
                    </span>
                  </div>
                  <div className="relative h-6 flex items-center">
                    <div className="absolute w-full h-1.5 bg-surface-container-highest rounded-full border border-outline-variant" />
                    <div
                      className="absolute h-1.5 bg-primary rounded-full"
                      style={{ width: `${((stockfishLevel - 1) / 19) * 100}%` }}
                    />
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={stockfishLevel}
                      onChange={(e) => setStockfishLevel(Number(e.target.value))}
                      className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer accent-primary"
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-outline">
                    <span>Beginner</span>
                    <span>Grandmaster</span>
                  </div>
                </div>
              )}
            </div>

            {/* Commentary style */}
            {commentaryEnabled && (
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-outline uppercase tracking-widest mb-3">
                  <span className="material-symbols-outlined text-sm">stylus</span>
                  Commentary Style
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-xl">
                    history_edu
                  </span>
                  <input
                    type="text"
                    placeholder='e.g. "Sarcastic, Grandmaster, Aggressive..."'
                    value={commentaryStyle}
                    onChange={(e) => setCommentaryStyle(e.target.value)}
                    maxLength={150}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-4 pl-12 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-on-surface placeholder-outline text-sm"
                  />
                </div>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleCreate}
              className="w-full bg-primary-container hover:opacity-90 active:scale-[0.98] transition-all py-5 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-primary-container/20 group"
            >
              <span className="text-lg font-headline font-extrabold tracking-widest text-on-primary-container">
                START
              </span>
              <span className="material-symbols-outlined text-on-primary-container group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}

export default GameMenu;
