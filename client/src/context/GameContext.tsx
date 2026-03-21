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

interface RoomInfo {
  roomId: string;
  hostColor: "white" | "black";
  timeControl: TimeControl;
  isStockfish: boolean;
  stockfishLevel: number | null;
}

type GamePhase = "menu" | "waiting" | "active" | "result";

interface GameContextType {
  phase: GamePhase;
  roomInfo: RoomInfo | null;
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
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [awayJoined, setAwayJoined] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    socket.connect();

    socket.on("room:created", (data: RoomInfo) => {
      setRoomInfo(data);
      setIsHost(true);
      setPhase("waiting");
    });

    socket.on("room:joined", (data: RoomInfo) => {
      setRoomInfo(data);
      setAwayJoined(true);
      setPhase("waiting");
    });

    socket.on("room:left", () => {
      setRoomInfo((prev) => prev ? { ...prev } : null);
      setAwayJoined(false);
    });

    socket.on("game:timer", (data: { hostMs: number; awayMs: number }) => {
      setGameState((prev) =>
        prev ? { ...prev, timerState: { hostMs: data.hostMs, awayMs: data.awayMs } } : prev
      );
    });

    socket.on("room:discarded", () => {
      setRoomInfo(null);
      setPhase("menu");
    });

    socket.on("room:expired", () => {
      setRoomInfo(null);
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
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback((data: {
    timeControlKey: string;
    hostColor: "white" | "black" | "random";
    isStockfish: boolean;
    stockfishLevel: number | null;
  }) => {
    socket.emit("room:create", { ...data, userId: user?._id ?? null });
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    socket.emit("room:join", { roomId, userId: user?._id ?? null });
  }, []);

  const leaveRoom = useCallback(() => {
    if (!roomInfo) return;
    socket.emit("room:leave", { roomId: roomInfo.roomId });
    setRoomInfo(null);
    setPhase("menu");
  }, [roomInfo]);

  const discardRoom = useCallback(() => {
    if (!roomInfo) return;
    socket.emit("room:discard", { roomId: roomInfo.roomId });
    setRoomInfo(null);
    setPhase("menu");
  }, [roomInfo]);

  const startGame = useCallback(() => {
    if (!roomInfo) return;
    socket.emit("room:start", { roomId: roomInfo.roomId });
  }, [roomInfo]);

  const makeMove = useCallback((move: string) => {
    if (!roomInfo) return;
    socket.emit("game:move", { roomId: roomInfo.roomId, move });
  }, [roomInfo]);

  const resign = useCallback(() => {
    if (!roomInfo) return;
    socket.emit("game:resign", { roomId: roomInfo.roomId });
  }, [roomInfo]);

  const offerDraw = useCallback(() => {
    if (!roomInfo) return;
    socket.emit("game:draw:offer", { roomId: roomInfo.roomId });
  }, [roomInfo]);

  const acceptDraw = useCallback(() => {
    if (!roomInfo) return;
    socket.emit("game:draw:accept", { roomId: roomInfo.roomId });
  }, [roomInfo]);

  const declineDraw = useCallback(() => {
    if (!roomInfo) return;
    socket.emit("game:draw:decline", { roomId: roomInfo.roomId });
  }, [roomInfo]);

  const backToMenu = useCallback(() => {
    setPhase("menu");
    setRoomInfo(null);
    setGameState(null);
    setGameResult(null);
    setError(null);
    setIsHost(false);
  }, []);

  return (
    <GameContext.Provider value={{
      phase, roomInfo, gameState, gameResult, error, isHost, awayJoined,
      createRoom, joinRoom, leaveRoom, discardRoom, startGame,
      makeMove, resign, offerDraw, acceptDraw, declineDraw, backToMenu,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
}