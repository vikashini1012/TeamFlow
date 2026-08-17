import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

export const createTeam = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Team name is required",
      });
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,

        members: {
          create: {
            userId: req.userId,
            role: "OWNER",
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      message: "Team created successfully",
      team,
    });
  } catch (error) {
    console.error("Create team error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getMyTeams = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const memberships = await prisma.teamMember.findMany({
      where: {
        userId: req.userId,
      },
      include: {
        team: {
          include: {
            _count: {
              select: {
                members: true,
                projects: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    const teams = memberships.map((membership) => ({
      id: membership.team.id,
      name: membership.team.name,
      description: membership.team.description,
      role: membership.role,
      joinedAt: membership.joinedAt,
      memberCount: membership.team._count.members,
      projectCount: membership.team._count.projects,
      createdAt: membership.team.createdAt,
    }));

    return res.status(200).json({
      teams,
    });
  } catch (error) {
    console.error("Get my teams error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getTeamById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const id = req.params.id;

if (typeof id !== "string") {
  return res.status(400).json({
    message: "Invalid team ID",
  });
}

    const membership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: req.userId,
          teamId: id,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "You are not a member of this team",
      });
    }

    const team = await prisma.team.findUnique({
      where: {
        id,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            joinedAt: "asc",
          },
        },
        projects: {
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
        },
      },
    });

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    return res.status(200).json({
      team,
    });
  } catch (error) {
    console.error("Get team by ID error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const addTeamMember = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const teamId = req.params.id;

    if (typeof teamId !== "string") {
      return res.status(400).json({
        message: "Invalid team ID",
      });
    }

    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "User email is required",
      });
    }

    // Check whether the requester belongs to the team
    const requesterMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: req.userId,
          teamId,
        },
      },
    });

    if (!requesterMembership) {
      return res.status(403).json({
        message: "You are not a member of this team",
      });
    }

    // Only OWNER and ADMIN can add members
    if (
      requesterMembership.role !== "OWNER" &&
      requesterMembership.role !== "ADMIN"
    ) {
      return res.status(403).json({
        message: "Only team owners and admins can add members",
      });
    }

    // Find the user being added
    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check if the user is already a member
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: user.id,
          teamId,
        },
      },
    });

    if (existingMembership) {
      return res.status(409).json({
        message: "User is already a member of this team",
      });
    }

    // Validate requested role
    const memberRole =
      role === "ADMIN" ? "ADMIN" : "MEMBER";

    // Prevent ADMIN from creating another OWNER
    // OWNER is never accepted through this endpoint.
    const membership = await prisma.teamMember.create({
      data: {
        userId: user.id,
        teamId,
        role: memberRole,
      },
      include: {
        user: {
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
      message: "Member added successfully",
      member: membership,
    });
  } catch (error) {
    console.error("Add team member error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const updateTeam = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const teamId = req.params.id;

    if (typeof teamId !== "string") {
      return res.status(400).json({
        message: "Invalid team ID",
      });
    }

    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Team name is required",
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

    if (
      membership.role !== "OWNER" &&
      membership.role !== "ADMIN"
    ) {
      return res.status(403).json({
        message:
          "Only team owners and admins can update the team",
      });
    }

    const updatedTeam = await prisma.team.update({
      where: {
        id: teamId,
      },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return res.status(200).json({
      message: "Team updated successfully",
      team: updatedTeam,
    });
  } catch (error: any) {
    console.error("Update team error:", error);

    if (error?.code === "P2002") {
      return res.status(409).json({
        message: "A team with this name already exists",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const deleteTeam = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const teamId = req.params.id;

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

    // Only the team OWNER can delete the entire team.
    if (membership.role !== "OWNER") {
      return res.status(403).json({
        message:
          "Only the team owner can delete the team",
      });
    }

    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      select: {
        id: true,
      },
    });

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    await prisma.team.delete({
      where: {
        id: teamId,
      },
    });

    return res.status(200).json({
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("Delete team error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};