import { Request, Response, NextFunction } from "express";

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated()) {
    return next();
  }
  console.log("requireAuth - sessionID:", req.sessionID, "passport:", (req.session as any)?.passport);
  res.status(401).json({ message: "Unauthorized" });
};