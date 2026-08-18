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

  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  useEffect(() => {
    if (layoutLoading) return;

    const fetchDashboardData = async () => {
      try {
        const response = await api.get("/teams");
        setTeams(response.data.teams);
      } catch (error) {
        console.error("Failed to load teams:", error);
        setTeamsError("Failed to load your teams.");
      } finally {
        setTeamsLoading(false);
      }

      try {
        const response = await api.get("/teams/analytics");
        setAnalytics(response.data.analytics);
      } catch (error) {
        console.error("Failed to load dashboard analytics:", error);
        setAnalyticsError("Failed to load productivity analytics.");
      } finally {
        setAnalyticsLoading(false);
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, [layoutLoading]);

  const handleCreateTeam = () => {
    setTeamName("");
    setTeamDescription("");
    setCreateTeamError("");
    setCreateTeamSuccess("");
    setShowCreateTeam(true);
  };

  const handleCreateTeamSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

  const statusItems = [
    ["To Do", analytics?.statusDistribution.TODO ?? 0, "status-todo"],
    ["In Progress", analytics?.statusDistribution.IN_PROGRESS ?? 0, "status-progress"],
    ["In Review", analytics?.statusDistribution.IN_REVIEW ?? 0, "status-review"],
    ["Done", analytics?.statusDistribution.DONE ?? 0, "status-done"],
  ] as const;

  const priorityItems = [
    ["Low", analytics?.priorityDistribution.LOW ?? 0, "priority-low"],
    ["Medium", analytics?.priorityDistribution.MEDIUM ?? 0, "priority-medium"],
    ["High", analytics?.priorityDistribution.HIGH ?? 0, "priority-high"],
    ["Urgent", analytics?.priorityDistribution.URGENT ?? 0, "priority-urgent"],
  ] as const;

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
      <div className="dashboard-content">
          <section className="dashboard-heading">
            <div>
              <span className="eyebrow">WORKSPACE OVERVIEW</span>
              <h1>Good morning, {user?.name?.split(" ")[0]}! 👋</h1>
              <p>Here's what's happening across your teams today.</p>
            </div>

            <button className="primary-button" onClick={handleCreateTeam}>
              ＋ Create Team
            </button>
          </section>

          <section className="stats-grid" aria-label="Productivity summary">
            {[
              ["♙", "Workspace", analytics?.teamCount ?? 0, "Teams", "stat-purple"],
              ["▦", "Active", analytics?.projectCount ?? 0, "Projects", "stat-blue"],
              ["✓", "Tracked", analytics?.totalTasks ?? 0, "Total tasks", "stat-orange"],
              ["↗", "Performance", `${analytics?.completionPercentage ?? 0}%`, "Completion rate", "stat-green"],
            ].map(([icon, caption, value, label, color]) => (
              <article className="stat-card" key={label}>
                <div className="stat-card-top">
                  <span className={`stat-icon ${color}`}>{icon}</span>
                  <span className="stat-caption">{caption}</span>
                </div>
                <strong>{analyticsLoading ? "—" : value}</strong>
                <p>{label}</p>
              </article>
            ))}
          </section>

          {analyticsError && (
            <div className="alert-card alert-error">
              <span>!</span>
              {analyticsError}
            </div>
          )}

          <section className="analytics-grid">
            <article className="panel completion-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">PRODUCTIVITY</span>
                  <h2>Task completion</h2>
                </div>
                <span className="panel-menu">•••</span>
              </div>

              {analyticsLoading ? (
                <div className="panel-loading">Loading analytics...</div>
              ) : (
                <div className="completion-content">
                  <div
                    className="completion-ring"
                    style={
                      {
                        "--completion": `${analytics?.completionPercentage ?? 0}%`,
                      } as CSSProperties
                    }
                  >
                    <div className="completion-ring-inner">
                      <strong>{analytics?.completionPercentage ?? 0}%</strong>
                      <span>completed</span>
                    </div>
                  </div>

                  <div className="completion-details">
                    <div className="completion-big">
                      <strong>{analytics?.completedTasks ?? 0}</strong>
                      <span>completed tasks</span>
                    </div>

                    <div className="mini-metric">
                      <span className="metric-dot dot-review" />
                      <span>In review</span>
                      <strong>{analytics?.inReviewTasks ?? 0}</strong>
                    </div>

                    <div className="mini-metric">
                      <span className="metric-dot dot-overdue" />
                      <span>Overdue</span>
                      <strong>{analytics?.overdueTasks ?? 0}</strong>
                    </div>
                  </div>
                </div>
              )}
            </article>

            {[
              {
                kicker: "BREAKDOWN",
                title: "Task status",
                items: statusItems,
              },
              {
                kicker: "BREAKDOWN",
                title: "Priority",
                items: priorityItems,
              },
            ].map(({ kicker, title, items }) => (
              <article className="panel" key={title}>
                <div className="panel-heading">
                  <div>
                    <span className="panel-kicker">{kicker}</span>
                    <h2>{title}</h2>
                  </div>
                </div>

                <div className="distribution-list">
                  {items.map(([label, value, className]) => {
                    const percentage = getPercentage(
                      value,
                      analytics?.totalTasks ?? 0
                    );

                    return (
                      <div className="distribution-item" key={label}>
                        <div className="distribution-header">
                          <span>
                            <i className={`distribution-dot ${className}`} />
                            {label}
                          </span>
                          <strong>
                            {value} <small>({percentage}%)</small>
                          </strong>
                        </div>
                        <div className="distribution-track">
                          <span
                            className={className}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  }
                  )}
                </div>
              </article>
            ))}
          </section>

          <section className="section-block" id="teams-section">
            <div className="section-heading">
              <div>
                <span className="panel-kicker">COLLABORATION</span>
                <h2>Your teams</h2>
                <p>Workspaces you belong to and manage.</p>
              </div>

              <button className="secondary-button" onClick={handleCreateTeam}>
                ＋ New team
              </button>
            </div>

            {teamsLoading && (
              <div className="empty-card">
                <div className="loading-spinner small" />
                <p>Loading your teams...</p>
              </div>
            )}

            {teamsError && (
              <div className="alert-card alert-error">
                <span>!</span>
                {teamsError}
              </div>
            )}

            {!teamsLoading && teams.length === 0 && (
              <div className="empty-card">
                <div className="empty-icon">♙</div>
                <h3>No teams yet</h3>
                <p>Create your first team to start collaborating.</p>
                <button className="primary-button" onClick={handleCreateTeam}>
                  ＋ Create your first team
                </button>
              </div>
            )}

            {!teamsLoading && teams.length > 0 && (
              <div className="teams-grid">
                {teams.map((team, index) => (
                  <article className="team-card" key={team.id}>
                    <div className="team-card-cover">
                      <span className={`team-color team-color-${index % 4}`}>
                        {team.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="team-card-menu">•••</span>
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
                        {team.description || "No description provided."}
                      </p>

                      <div className="team-meta">
                        <span>
                          <strong>{team.memberCount}</strong>{" "}
                          {team.memberCount === 1 ? "member" : "members"}
                        </span>
                        <span>
                          <strong>{team.projectCount}</strong>{" "}
                          {team.projectCount === 1 ? "project" : "projects"}
                        </span>
                      </div>

                      <button
                        className="team-open-button"
                        onClick={() => navigate(`/teams/${team.id}`)}
                      >
                        Open team <span>→</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
      </div>

      {showCreateTeam && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !creatingTeam) {
              setShowCreateTeam(false);
            }
          }}
        >
          <section className="modal-card" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon">＋</span>
                <div>
                  <span className="panel-kicker">NEW WORKSPACE</span>
                  <h2>Create a team</h2>
                </div>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowCreateTeam(false)}
                disabled={creatingTeam}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateTeamSubmit}>
              <div className="form-field">
                <label htmlFor="teamName">Team name</label>
                <input
                  id="teamName"
                  type="text"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  placeholder="e.g. Product Design"
                  disabled={creatingTeam}
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label htmlFor="teamDescription">
                  Description <span>Optional</span>
                </label>
                <textarea
                  id="teamDescription"
                  value={teamDescription}
                  onChange={(event) => setTeamDescription(event.target.value)}
                  placeholder="What will this team work on?"
                  rows={4}
                  disabled={creatingTeam}
                />
              </div>

              {createTeamError && (
                <div className="form-message form-error">{createTeamError}</div>
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
                  onClick={() => setShowCreateTeam(false)}
                  disabled={creatingTeam}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={creatingTeam}
                >
                  {creatingTeam ? "Creating..." : "Create team"}
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