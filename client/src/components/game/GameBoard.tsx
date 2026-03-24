import { useState, useEffect } from "react";
import { Chessboard, ChessboardProvider } from "react-chessboard";
import { Chess } from "chess.js";
import { useGame } from "../../context/GameContext";
import socket from "../../socket";

function GameBoard() {
  const {
    gameState,
    roomConfig: roomInfo,
    isHost,
    makeMove,
    resign,
    offerDraw,
    acceptDraw,
    declineDraw,
    error,
  } = useGame();

  const [drawOffered, setDrawOffered] = useState(false);
  const [drawOfferedBy, setDrawOfferedBy] = useState<"host" | "away" | null>(null);

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

  if (!gameState || !roomInfo) return null;

  const playerColor = isHost ? roomInfo.hostColor : roomInfo.hostColor === "white" ? "black" : "white";
  const boardOrientation = playerColor === "white" ? "white" : "black";

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const hostTime = formatTime(gameState.timerState.hostMs);
  const awayTime = formatTime(gameState.timerState.awayMs);

  const isMyTurn = (): boolean => {
    const chess = new Chess(gameState.fen);
    const turn = chess.turn();
    if (playerColor === "white") return turn === "w";
    return turn === "b";
  };

  const onDrop = (sourceSquare: string, targetSquare: string): boolean => {
    if (!isMyTurn()) return false;

    const chessCopy = new Chess(gameState.fen);
    try {
      const move = chessCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (!move) return false;
      makeMove(move.san);
      return true;
    } catch {
      return false;
    }
  };

  const iOfferDraw = drawOfferedBy === (isHost ? "host" : "away");
  const opponentOfferedDraw = drawOffered && !iOfferDraw;

  return (
    <div>
      {error && <p>{error}</p>}

      <div>
        <p>Opponent: {isHost ? awayTime : hostTime}</p>
      </div>

      <div style={{ touchAction: "none", userSelect: "none" }}>
        <Chessboard
          options={{
            id: "game-board",
            position: gameState.fen,
            boardOrientation: boardOrientation as "white" | "black",
            allowDragging: isMyTurn(),
            onPieceDrop: ({ sourceSquare, targetSquare }) => {
              if (!targetSquare) return false;
              return onDrop(sourceSquare, targetSquare);
            },
          }}
        />
      </div>

      <div>
        <p>You: {isHost ? hostTime : awayTime}</p>
      </div>

      <div>
        <button onClick={resign}>Resign</button>
        {!drawOffered && (
          <button onClick={offerDraw}>Offer Draw</button>
        )}
        {iOfferDraw && <p>Draw offer sent...</p>}
        {opponentOfferedDraw && (
          <div>
            <p>Opponent offers a draw</p>
            <button onClick={acceptDraw}>Accept</button>
            <button onClick={declineDraw}>Decline</button>
          </div>
        )}
      </div>
    </div >
  );
}

export default GameBoard;