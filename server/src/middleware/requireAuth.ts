import { Request, Response, NextFunction } from "express";

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated()) {
    return next();
  }
  console.log("requireAuth - user:", req.user);
  res.status(401).json({ message: "Unauthorized" });
};