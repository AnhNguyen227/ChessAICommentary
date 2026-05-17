import { useState } from "react";
import { useGame } from "../../context/GameContext";
import { useAuth } from "../../context/AuthContext";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

function GameLobby() {
  const { roomConfig: roomInfo, isHost, leaveRoom, discardRoom, startGame, error, awayJoined } = useGame();
  const { user } = useAuth();

  if (!roomInfo) return null;

  const canStart = roomInfo.isStockfish || awayJoined;
  const playerColor = isHost ? roomInfo.hostColor : roomInfo.hostColor === "white" ? "black" : "white";
  const hostDisplayName = user?.displayName ?? "You";
  const timeLabel = `${roomInfo.timeControl.minutes}${roomInfo.timeControl.increment > 0 ? ` | ${roomInfo.timeControl.increment}` : ""} ${roomInfo.timeControl.minutes >= 15 ? "Rapid" : "Blitz"}`;

  const [copied, setCopied] = useState(false);
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomInfo.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-tighter text-primary font-headline">CAIC</a>
          {user ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container border border-outline-variant rounded-lg">
              <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-bold text-on-primary-container">
                {user.displayName?.[0] ?? "?"}
              </div>
              <span className="text-sm text-on-surface-variant font-medium">{user.displayName}</span>
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

      <main className="flex-grow flex flex-col items-center justify-center p-6 md:p-12">
        <div className="max-w-5xl w-full">

          {/* Page header + Room ID */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-headline text-on-surface mb-2">
                Match Lobby
              </h1>
            </div>
            {!roomInfo.isStockfish && <div className="bg-surface-container border border-outline-variant p-4 rounded-xl flex items-center gap-4 flex-shrink-0">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-widest text-outline font-bold">Match ID</span>
                <span className="font-mono text-primary font-bold text-lg">{roomInfo.roomId}</span>
              </div>
              <button
                onClick={copyRoomId}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium text-sm ${copied
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary-container text-on-secondary-container hover:brightness-110"
                  }`}
              >
                <span className="material-symbols-outlined text-sm">{copied ? "check" : "content_copy"}</span>
                {copied ? "Copied!" : "Copy Invite"}
              </button>
            </div>}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
              {error}
            </div>
          )}

          {/* 3-column bento */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">

            {/* Host card */}
            <div className="lg:col-span-4 bg-surface-container-high rounded-2xl p-8 border border-outline-variant/30 flex flex-col items-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              {/* Avatar */}
              <div className="relative z-10 w-24 h-24 rounded-full bg-primary-container border-4 border-primary shadow-xl mb-6 flex items-center justify-center">
                <span className="text-3xl font-bold text-on-primary-container font-headline">
                  {hostDisplayName[0]?.toUpperCase() ?? "?"}
                </span>
              </div>
              <div className="text-center relative z-10">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-xl font-bold font-headline text-on-surface">{hostDisplayName}</span>
                </div>
                <p className="text-on-surface-variant text-sm font-medium capitalize">
                  Playing {playerColor === "white" || playerColor === "black" ? playerColor : "random color"}
                </p>
                <span className="inline-block mt-4 px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                  {isHost ? "Host" : "Guest"}
                </span>
              </div>
            </div>

            {/* VS + Engine config */}
            <div className="lg:col-span-4 flex flex-col justify-center items-center gap-6 py-4">
              <div className="w-14 h-14 bg-surface-container-highest rounded-full flex items-center justify-center border border-outline-variant">
                <span className="text-xl font-bold font-headline italic text-on-surface">VS</span>
              </div>
              <div className="w-full bg-surface-container-low rounded-xl p-6 border border-outline-variant/30">
                <h3 className="text-xs uppercase tracking-widest text-outline font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">settings_input_component</span>
                  MATCH INFO
                </h3>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">Engine</span>
                    <span className="text-on-surface font-medium">
                      {roomInfo.isStockfish ? "Stockfish 16.1" : "Human"}
                    </span>
                  </li>
                  {roomInfo.isStockfish && (
                    <li className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant">Difficulty</span>
                      <span className="text-on-surface font-medium">Level {roomInfo.stockfishLevel}</span>
                    </li>
                  )}
                  <li className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">Commentary</span>
                    <span className="font-medium text-primary">Gemini AI</span>
                  </li>
                  <li className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">Time Control</span>
                    <span className="text-on-surface font-medium">{timeLabel}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Opponent card */}
            <div className={`lg:col-span-4 rounded-2xl p-8 flex flex-col items-center justify-center border-2 ${roomInfo.isStockfish || awayJoined
              ? "bg-surface-container-high border-outline-variant/30"
              : "bg-surface-container-lowest border-dashed border-outline-variant/50"
              }`}>
              {roomInfo.isStockfish ? (
                /* Stockfish opponent */
                <>
                  <div className="w-24 h-24 rounded-full bg-secondary-container border-4 border-secondary shadow-xl mb-6 flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-4xl text-on-secondary-container"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      memory
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold font-headline text-on-surface">Stockfish</span>
                    <p className="text-on-surface-variant text-sm mt-1">Level {roomInfo.stockfishLevel} · Engine</p>
                    <span className="inline-block mt-4 px-3 py-1 bg-secondary/20 text-secondary text-xs font-bold rounded-full uppercase tracking-wider">
                      Bot
                    </span>
                  </div>
                </>
              ) : awayJoined ? (
                /* Opponent joined */
                <>
                  <div className="w-24 h-24 rounded-full bg-surface-container-highest border-4 border-primary shadow-xl mb-6 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-primary">person</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-xl font-bold font-headline text-on-surface">Opponent</span>
                    </div>
                    <p className="text-primary text-sm mt-1 font-medium">Connected — ready!</p>
                    <span className="inline-block mt-4 px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                      Guest
                    </span>
                  </div>
                </>
              ) : (
                /* Waiting */
                <>
                  <div className="w-24 h-24 rounded-full border-4 border-dashed border-outline-variant flex items-center justify-center mb-6 animate-pulse">
                    <span className="material-symbols-outlined text-4xl text-outline-variant">person_add</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold font-headline text-outline-variant italic">Waiting...</span>
                    <p className="text-outline text-sm mt-2">Opponent joining soon</p>
                  </div>
                  <button
                    onClick={copyRoomId}
                    className="mt-8 text-secondary font-medium text-sm flex items-center gap-2 hover:text-primary transition-colors"
                  >
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Action section */}
          <div className="flex flex-col items-center gap-5">
            {/* Status pill */}
            <div className={`flex items-center gap-3 text-sm px-4 py-2 rounded-full border ${canStart
              ? "bg-primary/5 border-primary/20 text-on-surface"
              : "bg-surface-container-high border-outline-variant text-on-surface-variant"
              }`}>
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${canStart ? "bg-primary" : "bg-error"}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${canStart ? "bg-primary" : "bg-error"}`} />
              </span>
              {canStart
                ? roomInfo.isStockfish ? "Engine ready — you can start the game." : "Opponent joined — ready to start!"
                : isHost ? "Waiting for second player..." : "Waiting for host to start..."}
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              {isHost ? (
                <>
                  <button
                    onClick={discardRoom}
                    className="flex-1 bg-surface-container-highest text-on-surface px-8 py-4 rounded-xl font-bold border border-outline-variant hover:bg-surface-variant transition-all text-sm"
                  >
                    Discard Room
                  </button>
                  <button
                    onClick={startGame}
                    disabled={!canStart}
                    className={`flex-1 px-8 py-4 rounded-xl font-bold transition-all text-sm ${canStart
                      ? "bg-primary-container text-on-primary-container hover:opacity-90 shadow-lg shadow-primary-container/20"
                      : "bg-neutral-800 text-neutral-600 cursor-not-allowed border border-neutral-700/50"
                      }`}
                  >
                    START GAME
                  </button>
                </>
              ) : (
                <button
                  onClick={leaveRoom}
                  className="flex-1 bg-surface-container-highest text-on-surface px-8 py-4 rounded-xl font-bold border border-outline-variant hover:bg-surface-variant transition-all text-sm"
                >
                  Leave Room
                </button>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-950 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-neutral-500">Chess AI Commentary</span>
          <div className="flex gap-6 text-sm text-neutral-500">
            <a href="#" className="hover:text-neutral-300 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default GameLobby;
