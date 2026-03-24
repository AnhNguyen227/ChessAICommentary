import { useGame } from "../../context/GameContext";

function GameResult() {
  const { gameResult, roomConfig: roomInfo, isHost, backToMenu } = useGame();

  if (!gameResult || !roomInfo) return null;

  const playerRole = isHost ? "host" : "away";

  const outcome =
    gameResult.winner === "draw"
      ? "Draw"
      : gameResult.winner === playerRole
        ? "You Win!"
        : "You Lose";

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

  return (
    <div>
      <h2>{outcome}</h2>
      <p>{endReasonLabel[gameResult.endReason]}</p>
      <p>
        {roomInfo.timeControl.minutes} min
        {roomInfo.timeControl.increment > 0 && ` + ${roomInfo.timeControl.increment}s`}
      </p>
      <button onClick={backToMenu}>Back to Menu</button>
    </div>
  );
}

export default GameResult;