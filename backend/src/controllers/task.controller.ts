import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

export const createTask = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const projectId = req.params.projectId;

    if (typeof projectId !== "string") {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    const {
      title,
      description,
      priority,
      dueDate,
      assigneeId,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Task title is required",
      });
    }

    // Find the project and its team
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        id: true,
        teamId: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Check whether requester belongs to the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: req.userId,
          teamId: project.teamId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "You are not a member of this team",
      });
    }

    // Validate assignee if provided
    if (assigneeId) {
      const assigneeMembership =
        await prisma.teamMember.findUnique({
          where: {
            userId_teamId: {
              userId: assigneeId,
              teamId: project.teamId,
            },
          },
        });

      if (!assigneeMembership) {
        return res.status(400).json({
          message:
            "Assignee must be a member of the project team",
        });
      }
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        projectId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getProjectTasks = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const projectId = req.params.projectId;

    if (typeof projectId !== "string") {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    // Find the project and its team
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        id: true,
        teamId: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Check whether requester belongs to the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: req.userId,
          teamId: project.teamId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "You are not a member of this team",
      });
    }

    // Get all tasks belonging to the project
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      tasks,
    });
  } catch (error) {
    console.error("Get project tasks error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const updateTask = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const taskId = req.params.taskId;

    if (typeof taskId !== "string") {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const {
      title,
      description,
      priority,
      dueDate,
      assigneeId,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Task title is required",
      });
    }

    // Find the existing task and its project/team
    const existingTask = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: {
          select: {
            id: true,
            teamId: true,
          },
        },
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // Check whether requester belongs to the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: req.userId,
          teamId: existingTask.project.teamId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "You are not a member of this team",
      });
    }

    // Validate assignee if provided
    if (assigneeId) {
      const assigneeMembership =
        await prisma.teamMember.findUnique({
          where: {
            userId_teamId: {
              userId: assigneeId,
              teamId: existingTask.project.teamId,
            },
          },
        });

      if (!assigneeMembership) {
        return res.status(400).json({
          message:
            "Assignee must be a member of the project team",
        });
      }
    }

    const task = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Update task error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};