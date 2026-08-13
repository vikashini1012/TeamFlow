import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createProject,
  getTeamProjects,
} from "../controllers/project.controller";

const router = Router();

router.post(
  "/teams/:teamId/projects",
  authenticate,
  createProject
);

router.get(
  "/teams/:teamId/projects",
  authenticate,
  getTeamProjects
);

export default router;