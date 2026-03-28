import { useState } from "react";
import { useGame } from "../../context/GameContext";

const TIME_CONTROLS = [
  { key: "blitz-3", label: "Blitz • 3 min" },
  { key: "blitz-3-2", label: "Blitz • 3+2" },
  { key: "blitz-5", label: "Blitz • 5 min" },
  { key: "rapid-10", label: "Rapid • 10 min" },
  { key: "rapid-15-10", label: "Rapid • 15+10" },
  { key: "rapid-30", label: "Rapid • 30 min" },
];

type Mode = "select" | "create" | "join";

function GameMenu() {
  const { createRoom, joinRoom, error } = useGame();
  const [mode, setMode] = useState<Mode>("select");

  // Create room state
  const [timeControlKey, setTimeControlKey] = useState("blitz-3");
  const [hostColor, setHostColor] = useState<"white" | "black" | "random">("random");
  const [isStockfish, setIsStockfish] = useState(false);
  const [stockfishLevel, setStockfishLevel] = useState(5);
  const [commentaryStyle, setCommentaryStyle] = useState("");
  const [commentaryEnabled, setCommentaryEnabled] = useState(true);


  // Join room state
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

  if (mode === "select") {
    return (
      <div>
        <h1>CAIC</h1>
        {error && <p>{error}</p>}
        <button onClick={() => setMode("create")}>Create Room</button>
        <button onClick={() => setMode("join")}>Join Room</button>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div>
        <h2>Join a Room</h2>
        {error && <p>{error}</p>}
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button onClick={handleJoin}>Join</button>
        <button onClick={() => setMode("select")}>Back</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Create a Room</h2>
      {error && <p>{error}</p>}

      <div>
        <p>Time Control</p>
        {TIME_CONTROLS.map((tc) => (
          <button
            key={tc.key}
            onClick={() => setTimeControlKey(tc.key)}
            style={{ fontWeight: timeControlKey === tc.key ? "bold" : "normal" }}
          >
            {tc.label}
          </button>
        ))}
      </div>

      <div>
        <p>Play as</p>
        {(["white", "black", "random"] as const).map((color) => (
          <button
            key={color}
            onClick={() => setHostColor(color)}
            style={{ fontWeight: hostColor === color ? "bold" : "normal" }}
          >
            {color}
          </button>
        ))}
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={isStockfish}
            onChange={(e) => setIsStockfish(e.target.checked)}
          />
          Play vs Stockfish
        </label>
      </div>

      {isStockfish && (
        <div>
          <p>Difficulty: {stockfishLevel}</p>
          <input
            type="range"
            min={1}
            max={20}
            value={stockfishLevel}
            onChange={(e) => setStockfishLevel(Number(e.target.value))}
          />
        </div>
      )}

      <div>
        <label>
          <input
            type="checkbox"
            checked={commentaryEnabled}
            onChange={(e) => setCommentaryEnabled(e.target.checked)}
          />
          Live Commentary
        </label>

        {commentaryEnabled && (
          <input
            type="text"
            placeholder='e.g. "Commentate like an Englishman from the 1800s"'
            value={commentaryStyle}
            onChange={(e) => setCommentaryStyle(e.target.value)}
            maxLength={150}
          />
        )}
      </div>

      <button onClick={handleCreate}>Create Room</button>
      <button onClick={() => setMode("select")}>Back</button>
    </div>
  );
}

export default GameMenu;