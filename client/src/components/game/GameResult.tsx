import { useGame } from "../../context/GameContext";

const endReasonLabel: Record<string, string> = {
  checkmate: "Checkmate",
  forfeit: "Opponent Forfeited",
  timeout: "Timeout",
  resign: "Resignation",
  draw: "Draw by Agreement",
  stalemate: "Stalemate",
  insufficient_material: "Insufficient Material",
  threefold_repetition: "Threefold Repetition",
  fifty_move_rule: "50-Move Rule",
};

function GameResult() {
  const { gameResult, roomConfig: roomInfo, isHost, backToMenu } = useGame();

  if (!gameResult || !roomInfo) return null;

  const playerRole = isHost ? "host" : "away";
  const isDraw = gameResult.winner === "draw";
  const isWin = gameResult.winner === playerRole;

  const outcome = isDraw ? "Draw" : isWin ? "Victory" : "Defeat";
  const outcomeColor = isDraw
    ? "text-tertiary"
    : isWin
      ? "text-primary"
      : "text-on-surface-variant";
  const icon = isDraw ? "handshake" : isWin ? "emoji_events" : "flag";
  const iconBg = isDraw
    ? "bg-tertiary/10 border-tertiary/20"
    : isWin
      ? "bg-primary/10 border-primary/20"
      : "bg-surface-container-high border-outline-variant";

  const timeLabel = `${roomInfo.timeControl.minutes} min${roomInfo.timeControl.increment > 0 ? ` + ${roomInfo.timeControl.increment}s` : ""
    }`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface-container border border-outline-variant rounded-2xl overflow-hidden shadow-2xl shadow-black/40">

        {/* Header glow band */}
        <div className={`h-1 w-full ${isWin ? "bg-primary" : isDraw ? "bg-tertiary" : "bg-outline-variant"}`} />

        <div className="p-8 flex flex-col items-center text-center gap-6">
          {/* Icon */}
          <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center ${iconBg}`}>
            <span
              className={`material-symbols-outlined text-5xl ${outcomeColor}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {icon}
            </span>
          </div>

          {/* Outcome */}
          <div>
            <h1 className={`text-5xl font-bold tracking-tight font-headline ${outcomeColor}`}>
              {outcome}
            </h1>
            <p className="text-sm text-on-surface-variant mt-2">
              {endReasonLabel[gameResult.endReason] ?? gameResult.endReason}
            </p>
          </div>

          {/* Meta chip */}
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-low border border-outline-variant/50 rounded-full text-xs text-outline">
            <span className="material-symbols-outlined text-sm">timer</span>
            {timeLabel}
            {roomInfo.isStockfish && (
              <>
                <span className="text-outline-variant">·</span>
                <span className="material-symbols-outlined text-sm">memory</span>
                Stockfish Lv.{roomInfo.stockfishLevel}
              </>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={backToMenu}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-container text-on-primary-container font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary-container/20 text-sm"
          >
            <span className="material-symbols-outlined text-base">home</span>
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameResult;