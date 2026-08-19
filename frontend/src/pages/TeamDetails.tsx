import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AppLayout from "../components/AppLayout";
import { useLayoutData } from "../hooks/useLayoutData";
import api from "../services/api";

type TeamRole = "OWNER" | "ADMIN" | "MEMBER";

interface TeamMember {
  id: string;
  role: TeamRole;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  _count: {
    tasks: number;
  };
}

interface Team {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
  projects: Project[];
}

const TeamDetails = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();

  const {
    user,
    teams,
    layoutLoading,
    mobileMenuOpen,
    setMobileMenuOpen,
    handleLogout,
  } = useLayoutData();

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ============================================================
     TEAM MANAGEMENT
     ============================================================ */

  const [showEditTeam, setShowEditTeam] = useState(false);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDescription, setEditTeamDescription] = useState("");
  const [updatingTeam, setUpdatingTeam] = useState(false);
  const [teamUpdateError, setTeamUpdateError] = useState("");
  const [teamUpdateSuccess, setTeamUpdateSuccess] = useState("");

  const [deletingTeam, setDeletingTeam] = useState(false);
  const [deleteTeamError, setDeleteTeamError] = useState("");

  /* ============================================================
     MEMBER MANAGEMENT
     ============================================================ */

  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] =
    useState<"ADMIN" | "MEMBER">("MEMBER");

  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [memberSuccess, setMemberSuccess] = useState("");

  const [updatingMemberId, setUpdatingMemberId] =
    useState<string | null>(null);

  const [removingMemberId, setRemovingMemberId] =
    useState<string | null>(null);

  const [memberActionError, setMemberActionError] = useState("");

  /* ============================================================
     PROJECT MANAGEMENT
     ============================================================ */

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState("");
  const [projectSuccess, setProjectSuccess] = useState("");

  const [editingProjectId, setEditingProjectId] =
    useState<string | null>(null);

  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] =
    useState("");

  const [updatingProject, setUpdatingProject] = useState(false);
  const [updateProjectError, setUpdateProjectError] = useState("");
  const [updateProjectSuccess, setUpdateProjectSuccess] = useState("");

  const [deletingProjectId, setDeletingProjectId] =
    useState<string | null>(null);

  const [deleteProjectError, setDeleteProjectError] = useState("");

  /* ============================================================
     FETCH TEAM
     ============================================================ */

  const fetchTeam = async () => {
    if (!teamId) {
      setError("Invalid team ID.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(`/teams/${teamId}`);
      setTeam(response.data.team);
      setError("");
    } catch (error: any) {
      console.error("Failed to load team:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load team details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("teamflow_token");

    if (!token) {
      navigate("/login");
      return;
    }

    void fetchTeam();
  }, [teamId, navigate]);

  /* ============================================================
     CURRENT USER / PERMISSIONS
     ============================================================ */

  const currentMember = useMemo(() => {
    if (!team || !user) {
      return null;
    }

    return (
      team.members.find(
        (member) => member.user.id === user.id
      ) || null
    );
  }, [team, user]);

  const currentUserRole: TeamRole =
    currentMember?.role || "MEMBER";

  const isOwner = currentUserRole === "OWNER";
  const isAdmin =
    currentUserRole === "ADMIN" || currentUserRole === "OWNER";

  const canEditTeam = isAdmin;
  const canDeleteTeam = isOwner;
  const canManageMembers = isAdmin;
  const canManageProjects = isAdmin;

  /* ============================================================
     TEAM EDIT
     ============================================================ */

  const openEditTeam = () => {
    if (!team) {
      return;
    }

    setEditTeamName(team.name);
    setEditTeamDescription(team.description || "");
    setTeamUpdateError("");
    setTeamUpdateSuccess("");
    setShowEditTeam(true);
  };

  const handleUpdateTeam = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!teamId) {
      setTeamUpdateError("Invalid team ID.");
      return;
    }

    if (!editTeamName.trim()) {
      setTeamUpdateError("Team name is required.");
      return;
    }

    try {
      setUpdatingTeam(true);
      setTeamUpdateError("");
      setTeamUpdateSuccess("");

      await api.put(`/teams/${teamId}`, {
        name: editTeamName.trim(),
        description: editTeamDescription.trim(),
      });

      setTeamUpdateSuccess("Team updated successfully.");

      await fetchTeam();

      setTimeout(() => {
        setShowEditTeam(false);
        setTeamUpdateSuccess("");
      }, 700);
    } catch (error: any) {
      console.error("Failed to update team:", error);

      setTeamUpdateError(
        error.response?.data?.message ||
          "Failed to update team. Please try again."
      );
    } finally {
      setUpdatingTeam(false);
    }
  };

  /* ============================================================
     TEAM DELETE
     ============================================================ */

  const handleDeleteTeam = async () => {
    if (!teamId || !team) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${team.name}"?\n\nThis will permanently delete the team and its projects. This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingTeam(true);
      setDeleteTeamError("");

      await api.delete(`/teams/${teamId}`);

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Failed to delete team:", error);

      setDeleteTeamError(
        error.response?.data?.message ||
          "Failed to delete team. Please try again."
      );
    } finally {
      setDeletingTeam(false);
    }
  };

  /* ============================================================
     ADD MEMBER
     ============================================================ */

  const openAddMember = () => {
    setMemberEmail("");
    setMemberRole("MEMBER");
    setMemberError("");
    setMemberSuccess("");
    setShowAddMember(true);
  };

  const handleAddMember = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!teamId) {
      setMemberError("Invalid team ID.");
      return;
    }

    if (!memberEmail.trim()) {
      setMemberError("User email is required.");
      return;
    }

    try {
      setAddingMember(true);
      setMemberError("");
      setMemberSuccess("");

      await api.post(`/teams/${teamId}/members`, {
        email: memberEmail.trim().toLowerCase(),
        role: memberRole,
      });

      setMemberSuccess("Member added successfully.");
      setMemberEmail("");
      setMemberRole("MEMBER");

      await fetchTeam();

      setTimeout(() => {
        setShowAddMember(false);
        setMemberSuccess("");
      }, 700);
    } catch (error: any) {
      console.error("Failed to add member:", error);

      setMemberError(
        error.response?.data?.message ||
          "Failed to add member. Please try again."
      );
    } finally {
      setAddingMember(false);
    }
  };

  /* ============================================================
     MEMBER ROLE UPDATE
     ============================================================ */

  const canModifyMember = (member: TeamMember) => {
    if (!canManageMembers) {
      return false;
    }

    if (member.user.id === user?.id) {
      return false;
    }

    if (member.role === "OWNER") {
      return false;
    }

    if (currentUserRole === "ADMIN" && member.role === "ADMIN") {
      return false;
    }

    return true;
  };

  const handleUpdateMemberRole = async (
    member: TeamMember,
    newRole: "ADMIN" | "MEMBER"
  ) => {
    if (!teamId || !canModifyMember(member)) {
      return;
    }

    if (member.role === newRole) {
      return;
    }

    try {
      setUpdatingMemberId(member.id);
      setMemberActionError("");

      await api.put(
        `/teams/${teamId}/members/${member.id}`,
        {
          role: newRole,
        }
      );

      await fetchTeam();
    } catch (error: any) {
      console.error("Failed to update member role:", error);

      setMemberActionError(
        error.response?.data?.message ||
          "Failed to update member role."
      );
    } finally {
      setUpdatingMemberId(null);
    }
  };

  /* ============================================================
     REMOVE MEMBER
     ============================================================ */

  const handleRemoveMember = async (member: TeamMember) => {
    if (!teamId || !canModifyMember(member)) {
      return;
    }

    const confirmed = window.confirm(
      `Remove ${member.user.name} from ${team?.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingMemberId(member.id);
      setMemberActionError("");

      await api.delete(
        `/teams/${teamId}/members/${member.id}`
      );

      await fetchTeam();
    } catch (error: any) {
      console.error("Failed to remove member:", error);

      setMemberActionError(
        error.response?.data?.message ||
          "Failed to remove member."
      );
    } finally {
      setRemovingMemberId(null);
    }
  };

  /* ============================================================
     CREATE PROJECT
     ============================================================ */

  const handleCreateProject = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!teamId) {
      setProjectError("Invalid team ID.");
      return;
    }

    if (!projectName.trim()) {
      setProjectError("Project name is required.");
      return;
    }

    try {
      setCreatingProject(true);
      setProjectError("");
      setProjectSuccess("");

      await api.post(`/teams/${teamId}/projects`, {
        name: projectName.trim(),
        description: projectDescription.trim(),
      });

      setProjectSuccess("Project created successfully.");

      setProjectName("");
      setProjectDescription("");

      await fetchTeam();

      setTimeout(() => {
        setShowCreateProject(false);
        setProjectSuccess("");
      }, 700);
    } catch (error: any) {
      console.error("Failed to create project:", error);

      setProjectError(
        error.response?.data?.message ||
          "Failed to create project. Please try again."
      );
    } finally {
      setCreatingProject(false);
    }
  };

  /* ============================================================
     EDIT PROJECT
     ============================================================ */

  const handleEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditProjectName(project.name);
    setEditProjectDescription(project.description || "");
    setUpdateProjectError("");
    setUpdateProjectSuccess("");
    setDeleteProjectError("");
  };

  const handleCancelEditProject = () => {
    setEditingProjectId(null);
    setEditProjectName("");
    setEditProjectDescription("");
    setUpdateProjectError("");
    setUpdateProjectSuccess("");
  };

  const handleUpdateProject = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!editingProjectId) {
      return;
    }

    if (!editProjectName.trim()) {
      setUpdateProjectError("Project name is required.");
      return;
    }

    try {
      setUpdatingProject(true);
      setUpdateProjectError("");
      setUpdateProjectSuccess("");

      await api.put(`/projects/${editingProjectId}`, {
        name: editProjectName.trim(),
        description: editProjectDescription.trim(),
      });

      setUpdateProjectSuccess("Project updated successfully.");

      await fetchTeam();

      setTimeout(() => {
        handleCancelEditProject();
      }, 700);
    } catch (error: any) {
      console.error("Failed to update project:", error);

      setUpdateProjectError(
        error.response?.data?.message ||
          "Failed to update project. Please try again."
      );
    } finally {
      setUpdatingProject(false);
    }
  };

  /* ============================================================
     DELETE PROJECT
     ============================================================ */

  const handleDeleteProject = async (project: Project) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingProjectId(project.id);
      setDeleteProjectError("");

      await api.delete(`/projects/${project.id}`);

      setTeam((currentTeam) => {
        if (!currentTeam) {
          return currentTeam;
        }

        return {
          ...currentTeam,
          projects: currentTeam.projects.filter(
            (item) => item.id !== project.id
          ),
        };
      });

      if (editingProjectId === project.id) {
        handleCancelEditProject();
      }
    } catch (error: any) {
      console.error("Failed to delete project:", error);

      setDeleteProjectError(
        error.response?.data?.message ||
          "Failed to delete project. Please try again."
      );
    } finally {
      setDeletingProjectId(null);
    }
  };

  /* ============================================================
     LOADING / ERROR STATES
     ============================================================ */

  if (layoutLoading || loading) {
    return (
      <div className="app-loading">
        Loading your team...
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="app-loading">
        <div className="empty-card">
          <div className="empty-icon">!</div>
          <h3>{error || "Team not found."}</h3>
          <p>
            We couldn't load this team. Please return to the
            dashboard and try again.
          </p>
          <button
            className="primary-button"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      user={user}
      teams={teams}
      activeNav="teams"
      mobileMenuOpen={mobileMenuOpen}
      onMobileMenuOpen={() => setMobileMenuOpen(true)}
      onMobileMenuClose={() => setMobileMenuOpen(false)}
      onLogout={handleLogout}
    >
      <main className="team-details-page">
        {/* ======================================================
            TEAM HEADER
            ====================================================== */}

        <section className="team-page-header">
          <div className="team-page-header-main">
            <button
              className="back-link"
              type="button"
              onClick={() => navigate("/dashboard")}
            >
              ← Back to Dashboard
            </button>

            <span className="page-eyebrow">TEAM WORKSPACE</span>

            <div className="team-title-row">
              <div>
                <h1>{team.name}</h1>

                <p>
                  {team.description ||
                    "No description provided for this team."}
                </p>
              </div>

              <span className={`role-badge role-${currentUserRole.toLowerCase()}`}>
                {currentUserRole}
              </span>
            </div>

            <div className="team-summary">
              <span>
                <strong>{team.members.length}</strong> members
              </span>

              <span>
                <strong>{team.projects.length}</strong> projects
              </span>

              <span>
                Created{" "}
                {new Date(team.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {canEditTeam && (
            <div className="team-header-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={openEditTeam}
              >
                Edit Team
              </button>

              {canDeleteTeam && (
                <button
                  className="danger-button"
                  type="button"
                  onClick={handleDeleteTeam}
                  disabled={deletingTeam}
                >
                  {deletingTeam ? "Deleting..." : "Delete Team"}
                </button>
              )}
            </div>
          )}
        </section>

        {deleteTeamError && (
          <div className="alert-card alert-error">
            {deleteTeamError}
          </div>
        )}

        {/* ======================================================
            EDIT TEAM
            ====================================================== */}

        {showEditTeam && (
          <section className="panel team-management-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">TEAM SETTINGS</span>
                <h2>Edit Team</h2>
              </div>

              <button
                className="modal-close"
                type="button"
                onClick={() => setShowEditTeam(false)}
                disabled={updatingTeam}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateTeam}>
              <div className="form-field">
                <label htmlFor="team-name">
                  Team Name
                </label>

                <input
                  id="team-name"
                  type="text"
                  value={editTeamName}
                  onChange={(event) =>
                    setEditTeamName(event.target.value)
                  }
                  disabled={updatingTeam}
                />
              </div>

              <div className="form-field">
                <label htmlFor="team-description">
                  Description
                </label>

                <textarea
                  id="team-description"
                  rows={4}
                  value={editTeamDescription}
                  onChange={(event) =>
                    setEditTeamDescription(event.target.value)
                  }
                  disabled={updatingTeam}
                />
              </div>

              {teamUpdateError && (
                <div className="form-message error">
                  {teamUpdateError}
                </div>
              )}

              {teamUpdateSuccess && (
                <div className="form-message success">
                  {teamUpdateSuccess}
                </div>
              )}

              <div className="form-actions">
                <button
                  className="primary-button"
                  type="submit"
                  disabled={updatingTeam}
                >
                  {updatingTeam
                    ? "Saving..."
                    : "Save Changes"}
                </button>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setShowEditTeam(false)}
                  disabled={updatingTeam}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ======================================================
            MEMBERS
            ====================================================== */}

        <section className="team-section">
          <div className="section-heading">
            <div>
              <span className="panel-kicker">PEOPLE</span>
              <h2>Team Members</h2>
              <p>
                Manage the people working in this team.
              </p>
            </div>

            {canManageMembers && (
              <button
                className="primary-button"
                type="button"
                onClick={openAddMember}
              >
                + Add Member
              </button>
            )}
          </div>

          {showAddMember && canManageMembers && (
            <div className="panel team-management-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">
                    ADD MEMBER
                  </span>
                  <h2>Invite a TeamFlow user</h2>
                </div>

                <button
                  className="modal-close"
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  disabled={addingMember}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddMember}>
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="member-email">
                      Email
                    </label>

                    <input
                      id="member-email"
                      type="email"
                      value={memberEmail}
                      onChange={(event) =>
                        setMemberEmail(event.target.value)
                      }
                      placeholder="user@example.com"
                      disabled={addingMember}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="member-role">
                      Role
                    </label>

                    <select
                      id="member-role"
                      value={memberRole}
                      onChange={(event) =>
                        setMemberRole(
                          event.target.value as
                            | "ADMIN"
                            | "MEMBER"
                        )
                      }
                      disabled={addingMember}
                    >
                      <option value="MEMBER">
                        Member
                      </option>

                      <option value="ADMIN">
                        Admin
                      </option>
                    </select>
                  </div>
                </div>

                {memberError && (
                  <div className="form-message error">
                    {memberError}
                  </div>
                )}

                {memberSuccess && (
                  <div className="form-message success">
                    {memberSuccess}
                  </div>
                )}

                <div className="form-actions">
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={addingMember}
                  >
                    {addingMember
                      ? "Adding..."
                      : "Add Member"}
                  </button>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setShowAddMember(false)}
                    disabled={addingMember}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {memberActionError && (
            <div className="alert-card alert-error">
              {memberActionError}
            </div>
          )}

          {team.members.length === 0 ? (
            <div className="empty-card">
              <div className="empty-icon">+</div>
              <h3>No members yet</h3>
              <p>
                Add your first member to start working
                together.
              </p>
            </div>
          ) : (
            <div className="members-grid">
              {team.members.map((member) => {
                const isCurrentUser =
                  member.user.id === user?.id;

                const canModify =
                  canModifyMember(member);

                return (
                  <article
                    className="member-card"
                    key={member.id}
                  >
                    <div className="member-card-top">
                      <div className="member-avatar">
                        {member.user.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <span
                        className={`role-badge role-${member.role.toLowerCase()}`}
                      >
                        {member.role}
                      </span>
                    </div>

                    <div className="member-info">
                      <h3>
                        {member.user.name}
                        {isCurrentUser && (
                          <span className="you-label">
                            You
                          </span>
                        )}
                      </h3>

                      <p>{member.user.email}</p>

                      <span className="member-joined">
                        Joined{" "}
                        {new Date(
                          member.joinedAt
                        ).toLocaleDateString()}
                      </span>
                    </div>

                    {canModify && (
                      <div className="member-actions">
                        <select
                          value={
                            member.role === "OWNER"
                              ? "OWNER"
                              : member.role
                          }
                          onChange={(event) =>
                            handleUpdateMemberRole(
                              member,
                              event.target.value as
                                | "ADMIN"
                                | "MEMBER"
                            )
                          }
                          disabled={
                            updatingMemberId ===
                              member.id ||
                            removingMemberId ===
                              member.id
                          }
                        >
                          <option value="MEMBER">
                            Member
                          </option>
                          <option value="ADMIN">
                            Admin
                          </option>
                        </select>

                        <button
                          className="danger-text-button"
                          type="button"
                          onClick={() =>
                            handleRemoveMember(member)
                          }
                          disabled={
                            updatingMemberId ===
                              member.id ||
                            removingMemberId ===
                              member.id
                          }
                        >
                          {removingMemberId ===
                          member.id
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ======================================================
            PROJECTS
            ====================================================== */}

        <section className="team-section">
          <div className="section-heading">
            <div>
              <span className="panel-kicker">
                WORKSPACE
              </span>
              <h2>Projects</h2>
              <p>
                Projects and work currently belonging to
                this team.
              </p>
            </div>

            {canManageProjects && (
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  setProjectName("");
                  setProjectDescription("");
                  setProjectError("");
                  setProjectSuccess("");
                  setShowCreateProject(true);
                }}
              >
                + Create Project
              </button>
            )}
          </div>

          {showCreateProject && canManageProjects && (
            <div className="panel team-management-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">
                    NEW PROJECT
                  </span>
                  <h2>Create Project</h2>
                </div>

                <button
                  className="modal-close"
                  type="button"
                  onClick={() =>
                    setShowCreateProject(false)
                  }
                  disabled={creatingProject}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateProject}>
                <div className="form-field">
                  <label htmlFor="project-name">
                    Project Name
                  </label>

                  <input
                    id="project-name"
                    type="text"
                    value={projectName}
                    onChange={(event) =>
                      setProjectName(event.target.value)
                    }
                    placeholder="Enter project name"
                    disabled={creatingProject}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="project-description">
                    Description
                  </label>

                  <textarea
                    id="project-description"
                    rows={4}
                    value={projectDescription}
                    onChange={(event) =>
                      setProjectDescription(
                        event.target.value
                      )
                    }
                    placeholder="Describe the project..."
                    disabled={creatingProject}
                  />
                </div>

                {projectError && (
                  <div className="form-message error">
                    {projectError}
                  </div>
                )}

                {projectSuccess && (
                  <div className="form-message success">
                    {projectSuccess}
                  </div>
                )}

                <div className="form-actions">
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={creatingProject}
                  >
                    {creatingProject
                      ? "Creating..."
                      : "Create Project"}
                  </button>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      setShowCreateProject(false)
                    }
                    disabled={creatingProject}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {deleteProjectError && (
            <div className="alert-card alert-error">
              {deleteProjectError}
            </div>
          )}

          {team.projects.length === 0 ? (
            <div className="empty-card">
              <div className="empty-icon">+</div>
              <h3>No projects yet</h3>
              <p>
                Create a project to start organizing your
                team's work.
              </p>
            </div>
          ) : (
            <div className="team-projects-grid">
              {team.projects.map((project) => (
                <article
                  className="team-project-card"
                  key={project.id}
                >
                  {editingProjectId === project.id ? (
                    <form onSubmit={handleUpdateProject}>
                      <div className="panel-heading">
                        <div>
                          <span className="panel-kicker">
                            EDIT PROJECT
                          </span>
                          <h2>{project.name}</h2>
                        </div>
                      </div>

                      <div className="form-field">
                        <label
                          htmlFor={`edit-project-name-${project.id}`}
                        >
                          Project Name
                        </label>

                        <input
                          id={`edit-project-name-${project.id}`}
                          type="text"
                          value={editProjectName}
                          onChange={(event) =>
                            setEditProjectName(
                              event.target.value
                            )
                          }
                          disabled={updatingProject}
                        />
                      </div>

                      <div className="form-field">
                        <label
                          htmlFor={`edit-project-description-${project.id}`}
                        >
                          Description
                        </label>

                        <textarea
                          id={`edit-project-description-${project.id}`}
                          value={editProjectDescription}
                          onChange={(event) =>
                            setEditProjectDescription(
                              event.target.value
                            )
                          }
                          rows={4}
                          disabled={updatingProject}
                        />
                      </div>

                      {updateProjectError && (
                        <div className="form-message error">
                          {updateProjectError}
                        </div>
                      )}

                      {updateProjectSuccess && (
                        <div className="form-message success">
                          {updateProjectSuccess}
                        </div>
                      )}

                      <div className="form-actions">
                        <button
                          className="primary-button"
                          type="submit"
                          disabled={updatingProject}
                        >
                          {updatingProject
                            ? "Saving..."
                            : "Save Changes"}
                        </button>

                        <button
                          className="secondary-button"
                          type="button"
                          onClick={
                            handleCancelEditProject
                          }
                          disabled={updatingProject}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="team-project-card-top">
                        <div className="project-card-icon">
                          {project.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <span className="project-task-count">
                          {project._count.tasks}{" "}
                          {project._count.tasks === 1
                            ? "task"
                            : "tasks"}
                        </span>
                      </div>

                      <h3>{project.name}</h3>

                      <p>
                        {project.description ||
                          "No description provided."}
                      </p>

                      <div className="team-project-actions">
                        <button
                          className="primary-button"
                          type="button"
                          onClick={() =>
                            navigate(
                              `/projects/${project.id}`
                            )
                          }
                        >
                          View Project
                        </button>

                        {canManageProjects && (
                          <>
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() =>
                                handleEditProject(project)
                              }
                              disabled={
                                deletingProjectId ===
                                project.id
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="danger-text-button"
                              type="button"
                              onClick={() =>
                                handleDeleteProject(
                                  project
                                )
                              }
                              disabled={
                                deletingProjectId ===
                                project.id
                              }
                            >
                              {deletingProjectId ===
                              project.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </AppLayout>
  );
};

export default TeamDetails;