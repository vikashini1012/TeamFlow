import { Router } from "express";
import {
  createTeam,
  getMyTeams,
  getTeamById,
  addTeamMember,
} from "../controllers/team.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, createTeam);
router.get("/", authenticate, getMyTeams);
router.get("/:id", authenticate, getTeamById);
router.post("/:id/members", authenticate, addTeamMember);

export default router;