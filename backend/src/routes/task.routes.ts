import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createTask,
  getProjectTasks,
} from "../controllers/task.controller";

const router = Router();

router.post(
  "/projects/:projectId/tasks",
  authenticate,
  createTask
);

router.get(
  "/projects/:projectId/tasks",
  authenticate,
  getProjectTasks
);

export default router;