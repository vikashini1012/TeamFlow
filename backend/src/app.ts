import "dotenv/config";
import authRoutes from "./routes/auth.routes";
import express from "express";
import cors from "cors";
import prisma from "./lib/prisma";
import teamRoutes from "./routes/team.routes";
import projectRoutes from "./routes/project.routes";
import taskRoutes from "./routes/task.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/teams", teamRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", projectRoutes);
app.use("/api", taskRoutes);
app.get("/", (_req, res) => {
  res.json({
    message: "TeamFlow API is running!"
  });
});

app.get("/api/users", async (_req, res) => {
  try {
    const users = await prisma.user.findMany();

    res.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);

    res.status(500).json({
      message: "Failed to fetch users"
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`TeamFlow API running on http://localhost:${PORT}`);
});