import { Request, Response } from "express";
import { IUser } from "../models/User";
import axios from "axios";

export const getMe = (req: Request, res: Response): void => {
  res.json(req.user);
};

export const logout = (req: Request, res: Response): void => {
  req.logout((err) => {
    if (err) {
      res.status(500).json({ message: "Error logging out" });
      return;
    }
    res.json({ message: "Logged out successfully" });
  });
};

export const linkChessCom = async (req: Request, res: Response): Promise<void> => {
  const { username } = req.body;

  if (!username) {
    res.status(400).json({ message: "Username is required" });
    return;
  }

  try {
    // Verify the username exists on Chess.com
    const response = await axios.get(`https://api.chess.com/pub/player/${username}`);
    const chessComElo = response.data?.ratings?.rapid?.last?.rating ?? null;

    const user = req.user as IUser;
    user.chessComUsername = username;
    user.chessComElo = chessComElo;
    await user.save();

    res.json({ message: "Chess.com account linked", chessComUsername: username, chessComElo });
  } catch (error) {
    res.status(404).json({ message: "Chess.com username not found" });
  }
};