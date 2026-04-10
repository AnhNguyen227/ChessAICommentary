import { useGame } from "../../context/GameContext";

function GameLobby() {
  const { roomConfig: roomInfo, isHost, leaveRoom, discardRoom, startGame, error, awayJoined } = useGame();

  if (!roomInfo) return null;

  const canStart = roomInfo.isStockfish || awayJoined;
  const playerColor = isHost ? roomInfo.hostColor : roomInfo.hostColor === "white" ? "black" : "white";

  const copyRoomId = () => navigator.clipboard.writeText(roomInfo.roomId);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container border border-outline-variant rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center shadow-md shadow-primary/20">
              <span className="material-symbols-outlined text-on-primary-container text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                chess
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold font-headline text-on-surface">Game Lobby</h2>
              <p className="text-xs text-outline">
                {roomInfo.isStockfish ? `vs Stockfish · Level ${roomInfo.stockfishLevel}` : "Waiting for opponent"}
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 px-4 py-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* Room ID */}
          <div className="flex items-center justify-between px-4 py-3 bg-surface-container-high border border-outline-variant rounded-xl">
            <div>
              <p className="text-xs text-outline uppercase tracking-widest font-semibold mb-0.5">Room ID</p>
              <p className="text-sm font-mono font-bold text-on-surface tracking-wider">{roomInfo.roomId}</p>
            </div>
            <button
              onClick={copyRoomId}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container border border-outline-variant rounded-lg text-xs text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-all"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
              Copy
            </button>
          </div>

          {/* Game info cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl">
              <p className="text-xs text-outline uppercase tracking-widest font-semibold mb-1">Time Control</p>
              <p className="text-sm font-bold text-on-surface">
                {roomInfo.timeControl.minutes} min
                {roomInfo.timeControl.increment > 0 && (
                  <span className="text-outline font-normal"> +{roomInfo.timeControl.increment}s</span>
                )}
              </p>
            </div>
            <div className="px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl">
              <p className="text-xs text-outline uppercase tracking-widest font-semibold mb-1">Your Color</p>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">
                  {playerColor === "white" ? "light_mode" : "dark_mode"}
                </span>
                <p className="text-sm font-bold text-on-surface capitalize">{playerColor}</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${canStart
              ? "bg-primary/5 border-primary/20"
              : "bg-surface-container-low border-outline-variant/50"
            }`}>
            {canStart ? (
              <>
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <p className="text-sm text-on-surface">
                  {roomInfo.isStockfish ? "Ready to play against Stockfish" : "Opponent joined — ready to start!"}
                </p>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-outline animate-pulse" />
                <p className="text-sm text-on-surface-variant">
                  {isHost ? "Waiting for opponent to join..." : "Waiting for host to start the game..."}
                </p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            {isHost ? (
              <>
                {canStart && (
                  <button
                    onClick={startGame}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-container text-on-primary-container font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary-container/20 text-sm"
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    Start Game
                  </button>
                )}
                <button
                  onClick={discardRoom}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-outline-variant text-on-surface-variant font-semibold rounded-xl hover:bg-surface-container-high hover:text-on-surface transition-all text-sm"
                >
                  <span className="material-symbols-outlined text-base">delete_outline</span>
                  Discard Room
                </button>
              </>
            ) : (
              <button
                onClick={leaveRoom}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-outline-variant text-on-surface-variant font-semibold rounded-xl hover:bg-surface-container-high hover:text-on-surface transition-all text-sm"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Leave Room
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameLobby;