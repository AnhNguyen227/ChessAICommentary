import { Server, Socket } from "socket.io";
import { Chess } from "chess.js";
import { nanoid } from "nanoid";
import Game from "../models/Game";
import mongoose from "mongoose";
import {
  createRoom,
  getRoom,
  updateRoom,
  deleteRoom,
  getRoomBySocketId,
  Room,
} from "../services/roomStore";
import { createStockfishProcess, getBestMoveAndEval, getEval } from "../services/stockfish";
import { ChildProcessWithoutNullStreams } from "child_process";

const stockfishProcesses = new Map<string, ChildProcessWithoutNullStreams>();

const roomTimers = new Map<string, ReturnType<typeof setTimeout>>();

const TIME_CONTROLS: Record<string, { minutes: number; increment: number }> = {
  "blitz-3": { minutes: 3, increment: 0 },
  "blitz-3-2": { minutes: 3, increment: 2 },
  "blitz-5": { minutes: 5, increment: 0 },
  "rapid-10": { minutes: 10, increment: 0 },
  "rapid-15-10": { minutes: 15, increment: 10 },
  "rapid-30": { minutes: 30, increment: 0 },
};

const handleGameOver = async (
  io: Server,
  roomId: string,
  winner: "host" | "away" | "draw",
  endReason:
    | "checkmate" | "forfeit" | "timeout" | "resign"
    | "draw" | "stalemate" | "insufficient_material"
    | "threefold_repetition" | "fifty_move_rule"
): Promise<void> => {
  const room = getRoom(roomId);
  if (!room) return;

  // Stop the clock
  if (room.timer.interval) clearInterval(room.timer.interval);

  // Persist result to MongoDB
  room.game.status = "completed";
  room.game.winner = winner;
  room.game.endReason = endReason;
  await room.game.save();

  io.to(roomId).emit("game:over", {
    winner,
    endReason,
    pgn: room.game.pgn,
  });

  const sf = stockfishProcesses.get(roomId);
  if (sf) {
    sf.kill();
    stockfishProcesses.delete(roomId);
  }

  deleteRoom(roomId);
};

const startClock = (io: Server, roomId: string): void => {
  const TICK = 1000;

  const interval = setInterval(async () => {
    const room = getRoom(roomId);
    if (!room || room.game.status !== "active") {
      clearInterval(interval);
      return;
    }

    const chess = new Chess();
    room.game.moves.forEach((move) => chess.move(move));
    const turn = chess.turn(); // "w" or "b"

    const hostIsWhite = room.game.hostColor === "white";
    const isHostTurn = (turn === "w" && hostIsWhite) || (turn === "b" && !hostIsWhite);

    if (isHostTurn) {
      room.timer.hostMs -= TICK;
    } else {
      room.timer.awayMs -= TICK;
    }

    updateRoom(roomId, { timer: room.timer });

    io.to(roomId).emit("game:timer", {
      hostMs: room.timer.hostMs,
      awayMs: room.timer.awayMs,
    });

    // Check for timeout
    if (room.timer.hostMs <= 0 || room.timer.awayMs <= 0) {
      clearInterval(interval);
      const timedOutSide = room.timer.hostMs <= 0 ? "host" : "away";
      await handleGameOver(io, roomId, timedOutSide === "host" ? "away" : "host", "timeout");
    }
  }, TICK);

  updateRoom(roomId, { timer: { ...getRoom(roomId)!.timer, interval } });
};

