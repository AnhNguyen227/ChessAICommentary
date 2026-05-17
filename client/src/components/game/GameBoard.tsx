import { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useGame } from "../../context/GameContext";
import socket from "../../socket";

function EvalBar({ evaluation, orientation }: { evaluation: number | null; orientation: "white" | "black" }) {
  const eval_ = evaluation ?? 0;
  const clamped = Math.max(-10, Math.min(10, eval_));
  const whitePct = Math.round(50 + (clamped / 10) * 50);
  const blackPct = 100 - whitePct;
  const flipped = orientation === "black";

  const evalLabel = () => {
    if (evaluation === null) return "0.0";
    if (evaluation >= 999 || evaluation <= -999) return "M";
    return Math.abs(evaluation).toFixed(1);
  };

  return (
    <div className="flex flex-col items-center gap-1 h-full w-7 flex-shrink-0">
      <span className="text-[9px] font-bold text-outline tabular-nums leading-none">
        {(!flipped && evaluation !== null && evaluation < 0) || (flipped && evaluation !== null && evaluation > 0) ? evalLabel() : " "}
      </span>
      <div className="flex-1 w-full rounded-md overflow-hidden flex flex-col border border-outline-variant/30 min-h-0">
        <div className="w-full bg-surface-container-highest transition-all duration-700" style={{ height: flipped ? `${whitePct}%` : `${blackPct}%` }} />
        <div className="w-full bg-on-surface transition-all duration-700 flex-1" />
      </div>
      <span className="text-[9px] font-bold text-outline tabular-nums leading-none">
        {(!flipped && evaluation !== null && evaluation > 0) || (flipped && evaluation !== null && evaluation < 0) ? evalLabel() : " "}
      </span>
    </div>
  );
}

