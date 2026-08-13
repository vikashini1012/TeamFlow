import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { createTask } from "../controllers/task.controller";

const router = Router();

router.post(
  "/projects/:projectId/tasks",
  authenticate,
  createTask
);

export default router;