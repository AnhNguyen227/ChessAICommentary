import { useGame } from "../context/GameContext";
import GameMenu from "../components/game/GameMenu";
import GameLobby from "../components/game/GameLobby";
import GameBoard from "../components/game/GameBoard";
import GameResult from "../components/game/GameResult";

function Game() {
  const { phase } = useGame();

  return (
    <div className="min-h-screen bg-background">
      {phase === "menu" && <GameMenu />}
      {phase === "waiting" && <GameLobby />}
      {phase === "active" && <GameBoard />}
      {phase === "result" && <GameResult />}
    </div>
  );
}

export default Game;