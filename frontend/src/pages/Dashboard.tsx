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

  statusDistribution: {
    TODO: number;
    IN_PROGRESS: number;
    IN_REVIEW: number;
    DONE: number;
  };

  priorityDistribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
}

const getPercentage = (
  count: number,
  total: number
) => {
  if (total === 0) {
    return 0;
  }

  return Math.round((count / total) * 100);
};

const Dashboard = () => {
  const navigate = useNavigate();

  // =========================================================
  // USER AND TEAM DATA
  // =========================================================

  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  // =========================================================
  // LOADING AND ERROR STATES
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(true);

  const [error, setError] = useState("");
  const [teamsError, setTeamsError] = useState("");

  // =========================================================
  // CREATE TEAM STATE
  // =========================================================

  const [showCreateTeam, setShowCreateTeam] =
    useState(false);

  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] =
    useState("");

  const [creatingTeam, setCreatingTeam] =
    useState(false);

  const [createTeamError, setCreateTeamError] =
    useState("");

  const [createTeamSuccess, setCreateTeamSuccess] =
    useState("");

  // =========================================================
  // ANALYTICS STATE
  // =========================================================

  const [analytics, setAnalytics] =
    useState<DashboardAnalytics | null>(null);

  const [analyticsLoading, setAnalyticsLoading] =
    useState(true);

  const [analyticsError, setAnalyticsError] =
    useState("");

  // =========================================================
  // LOAD DASHBOARD DATA
  // =========================================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token =
        localStorage.getItem("teamflow_token");

      if (!token) {
        navigate("/login");
        return;
      }

      // -------------------------------------------------------
      // FETCH CURRENT USER
      // -------------------------------------------------------

      try {
        const userResponse =
          await api.get("/auth/me");

        setUser(userResponse.data.user);
      } catch (error) {
        console.error(
          "Authentication failed:",
          error
        );

        localStorage.removeItem(
          "teamflow_token"
        );

        setError(
          "Your session has expired. Please login again."
        );

        setTimeout(() => {
          navigate("/login");
        }, 1500);

        setLoading(false);
        return;
      }

      setLoading(false);

      // -------------------------------------------------------
      // FETCH USER'S TEAMS
      // -------------------------------------------------------

      try {
        const teamsResponse =
          await api.get("/teams");

        setTeams(
          teamsResponse.data.teams
        );
      } catch (error) {
        console.error(
          "Failed to load teams:",
          error
        );

        setTeamsError(
          "Failed to load your teams."
        );
      } finally {
        setTeamsLoading(false);
      }

      // -------------------------------------------------------
      // FETCH DASHBOARD ANALYTICS
      // -------------------------------------------------------

      try {
        const analyticsResponse =
          await api.get("/teams/analytics");

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

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "teamflow_token"
    );

    navigate("/login");
  };

  // =========================================================
  // OPEN CREATE TEAM FORM
  // =========================================================

  const handleCreateTeam = () => {
    setTeamName("");
    setTeamDescription("");

    setCreateTeamError("");
    setCreateTeamSuccess("");

    setShowCreateTeam(true);
  };

  // =========================================================
  // CREATE TEAM
  // =========================================================

  const handleCreateTeamSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!teamName.trim()) {
      setCreateTeamError(
        "Team name is required."
      );

      return;
    }

    try {
      setCreatingTeam(true);

      setCreateTeamError("");
      setCreateTeamSuccess("");

      const response = await api.post(
        "/teams",
        {
          name: teamName.trim(),
          description:
            teamDescription.trim(),
        }
      );

      const createdTeam =
        response.data.team;

      setTeams((currentTeams) => [
        {
          id: createdTeam.id,
          name: createdTeam.name,
          description:
            createdTeam.description,
          role: "OWNER",
          joinedAt:
            createdTeam.createdAt,
          memberCount: 1,
          projectCount: 0,
          createdAt:
            createdTeam.createdAt,
        },
        ...currentTeams,
      ]);

      setCreateTeamSuccess(
        "Team created successfully!"
      );

      setTeamName("");
      setTeamDescription("");

      setTimeout(() => {
        setShowCreateTeam(false);
        setCreateTeamSuccess("");
      }, 1000);
    } catch (error: any) {
      console.error(
        "Create team failed:",
        error
      );

      setCreateTeamError(
        error.response?.data?.message ||
          "Failed to create team. Please try again."
      );
    } finally {
      setCreatingTeam(false);
    }
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div>
        <h1>TeamFlow</h1>

        <p>
          Loading your dashboard...
        </p>
      </div>
    );
  }

  // =========================================================
  // AUTHENTICATION ERROR
  // =========================================================

  if (error) {
    return (
      <div>
        <h1>TeamFlow</h1>

        <p>{error}</p>
      </div>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div>
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header>
        <h1>TeamFlow</h1>

        <button onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main>
        {/* ===================================================
            WELCOME
        ==================================================== */}

        {user && (
          <section>
            <h2>
              Welcome back, {user.name}! 👋
            </h2>

            <p>{user.email}</p>
          </section>
        )}

        {/* ===================================================
            PRODUCTIVITY SUMMARY
        ==================================================== */}

        <section>
          <h2>
            Productivity Summary
          </h2>

          {analyticsLoading && (
            <p>
              Loading productivity analytics...
            </p>
          )}

          {analyticsError && (
            <p>{analyticsError}</p>
          )}

          {!analyticsLoading &&
            !analyticsError &&
            analytics && (
              <div>
                {/* -------------------------------------------
                    BASIC COUNTS
                -------------------------------------------- */}

                <div>
                  <h3>Teams</h3>
                  <p>
                    {analytics.teamCount}
                  </p>
                </div>

                <div>
                  <h3>Projects</h3>
                  <p>
                    {analytics.projectCount}
                  </p>
                </div>

                <div>
                  <h3>Total Tasks</h3>
                  <p>
                    {analytics.totalTasks}
                  </p>
                </div>

                <div>
                  <h3>TODO</h3>
                  <p>
                    {analytics.todoTasks}
                  </p>
                </div>

                <div>
                  <h3>In Progress</h3>
                  <p>
                    {analytics.inProgressTasks}
                  </p>
                </div>

                <div>
                  <h3>In Review</h3>
                  <p>
                    {analytics.inReviewTasks}
                  </p>
                </div>

                <div>
                  <h3>Completed</h3>
                  <p>
                    {analytics.completedTasks}
                  </p>
                </div>

                <div>
                  <h3>Overdue</h3>
                  <p>
                    {analytics.overdueTasks}
                  </p>
                </div>

                {/* -------------------------------------------
                    OVERALL COMPLETION
                -------------------------------------------- */}

                <div>
                  <h3>Completion</h3>

                  <p>
                    <strong>
                      {
                        analytics.completionPercentage
                      }
                      %
                    </strong>
                  </p>

                  <progress
                    value={
                      analytics.completionPercentage
                    }
                    max={100}
                    aria-label="Overall task completion"
                  >
                    {
                      analytics.completionPercentage
                    }
                    %
                  </progress>
                </div>

                {/* =================================================
                    TASK STATUS DISTRIBUTION
                ================================================== */}

                <section>
                  <h2>
                    Task Status Distribution
                  </h2>

                  {/* TODO */}

                  <div>
                    <p>
                      <strong>
                        TODO
                      </strong>{" "}
                      {
                        analytics
                          .statusDistribution
                          .TODO
                      }{" "}
                      {analytics
                        .statusDistribution
                        .TODO === 1
                        ? "task"
                        : "tasks"}{" "}
                      (
                      {getPercentage(
                        analytics
                          .statusDistribution
                          .TODO,
                        analytics.totalTasks
                      )}
                      %)
                    </p>

                    <progress
                      value={getPercentage(
                        analytics
                          .statusDistribution
                          .TODO,
                        analytics.totalTasks
                      )}
                      max={100}
                      aria-label="TODO task percentage"
                    >
                      {getPercentage(
                        analytics
                          .statusDistribution
                          .TODO,
                        analytics.totalTasks
                      )}
                      %
                    </progress>
                  </div>

                  {/* IN PROGRESS */}

                  <div>
                    <p>
                      <strong>
                        IN PROGRESS
                      </strong>{" "}
                      {
                        analytics
                          .statusDistribution
                          .IN_PROGRESS
                      }{" "}
                      {analytics
                        .statusDistribution
                        .IN_PROGRESS === 1
                        ? "task"
                        : "tasks"}{" "}
                      (
                      {getPercentage(
                        analytics
                          .statusDistribution
                          .IN_PROGRESS,
                        analytics.totalTasks
                      )}
                      %)
                    </p>

                    <progress
                      value={getPercentage(
                        analytics
                          .statusDistribution
                          .IN_PROGRESS,
                        analytics.totalTasks
                      )}
                      max={100}
                      aria-label="In progress task percentage"
                    >
                      {getPercentage(
                        analytics
                          .statusDistribution
                          .IN_PROGRESS,
                        analytics.totalTasks
                      )}
                      %
                    </progress>
                  </div>

                  {/* IN REVIEW */}

                  <div>
                    <p>
                      <strong>
                        IN REVIEW
                      </strong>{" "}
                      {
                        analytics
                          .statusDistribution
                          .IN_REVIEW
                      }{" "}
                      {analytics
                        .statusDistribution
                        .IN_REVIEW === 1
                        ? "task"
                        : "tasks"}{" "}
                      (
                      {getPercentage(
                        analytics
                          .statusDistribution
                          .IN_REVIEW,
                        analytics.totalTasks
                      )}
                      %)
                    </p>

                    <progress
                      value={getPercentage(
                        analytics
                          .statusDistribution
                          .IN_REVIEW,
                        analytics.totalTasks
                      )}
                      max={100}
                      aria-label="In review task percentage"
                    >
                      {getPercentage(
                        analytics
                          .statusDistribution
                          .IN_REVIEW,
                        analytics.totalTasks
                      )}
                      %
                    </progress>
                  </div>

                  {/* DONE */}

                  <div>
                    <p>
                      <strong>
                        DONE
                      </strong>{" "}
                      {
                        analytics
                          .statusDistribution
                          .DONE
                      }{" "}
                      {analytics
                        .statusDistribution
                        .DONE === 1
                        ? "task"
                        : "tasks"}{" "}
                      (
                      {getPercentage(
                        analytics
                          .statusDistribution
                          .DONE,
                        analytics.totalTasks
                      )}
                      %)
                    </p>

                    <progress
                      value={getPercentage(
                        analytics
                          .statusDistribution
                          .DONE,
                        analytics.totalTasks
                      )}
                      max={100}
                      aria-label="Completed task percentage"
                    >
                      {getPercentage(
                        analytics
                          .statusDistribution
                          .DONE,
                        analytics.totalTasks
                      )}
                      %
                    </progress>
                  </div>
                </section>

                {/* =================================================
                    PRIORITY DISTRIBUTION
                ================================================== */}

                <section>
                  <h2>
                    Priority Distribution
                  </h2>

                  {/* LOW */}

                  <div>
                    <p>
                      <strong>
                        LOW
                      </strong>{" "}
                      {
                        analytics
                          .priorityDistribution
                          .LOW
                      }{" "}
                      {analytics
                        .priorityDistribution
                        .LOW === 1
                        ? "task"
                        : "tasks"}{" "}
                      (
                      {getPercentage(
                        analytics
                          .priorityDistribution
                          .LOW,
                        analytics.totalTasks
                      )}
                      %)
                    </p>

                    <progress
                      value={getPercentage(
                        analytics
                          .priorityDistribution
                          .LOW,
                        analytics.totalTasks
                      )}
                      max={100}
                      aria-label="Low priority task percentage"
                    >
                      {getPercentage(
                        analytics
                          .priorityDistribution
                          .LOW,
                        analytics.totalTasks
                      )}
                      %
                    </progress>
                  </div>

                  {/* MEDIUM */}

                  <div>
                    <p>
                      <strong>
                        MEDIUM
                      </strong>{" "}
                      {
                        analytics
                          .priorityDistribution
                          .MEDIUM
                      }{" "}
                      {analytics
                        .priorityDistribution
                        .MEDIUM === 1
                        ? "task"
                        : "tasks"}{" "}
                      (
                      {getPercentage(
                        analytics
                          .priorityDistribution
                          .MEDIUM,
                        analytics.totalTasks
                      )}
                      %)
                    </p>

                    <progress
                      value={getPercentage(
                        analytics
                          .priorityDistribution
                          .MEDIUM,
                        analytics.totalTasks
                      )}
                      max={100}
                      aria-label="Medium priority task percentage"
                    >
                      {getPercentage(
                        analytics
                          .priorityDistribution
                          .MEDIUM,
                        analytics.totalTasks
                      )}
                      %
                    </progress>
                  </div>

                  {/* HIGH */}

                  <div>
                    <p>
                      <strong>
                        HIGH
                      </strong>{" "}
                      {
                        analytics
                          .priorityDistribution
                          .HIGH
                      }{" "}
                      {analytics
                        .priorityDistribution
                        .HIGH === 1
                        ? "task"
                        : "tasks"}{" "}
                      (
                      {getPercentage(
                        analytics
                          .priorityDistribution
                          .HIGH,
                        analytics.totalTasks
                      )}
                      %)
                    </p>

                    <progress
                      value={getPercentage(
                        analytics
                          .priorityDistribution
                          .HIGH,
                        analytics.totalTasks
                      )}
                      max={100}
                      aria-label="High priority task percentage"
                    >
                      {getPercentage(
                        analytics
                          .priorityDistribution
                          .HIGH,
                        analytics.totalTasks
                      )}
                      %
                    </progress>
                  </div>

                  {/* URGENT */}

                  <div>
                    <p>
                      <strong>
                        URGENT
                      </strong>{" "}
                      {
                        analytics
                          .priorityDistribution
                          .URGENT
                      }{" "}
                      {analytics
                        .priorityDistribution
                        .URGENT === 1
                        ? "task"
                        : "tasks"}{" "}
                      (
                      {getPercentage(
                        analytics
                          .priorityDistribution
                          .URGENT,
                        analytics.totalTasks
                      )}
                      %)
                    </p>

                    <progress
                      value={getPercentage(
                        analytics
                          .priorityDistribution
                          .URGENT,
                        analytics.totalTasks
                      )}
                      max={100}
                      aria-label="Urgent priority task percentage"
                    >
                      {getPercentage(
                        analytics
                          .priorityDistribution
                          .URGENT,
                        analytics.totalTasks
                      )}
                      %
                    </progress>
                  </div>
                </section>
              </div>
            )}
        </section>

        {/* =====================================================
            CREATE TEAM FORM
        ====================================================== */}

        {showCreateTeam && (
          <section>
            <h2>
              Create New Team
            </h2>

            <form
              onSubmit={
                handleCreateTeamSubmit
              }
            >
              <div>
                <label htmlFor="teamName">
                  Team Name
                </label>

                <input
                  id="teamName"
                  type="text"
                  value={teamName}
                  onChange={(event) =>
                    setTeamName(
                      event.target.value
                    )
                  }
                  placeholder="Enter team name"
                  disabled={creatingTeam}
                />
              </div>

              <div>
                <label htmlFor="teamDescription">
                  Description
                </label>

                <textarea
                  id="teamDescription"
                  value={teamDescription}
                  onChange={(event) =>
                    setTeamDescription(
                      event.target.value
                    )
                  }
                  placeholder="Enter team description"
                  rows={4}
                  disabled={creatingTeam}
                />
              </div>

              {createTeamError && (
                <p>
                  {createTeamError}
                </p>
              )}

              {createTeamSuccess && (
                <p>
                  {createTeamSuccess}
                </p>
              )}

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
                onClick={() =>
                  setShowCreateTeam(false)
                }
                disabled={creatingTeam}
              >
                Cancel
              </button>
            </form>
          </section>
        )}

        {/* =====================================================
            TEAMS SECTION
        ====================================================== */}

        <section>
          <div>
            <h2>
              Your Teams
            </h2>

            <button
              onClick={handleCreateTeam}
            >
              + Create Team
            </button>
          </div>

          {teamsLoading && (
            <p>
              Loading your teams...
            </p>
          )}

          {teamsError && (
            <p>{teamsError}</p>
          )}

          {!teamsLoading &&
            teams.length === 0 && (
              <div>
                <h3>
                  No teams yet
                </h3>

                <p>
                  Create your first team
                  to start collaborating.
                </p>

                <button
                  onClick={
                    handleCreateTeam
                  }
                >
                  Create Your First Team
                </button>
              </div>
            )}

          {!teamsLoading &&
            teams.length > 0 && (
              <div>
                {teams.map((team) => (
                  <article
                    key={team.id}
                  >
                    <h3>
                      {team.name}
                    </h3>

                    <p>
                      {team.description ||
                        "No description provided."}
                    </p>

                    <p>
                      Role:{" "}
                      <strong>
                        {team.role}
                      </strong>
                    </p>

                    <p>
                      Members:{" "}
                      {team.memberCount}
                    </p>

                    <p>
                      Projects:{" "}
                      {team.projectCount}
                    </p>

                    <button
                      onClick={() =>
                        navigate(
                          `/teams/${team.id}`
                        )
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