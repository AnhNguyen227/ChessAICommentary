import { createContext, useContext, useEffect, useState, useCallback } from "react";
import socket from "../socket";
import { useAuth } from "./AuthContext";

interface TimeControl {
  minutes: number;
  increment: number;
}

interface TimerState {
  hostMs: number;
  awayMs: number;
}

interface GameState {
  fen: string;
  lastMove: string | null;
  timerState: TimerState;
  turn: "w" | "b";
}

interface GameResult {
  winner: "host" | "away" | "draw";
  endReason:
  | "checkmate" | "forfeit" | "timeout" | "resign"
  | "draw" | "stalemate" | "insufficient_material"
  | "threefold_repetition" | "fifty_move_rule";
  pgn: string;
}

interface RoomConfig {
  roomId: string;
  hostColor: "white" | "black";
  timeControl: TimeControl;
  isStockfish: boolean;
  stockfishLevel: number | null;
}

type GamePhase = "menu" | "waiting" | "active" | "result";

interface GameContextType {
  phase: GamePhase;
  roomConfig: RoomConfig | null;
  gameState: GameState | null;
  gameResult: GameResult | null;
  error: string | null;
  isHost: boolean;
  awayJoined: boolean;
  createRoom: (data: {
    timeControlKey: string;
    hostColor: "white" | "black" | "random";
    isStockfish: boolean;
    stockfishLevel: number | null;
    commentaryStyle: string | null;
    commentaryEnabled: boolean;
  }) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  discardRoom: () => void;
  startGame: () => void;
  makeMove: (move: string) => void;
  resign: () => void;
  offerDraw: () => void;
  acceptDraw: () => void;
  declineDraw: () => void;
  backToMenu: () => void;
  commentary: string | null;
  evaluation: number | null;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [awayJoined, setAwayJoined] = useState(false);
  const [commentary, setCommentary] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<number | null>(null);

  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    socket.connect();

    socket.on("room:created", (data: RoomConfig) => {
      setRoomConfig(data);
      setIsHost(true);
      setPhase("waiting");
    });

    socket.on("room:joined", (data: RoomConfig) => {
      setRoomConfig(data);
      setAwayJoined(true);
      setPhase("waiting");
    });

    socket.on("room:left", () => {
      setRoomConfig((prev) => prev ? { ...prev } : null);
      setAwayJoined(false);
    });

    socket.on("game:timer", (data: { hostMs: number; awayMs: number }) => {
      setGameState((prev) =>
        prev ? { ...prev, timerState: { hostMs: data.hostMs, awayMs: data.awayMs } } : prev
      );
    });

    socket.on("room:discarded", () => {
      setRoomConfig(null);
      setPhase("menu");
    });

    socket.on("room:expired", () => {
      setRoomConfig(null);
      setPhase("menu");
      setError("Room expired due to inactivity."); // or however you handle notifications
    });

    socket.on("game:started", (data: GameState & { roomId: string; hostColor: "white" | "black"; timeControl: TimeControl }) => {
      setGameState({
        fen: data.fen,
        lastMove: null,
        timerState: data.timerState,
        turn: data.turn,
      });
      setPhase("active");
    });

    socket.on("game:state", (data: GameState) => {
      setGameState(data);
    });

    socket.on("game:commentary", (data: { text: string }) => {
      setCommentary(data.text);
    });

    socket.on("game:eval", (data: { eval: number }) => {
      setEvaluation(data.eval);
    });

    socket.on("game:over", (data: GameResult) => {
      setGameResult(data);
      setPhase("result");
    });

    socket.on("game:error", (data: { message: string }) => {
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    return () => {
      socket.off("room:created");
      socket.off("room:joined");
      socket.off("room:left");
      socket.off("room:discarded");
      socket.off("game:started");
      socket.off("game:state");
      socket.off("game:over");
      socket.off("game:error");
      socket.off("game:commentary");
      socket.off("game:eval");
      socket.disconnect();
    };
  }, [loading]);

  const createRoom = useCallback((data: {
    timeControlKey: string;
    hostColor: "white" | "black" | "random";
    isStockfish: boolean;
    stockfishLevel: number | null;
    commentaryStyle: string | null;
    commentaryEnabled: boolean;
  }) => {
    socket.emit("room:create", {
      ...data,
      userId: user?._id ?? null,
    });
  }, [user]);

  const joinRoom = useCallback((roomId: string) => {
    socket.emit("room:join", { roomId, userId: user?._id ?? null });
  }, [user]);

  const leaveRoom = useCallback(() => {
    if (!roomConfig) return;
    socket.emit("room:leave", { roomId: roomConfig.roomId });
    setRoomConfig(null);
    setPhase("menu");
  }, [roomConfig]);

  const discardRoom = useCallback(() => {
    if (!roomConfig) return;
    socket.emit("room:discard", { roomId: roomConfig.roomId });
    setRoomConfig(null);
    setPhase("menu");
  }, [roomConfig]);

  const startGame = useCallback(() => {
    if (!roomConfig) return;
    socket.emit("room:start", { roomId: roomConfig.roomId });
  }, [roomConfig]);

  const makeMove = useCallback((move: string) => {
    if (!roomConfig) return;
    socket.emit("game:move", { roomId: roomConfig.roomId, move });
  }, [roomConfig]);

  const resign = useCallback(() => {
    if (!roomConfig) return;
    socket.emit("game:resign", { roomId: roomConfig.roomId });
  }, [roomConfig]);

  const offerDraw = useCallback(() => {
    if (!roomConfig) return;
    socket.emit("game:draw:offer", { roomId: roomConfig.roomId });
  }, [roomConfig]);

  const acceptDraw = useCallback(() => {
    if (!roomConfig) return;
    socket.emit("game:draw:accept", { roomId: roomConfig.roomId });
  }, [roomConfig]);

  const declineDraw = useCallback(() => {
    if (!roomConfig) return;
    socket.emit("game:draw:decline", { roomId: roomConfig.roomId });
  }, [roomConfig]);

  const backToMenu = useCallback(() => {
    setPhase("menu");
    setRoomConfig(null);
    setGameState(null);
    setGameResult(null);
    setError(null);
    setIsHost(false);
  }, []);

  return (
    <GameContext.Provider value={{
      commentary, evaluation, phase, roomConfig: roomConfig, gameState, gameResult, error, isHost, awayJoined,
      createRoom, joinRoom, leaveRoom, discardRoom, startGame,
      makeMove, resign, offerDraw, acceptDraw, declineDraw, backToMenu,
    }}>
      {children}
    </GameContext.Provider>
  );
}

/**
 * Provides game state and actions to manage chess games, including room creation/joining, game state updates, and game actions like making moves, resigning, and offering/accepting draws.
 *
 * Usage: Wrap your app with <GameProvider> and use the useGame() hook to access game state and actions in your components.
 * @returns Game context values and actions
 */
export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
}