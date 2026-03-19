import { useGame } from "../../context/GameContext";

function GameLobby() {
  const { roomInfo, isHost, leaveRoom, discardRoom, startGame, error, awayJoined } = useGame();

  if (!roomInfo) return null;

  const canStart = roomInfo.isStockfish || awayJoined;
  return (
    <div>
      <h2>Game Lobby</h2>
      {error && <p>{error}</p>}

      <div>
        <p>Room ID: <strong>{roomInfo.roomId}</strong></p>
        <button onClick={() => navigator.clipboard.writeText(roomInfo.roomId)}>
          Copy Room ID
        </button>
      </div>

      <div>
        <p>Time Control: {roomInfo.timeControl.minutes} min
          {roomInfo.timeControl.increment > 0 && ` + ${roomInfo.timeControl.increment}s`}
        </p>
        <p>You are playing as: <strong>
          {isHost ? roomInfo.hostColor : roomInfo.hostColor === "white" ? "black" : "white"}
        </strong></p>
      </div>

      {isHost ? (
        <div>
          <p>
            {roomInfo.isStockfish
              ? `Playing vs Stockfish (Level ${roomInfo.stockfishLevel})`
              : "Waiting for opponent to join..."}
          </p>
          {canStart && (
            <button onClick={startGame}>Start Game</button>
          )}
          <button onClick={discardRoom}>Discard Room</button>
        </div>
      ) : (
        <div>
          <p>Waiting for host to start the game...</p>
          <button onClick={leaveRoom}>Leave Room</button>
        </div>
      )}
    </div>
  );
}

export default GameLobby;