import { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useGame } from "../../context/GameContext";
import socket from "../../socket";

function EvalBar({ evaluation, orientation }: { evaluation: number | null; orientation: "white" | "black" }) {
  const eval_ = evaluation ?? 0;
  const clamped = Math.max(-10, Math.min(10, eval_));
  // White % of bar (50% = equal)
  const whitePct = Math.round(50 + (clamped / 10) * 50);
  const blackPct = 100 - whitePct;
  const flipped = orientation === "black";

  const evalLabel = () => {
    if (evaluation === null) return "0.0";
    if (evaluation >= 999) return "M";
    if (evaluation <= -999) return "M";
    return Math.abs(evaluation).toFixed(1);
  };

  return (
    <div className="flex flex-col items-center gap-1 h-full" style={{ width: "24px" }}>
      {/* Eval number — top = black side, bottom = white side */}
      <span className="text-[9px] font-bold text-outline tabular-nums" style={{ minHeight: "12px" }}>
        {!flipped && evaluation !== null && evaluation < 0 ? evalLabel() : ""}
        {flipped && evaluation !== null && evaluation > 0 ? evalLabel() : ""}
      </span>

      <div className="flex-1 w-full rounded-full overflow-hidden flex flex-col border border-outline-variant/40" style={{ minHeight: 0 }}>
        {/* Black portion */}
        <div
          className="w-full bg-surface-container-highest transition-all duration-700"
          style={{ height: flipped ? `${whitePct}%` : `${blackPct}%` }}
        />
        {/* White portion */}
        <div
          className="w-full bg-on-surface transition-all duration-700"
          style={{ height: flipped ? `${blackPct}%` : `${whitePct}%` }}
        />
      </div>

      <span className="text-[9px] font-bold text-outline tabular-nums" style={{ minHeight: "12px" }}>
        {!flipped && evaluation !== null && evaluation > 0 ? evalLabel() : ""}
        {flipped && evaluation !== null && evaluation < 0 ? evalLabel() : ""}
      </span>
    </div>
  );
}

