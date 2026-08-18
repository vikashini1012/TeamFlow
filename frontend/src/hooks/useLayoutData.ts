import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export interface LayoutUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface LayoutTeam {
  id: string;
  name: string;
  description?: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
  memberCount: number;
  projectCount: number;
  createdAt: string;
}

export function getPercentage(count: number, total: number) {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

export function useLayoutData() {
  const navigate = useNavigate();
  const [user, setUser] = useState<LayoutUser | null>(null);
  const [teams, setTeams] = useState<LayoutTeam[]>([]);
  const [layoutLoading, setLayoutLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("teamflow_token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const [userResponse, teamsResponse] = await Promise.all([
          api.get("/auth/me"),
          api.get("/teams"),
        ]);
        setUser(userResponse.data.user);
        setTeams(teamsResponse.data.teams || []);
      } catch (error) {
        console.error("Failed to load application layout:", error);
        localStorage.removeItem("teamflow_token");
        navigate("/login");
      } finally {
        setLayoutLoading(false);
      }
    };

    load();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("teamflow_token");
    navigate("/login");
  };

  return {
    user,
    teams,
    layoutLoading,
    mobileMenuOpen,
    setMobileMenuOpen,
    handleLogout,
  };
}
