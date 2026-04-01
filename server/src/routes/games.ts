import { Router } from "express";
import { getMatchHistory, getStats } from "../controllers/gamesController";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/", requireAuth, getMatchHistory);
router.get("/stats", requireAuth, getStats);

export default router;