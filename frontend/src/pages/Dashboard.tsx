import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem("teamflow_token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await api.get("/auth/me");

        setUser(response.data.user);
      } catch (error) {
        console.error("Authentication failed:", error);

        localStorage.removeItem("teamflow_token");

        setError("Your session has expired. Please login again.");

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("teamflow_token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div>
        <h1>TeamFlow</h1>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>TeamFlow</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>TeamFlow Dashboard</h1>

      {user && (
        <div>
          <h2>Welcome back, {user.name}! 👋</h2>

          <p>Email: {user.email}</p>

          <p>User ID: {user.id}</p>

          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;