export const initSocket = (io: Server): void => {
  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ─── ROOM:CREATE ───────────────────────────────────────────
    socket.on(
      "room:create",
      async (data: {
        timeControlKey: string;
        hostColor: "white" | "black" | "random";
        isStockfish: boolean;
        stockfishLevel: number | null;
        userId: string | null;
      }) => {
        const timeControl = TIME_CONTROLS[data.timeControlKey];
        if (!timeControl) {
          socket.emit("game:error", { message: "Invalid time control" });
          return;
        }

        const resolvedColor =
          data.hostColor === "random"
            ? Math.random() < 0.5
              ? "white"
              : "black"
            : data.hostColor;

        const roomId = nanoid(8);
        const startMs = timeControl.minutes * 60 * 1000;

        try {
          const game = await Game.create({
            roomId,
            host: data.userId ?? null,
            away: null,
            hostColor: resolvedColor,
            timeControl,
            status: "waiting",
            isStockfish: data.isStockfish,
            stockfishLevel: data.isStockfish ? data.stockfishLevel : null,
          });

          const room: Room = {
            game,
            hostSocketId: socket.id,
            awaySocketId: null,
            timer: { hostMs: startMs, awayMs: startMs, interval: null },
            drawOfferedBy: null,
          };

          createRoom(roomId, room);
          socket.join(roomId);

          // Auto-expire room after 10 minutes if still waiting
          const expiryTimer = setTimeout(async () => {
            const room = getRoom(roomId);
            if (room && room.game.status === "waiting") {
              await Game.findOneAndDelete({ roomId });
              deleteRoom(roomId);
              io.to(roomId).emit("room:expired");
            }
          }, 10 * 60 * 1000);

          roomTimers.set(roomId, expiryTimer);

          socket.emit("room:created", {
            roomId,
            hostColor: resolvedColor,
            timeControl,
            isStockfish: data.isStockfish,
            stockfishLevel: data.stockfishLevel,
          });
        } catch (error) {
          socket.emit("game:error", { message: "Failed to create room" });
        }
      }
    );
    // ─── ROOM:JOIN ────────────────────────────────────────────
    socket.on("room:join", async (data: { roomId: string; userId: string | null }) => {
      const room = getRoom(data.roomId);

      if (!room) {
        socket.emit("game:error", { message: "Room not found" });
        return;
      }
      if (room.game.status !== "waiting") {
        socket.emit("game:error", { message: "Room is no longer available" });
        return;
      }
      if (room.awaySocketId !== null) {
        socket.emit("game:error", { message: "Room is full" });
        return;
      }
      if (room.game.isStockfish) {
        socket.emit("game:error", { message: "This room is a Stockfish game" });
        return;
      }
      if (room.hostSocketId === socket.id) {
        socket.emit("game:error", { message: "Cannot join your own room" });
        return;
      }

      updateRoom(data.roomId, { awaySocketId: socket.id });
      room.game.away = data.userId ? new mongoose.Types.ObjectId(data.userId) : null;
      await room.game.save();

      socket.join(data.roomId);

      const timer = roomTimers.get(data.roomId);
      if (timer) {
        clearTimeout(timer);
        roomTimers.delete(data.roomId);
      }

      io.to(data.roomId).emit("room:joined", {
        roomId: data.roomId,
        hostColor: room.game.hostColor,
        timeControl: room.game.timeControl,
        isStockfish: room.game.isStockfish,
      });
    });

    // ─── ROOM:LEAVE ───────────────────────────────────────────
    socket.on("room:leave", async (data: { roomId: string }) => {
      const room = getRoom(data.roomId);

      if (!room || room.awaySocketId !== socket.id) return;

      updateRoom(data.roomId, { awaySocketId: null });
      room.game.away = null;
      await room.game.save();

      socket.leave(data.roomId);

      io.to(data.roomId).emit("room:left");
    });

    // ─── ROOM:DISCARD ─────────────────────────────────────────
    socket.on("room:discard", async (data: { roomId: string }) => {
      const room = getRoom(data.roomId);

      if (!room || room.hostSocketId !== socket.id) return;
      if (room.game.status === "active") return; // handled by resign/forfeit

      const timer = roomTimers.get(data.roomId);
      if (timer) {
        clearTimeout(timer);
        roomTimers.delete(data.roomId);
      }

      await Game.findOneAndDelete({ roomId: data.roomId });
      deleteRoom(data.roomId);

      io.to(data.roomId).emit("room:discarded");
    });

    // ─── ROOM:START ───────────────────────────────────────────
    socket.on("room:start", async (data: { roomId: string }) => {
      const room = getRoom(data.roomId);

      if (!room || room.hostSocketId !== socket.id) return;
      if (room.game.status !== "waiting") return;
      if (!room.awaySocketId && !room.game.isStockfish) return;

      room.game.status = "active";
      await room.game.save();
      updateRoom(data.roomId, { ...room, game: room.game });

      const chess = new Chess();

      // Spawn Stockfish for every game (used for eval even in human vs human)
      const sf = await createStockfishProcess();
      stockfishProcesses.set(data.roomId, sf);

      const timer = roomTimers.get(data.roomId);
      if (timer) {
        clearTimeout(timer);
        roomTimers.delete(data.roomId);
      }

      io.to(data.roomId).emit("game:started", {
        roomId: data.roomId,
        fen: chess.fen(),
        hostColor: room.game.hostColor,
        timeControl: room.game.timeControl,
        timerState: {
          hostMs: room.timer.hostMs,
          awayMs: room.timer.awayMs,
        },
      });

      startClock(io, data.roomId);

      // If Stockfish is playing as white, make the first move immediately
      if (room.game.isStockfish) {
        const chess = new Chess(); // fresh board, no moves yet
        const stockfishColor = room.game.hostColor === "white" ? "black" : "white";
        if (stockfishColor === "white") {
          const depth = room.game.stockfishLevel ?? 10;
          const { bestMove, evaluation } = await getBestMoveAndEval(sf, chess.fen(), depth);
          io.to(data.roomId).emit("game:eval", { eval: evaluation });

          const from = bestMove.slice(0, 2);
          const to = bestMove.slice(2, 4);
          const promotion = bestMove[4] ?? undefined;
          const result = chess.move({ from, to, promotion });
          if (result) {
            await processMove(data.roomId, chess, result.san, "stockfish");
          }
        }
      }
    });

    // ─── PROCESS MOVE (shared logic for human and Stockfish moves) ────────────
    async function processMove(
      roomId: string,
      chess: Chess,
      moveStr: string,
      movedBy: "host" | "away" | "stockfish"
    ) {
      const room = getRoom(roomId);
      if (!room) return;

      // Apply increment to the player who just moved
      if (room.game.timeControl.increment > 0 && movedBy !== "stockfish") {
        const incrementMs = room.game.timeControl.increment * 1000;
        if (movedBy === "host") room.timer.hostMs += incrementMs;
        else room.timer.awayMs += incrementMs;
      }

      // Save move
      room.game.moves.push(moveStr);
      room.game.pgn = chess.pgn();
      await room.game.save();
      updateRoom(roomId, { game: room.game, timer: room.timer });

      // Emit updated state
      io.to(roomId).emit("game:state", {
        fen: chess.fen(),
        lastMove: moveStr,
        timerState: {
          hostMs: room.timer.hostMs,
          awayMs: room.timer.awayMs,
        },
        turn: chess.turn(),
      });

      // Check game over
      if (chess.isCheckmate()) {
        const winner = movedBy === "stockfish"
          ? (room.game.hostColor === "white" ? "away" : "host") // stockfish wins
          : movedBy;
        await handleGameOver(io, roomId, winner, "checkmate");
        return true;
      }
      if (chess.isStalemate()) {
        await handleGameOver(io, roomId, "draw", "stalemate");
        return true;
      }
      if (chess.isInsufficientMaterial()) {
        await handleGameOver(io, roomId, "draw", "insufficient_material");
        return true;
      }
      if (chess.isThreefoldRepetition()) {
        await handleGameOver(io, roomId, "draw", "threefold_repetition");
        return true;
      }
      if (chess.isDraw()) {
        await handleGameOver(io, roomId, "draw", "fifty_move_rule");
        return true;
      }

      return false; // game still ongoing
    }

    // ─── GAME:MOVE ────────────────────────────────────────────
    socket.on("game:move", async (data: { roomId: string; move: string }) => {
      const room = getRoom(data.roomId);
      if (!room || room.game.status !== "active") return;

      const isHost = room.hostSocketId === socket.id;
      const isAway = room.awaySocketId === socket.id;
      if (!isHost && !isAway) return;

      // Reconstruct board state
      const chess = new Chess();
      room.game.moves.forEach((move) => chess.move(move));

      // Validate turn
      const turn = chess.turn();
      const hostIsWhite = room.game.hostColor === "white";
      const isHostTurn = (turn === "w" && hostIsWhite) || (turn === "b" && !hostIsWhite);

      if (isHost && !isHostTurn) {
        socket.emit("game:error", { message: "Not your turn" });
        return;
      }
      if (isAway && isHostTurn) {
        socket.emit("game:error", { message: "Not your turn" });
        return;
      }

      // Validate and apply the human move
      let result;
      try {
        result = chess.move(data.move);
      } catch {
        socket.emit("game:error", { message: "Invalid move" });
        return;
      }
      if (!result) {
        socket.emit("game:error", { message: "Invalid move" });
        return;
      }

      const movedBy = isHost ? "host" : "away";
      const gameOver = await processMove(data.roomId, chess, data.move, movedBy);
      if (gameOver) return;

      // Stockfish response
      const sf = stockfishProcesses.get(data.roomId);
      if (!sf) return;

      const stockfishColor = room.game.hostColor === "white" ? "black" : "white";
      const stockfishTurn = stockfishColor === "white" ? "w" : "b";

      if (room.game.isStockfish && chess.turn() === stockfishTurn) {
        // Get best move and eval in one shot
        const depth = room.game.stockfishLevel ?? 10;
        const { bestMove, evaluation } = await getBestMoveAndEval(sf, chess.fen(), depth);

        io.to(data.roomId).emit("game:eval", { eval: evaluation });

        const from = bestMove.slice(0, 2);
        const to = bestMove.slice(2, 4);
        const promotion = bestMove[4] ?? undefined;

        let sfResult;
        try {
          sfResult = chess.move({ from, to, promotion });
        } catch {
          console.error("Stockfish returned an invalid move:", bestMove);
          return;
        }
        if (!sfResult) return;

        await processMove(data.roomId, chess, sfResult.san, "stockfish");
      } else {
        // Human vs human — just emit eval
        const evaluation = await getEval(sf, chess.fen());
        io.to(data.roomId).emit("game:eval", { eval: evaluation });
      }
    });

    // ─── GAME:RESIGN ──────────────────────────────────────────
    socket.on("game:resign", async (data: { roomId: string }) => {
      const room = getRoom(data.roomId);
      if (!room || room.game.status !== "active") return;

      const isHost = room.hostSocketId === socket.id;
      const winner = isHost ? "away" : "host";
      await handleGameOver(io, data.roomId, winner, "resign");
    });

    // ─── GAME:DRAW:OFFER ──────────────────────────────────────
    socket.on("game:draw:offer", (data: { roomId: string }) => {
      const room = getRoom(data.roomId);
      if (!room || room.game.status !== "active") return;

      const isHost = room.hostSocketId === socket.id;
      const offeredBy = isHost ? "host" : "away";

      updateRoom(data.roomId, { drawOfferedBy: offeredBy });
      io.to(data.roomId).emit("game:draw:offered", { offeredBy });
    });

    // ─── GAME:DRAW:ACCEPT ─────────────────────────────────────
    socket.on("game:draw:accept", async (data: { roomId: string }) => {
      const room = getRoom(data.roomId);
      if (!room || room.game.status !== "active") return;
      if (!room.drawOfferedBy) return;

      const isHost = room.hostSocketId === socket.id;
      const responder = isHost ? "host" : "away";

      // Only the opponent can accept
      if (responder === room.drawOfferedBy) {
        socket.emit("game:error", { message: "Cannot accept your own draw offer" });
        return;
      }

      await handleGameOver(io, data.roomId, "draw", "draw");
    });

    // ─── GAME:DRAW:DECLINE ────────────────────────────────────
    socket.on("game:draw:decline", (data: { roomId: string }) => {
      const room = getRoom(data.roomId);
      if (!room) return;

      updateRoom(data.roomId, { drawOfferedBy: null });
      io.to(data.roomId).emit("game:draw:declined");
    });

    // ─── DISCONNECT ───────────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const result = getRoomBySocketId(socket.id);
      if (!result) return;

      const [roomId, room] = result;

      if (room.game.status === "waiting") {
        // Clean up room with no match history
        await Game.findOneAndDelete({ roomId });
        deleteRoom(roomId);
        io.to(roomId).emit("room:discarded");
        return;
      }

      if (room.game.status === "active") {
        const isHost = room.hostSocketId === socket.id;
        const winner = isHost ? "away" : "host";
        await handleGameOver(io, roomId, winner, "forfeit");
      }
    });
  });
};