function Clock({ time, active, label }: { time: string; active: boolean; label: string }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${active
        ? "bg-surface-container-highest border-primary/40 shadow-md shadow-primary/10"
        : "bg-surface-container-low border-outline-variant/40"
      }`}>
      <span className="text-xs text-outline font-medium">{label}</span>
      <span className={`font-mono font-bold tabular-nums text-lg leading-none tracking-tight ${active ? "text-on-surface" : "text-on-surface-variant"
        }`}>
        {time}
      </span>
    </div>
  );
}

function GameBoard() {
  const {
    gameState,
    roomConfig: roomInfo,
    isHost,
    commentary,
    evaluation,
    makeMove,
    resign,
    offerDraw,
    acceptDraw,
    declineDraw,
    error,
  } = useGame();

  const [drawOffered, setDrawOffered] = useState(false);
  const [drawOfferedBy, setDrawOfferedBy] = useState<"host" | "away" | null>(null);
  const [commentaryLog, setCommentaryLog] = useState<string[]>([]);
  const commentaryEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on("game:draw:offered", (data: { offeredBy: "host" | "away" }) => {
      setDrawOffered(true);
      setDrawOfferedBy(data.offeredBy);
    });
    socket.on("game:draw:declined", () => {
      setDrawOffered(false);
      setDrawOfferedBy(null);
    });
    return () => {
      socket.off("game:draw:offered");
      socket.off("game:draw:declined");
    };
  }, []);

  // Accumulate commentary into a log
  useEffect(() => {
    if (commentary) {
      setCommentaryLog((prev) => [...prev, commentary]);
    }
  }, [commentary]);

  useEffect(() => {
    commentaryEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [commentaryLog]);

  if (!gameState || !roomInfo) return null;

  const playerColor = isHost ? roomInfo.hostColor : roomInfo.hostColor === "white" ? "black" : "white";
  const boardOrientation = playerColor === "white" ? "white" : "black";

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const myTime = formatTime(isHost ? gameState.timerState.hostMs : gameState.timerState.awayMs);
  const oppTime = formatTime(isHost ? gameState.timerState.awayMs : gameState.timerState.hostMs);

  const chess = new Chess(gameState.fen);
  const turn = chess.turn();
  const isMyTurn = playerColor === "white" ? turn === "w" : turn === "b";
  const isOppTurn = !isMyTurn;

  const onDrop = (sourceSquare: string, targetSquare: string): boolean => {
    if (!isMyTurn) return false;
    const chessCopy = new Chess(gameState.fen);
    try {
      const move = chessCopy.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
      if (!move) return false;
      makeMove(move.san);
      return true;
    } catch {
      return false;
    }
  };

  const iOfferDraw = drawOfferedBy === (isHost ? "host" : "away");
  const opponentOfferedDraw = drawOffered && !iOfferDraw;

  const endReasonForDraw = roomInfo.isStockfish ? "vs Stockfish" :
    `${roomInfo.timeControl.minutes}+${roomInfo.timeControl.increment}`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex gap-4 items-stretch w-full max-w-5xl">

        {/* === LEFT: Eval bar + Board + Clocks === */}
        <div className="flex flex-col gap-2 flex-shrink-0">

          {/* Opponent clock */}
          <Clock time={oppTime} active={isOppTurn} label="Opponent" />

          {/* Board row: eval bar + board */}
          <div className="flex gap-2 items-stretch">
            {/* Eval bar */}
            <EvalBar evaluation={evaluation} orientation={boardOrientation} />

            {/* Board */}
            <div
              className="rounded-xl overflow-hidden border border-outline-variant/30 shadow-2xl shadow-black/40"
              style={{ touchAction: "none", userSelect: "none", width: "min(480px, calc(100vw - 280px))", aspectRatio: "1" }}
            >
              <Chessboard
                options={{
                  id: "game-board",
                  position: gameState.fen,
                  boardOrientation: boardOrientation as "white" | "black",
                  allowDragging: isMyTurn,
                  onPieceDrop: ({ sourceSquare, targetSquare }) => {
                    if (!targetSquare) return false;
                    return onDrop(sourceSquare, targetSquare);
                  },
                }}
              />
            </div>
          </div>

          {/* My clock */}
          <Clock time={myTime} active={isMyTurn} label="You" />

          {/* Error */}
          {error && (
            <div className="px-4 py-2 bg-error/10 border border-error/30 rounded-lg text-error text-xs">
              {error}
            </div>
          )}
        </div>

        {/* === RIGHT: Commentary + Actions === */}
        <div className="flex flex-col gap-3 flex-1 min-w-0" style={{ minWidth: "220px", maxWidth: "280px" }}>

          {/* Game info chip */}
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-container border border-outline-variant rounded-xl">
            <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>chess</span>
            <span className="text-xs text-on-surface-variant font-medium truncate">{endReasonForDraw}</span>
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${playerColor === "white"
                ? "bg-white/10 text-on-surface"
                : "bg-surface-container-highest text-on-surface-variant"
              }`}>
              {playerColor === "white" ? "⬜ White" : "⬛ Black"}
            </span>
          </div>

          {/* Commentary feed */}
          <div className="flex-1 flex flex-col bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>record_voice_over</span>
              <span className="text-xs font-semibold text-on-surface uppercase tracking-widest">Commentary</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: "320px", minHeight: "120px" }}>
              {commentaryLog.length === 0 ? (
                <p className="text-xs text-outline italic text-center pt-4">Commentary will appear here as the game progresses...</p>
              ) : (
                commentaryLog.map((text, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-primary text-xs mt-0.5 flex-shrink-0">🎙</span>
                    <p className="text-xs text-on-surface-variant leading-relaxed italic">{text}</p>
                  </div>
                ))
              )}
              <div ref={commentaryEndRef} />
            </div>
          </div>

          {/* Draw offer notification */}
          {opponentOfferedDraw && (
            <div className="px-3 py-3 bg-secondary-container/40 border border-secondary/30 rounded-xl">
              <p className="text-xs font-semibold text-on-surface mb-2">Opponent offers a draw</p>
              <div className="flex gap-2">
                <button
                  onClick={acceptDraw}
                  className="flex-1 py-1.5 bg-primary-container text-on-primary-container text-xs font-bold rounded-lg hover:opacity-90 transition-all"
                >
                  Accept
                </button>
                <button
                  onClick={declineDraw}
                  className="flex-1 py-1.5 bg-surface-container-high border border-outline-variant text-on-surface-variant text-xs font-semibold rounded-lg hover:bg-surface-container-highest transition-all"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {iOfferDraw && (
            <div className="px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl">
              <p className="text-xs text-outline italic text-center">Draw offer sent...</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {!drawOffered && (
              <button
                onClick={offerDraw}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface-container border border-outline-variant text-on-surface-variant text-xs font-semibold rounded-xl hover:bg-surface-container-high hover:text-on-surface transition-all"
              >
                <span className="material-symbols-outlined text-sm">handshake</span>
                Offer Draw
              </button>
            )}
            <button
              onClick={resign}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-error/30 text-error/70 text-xs font-semibold rounded-xl hover:bg-error/10 hover:text-error transition-all"
            >
              <span className="material-symbols-outlined text-sm">flag</span>
              Resign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameBoard;