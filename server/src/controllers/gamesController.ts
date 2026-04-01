import { Request, Response } from "express";
import Game from "../models/Game";
import mongoose from "mongoose";

export async function getMatchHistory(req: Request, res: Response) {
  const userId = (req.user as any)?._id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const games = await Game.find({
    status: "completed",
    $or: [{ host: userId }, { away: userId }],
  })
    .sort({ createdAt: -1 })
    .populate("host", "displayName")
    .populate("away", "displayName")
    .lean();

  const history = games.map((g) => {
    const isHost = g.host?._id?.toString() === userId.toString();
    const playerColor = isHost ? g.hostColor : g.hostColor === "white" ? "black" : "white";
    const result =
      g.winner === "draw" ? "draw"
        : (isHost && g.winner === "host") || (!isHost && g.winner === "away") ? "win"
          : "loss";

    const opponent = g.isStockfish
      ? `Stockfish (Level ${g.stockfishLevel})`
      : isHost
        ? (g.away as any)?.displayName ?? "Guest"
        : (g.host as any)?.displayName ?? "Guest";

    return {
      gameId: g._id,
      date: g.createdAt,
      opponent,
      timeControl: g.timeControl,
      color: playerColor,
      result,
      endReason: g.endReason,
      pgn: g.pgn,
    };
  });

  res.json(history);
}

export async function getStats(req: Request, res: Response) {
  const userId = (req.user as any)?._id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const games = await Game.find({
    status: "completed",
    $or: [{ host: userId }, { away: userId }],
  }).lean();

  const total = games.length;
  if (total === 0) return res.json({ total: 0, asWhite: null, asBlack: null, byTimeControl: {} });

  const compute = (filtered: typeof games) => {
    const wins = filtered.filter((g) => {
      const isHost = g.host?.toString() === userId.toString();
      return (isHost && g.winner === "host") || (!isHost && g.winner === "away");
    }).length;
    const draws = filtered.filter((g) => g.winner === "draw").length;
    const losses = filtered.length - wins - draws;
    return { played: filtered.length, wins, draws, losses };
  };

  const asWhite = games.filter((g) => {
    const isHost = g.host?.toString() === userId.toString();
    return isHost ? g.hostColor === "white" : g.hostColor === "black";
  });

  const asBlack = games.filter((g) => {
    const isHost = g.host?.toString() === userId.toString();
    return isHost ? g.hostColor === "black" : g.hostColor === "white";
  });

  // Group by time control label e.g. "10+0"
  const byTimeControl: Record<string, ReturnType<typeof compute>> = {};
  for (const g of games) {
    const key = `${g.timeControl.minutes}+${g.timeControl.increment}`;
    if (!byTimeControl[key]) {
      byTimeControl[key] = compute(games.filter(
        (x) => x.timeControl.minutes === g.timeControl.minutes &&
          x.timeControl.increment === g.timeControl.increment
      ));
    }
  }

  res.json({
    total,
    asWhite: compute(asWhite),
    asBlack: compute(asBlack),
    byTimeControl,
  });
}