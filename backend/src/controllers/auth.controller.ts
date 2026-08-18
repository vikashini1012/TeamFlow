import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middleware/auth.middleware";

const PASSWORD_RESET_EXPIRY_MINUTES = 30;

const safeUser = (user: {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl,
  createdAt: user.createdAt,
});

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      jwtSecret,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const { name, avatarUrl } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    if (
      avatarUrl !== undefined &&
      avatarUrl !== null &&
      typeof avatarUrl !== "string"
    ) {
      return res.status(400).json({
        message: "Avatar URL must be a valid string",
      });
    }

    const user = await prisma.user.update({
      where: {
        id: req.userId,
      },
      data: {
        name: name.trim(),
        avatarUrl:
          typeof avatarUrl === "string"
            ? avatarUrl.trim() || null
            : avatarUrl,
      },
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message:
          "Current password, new password and confirmation are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New passwords do not match",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const matches = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!matches) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: {
        id: req.userId,
      },
      data: {
        passwordHash,
      },
    });

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response
) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    /*
     * Always return the same public response so an attacker
     * cannot discover which email addresses are registered.
     */
    const genericResponse = {
      message:
        "If an account exists for that email, a password reset request has been created.",
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() +
        PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000
    );

    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        expiresAt,
        userId: user.id,
      },
    });

    /*
     * There is currently no email provider in TeamFlow.
     * In development we expose the token so the flow can be
     * tested locally. Production should deliver this token
     * through an email provider instead.
     */
    if (process.env.NODE_ENV !== "production") {
      return res.status(200).json({
        ...genericResponse,
        resetToken: rawToken,
        expiresAt,
      });
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      token,
      newPassword,
      confirmPassword,
    } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message:
          "Reset token, new password and confirmation are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const resetRequest =
      await prisma.passwordResetToken.findUnique({
        where: {
          tokenHash,
        },
      });

    if (
      !resetRequest ||
      resetRequest.usedAt ||
      resetRequest.expiresAt < new Date()
    ) {
      return res.status(400).json({
        message: "Invalid or expired password reset token",
      });
    }

    const passwordHash = await bcrypt.hash(
      newPassword,
      10
    );

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: resetRequest.userId,
        },
        data: {
          passwordHash,
        },
      }),
      prisma.passwordResetToken.update({
        where: {
          id: resetRequest.id,
        },
        data: {
          usedAt: new Date(),
        },
      }),
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: resetRequest.userId,
          id: {
            not: resetRequest.id,
          },
        },
      }),
    ]);

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};