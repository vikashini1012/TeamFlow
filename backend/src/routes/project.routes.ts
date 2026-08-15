import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createProject,
  getTeamProjects,
  updateProject,
  deleteProject,
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

router.put(
  "/projects/:projectId",
  authenticate,
  updateProject
);

router.delete(
  "/projects/:projectId",
  authenticate,
  deleteProject
);

export default router;