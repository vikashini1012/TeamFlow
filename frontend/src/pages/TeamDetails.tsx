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

    const [showAddMember, setShowAddMember] = useState(false);
    const [memberEmail, setMemberEmail] = useState("");
    const [memberRole, setMemberRole] = useState<
        "ADMIN" | "MEMBER"
    >("MEMBER");
    const [addingMember, setAddingMember] = useState(false);
    const [memberError, setMemberError] = useState("");
    const [memberSuccess, setMemberSuccess] = useState("");

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
                const response = await api.get(`/teams/${teamId}`);

                setTeam(response.data.team);
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

        fetchTeam();
    }, [teamId, navigate]);

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

            setMemberSuccess("Member added successfully!");

            setMemberEmail("");
            setMemberRole("MEMBER");

            // Reload the team so the member list is always
            // synchronized with the database.
            const response = await api.get(`/teams/${teamId}`);

            setTeam(response.data.team);

            setTimeout(() => {
                setShowAddMember(false);
                setMemberSuccess("");
            }, 1000);
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

    if (loading) {
        return (
            <div>
                <h1>TeamFlow</h1>
                <p>Loading team...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <h1>TeamFlow</h1>

                <p>{error}</p>

                <button onClick={() => navigate("/dashboard")}>
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

                <button onClick={() => navigate("/dashboard")}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <header>
                <button onClick={() => navigate("/dashboard")}>
                    ← Back to Dashboard
                </button>

                <h1>TeamFlow</h1>
            </header>

            <main>
                {/* Team information */}
                <section>
                    <h2>{team.name}</h2>

                    <p>
                        {team.description ||
                            "No description provided."}
                    </p>

                    <p>
                        Created:{" "}
                        {new Date(team.createdAt).toLocaleDateString()}
                    </p>

                    <p>
                        Members: {team.members.length}
                    </p>

                    <p>
                        Projects: {team.projects.length}
                    </p>
                </section>

                {/* Members */}
                <section>
                    <div>
                        <h2>Members</h2>

                        <button
                            onClick={() => {
                                setMemberEmail("");
                                setMemberRole("MEMBER");
                                setMemberError("");
                                setMemberSuccess("");
                                setShowAddMember(true);
                            }}
                        >
                            + Add Member
                        </button>
                    </div>

                    {showAddMember && (
                        <div>
                            <h3>Add Member</h3>

                            <form onSubmit={handleAddMember}>
                                <div>
                                    <label htmlFor="memberEmail">
                                        Email
                                    </label>

                                    <input
                                        id="memberEmail"
                                        type="email"
                                        value={memberEmail}
                                        onChange={(event) =>
                                            setMemberEmail(event.target.value)
                                        }
                                        placeholder="Enter user's email"
                                        disabled={addingMember}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="memberRole">
                                        Role
                                    </label>

                                    <select
                                        id="memberRole"
                                        value={memberRole}
                                        onChange={(event) =>
                                            setMemberRole(
                                                event.target.value as "ADMIN" | "MEMBER"
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

                                {memberError && (
                                    <p>{memberError}</p>
                                )}

                                {memberSuccess && (
                                    <p>{memberSuccess}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={addingMember}
                                >
                                    {addingMember
                                        ? "Adding..."
                                        : "Add Member"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowAddMember(false)}
                                    disabled={addingMember}
                                >
                                    Cancel
                                </button>
                            </form>
                        </div>
                    )}

                    {team.members.length === 0 ? (
                        <p>No members found.</p>
                    ) : (
                        <div>
                            {team.members.map((member) => (
                                <article key={member.id}>
                                    <h3>{member.user.name}</h3>

                                    <p>{member.user.email}</p>

                                    <p>
                                        Role:{" "}
                                        <strong>{member.role}</strong>
                                    </p>

                                    <p>
                                        Joined:{" "}
                                        {new Date(
                                            member.joinedAt
                                        ).toLocaleDateString()}
                                    </p>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {/* Projects */}
                <section>
                    <h2>Projects</h2>

                    {team.projects.length === 0 ? (
                        <div>
                            <p>No projects yet.</p>

                            <button>
                                + Create Project
                            </button>
                        </div>
                    ) : (
                        <div>
                            {team.projects.map((project) => (
                                <article key={project.id}>
                                    <h3>{project.name}</h3>

                                    <p>
                                        {project.description ||
                                            "No description provided."}
                                    </p>

                                    <p>
                                        Tasks: {project._count.tasks}
                                    </p>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default TeamDetails;