function PlayerCard({ time, active, label, isBot }: {
  time: string; active: boolean; label: string; isBot?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all flex-shrink-0 ${
      active
        ? "bg-surface-container-high border-primary/30"
        : "bg-surface-container border-outline-variant/30"
    }`}>
      <div className="flex items-center gap-2">
        <span
          className={`material-symbols-outlined text-sm ${active ? "text-primary" : "text-outline"}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {isBot ? "memory" : "person"}
        </span>
        <span className={`text-sm font-semibold font-headline ${active ? "text-on-surface" : "text-on-surface-variant"}`}>
          {label}
        </span>
        {isBot && (
          <span className="text-[9px] bg-surface-container-highest text-outline px-1.5 py-0.5 rounded uppercase tracking-widest">
            Bot
          </span>
        )}
      </div>
      <span className={`font-mono font-bold tabular-nums text-base ${active ? "text-on-surface" : "text-on-surface-variant"}`}>
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
    commentaryEnabled,
    evalEnabled,
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

  useEffect(() => {
    if (commentary) setCommentaryLog((prev) => [...prev, commentary]);
  }, [commentary]);

  useEffect(() => {
    commentaryEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [commentaryLog]);

  if (!gameState || !roomInfo) return null;

  const playerColor = isHost ? roomInfo.hostColor : roomInfo.hostColor === "white" ? "black" : "white";
  const boardOrientation = playerColor === "white" ? "white" : "black";

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const myTime = formatTime(isHost ? gameState.timerState.hostMs : gameState.timerState.awayMs);
  const oppTime = formatTime(isHost ? gameState.timerState.awayMs : gameState.timerState.hostMs);

  const chess = new Chess(gameState.fen);
  const isMyTurn = playerColor === "white" ? chess.turn() === "w" : chess.turn() === "b";
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
  const canOfferDraw = !roomInfo.isStockfish && !drawOffered;
  const oppLabel = roomInfo.isStockfish
    ? `Stockfish${roomInfo.stockfishLevel ? ` Lv.${roomInfo.stockfishLevel}` : ""}`
    : "Opponent";

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <main className="flex-1 flex items-stretch justify-center gap-6 p-6 min-h-0">

        {/* ── Board column ── */}
        <div className="flex flex-col gap-2 flex-shrink-0 min-h-0">

          <PlayerCard time={oppTime} active={isOppTurn} label={oppLabel} isBot={roomInfo.isStockfish} />

          {/* Eval bar + board — sized by explicit min(height, width) so both stay in sync */}
          <div className="flex-1 flex items-center min-h-0">
            <div
              className="flex gap-2 items-stretch"
              style={{ height: "min(calc(100vh - 168px), calc(100vw - 500px))" }}
            >
            {evalEnabled && <EvalBar evaluation={evaluation} orientation={boardOrientation} />}
            <div
              className="rounded-xl overflow-hidden border border-outline-variant/30 shadow-2xl shadow-black/50"
              style={{ height: "100%", aspectRatio: "1 / 1" }}
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
                  darkSquareStyle: { backgroundColor: "#2e4d41" },
                  lightSquareStyle: { backgroundColor: "#bec9c2" },
                }}
              />
            </div>
            </div>
          </div>

          <PlayerCard time={myTime} active={isMyTurn} label="You" />

          {error && (
            <div className="px-3 py-1.5 bg-error/10 border border-error/30 rounded-lg text-error text-xs flex-shrink-0">
              {error}
            </div>
          )}
        </div>

        {/* ── Commentary panel ── */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-surface-container rounded-xl border border-outline-variant overflow-hidden min-h-0">

          {/* Header */}
          <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-high flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                record_voice_over
              </span>
              <h2 className="font-headline font-bold text-sm uppercase tracking-widest text-on-surface">AI Commentary</h2>
            </div>
            {commentaryEnabled ? (
              <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold border border-primary/20 uppercase">Live</span>
            ) : (
              <span className="bg-outline/10 text-outline text-[10px] px-2 py-0.5 rounded-full font-bold border border-outline/20 uppercase">Off</span>
            )}
          </div>

          {/* Scrollable feed */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {!commentaryEnabled ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-outline text-xl">comments_disabled</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface-variant">Commentary Disabled</p>
                  <p className="text-xs text-outline mt-1">No AI commentary for this match</p>
                </div>
              </div>
            ) : commentaryLog.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined text-primary text-base">mic</span>
                </div>
                <p className="text-xs text-outline italic">Commentary will appear as the game unfolds...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {commentaryLog.map((text, i) => (
                  <div key={i} className="bg-surface-container-low p-3 rounded-lg border-l-4 border-primary/50">
                    <p className="text-xs text-on-surface-variant leading-relaxed italic">{text}</p>
                  </div>
                ))}
                <div ref={commentaryEndRef} />
              </div>
            )}
          </div>

          {/* Draw offer */}
          {opponentOfferedDraw && (
            <div className="px-4 py-3 bg-secondary-container/30 border-t border-secondary/20 flex-shrink-0">
              <p className="text-xs font-semibold text-on-surface mb-2">Opponent offers a draw</p>
              <div className="flex gap-2">
                <button onClick={acceptDraw} className="flex-1 py-2 bg-primary-container text-on-primary-container text-xs font-bold rounded-lg hover:opacity-90 transition-all">Accept</button>
                <button onClick={declineDraw} className="flex-1 py-2 bg-surface-container-high border border-outline-variant text-on-surface-variant text-xs font-semibold rounded-lg hover:bg-surface-container-highest transition-all">Decline</button>
              </div>
            </div>
          )}

          {iOfferDraw && (
            <div className="px-4 py-2 border-t border-outline-variant/50 flex-shrink-0">
              <p className="text-xs text-outline italic text-center">Draw offer sent...</p>
            </div>
          )}

          {/* Actions docked to bottom */}
          <div className={`p-4 border-t border-outline-variant bg-surface-container-high flex-shrink-0 ${canOfferDraw ? "grid grid-cols-2 gap-3" : ""}`}>
            {canOfferDraw && (
              <button
                onClick={offerDraw}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant text-xs font-semibold uppercase tracking-wider hover:bg-surface-container-highest hover:text-on-surface transition-all"
              >
                <span className="material-symbols-outlined text-sm">handshake</span>
                Offer Draw
              </button>
            )}
            <button
              onClick={resign}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-error/40 text-error text-xs font-semibold uppercase tracking-wider hover:bg-error/10 transition-all"
            >
              <span className="material-symbols-outlined text-sm">flag</span>
              Resign
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}

export default GameBoard;
