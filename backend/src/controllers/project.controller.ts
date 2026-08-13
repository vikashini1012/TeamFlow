import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

export const createProject = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const teamId = req.params.teamId;

    if (typeof teamId !== "string") {
      return res.status(400).json({
        message: "Invalid team ID",
      });
    }

    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    // Check whether the requester belongs to the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: req.userId,
          teamId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "You are not a member of this team",
      });
    }

    // Only OWNER and ADMIN can create projects
    if (
      membership.role !== "OWNER" &&
      membership.role !== "ADMIN"
    ) {
      return res.status(403).json({
        message: "Only team owners and admins can create projects",
      });
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        teamId,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error: any) {
    console.error("Create project error:", error);

    // Prisma unique constraint
    if (error?.code === "P2002") {
      return res.status(409).json({
        message: "A project with this name already exists in this team",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getTeamProjects = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const teamId = req.params.teamId;

    if (typeof teamId !== "string") {
      return res.status(400).json({
        message: "Invalid team ID",
      });
    }

    const membership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: req.userId,
          teamId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "You are not a member of this team",
      });
    }

    const projects = await prisma.project.findMany({
      where: {
        teamId,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      projects,
    });
  } catch (error) {
    console.error("Get team projects error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

