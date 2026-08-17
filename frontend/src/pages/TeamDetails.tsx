import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import type { FormEvent } from "react";

interface TeamMember {
    id: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
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

    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================================================
    // ADD MEMBER
    // =========================================================

    const [showAddMember, setShowAddMember] = useState(false);
    const [memberEmail, setMemberEmail] = useState("");
    const [memberRole, setMemberRole] = useState<
        "ADMIN" | "MEMBER"
    >("MEMBER");
    const [addingMember, setAddingMember] = useState(false);
    const [memberError, setMemberError] = useState("");
    const [memberSuccess, setMemberSuccess] = useState("");
    const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
    const [memberRoleError, setMemberRoleError] = useState("");
    const [memberRoleSuccess, setMemberRoleSuccess] = useState("");

    // =========================================================
    // CREATE PROJECT
    // =========================================================

    const [showCreateProject, setShowCreateProject] =
        useState(false);

    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] =
        useState("");

    const [creatingProject, setCreatingProject] =
        useState(false);

    const [projectError, setProjectError] = useState("");
    const [projectSuccess, setProjectSuccess] = useState("");

    // =========================================================
    // EDIT PROJECT
    // =========================================================

    const [editingProjectId, setEditingProjectId] =
        useState<string | null>(null);

    const [editProjectName, setEditProjectName] =
        useState("");

    const [editProjectDescription, setEditProjectDescription] =
        useState("");

    const [updatingProject, setUpdatingProject] =
        useState(false);

    const [updateProjectError, setUpdateProjectError] =
        useState("");

    const [updateProjectSuccess, setUpdateProjectSuccess] =
        useState("");

    // =========================================================
    // DELETE PROJECT
    // =========================================================

    const [deletingProjectId, setDeletingProjectId] =
        useState<string | null>(null);

    const [deleteProjectError, setDeleteProjectError] =
        useState("");

    // =========================================================
    // EDIT TEAM
    // =========================================================

    const [editingTeam, setEditingTeam] = useState(false);

    const [editTeamName, setEditTeamName] = useState("");
    const [editTeamDescription, setEditTeamDescription] =
        useState("");

    const [updatingTeam, setUpdatingTeam] = useState(false);

    const [teamUpdateError, setTeamUpdateError] =
        useState("");

    const [teamUpdateSuccess, setTeamUpdateSuccess] =
        useState("");

    // =========================================================
    // DELETE TEAM
    // =========================================================

    const [deletingTeam, setDeletingTeam] = useState(false);

    const [teamDeleteError, setTeamDeleteError] =
        useState("");

    // =========================================================
    // LOAD TEAM
    // =========================================================

    useEffect(() => {
        const fetchTeam = async () => {
            const token = localStorage.getItem("teamflow_token");

            if (!token) {
                navigate("/login");
                return;
            }

            if (!teamId) {
                setError("Invalid team ID.");
                setLoading(false);
                return;
            }

            try {
                const response = await api.get(
                    `/teams/${teamId}`
                );

                setTeam(response.data.team);
            } catch (error: any) {
                console.error(
                    "Failed to load team:",
                    error
                );

                setError(
                    error.response?.data?.message ||
                    "Failed to load team details."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchTeam();
    }, [teamId, navigate]);

    // =========================================================
    // ADD MEMBER
    // =========================================================

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

            await api.post(
                `/teams/${teamId}/members`,
                {
                    email: memberEmail
                        .trim()
                        .toLowerCase(),
                    role: memberRole,
                }
            );

            setMemberSuccess(
                "Member added successfully!"
            );

            setMemberEmail("");
            setMemberRole("MEMBER");

            const response = await api.get(
                `/teams/${teamId}`
            );

            setTeam(response.data.team);

            setTimeout(() => {
                setShowAddMember(false);
                setMemberSuccess("");
            }, 1000);
        } catch (error: any) {
            console.error(
                "Failed to add member:",
                error
            );

            setMemberError(
                error.response?.data?.message ||
                "Failed to add member. Please try again."
            );
        } finally {
            setAddingMember(false);
        }
    };

    const handleUpdateMemberRole = async (
        member: TeamMember,
        role: "ADMIN" | "MEMBER"
    ) => {
        if (!teamId) {
            setMemberRoleError("Invalid team ID.");
            return;
        }

        if (member.role === role) {
            return;
        }

        try {
            setUpdatingMemberId(member.id);
            setMemberRoleError("");
            setMemberRoleSuccess("");

            await api.put(
                `/teams/${teamId}/members/${member.id}`,
                {
                    role,
                }
            );

            const response = await api.get(
                `/teams/${teamId}`
            );

            setTeam(response.data.team);

            setMemberRoleSuccess(
                "Member role updated successfully!"
            );

            setTimeout(() => {
                setMemberRoleSuccess("");
            }, 1000);
        } catch (error: any) {
            console.error(
                "Failed to update member role:",
                error
            );

            setMemberRoleError(
                error.response?.data?.message ||
                "Failed to update member role. Please try again."
            );
        } finally {
            setUpdatingMemberId(null);
        }
    };
    // =========================================================
    // CREATE PROJECT
    // =========================================================

    const handleCreateProject = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!teamId) {
            setProjectError("Invalid team ID.");
            return;
        }

        if (!projectName.trim()) {
            setProjectError(
                "Project name is required."
            );
            return;
        }

        try {
            setCreatingProject(true);
            setProjectError("");
            setProjectSuccess("");

            await api.post(
                `/teams/${teamId}/projects`,
                {
                    name: projectName.trim(),
                    description:
                        projectDescription.trim(),
                }
            );

            setProjectSuccess(
                "Project created successfully!"
            );

            setProjectName("");
            setProjectDescription("");

            const response = await api.get(
                `/teams/${teamId}`
            );

            setTeam(response.data.team);

            setTimeout(() => {
                setShowCreateProject(false);
                setProjectSuccess("");
            }, 1000);
        } catch (error: any) {
            console.error(
                "Failed to create project:",
                error
            );

            setProjectError(
                error.response?.data?.message ||
                "Failed to create project. Please try again."
            );
        } finally {
            setCreatingProject(false);
        }
    };

    // =========================================================
    // EDIT PROJECT
    // =========================================================

    const handleEditProject = (
        project: Project
    ) => {
        setEditingProjectId(project.id);
        setEditProjectName(project.name);
        setEditProjectDescription(
            project.description || ""
        );

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
            setUpdateProjectError(
                "Project name is required."
            );
            return;
        }

        try {
            setUpdatingProject(true);
            setUpdateProjectError("");
            setUpdateProjectSuccess("");

            await api.put(
                `/projects/${editingProjectId}`,
                {
                    name: editProjectName.trim(),
                    description:
                        editProjectDescription.trim(),
                }
            );

            setUpdateProjectSuccess(
                "Project updated successfully!"
            );

            const response = await api.get(
                `/teams/${teamId}`
            );

            setTeam(response.data.team);

            setTimeout(() => {
                handleCancelEditProject();
            }, 800);
        } catch (error: any) {
            console.error(
                "Failed to update project:",
                error
            );

            setUpdateProjectError(
                error.response?.data?.message ||
                "Failed to update project. Please try again."
            );
        } finally {
            setUpdatingProject(false);
        }
    };

    // =========================================================
    // DELETE PROJECT
    // =========================================================

    const handleDeleteProject = async (
        project: Project
    ) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingProjectId(project.id);
            setDeleteProjectError("");

            await api.delete(
                `/projects/${project.id}`
            );

            setTeam((currentTeam) => {
                if (!currentTeam) {
                    return currentTeam;
                }

                return {
                    ...currentTeam,
                    projects:
                        currentTeam.projects.filter(
                            (item) =>
                                item.id !== project.id
                        ),
                };
            });

            if (
                editingProjectId === project.id
            ) {
                handleCancelEditProject();
            }
        } catch (error: any) {
            console.error(
                "Failed to delete project:",
                error
            );

            setDeleteProjectError(
                error.response?.data?.message ||
                "Failed to delete project. Please try again."
            );
        } finally {
            setDeletingProjectId(null);
        }
    };

    // =========================================================
    // EDIT TEAM
    // =========================================================

    const handleEditTeam = () => {
        if (!team) {
            return;
        }

        setEditingTeam(true);

        setEditTeamName(team.name);
        setEditTeamDescription(
            team.description || ""
        );

        setTeamUpdateError("");
        setTeamUpdateSuccess("");
        setTeamDeleteError("");
    };

    const handleCancelEditTeam = () => {
        setEditingTeam(false);

        setEditTeamName("");
        setEditTeamDescription("");

        setTeamUpdateError("");
        setTeamUpdateSuccess("");
    };

    const handleUpdateTeam = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!teamId) {
            setTeamUpdateError(
                "Invalid team ID."
            );
            return;
        }

        if (!editTeamName.trim()) {
            setTeamUpdateError(
                "Team name is required."
            );
            return;
        }

        try {
            setUpdatingTeam(true);
            setTeamUpdateError("");
            setTeamUpdateSuccess("");

            await api.put(`/teams/${teamId}`, {
                name: editTeamName.trim(),
                description:
                    editTeamDescription.trim(),
            });

            const response = await api.get(
                `/teams/${teamId}`
            );

            setTeam(response.data.team);

            setTeamUpdateSuccess(
                "Team updated successfully!"
            );

            setTimeout(() => {
                setEditingTeam(false);
                setTeamUpdateSuccess("");
            }, 800);
        } catch (error: any) {
            console.error(
                "Failed to update team:",
                error
            );

            setTeamUpdateError(
                error.response?.data?.message ||
                "Failed to update team. Please try again."
            );
        } finally {
            setUpdatingTeam(false);
        }
    };

    // =========================================================
    // DELETE TEAM
    // =========================================================

    const handleDeleteTeam = async () => {
        if (!teamId || !team) {
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete "${team.name}"? This will permanently delete the team, its projects, and its tasks. This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingTeam(true);
            setTeamDeleteError("");

            await api.delete(
                `/teams/${teamId}`
            );

            navigate("/dashboard");
        } catch (error: any) {
            console.error(
                "Failed to delete team:",
                error
            );

            setTeamDeleteError(
                error.response?.data?.message ||
                "Failed to delete team. Please try again."
            );
        } finally {
            setDeletingTeam(false);
        }
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div>
                <h1>TeamFlow</h1>
                <p>Loading team...</p>
            </div>
        );
    }

    // =========================================================
    // ERROR
    // =========================================================

    if (error) {
        return (
            <div>
                <h1>TeamFlow</h1>

                <p>{error}</p>

                <button
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (!team) {
        return (
            <div>
                <h1>TeamFlow</h1>

                <p>Team not found.</p>

                <button
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    // =========================================================
    // UI
    // =========================================================

    return (
        <div>
            {/* =====================================================
                HEADER
            ====================================================== */}

            <header>
                <button
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    ← Back to Dashboard
                </button>

                <h1>TeamFlow</h1>
            </header>

            <main>
                {/* =================================================
                    TEAM INFORMATION
                ================================================== */}

                <section>
                    {editingTeam ? (
                        <div>
                            <h2>Edit Team</h2>

                            <form
                                onSubmit={
                                    handleUpdateTeam
                                }
                            >
                                <div>
                                    <label htmlFor="edit-team-name">
                                        Team Name
                                    </label>

                                    <input
                                        id="edit-team-name"
                                        type="text"
                                        value={
                                            editTeamName
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setEditTeamName(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        disabled={
                                            updatingTeam
                                        }
                                    />
                                </div>

                                <div>
                                    <label htmlFor="edit-team-description">
                                        Description
                                    </label>

                                    <textarea
                                        id="edit-team-description"
                                        value={
                                            editTeamDescription
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setEditTeamDescription(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        rows={4}
                                        disabled={
                                            updatingTeam
                                        }
                                    />
                                </div>

                                {teamUpdateError && (
                                    <p>
                                        {
                                            teamUpdateError
                                        }
                                    </p>
                                )}

                                {teamUpdateSuccess && (
                                    <p>
                                        {
                                            teamUpdateSuccess
                                        }
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={
                                        updatingTeam
                                    }
                                >
                                    {updatingTeam
                                        ? "Saving..."
                                        : "Save Changes"}
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleCancelEditTeam
                                    }
                                    disabled={
                                        updatingTeam
                                    }
                                >
                                    Cancel
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div>
                            <h2>{team.name}</h2>

                            <p>
                                {team.description ||
                                    "No description provided."}
                            </p>

                            <p>
                                Created:{" "}
                                {new Date(
                                    team.createdAt
                                ).toLocaleDateString()}
                            </p>

                            <p>
                                Members:{" "}
                                {team.members.length}
                            </p>

                            <p>
                                Projects:{" "}
                                {team.projects.length}
                            </p>

                            <button
                                type="button"
                                onClick={
                                    handleEditTeam
                                }
                            >
                                Edit Team
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleDeleteTeam
                                }
                                disabled={
                                    deletingTeam
                                }
                            >
                                {deletingTeam
                                    ? "Deleting..."
                                    : "Delete Team"}
                            </button>

                            {teamDeleteError && (
                                <p>
                                    {
                                        teamDeleteError
                                    }
                                </p>
                            )}
                        </div>
                    )}
                </section>

                {/* =================================================
                    MEMBERS
                ================================================== */}

                <section>
                    <div>
                        <h2>Members</h2>

                        <button
                            onClick={() => {
                                setMemberEmail("");
                                setMemberRole(
                                    "MEMBER"
                                );
                                setMemberError("");
                                setMemberSuccess("");
                                setShowAddMember(
                                    true
                                );
                            }}
                        >
                            + Add Member
                        </button>
                    </div>

                    {showAddMember && (
                        <div>
                            <h3>Add Member</h3>

                            <form
                                onSubmit={
                                    handleAddMember
                                }
                            >
                                <div>
                                    <label htmlFor="memberEmail">
                                        Email
                                    </label>

                                    <input
                                        id="memberEmail"
                                        type="email"
                                        value={
                                            memberEmail
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setMemberEmail(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Enter user's email"
                                        disabled={
                                            addingMember
                                        }
                                    />
                                </div>

                                <div>
                                    <label htmlFor="memberRole">
                                        Role
                                    </label>

                                    <select
                                        id="memberRole"
                                        value={
                                            memberRole
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setMemberRole(
                                                event
                                                    .target
                                                    .value as
                                                | "ADMIN"
                                                | "MEMBER"
                                            )
                                        }
                                        disabled={
                                            addingMember
                                        }
                                    >
                                        <option value="MEMBER">
                                            Member
                                        </option>

                                        <option value="ADMIN">
                                            Admin
                                        </option>
                                    </select>
                                </div>

                                {memberError && (
                                    <p>
                                        {
                                            memberError
                                        }
                                    </p>
                                )}

                                {memberSuccess && (
                                    <p>
                                        {
                                            memberSuccess
                                        }
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={
                                        addingMember
                                    }
                                >
                                    {addingMember
                                        ? "Adding..."
                                        : "Add Member"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowAddMember(
                                            false
                                        )
                                    }
                                    disabled={
                                        addingMember
                                    }
                                >
                                    Cancel
                                </button>
                            </form>
                        </div>
                    )}

                    {memberRoleError && (
                        <p>
                            {memberRoleError}
                        </p>
                    )}

                    {memberRoleSuccess && (
                        <p>
                            {memberRoleSuccess}
                        </p>
                    )}

                    {team.members.length === 0 ? (
                        <p>No members found.</p>
                    ) : (
                        <div>
                            {team.members.map(
                                (member) => (
                                    <article
                                        key={member.id}
                                    >
                                        <h3>
                                            {
                                                member
                                                    .user
                                                    .name
                                            }
                                        </h3>

                                        <p>
                                            {
                                                member
                                                    .user
                                                    .email
                                            }
                                        </p>

                                        <p>
                                            Current Role:{" "}
                                            <strong>
                                                {
                                                    member.role
                                                }
                                            </strong>
                                        </p>

                                        <p>
                                            Joined:{" "}
                                            {new Date(
                                                member.joinedAt
                                            ).toLocaleDateString()}
                                        </p>

                                        {/* OWNER cannot be changed */}
                                        {member.role ===
                                            "OWNER" ? (
                                            <p>
                                                Team Owner
                                            </p>
                                        ) : (
                                            <div>
                                                <label
                                                    htmlFor={`member-role-${member.id}`}
                                                >
                                                    Change Role
                                                </label>

                                                <select
                                                    id={`member-role-${member.id}`}
                                                    value={
                                                        member.role
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        handleUpdateMemberRole(
                                                            member,
                                                            event
                                                                .target
                                                                .value as
                                                            | "ADMIN"
                                                            | "MEMBER"
                                                        )
                                                    }
                                                    disabled={
                                                        updatingMemberId ===
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

                                                {updatingMemberId ===
                                                    member.id && (
                                                        <p>
                                                            Updating...
                                                        </p>
                                                    )}
                                            </div>
                                        )}
                                    </article>
                                )
                            )}
                        </div>
                    )}
                </section>

                {/* =================================================
                    PROJECTS
                ================================================== */}

                <section>
                    <div>
                        <h2>Projects</h2>

                        <button
                            onClick={() => {
                                setProjectName("");
                                setProjectDescription(
                                    ""
                                );
                                setProjectError("");
                                setProjectSuccess("");
                                setShowCreateProject(
                                    true
                                );
                            }}
                        >
                            + Create Project
                        </button>
                    </div>

                    {/* CREATE PROJECT */}

                    {showCreateProject && (
                        <div>
                            <h3>
                                Create New Project
                            </h3>

                            <form
                                onSubmit={
                                    handleCreateProject
                                }
                            >
                                <div>
                                    <label htmlFor="projectName">
                                        Project Name
                                    </label>

                                    <input
                                        id="projectName"
                                        type="text"
                                        value={
                                            projectName
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setProjectName(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Enter project name"
                                        disabled={
                                            creatingProject
                                        }
                                    />
                                </div>

                                <div>
                                    <label htmlFor="projectDescription">
                                        Description
                                    </label>

                                    <textarea
                                        id="projectDescription"
                                        value={
                                            projectDescription
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setProjectDescription(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Enter project description"
                                        rows={4}
                                        disabled={
                                            creatingProject
                                        }
                                    />
                                </div>

                                {projectError && (
                                    <p>
                                        {
                                            projectError
                                        }
                                    </p>
                                )}

                                {projectSuccess && (
                                    <p>
                                        {
                                            projectSuccess
                                        }
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={
                                        creatingProject
                                    }
                                >
                                    {creatingProject
                                        ? "Creating..."
                                        : "Create Project"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCreateProject(
                                            false
                                        )
                                    }
                                    disabled={
                                        creatingProject
                                    }
                                >
                                    Cancel
                                </button>
                            </form>
                        </div>
                    )}

                    {/* PROJECT LIST */}

                    {team.projects.length === 0 ? (
                        <div>
                            <p>
                                No projects yet.
                            </p>
                        </div>
                    ) : (
                        <div>
                            {deleteProjectError && (
                                <p>
                                    {
                                        deleteProjectError
                                    }
                                </p>
                            )}

                            {team.projects.map(
                                (project) => (
                                    <article
                                        key={
                                            project.id
                                        }
                                    >
                                        {editingProjectId ===
                                            project.id ? (
                                            <div>
                                                <h3>
                                                    Edit
                                                    Project
                                                </h3>

                                                <form
                                                    onSubmit={
                                                        handleUpdateProject
                                                    }
                                                >
                                                    <div>
                                                        <label
                                                            htmlFor={`edit-project-name-${project.id}`}
                                                        >
                                                            Project
                                                            Name
                                                        </label>

                                                        <input
                                                            id={`edit-project-name-${project.id}`}
                                                            type="text"
                                                            value={
                                                                editProjectName
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                setEditProjectName(
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            disabled={
                                                                updatingProject
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <label
                                                            htmlFor={`edit-project-description-${project.id}`}
                                                        >
                                                            Description
                                                        </label>

                                                        <textarea
                                                            id={`edit-project-description-${project.id}`}
                                                            value={
                                                                editProjectDescription
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                setEditProjectDescription(
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            rows={
                                                                4
                                                            }
                                                            disabled={
                                                                updatingProject
                                                            }
                                                        />
                                                    </div>

                                                    {updateProjectError && (
                                                        <p>
                                                            {
                                                                updateProjectError
                                                            }
                                                        </p>
                                                    )}

                                                    {updateProjectSuccess && (
                                                        <p>
                                                            {
                                                                updateProjectSuccess
                                                            }
                                                        </p>
                                                    )}

                                                    <button
                                                        type="submit"
                                                        disabled={
                                                            updatingProject
                                                        }
                                                    >
                                                        {updatingProject
                                                            ? "Saving..."
                                                            : "Save Changes"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={
                                                            handleCancelEditProject
                                                        }
                                                        disabled={
                                                            updatingProject
                                                        }
                                                    >
                                                        Cancel
                                                    </button>
                                                </form>
                                            </div>
                                        ) : (
                                            <div>
                                                <h3>
                                                    {
                                                        project.name
                                                    }
                                                </h3>

                                                <p>
                                                    {project.description ||
                                                        "No description provided."}
                                                </p>

                                                <p>
                                                    Tasks:{" "}
                                                    {
                                                        project
                                                            ._count
                                                            .tasks
                                                    }
                                                </p>

                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            `/projects/${project.id}`
                                                        )
                                                    }
                                                >
                                                    View Project
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEditProject(
                                                            project
                                                        )
                                                    }
                                                    disabled={
                                                        deletingProjectId ===
                                                        project.id
                                                    }
                                                >
                                                    Edit Project
                                                </button>

                                                <button
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
                                                        : "Delete Project"}
                                                </button>
                                            </div>
                                        )}
                                    </article>
                                )
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default TeamDetails;