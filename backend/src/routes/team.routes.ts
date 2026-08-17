import { Router } from "express";
import {
  createTeam,
  getMyTeams,
  getTeamById,
  addTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  updateTeam,
  getDashboardAnalytics,
  deleteTeam,
} from "../controllers/team.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  createTeam
);

router.get(
  "/",
  authenticate,
  getMyTeams
);

// IMPORTANT:
// Keep specific routes before "/:id"
router.get(
  "/analytics",
  authenticate,
  getDashboardAnalytics
);

router.get(
  "/:id",
  authenticate,
  getTeamById
);

router.post(
  "/:id/members",
  authenticate,
  addTeamMember
);

router.put(
  "/:id",
  authenticate,
  updateTeam
);

router.delete(
  "/:id",
  authenticate,
  deleteTeam
);

router.put(
  "/:id/members/:memberId",
  authenticate,
  updateTeamMemberRole
);

router.delete(
  "/:id/members/:memberId",
  authenticate,
  removeTeamMember
);

export default router;