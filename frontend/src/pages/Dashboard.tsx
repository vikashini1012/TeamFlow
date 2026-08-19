import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CSSProperties, FormEvent } from "react";
import api from "../services/api";
import AppLayout from "../components/AppLayout";
import { getPercentage, useLayoutData } from "../hooks/useLayoutData";

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

interface DistributionItem {
  label: string;
  value: number;
  className: string;
}

const Dashboard = () => {
  const navigate = useNavigate();

  const {
    user,
    teams: layoutTeams,
    layoutLoading,
    mobileMenuOpen,
    setMobileMenuOpen,
    handleLogout,
  } = useLayoutData();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState("");

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [createTeamError, setCreateTeamError] = useState("");
  const [createTeamSuccess, setCreateTeamSuccess] = useState("");

  const [analytics, setAnalytics] =
    useState<DashboardAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  useEffect(() => {
    if (layoutLoading) {
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);

      try {
        const teamsResponse = await api.get("/teams");
        setTeams(teamsResponse.data.teams || []);
      } catch (error) {
        console.error("Failed to load teams:", error);
        setTeamsError("Failed to load your teams.");
      } finally {
        setTeamsLoading(false);
      }

      try {
        const analyticsResponse = await api.get("/teams/analytics");
        setAnalytics(analyticsResponse.data.analytics);
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

      setLoading(false);
    };

    void fetchDashboardData();
  }, [layoutLoading]);

  const handleCreateTeam = () => {
    setTeamName("");
    setTeamDescription("");
    setCreateTeamError("");
    setCreateTeamSuccess("");
    setShowCreateTeam(true);
  };

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
      setTeamName("");
      setTeamDescription("");

      window.setTimeout(() => {
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

  if (layoutLoading || loading) {
    return (
      <div className="app-loading">
        <div className="loading-logo">TF</div>
        <div className="loading-spinner" />
        <h2>Loading TeamFlow</h2>
        <p>Preparing your workspace...</p>
      </div>
    );
  }

  const statusItems: DistributionItem[] = [
    {
      label: "To Do",
      value: analytics?.statusDistribution.TODO ?? 0,
      className: "status-todo",
    },
    {
      label: "In Progress",
      value: analytics?.statusDistribution.IN_PROGRESS ?? 0,
      className: "status-progress",
    },
    {
      label: "In Review",
      value: analytics?.statusDistribution.IN_REVIEW ?? 0,
      className: "status-review",
    },
    {
      label: "Done",
      value: analytics?.statusDistribution.DONE ?? 0,
      className: "status-done",
    },
  ];

  const priorityItems: DistributionItem[] = [
    {
      label: "Low",
      value: analytics?.priorityDistribution.LOW ?? 0,
      className: "priority-low",
    },
    {
      label: "Medium",
      value: analytics?.priorityDistribution.MEDIUM ?? 0,
      className: "priority-medium",
    },
    {
      label: "High",
      value: analytics?.priorityDistribution.HIGH ?? 0,
      className: "priority-high",
    },
    {
      label: "Urgent",
      value: analytics?.priorityDistribution.URGENT ?? 0,
      className: "priority-urgent",
    },
  ];

  const totalTasks = analytics?.totalTasks ?? 0;
  const hasTaskAnalytics = totalTasks > 0;

  const completionPercentage = Math.min(
    Math.max(analytics?.completionPercentage ?? 0, 0),
    100
  );

  const stats = [
    {
      icon: "T",
      caption: "Workspace",
      value: analytics?.teamCount ?? 0,
      label: "Teams",
      color: "stat-purple",
    },
    {
      icon: "P",
      caption: "Active",
      value: analytics?.projectCount ?? 0,
      label: "Projects",
      color: "stat-blue",
    },
    {
      icon: "✓",
      caption: "Tracked",
      value: analytics?.totalTasks ?? 0,
      label: "Total tasks",
      color: "stat-orange",
    },
    {
      icon: "%",
      caption: "Performance",
      value: `${completionPercentage}%`,
      label: "Completion rate",
      color: "stat-green",
    },
  ];

  return (
    <AppLayout
      user={user}
      teams={layoutTeams}
      activeNav="dashboard"
      mobileMenuOpen={mobileMenuOpen}
      onMobileMenuOpen={() => setMobileMenuOpen(true)}
      onMobileMenuClose={() => setMobileMenuOpen(false)}
      onLogout={handleLogout}
    >
      <main className="dashboard-content">
        <section className="dashboard-heading">
          <div className="dashboard-heading-copy">
            <span className="eyebrow">WORKSPACE OVERVIEW</span>

            <h1>
              Good morning,{" "}
              {user?.name?.split(" ")[0] || "there"}!{" "}
              <span aria-hidden="true">👋</span>
            </h1>

            <p>
              Here's what's happening across your teams today.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={handleCreateTeam}
          >
            <span aria-hidden="true">+</span>
            Create Team
          </button>
        </section>

        <section
          className="stats-grid"
          aria-label="Productivity summary"
        >
          {stats.map((stat) => (
            <article className="stat-card" key={stat.label}>
              <div className="stat-card-top">
                <span
                  className={`stat-icon ${stat.color}`}
                  aria-hidden="true"
                >
                  {stat.icon}
                </span>

                <span className="stat-caption">
                  {stat.caption}
                </span>
              </div>

              <strong>
                {analyticsLoading ? "—" : stat.value}
              </strong>

              <p>{stat.label}</p>
            </article>
          ))}
        </section>

        {analyticsError && (
          <div
            className="alert-card alert-error"
            role="alert"
          >
            <span className="alert-symbol" aria-hidden="true">
              !
            </span>
            <span>{analyticsError}</span>
          </div>
        )}

        <section
          className="analytics-grid"
          id="analytics"
          aria-label="Dashboard analytics"
        >
          <article className="panel completion-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">
                  PRODUCTIVITY
                </span>
                <h2>Task completion</h2>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="panel-loading">
                <div className="loading-spinner small" />
                <span>Loading analytics...</span>
              </div>
            ) : !hasTaskAnalytics ? (
              <div className="analytics-empty-state">
                <div
                  className="analytics-empty-icon"
                  aria-hidden="true"
                >
                  %
                </div>

                <h3>No task analytics yet</h3>

                <p>
                  Create tasks inside your projects to start
                  seeing productivity insights here.
                </p>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => navigate("/dashboard#teams-section")}
                >
                  View teams
                </button>
              </div>
            ) : (
              <div className="completion-content">
                <div
                  className="completion-ring"
                  style={
                    {
                      "--completion": `${completionPercentage}%`,
                    } as CSSProperties
                  }
                  role="img"
                  aria-label={`Task completion ${completionPercentage}%`}
                >
                  <div className="completion-ring-inner">
                    <strong>{completionPercentage}%</strong>
                    <span>completed</span>
                  </div>
                </div>

                <div className="completion-details">
                  <div className="completion-big">
                    <strong>
                      {analytics?.completedTasks ?? 0}
                    </strong>
                    <span>completed tasks</span>
                  </div>

                  <div className="mini-metric">
                    <span
                      className="metric-dot dot-review"
                      aria-hidden="true"
                    />
                    <span>In review</span>
                    <strong>
                      {analytics?.inReviewTasks ?? 0}
                    </strong>
                  </div>

                  <div className="mini-metric">
                    <span
                      className="metric-dot dot-overdue"
                      aria-hidden="true"
                    />
                    <span>Overdue</span>
                    <strong>
                      {analytics?.overdueTasks ?? 0}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">
                  BREAKDOWN
                </span>
                <h2>Task status</h2>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="panel-loading">
                <div className="loading-spinner small" />
                <span>Loading status...</span>
              </div>
            ) : !hasTaskAnalytics ? (
              <div className="analytics-mini-empty">
                <span>No task data available yet.</span>
              </div>
            ) : (
              <div className="distribution-list">
                {statusItems.map((item) => {
                  const percentage = getPercentage(
                    item.value,
                    totalTasks
                  );

                  return (
                    <div
                      className="distribution-item"
                      key={item.label}
                    >
                      <div className="distribution-header">
                        <span>
                          <i
                            className={`distribution-dot ${item.className}`}
                            aria-hidden="true"
                          />
                          {item.label}
                        </span>

                        <strong>
                          {item.value}
                          <small>
                            ({percentage}%)
                          </small>
                        </strong>
                      </div>

                      <div
                        className="distribution-track"
                        aria-label={`${item.label}: ${percentage}%`}
                      >
                        <span
                          className={item.className}
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">
                  BREAKDOWN
                </span>
                <h2>Priority</h2>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="panel-loading">
                <div className="loading-spinner small" />
                <span>Loading priorities...</span>
              </div>
            ) : !hasTaskAnalytics ? (
              <div className="analytics-mini-empty">
                <span>No task data available yet.</span>
              </div>
            ) : (
              <div className="distribution-list">
                {priorityItems.map((item) => {
                  const percentage = getPercentage(
                    item.value,
                    totalTasks
                  );

                  return (
                    <div
                      className="distribution-item"
                      key={item.label}
                    >
                      <div className="distribution-header">
                        <span>
                          <i
                            className={`distribution-dot ${item.className}`}
                            aria-hidden="true"
                          />
                          {item.label}
                        </span>

                        <strong>
                          {item.value}
                          <small>
                            ({percentage}%)
                          </small>
                        </strong>
                      </div>

                      <div
                        className="distribution-track"
                        aria-label={`${item.label}: ${percentage}%`}
                      >
                        <span
                          className={item.className}
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </section>

        <section
          className="section-block"
          id="teams-section"
        >
          <div className="section-heading">
            <div>
              <span className="panel-kicker">
                COLLABORATION
              </span>

              <h2>Your teams</h2>

              <p>
                Workspaces you belong to and manage.
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={handleCreateTeam}
            >
              <span aria-hidden="true">+</span>
              New team
            </button>
          </div>

          {teamsLoading && (
            <div className="empty-card">
              <div className="loading-spinner small" />
              <p>Loading your teams...</p>
            </div>
          )}

          {teamsError && (
            <div
              className="alert-card alert-error"
              role="alert"
            >
              <span className="alert-symbol" aria-hidden="true">
                !
              </span>
              <span>{teamsError}</span>
            </div>
          )}

          {!teamsLoading && teams.length === 0 && (
            <div className="empty-card">
              <div className="empty-icon" aria-hidden="true">
                T
              </div>

              <h3>No teams yet</h3>

              <p>
                Create your first team to start
                collaborating.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={handleCreateTeam}
              >
                <span aria-hidden="true">+</span>
                Create your first team
              </button>
            </div>
          )}

          {!teamsLoading && teams.length > 0 && (
            <div className="teams-grid">
              {teams.map((team, index) => (
                <article
                  className="team-card"
                  key={team.id}
                >
                  <div className="team-card-cover">
                    <span
                      className={`team-color team-color-${index % 4}`}
                    >
                      {team.name
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <span
                      className="team-card-menu"
                      aria-hidden="true"
                    >
                      •••
                    </span>
                  </div>

                  <div className="team-card-body">
                    <div className="team-title-row">
                      <h3>{team.name}</h3>

                      <span
                        className={`role-badge role-${team.role.toLowerCase()}`}
                      >
                        {team.role}
                      </span>
                    </div>

                    <p className="team-description">
                      {team.description ||
                        "No description provided."}
                    </p>

                    <div className="team-meta">
                      <span>
                        <strong>
                          {team.memberCount}
                        </strong>{" "}
                        {team.memberCount === 1
                          ? "member"
                          : "members"}
                      </span>

                      <span>
                        <strong>
                          {team.projectCount}
                        </strong>{" "}
                        {team.projectCount === 1
                          ? "project"
                          : "projects"}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="team-open-button"
                      onClick={() =>
                        navigate(
                          `/teams/${team.id}`
                        )
                      }
                    >
                      Open team{" "}
                      <span aria-hidden="true">
                        →
                      </span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {showCreateTeam && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !creatingTeam
            ) {
              setShowCreateTeam(false);
            }
          }}
        >
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-team-title"
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span
                  className="modal-icon"
                  aria-hidden="true"
                >
                  +
                </span>

                <div>
                  <span className="panel-kicker">
                    NEW WORKSPACE
                  </span>

                  <h2 id="create-team-title">
                    Create a team
                  </h2>
                </div>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowCreateTeam(false)
                }
                disabled={creatingTeam}
                aria-label="Close create team dialog"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateTeamSubmit}>
              <div className="form-field">
                <label htmlFor="teamName">
                  Team name
                </label>

                <input
                  id="teamName"
                  type="text"
                  value={teamName}
                  onChange={(event) =>
                    setTeamName(event.target.value)
                  }
                  placeholder="e.g. Product Design"
                  disabled={creatingTeam}
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label htmlFor="teamDescription">
                  Description{" "}
                  <span>Optional</span>
                </label>

                <textarea
                  id="teamDescription"
                  value={teamDescription}
                  onChange={(event) =>
                    setTeamDescription(
                      event.target.value
                    )
                  }
                  placeholder="What will this team work on?"
                  rows={4}
                  disabled={creatingTeam}
                />
              </div>

              {createTeamError && (
                <div className="form-message form-error">
                  {createTeamError}
                </div>
              )}

              {createTeamSuccess && (
                <div className="form-message form-success">
                  {createTeamSuccess}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowCreateTeam(false)
                  }
                  disabled={creatingTeam}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={creatingTeam}
                >
                  {creatingTeam
                    ? "Creating..."
                    : "Create team"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AppLayout>
  );
};

export default Dashboard;