import express from "express";
import passport from "passport";
import { getMe, logout, linkChessCom } from "../controllers/authController";
import { requireAuth } from "../middleware/requireAuth";

const router = express.Router();

// @route   GET /auth/google
// @desc    Redirect to Google OAuth
// @access  Public
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account" })
);

// @route   GET /auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    console.log("OAuth success, user:", (req.user as any)?._id, "session:", req.session.id, "req.secure:", req.secure);
    req.session.save((err) => {
      if (err) console.error("Session save error:", err);
      res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    });
  }
);

// @route   GET /auth/me
// @desc    Get current logged in user
// @access  Private
router.get("/me", requireAuth, getMe);

// @route   POST /auth/logout
// @desc    Logout user
// @access  Private
router.post("/logout", requireAuth, logout);

// @route   PUT /auth/chess-com
// @desc    Link Chess.com account
// @access  Private
router.put("/chess-com", requireAuth, linkChessCom);

export default router;