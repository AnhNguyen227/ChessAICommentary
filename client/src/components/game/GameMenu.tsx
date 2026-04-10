import { useState } from "react";
import { useGame } from "../../context/GameContext";

const TIME_CONTROLS = [
  { key: "blitz-3", label: "3 min", sub: "Blitz" },
  { key: "blitz-3-2", label: "3+2", sub: "Blitz" },
  { key: "blitz-5", label: "5 min", sub: "Blitz" },
  { key: "rapid-10", label: "10 min", sub: "Rapid" },
  { key: "rapid-15-10", label: "15+10", sub: "Rapid" },
  { key: "rapid-30", label: "30 min", sub: "Rapid" },
];

const COLOR_OPTIONS = [
  { value: "white", icon: "light_mode", label: "White" },
  { value: "black", icon: "dark_mode", label: "Black" },
  { value: "random", icon: "shuffle", label: "Random" },
] as const;

type Mode = "select" | "create" | "join";

function GameMenu() {
  const { createRoom, joinRoom, error } = useGame();
  const [mode, setMode] = useState<Mode>("select");

  const [timeControlKey, setTimeControlKey] = useState("blitz-3");
  const [hostColor, setHostColor] = useState<"white" | "black" | "random">("random");
  const [isStockfish, setIsStockfish] = useState(false);
  const [stockfishLevel, setStockfishLevel] = useState(5);
  const [commentaryStyle, setCommentaryStyle] = useState("");
  const [commentaryEnabled, setCommentaryEnabled] = useState(true);
  const [roomId, setRoomId] = useState("");

  const handleCreate = () => {
    createRoom({
      timeControlKey,
      hostColor,
      isStockfish,
      stockfishLevel: isStockfish ? stockfishLevel : null,
      commentaryStyle: commentaryStyle.trim() || null,
      commentaryEnabled,
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

  // Shared card wrapper
  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container border border-outline-variant rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
        {children}
      </div>
    </div>
  );

  const ErrorBanner = () =>
    error ? (
      <div className="mx-6 mt-4 px-4 py-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
        {error}
      </div>
    ) : null;

  if (mode === "select") {
    return (
      <Card>
        <div className="p-8 flex flex-col items-center text-center">
          {/* Logo */}
          <div className="mb-4 w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              chess
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-headline text-on-surface mb-1">CAIC</h1>
          <p className="text-sm text-outline mb-8">Chess · AI Commentary</p>

          <ErrorBanner />

          <div className="w-full flex flex-col gap-3 mt-2">
            <button
              onClick={() => setMode("create")}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-container text-on-primary-container font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary-container/20 text-sm"
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              Create Room
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-surface-container-high border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-container-highest transition-all text-sm"
            >
              <span className="material-symbols-outlined text-base">login</span>
              Join Room
            </button>
          </div>
        </div>
      </Card>
    );
  }

  if (mode === "join") {
    return (
      <Card>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-outline-variant flex items-center gap-3">
          <button
            onClick={() => setMode("select")}
            className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-outline hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <h2 className="text-lg font-bold font-headline text-on-surface">Join a Room</h2>
        </div>

        <ErrorBanner />

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-outline uppercase tracking-widest mb-2">
              Room ID
            </label>
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
      </Card>
    );
  }

  // Create room
  return (
    <Card>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-outline-variant flex items-center gap-3">
        <button
          onClick={() => setMode("select")}
          className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-outline hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold font-headline text-on-surface">Create Room</h2>
      </div>

      <ErrorBanner />

      <div className="p-6 space-y-6">
        {/* Time Control */}
        <div>
          <p className="text-xs font-semibold text-outline uppercase tracking-widest mb-3">Time Control</p>
          <div className="grid grid-cols-3 gap-2">
            {TIME_CONTROLS.map((tc) => (
              <button
                key={tc.key}
                onClick={() => setTimeControlKey(tc.key)}
                className={`flex flex-col items-center py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${timeControlKey === tc.key
                    ? "bg-primary-container border-primary-container text-on-primary-container shadow-md"
                    : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:bg-surface-container-highest hover:border-outline"
                  }`}
              >
                <span className="text-base font-bold font-headline">{tc.label}</span>
                <span className={`text-[10px] mt-0.5 ${timeControlKey === tc.key ? "text-on-primary-container/70" : "text-outline"}`}>
                  {tc.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Play As */}
        <div>
          <p className="text-xs font-semibold text-outline uppercase tracking-widest mb-3">Play As</p>
          <div className="grid grid-cols-3 gap-2">
            {COLOR_OPTIONS.map(({ value, icon, label }) => (
              <button
                key={value}
                onClick={() => setHostColor(value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all ${hostColor === value
                    ? "bg-primary-container border-primary-container text-on-primary-container shadow-md"
                    : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:bg-surface-container-highest hover:border-outline"
                  }`}
              >
                <span className="material-symbols-outlined text-lg">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Opponent */}
        <div>
          <p className="text-xs font-semibold text-outline uppercase tracking-widest mb-3">Opponent</p>
          <button
            onClick={() => setIsStockfish(!isStockfish)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${isStockfish
                ? "bg-secondary-container/40 border-secondary/40 text-on-surface"
                : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:bg-surface-container-highest"
              }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>memory</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-on-surface">Play vs Stockfish</p>
                <p className="text-xs text-outline">Computer opponent</p>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors relative ${isStockfish ? "bg-primary" : "bg-surface-container-highest"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isStockfish ? "left-5" : "left-1"}`} />
            </div>
          </button>

          {isStockfish && (
            <div className="mt-3 px-4 py-3 bg-surface-container rounded-xl border border-outline-variant">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-outline">Difficulty</span>
                <span className="text-xs font-bold text-primary">
                  {difficultyLabel(stockfishLevel)} <span className="text-outline font-normal">({stockfishLevel}/20)</span>
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={stockfishLevel}
                onChange={(e) => setStockfishLevel(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          )}
        </div>

        {/* Commentary */}
        <div>
          <p className="text-xs font-semibold text-outline uppercase tracking-widest mb-3">Commentary</p>
          <button
            onClick={() => setCommentaryEnabled(!commentaryEnabled)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${commentaryEnabled
                ? "bg-secondary-container/40 border-secondary/40 text-on-surface"
                : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:bg-surface-container-highest"
              }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>record_voice_over</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-on-surface">Live AI Commentary</p>
                <p className="text-xs text-outline">Powered by Gemini</p>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors relative ${commentaryEnabled ? "bg-primary" : "bg-surface-container-highest"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${commentaryEnabled ? "left-5" : "left-1"}`} />
            </div>
          </button>

          {commentaryEnabled && (
            <div className="mt-2">
              <input
                type="text"
                placeholder='e.g. "Like a 19th century Englishman"'
                value={commentaryStyle}
                onChange={(e) => setCommentaryStyle(e.target.value)}
                maxLength={150}
                className="w-full mt-2 bg-surface-container-high border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface placeholder-outline focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={handleCreate}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-container text-on-primary-container font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary-container/20 text-sm"
        >
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
          Create Room
        </button>
      </div>
    </Card>
  );
}

export default GameMenu;