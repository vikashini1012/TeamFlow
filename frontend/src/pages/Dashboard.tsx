import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import api from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
  memberCount: number;
  projectCount: number;
  createdAt: string;
}

interface DashboardAnalytics {
  teamCount: number;
  projectCount: number;

  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  inReviewTasks: number;
  completedTasks: number;

  overdueTasks: number;

  completionPercentage: number;

  priorityDistribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();

  // User and team data
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [error, setError] = useState("");
  const [teamsError, setTeamsError] = useState("");

  // Create team form states
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [createTeamError, setCreateTeamError] = useState("");
  const [createTeamSuccess, setCreateTeamSuccess] = useState("");
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("teamflow_token");

      if (!token) {
        navigate("/login");
        return;
      }

      // Fetch current user
      try {
        const userResponse = await api.get("/auth/me");

        setUser(userResponse.data.user);
      } catch (error) {
        console.error("Authentication failed:", error);

        localStorage.removeItem("teamflow_token");

        setError("Your session has expired. Please login again.");

        setTimeout(() => {
          navigate("/login");
        }, 1500);

        setLoading(false);
        return;
      }

      setLoading(false);

      // Fetch user's teams
      try {
        const teamsResponse = await api.get("/teams");

        setTeams(teamsResponse.data.teams);
      } catch (error) {
        console.error("Failed to load teams:", error);

        setTeamsError("Failed to load your teams.");
      } finally {
        setTeamsLoading(false);
      }

      // Fetch dashboard analytics
      try {
        const analyticsResponse = await api.get(
          "/teams/analytics"
        );

        setAnalytics(
          analyticsResponse.data.analytics
        );
      } catch (error) {
        console.error(
          "Failed to load dashboard analytics:",
          error
        );

        setAnalyticsError(
          "Failed to load productivity analytics."
        );
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("teamflow_token");
    navigate("/login");
  };

  // Open Create Team form
  const handleCreateTeam = () => {
    setTeamName("");
    setTeamDescription("");
    setCreateTeamError("");
    setCreateTeamSuccess("");
    setShowCreateTeam(true);
  };

