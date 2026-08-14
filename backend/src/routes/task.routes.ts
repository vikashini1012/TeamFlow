import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { createTask,
  getProjectTasks,updateTask, updateTaskStatus, deleteTask
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

router.put(
  "/tasks/:taskId",
  authenticate,
  updateTask
);

router.patch(
  "/tasks/:taskId/status",
  authenticate,
  updateTaskStatus
);

router.delete(
  "/tasks/:taskId",
  authenticate,
  deleteTask
);

export default router;