  // Submit Create Team form
  const handleCreateTeamSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!teamName.trim()) {
      setCreateTeamError("Team name is required.");
      return;
    }

    try {
      setCreatingTeam(true);
      setCreateTeamError("");
      setCreateTeamSuccess("");

      const response = await api.post("/teams", {
        name: teamName.trim(),
        description: teamDescription.trim(),
      });

      const createdTeam = response.data.team;

      // Add newly created team to the current list
      setTeams((currentTeams) => [
        {
          id: createdTeam.id,
          name: createdTeam.name,
          description: createdTeam.description,
          role: "OWNER",
          joinedAt: createdTeam.createdAt,
          memberCount: 1,
          projectCount: 0,
          createdAt: createdTeam.createdAt,
        },
        ...currentTeams,
      ]);

      setCreateTeamSuccess("Team created successfully!");

      // Clear form
      setTeamName("");
      setTeamDescription("");

      // Close form after successful creation
      setTimeout(() => {
        setShowCreateTeam(false);
        setCreateTeamSuccess("");
      }, 1000);
    } catch (error: any) {
      console.error("Create team failed:", error);

      setCreateTeamError(
        error.response?.data?.message ||
          "Failed to create team. Please try again."
      );
    } finally {
      setCreatingTeam(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div>
        <h1>TeamFlow</h1>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Authentication error
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
      {/* Header */}
      <header>
        <h1>TeamFlow</h1>

        <button onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main>
        {/* Welcome section */}
        {user && (
          <section>
            <h2>Welcome back, {user.name}! 👋</h2>
            <p>{user.email}</p>
          </section>
        )}

        {/* =====================================================
            PRODUCTIVITY SUMMARY
        ====================================================== */}

        <section>
          <h2>Productivity Summary</h2>

          {analyticsLoading && (
            <p>Loading productivity analytics...</p>
          )}

          {analyticsError && (
            <p>{analyticsError}</p>
          )}

          {!analyticsLoading &&
            !analyticsError &&
            analytics && (
              <div>
                <div>
                  <h3>Teams</h3>
                  <p>{analytics.teamCount}</p>
                </div>

                <div>
                  <h3>Projects</h3>
                  <p>{analytics.projectCount}</p>
                </div>

                <div>
                  <h3>Total Tasks</h3>
                  <p>{analytics.totalTasks}</p>
                </div>

                <div>
                  <h3>TODO</h3>
                  <p>{analytics.todoTasks}</p>
                </div>

                <div>
                  <h3>In Progress</h3>
                  <p>{analytics.inProgressTasks}</p>
                </div>

                <div>
                  <h3>In Review</h3>
                  <p>{analytics.inReviewTasks}</p>
                </div>

                <div>
                  <h3>Completed</h3>
                  <p>{analytics.completedTasks}</p>
                </div>

                <div>
                  <h3>Overdue</h3>
                  <p>{analytics.overdueTasks}</p>
                </div>

                <div>
                  <h3>Completion</h3>

                  <p>
                    <strong>
                      {analytics.completionPercentage}%
                    </strong>
                  </p>

                  <progress
                    value={
                      analytics.completionPercentage
                    }
                    max={100}
                    aria-label="Overall task completion"
                  >
                    {analytics.completionPercentage}%
                  </progress>
                </div>
              </div>
            )}
        </section>

        {/* Create Team form */}
        {showCreateTeam && (
          <section>
            <h2>Create New Team</h2>

            <form onSubmit={handleCreateTeamSubmit}>
              {/* Team name */}
              <div>
                <label htmlFor="teamName">
                  Team Name
                </label>

                <input
                  id="teamName"
                  type="text"
                  value={teamName}
                  onChange={(event) =>
                    setTeamName(event.target.value)
                  }
                  placeholder="Enter team name"
                  disabled={creatingTeam}
                />
              </div>

              {/* Team description */}
              <div>
                <label htmlFor="teamDescription">
                  Description
                </label>

                <textarea
                  id="teamDescription"
                  value={teamDescription}
                  onChange={(event) =>
                    setTeamDescription(event.target.value)
                  }
                  placeholder="Enter team description"
                  rows={4}
                  disabled={creatingTeam}
                />
              </div>

              {/* Error message */}
              {createTeamError && (
                <p>{createTeamError}</p>
              )}

              {/* Success message */}
              {createTeamSuccess && (
                <p>{createTeamSuccess}</p>
              )}

              {/* Form buttons */}
              <button
                type="submit"
                disabled={creatingTeam}
              >
                {creatingTeam
                  ? "Creating..."
                  : "Create Team"}
              </button>

              <button
                type="button"
                onClick={() => setShowCreateTeam(false)}
                disabled={creatingTeam}
              >
                Cancel
              </button>
            </form>
          </section>
        )}

        {/* Teams section */}
        <section>
          <div>
            <h2>Your Teams</h2>

            <button onClick={handleCreateTeam}>
              + Create Team
            </button>
          </div>

          {/* Loading teams */}
          {teamsLoading && (
            <p>Loading your teams...</p>
          )}

          {/* Team loading error */}
          {teamsError && (
            <p>{teamsError}</p>
          )}

          {/* No teams */}
          {!teamsLoading && teams.length === 0 && (
            <div>
              <h3>No teams yet</h3>

              <p>
                Create your first team to start collaborating.
              </p>

              <button onClick={handleCreateTeam}>
                Create Your First Team
              </button>
            </div>
          )}

          {/* Team list */}
          {!teamsLoading && teams.length > 0 && (
            <div>
              {teams.map((team) => (
                <article key={team.id}>
                  <h3>{team.name}</h3>

                  <p>
                    {team.description ||
                      "No description provided."}
                  </p>

                  <p>
                    Role: <strong>{team.role}</strong>
                  </p>

                  <p>
                    Members: {team.memberCount}
                  </p>

                  <p>
                    Projects: {team.projectCount}
                  </p>

                  <button
                    onClick={() =>
                      navigate(`/teams/${team.id}`)
                    }
                  >
                    View Team
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
