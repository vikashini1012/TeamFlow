import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { FormEvent } from "react";
import api from "../services/api";

interface Task {
    id: string;
    title: string;
    description?: string | null;
    status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate?: string | null;
    createdAt: string;
    updatedAt: string;
    assignee?: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string | null;
    } | null;
}

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
    updatedAt: string;
    teamId: string;
    tasks: Task[];
}

const ProjectDetails = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();

    const [project, setProject] = useState<Project | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================================================
    // CREATE TASK STATE
    // =========================================================

    const [showCreateTask, setShowCreateTask] = useState(false);

    const [taskTitle, setTaskTitle] = useState("");
    const [taskDescription, setTaskDescription] = useState("");

    const [taskPriority, setTaskPriority] = useState<
        "LOW" | "MEDIUM" | "HIGH" | "URGENT"
    >("MEDIUM");

    const [taskDueDate, setTaskDueDate] = useState("");
    const [taskAssigneeId, setTaskAssigneeId] = useState("");

    const [creatingTask, setCreatingTask] = useState(false);
    const [createTaskError, setCreateTaskError] = useState("");
    const [createTaskSuccess, setCreateTaskSuccess] = useState("");

    // =========================================================
    // EDIT TASK STATE
    // =========================================================

    const [editingTaskId, setEditingTaskId] = useState<string | null>(
        null
    );

    const [editTaskTitle, setEditTaskTitle] = useState("");
    const [editTaskDescription, setEditTaskDescription] = useState("");

    const [editTaskPriority, setEditTaskPriority] = useState<
        "LOW" | "MEDIUM" | "HIGH" | "URGENT"
    >("MEDIUM");

    const [editTaskDueDate, setEditTaskDueDate] = useState("");
    const [editTaskAssigneeId, setEditTaskAssigneeId] = useState("");

    const [updatingTask, setUpdatingTask] = useState(false);
    const [updateTaskError, setUpdateTaskError] = useState("");
    const [updateTaskSuccess, setUpdateTaskSuccess] = useState("");

    // =========================================================
    // LOAD PROJECT
    // =========================================================

    useEffect(() => {
        const fetchProject = async () => {
            const token = localStorage.getItem("teamflow_token");

            if (!token) {
                navigate("/login");
                return;
            }

            if (!projectId) {
                setError("Invalid project ID.");
                setLoading(false);
                return;
            }

            try {
                // Load teams
                const teamsResponse = await api.get("/teams");

                const teams = teamsResponse.data.teams || [];

                let foundProject: Project | null = null;
                let foundMembers: TeamMember[] = [];

                // Find the team containing this project
                for (const team of teams) {
                    try {
                        const response = await api.get(`/teams/${team.id}`);

                        const teamData = response.data.team;

                        if (!teamData) {
                            continue;
                        }

                        const projects = teamData.projects || [];

                        const matchingProject = projects.find(
                            (item: Project) => item.id === projectId
                        );

                        if (matchingProject) {
                            foundProject = {
                                ...matchingProject,
                                teamId: team.id,
                                tasks: matchingProject.tasks || [],
                            };

                            foundMembers = teamData.members || [];

                            break;
                        }
                    } catch (teamError) {
                        console.error(
                            `Failed to load team ${team.id}:`,
                            teamError
                        );
                    }
                }

                if (!foundProject) {
                    setError("Project not found.");
                    return;
                }

                // Load complete task records
                try {
                    const tasksResponse = await api.get(
                        `/projects/${projectId}/tasks`
                    );

                    foundProject.tasks =
                        tasksResponse.data.tasks || [];
                } catch (taskError) {
                    console.log(
                        "Task listing endpoint is not available yet:",
                        taskError
                    );

                    foundProject.tasks =
                        foundProject.tasks || [];
                }

                setProject(foundProject);
                setMembers(foundMembers);
            } catch (error: any) {
                console.error(
                    "Failed to load project:",
                    error
                );

                setError(
                    error.response?.data?.message ||
                    "Failed to load project details."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId, navigate]);

    // =========================================================
    // CREATE TASK
    // =========================================================

    const handleCreateTask = () => {
        setTaskTitle("");
        setTaskDescription("");
        setTaskPriority("MEDIUM");
        setTaskDueDate("");
        setTaskAssigneeId("");

        setCreateTaskError("");
        setCreateTaskSuccess("");

        setShowCreateTask(true);
    };

    const handleCreateTaskSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!projectId) {
            setCreateTaskError("Invalid project ID.");
            return;
        }

        if (!taskTitle.trim()) {
            setCreateTaskError("Task title is required.");
            return;
        }

        try {
            setCreatingTask(true);
            setCreateTaskError("");
            setCreateTaskSuccess("");

            const response = await api.post(
                `/projects/${projectId}/tasks`,
                {
                    title: taskTitle.trim(),
                    description: taskDescription.trim(),
                    priority: taskPriority,
                    dueDate: taskDueDate || null,
                    assigneeId: taskAssigneeId || null,
                }
            );

            const createdTask: Task = response.data.task;

            // Add the newly created task immediately
            setProject((currentProject) => {
                if (!currentProject) {
                    return currentProject;
                }

                return {
                    ...currentProject,
                    tasks: [
                        createdTask,
                        ...currentProject.tasks,
                    ],
                };
            });

            setCreateTaskSuccess(
                "Task created successfully!"
            );

            setTaskTitle("");
            setTaskDescription("");
            setTaskPriority("MEDIUM");
            setTaskDueDate("");
            setTaskAssigneeId("");

            setTimeout(() => {
                setShowCreateTask(false);
                setCreateTaskSuccess("");
            }, 1000);
        } catch (error: any) {
            console.error(
                "Create task failed:",
                error
            );

            setCreateTaskError(
                error.response?.data?.message ||
                "Failed to create task. Please try again."
            );
        } finally {
            setCreatingTask(false);
        }
    };

    // =========================================================
    // START EDITING TASK
    // =========================================================

    const handleEditTask = (task: Task) => {
        setEditingTaskId(task.id);

        setEditTaskTitle(task.title);
        setEditTaskDescription(
            task.description || ""
        );

        setEditTaskPriority(task.priority);

        if (task.dueDate) {
            setEditTaskDueDate(
                new Date(task.dueDate)
                    .toISOString()
                    .split("T")[0]
            );
        } else {
            setEditTaskDueDate("");
        }

        setEditTaskAssigneeId(
            task.assignee?.id || ""
        );

        setUpdateTaskError("");
        setUpdateTaskSuccess("");
    };

    // =========================================================
    // CANCEL EDIT
    // =========================================================

    const handleCancelEdit = () => {
        setEditingTaskId(null);

        setEditTaskTitle("");
        setEditTaskDescription("");
        setEditTaskPriority("MEDIUM");
        setEditTaskDueDate("");
        setEditTaskAssigneeId("");

        setUpdateTaskError("");
        setUpdateTaskSuccess("");
    };

    // =========================================================
    // UPDATE TASK
    // =========================================================

    const handleUpdateTaskSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!editingTaskId) {
            return;
        }

        if (!editTaskTitle.trim()) {
            setUpdateTaskError(
                "Task title is required."
            );
            return;
        }

        try {
            setUpdatingTask(true);
            setUpdateTaskError("");
            setUpdateTaskSuccess("");

            const response = await api.put(
                `/tasks/${editingTaskId}`,
                {
                    title: editTaskTitle.trim(),
                    description:
                        editTaskDescription.trim(),
                    priority: editTaskPriority,
                    dueDate:
                        editTaskDueDate || null,
                    assigneeId:
                        editTaskAssigneeId || null,
                }
            );

            const updatedTask: Task =
                response.data.task;

            // Replace the old task with updated task
            setProject((currentProject) => {
                if (!currentProject) {
                    return currentProject;
                }

                return {
                    ...currentProject,
                    tasks:
                        currentProject.tasks.map(
                            (task) =>
                                task.id === updatedTask.id
                                    ? updatedTask
                                    : task
                        ),
                };
            });

            setUpdateTaskSuccess(
                "Task updated successfully!"
            );

            setTimeout(() => {
                handleCancelEdit();
            }, 1000);
        } catch (error: any) {
            console.error(
                "Update task failed:",
                error
            );

            setUpdateTaskError(
                error.response?.data?.message ||
                "Failed to update task. Please try again."
            );
        } finally {
            setUpdatingTask(false);
        }
    };

    const handleStatusChange = async (
        taskId: string,
        status: Task["status"]
    ) => {
        try {
            const response = await api.patch(
                `/tasks/${taskId}/status`,
                {
                    status,
                }
            );

            const updatedTask: Task =
                response.data.task;

            setProject((currentProject) => {
                if (!currentProject) {
                    return currentProject;
                }

                return {
                    ...currentProject,
                    tasks: currentProject.tasks.map(
                        (task) =>
                            task.id === updatedTask.id
                                ? updatedTask
                                : task
                    ),
                };
            });
        } catch (error: any) {
            console.error(
                "Status update failed:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to update task status."
            );
        }
    };
    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div>
                <h1>TeamFlow</h1>
                <p>Loading project...</p>
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

    if (!project) {
        return (
            <div>
                <h1>TeamFlow</h1>

                <p>Project not found.</p>

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
            <header>
                <button
                    onClick={() =>
                        navigate(
                            `/teams/${project.teamId}`
                        )
                    }
                >
                    ← Back to Team
                </button>

                <h1>TeamFlow</h1>
            </header>

            <main>
                {/* =====================================================
            PROJECT INFORMATION
        ====================================================== */}

                <section>
                    <h2>{project.name}</h2>

                    <p>
                        {project.description ||
                            "No description provided."}
                    </p>

                    <p>
                        Created:{" "}
                        {new Date(
                            project.createdAt
                        ).toLocaleDateString()}
                    </p>

                    <p>
                        Tasks: {project.tasks.length}
                    </p>
                </section>

                {/* =====================================================
            TASKS SECTION
        ====================================================== */}

                <section>
                    <div>
                        <h2>Tasks</h2>

                        <button
                            onClick={handleCreateTask}
                        >
                            + Create Task
                        </button>
                    </div>

                    {/* ===================================================
              CREATE TASK FORM
          ==================================================== */}

                    {showCreateTask && (
                        <section>
                            <h3>Create New Task</h3>

                            <form
                                onSubmit={
                                    handleCreateTaskSubmit
                                }
                            >
                                <div>
                                    <label htmlFor="taskTitle">
                                        Title
                                    </label>

                                    <input
                                        id="taskTitle"
                                        type="text"
                                        value={taskTitle}
                                        onChange={(event) =>
                                            setTaskTitle(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Enter task title"
                                        disabled={
                                            creatingTask
                                        }
                                    />
                                </div>

                                <div>
                                    <label htmlFor="taskDescription">
                                        Description
                                    </label>

                                    <textarea
                                        id="taskDescription"
                                        value={taskDescription}
                                        onChange={(event) =>
                                            setTaskDescription(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Enter task description"
                                        rows={4}
                                        disabled={
                                            creatingTask
                                        }
                                    />
                                </div>

                                <div>
                                    <label htmlFor="taskPriority">
                                        Priority
                                    </label>

                                    <select
                                        id="taskPriority"
                                        value={taskPriority}
                                        onChange={(event) =>
                                            setTaskPriority(
                                                event.target.value as
                                                | "LOW"
                                                | "MEDIUM"
                                                | "HIGH"
                                                | "URGENT"
                                            )
                                        }
                                        disabled={
                                            creatingTask
                                        }
                                    >
                                        <option value="LOW">
                                            Low
                                        </option>

                                        <option value="MEDIUM">
                                            Medium
                                        </option>

                                        <option value="HIGH">
                                            High
                                        </option>

                                        <option value="URGENT">
                                            Urgent
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="taskDueDate">
                                        Due Date
                                    </label>

                                    <input
                                        id="taskDueDate"
                                        type="date"
                                        value={taskDueDate}
                                        onChange={(event) =>
                                            setTaskDueDate(
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            creatingTask
                                        }
                                    />
                                </div>

                                <div>
                                    <label htmlFor="taskAssignee">
                                        Assignee
                                    </label>

                                    <select
                                        id="taskAssignee"
                                        value={taskAssigneeId}
                                        onChange={(event) =>
                                            setTaskAssigneeId(
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            creatingTask
                                        }
                                    >
                                        <option value="">
                                            Unassigned
                                        </option>

                                        {members.map(
                                            (member) => (
                                                <option
                                                    key={
                                                        member.user.id
                                                    }
                                                    value={
                                                        member.user.id
                                                    }
                                                >
                                                    {
                                                        member.user
                                                            .name
                                                    }{" "}
                                                    ({member.role})
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {createTaskError && (
                                    <p>
                                        {createTaskError}
                                    </p>
                                )}

                                {createTaskSuccess && (
                                    <p>
                                        {createTaskSuccess}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={
                                        creatingTask
                                    }
                                >
                                    {creatingTask
                                        ? "Creating..."
                                        : "Create Task"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCreateTask(
                                            false
                                        )
                                    }
                                    disabled={
                                        creatingTask
                                    }
                                >
                                    Cancel
                                </button>
                            </form>
                        </section>
                    )}

                    {/* ===================================================
              NO TASKS
          ==================================================== */}

                    {project.tasks.length === 0 && (
                        <div>
                            <p>No tasks yet.</p>

                            <p>
                                Create your first task to
                                start working on this
                                project.
                            </p>
                        </div>
                    )}

                    {/* ===================================================
              TASK LIST
          ==================================================== */}

                    {project.tasks.length > 0 && (
                        <div>
                            {project.tasks.map(
                                (task) => (
                                    <article
                                        key={task.id}
                                    >
                                        {/* ================================
                        TASK INFORMATION
                    ================================= */}

                                        <h3>
                                            {task.title}
                                        </h3>

                                        <p>
                                            {task.description ||
                                                "No description provided."}
                                        </p>

                                        <div>
                                            <label htmlFor={`status-${task.id}`}>
                                                Status:
                                            </label>

                                            <select
                                                id={`status-${task.id}`}
                                                value={task.status}
                                                onChange={(event) =>
                                                    handleStatusChange(
                                                        task.id,
                                                        event.target.value as Task["status"]
                                                    )
                                                }
                                            >
                                                <option value="TODO">
                                                    TODO
                                                </option>

                                                <option value="IN_PROGRESS">
                                                    IN PROGRESS
                                                </option>

                                                <option value="IN_REVIEW">
                                                    IN REVIEW
                                                </option>

                                                <option value="DONE">
                                                    DONE
                                                </option>
                                            </select>
                                        </div>

                                        <p>
                                            Priority:{" "}
                                            <strong>
                                                {task.priority}
                                            </strong>
                                        </p>

                                        <p>
                                            Assignee:{" "}
                                            <strong>
                                                {task.assignee
                                                    ?.name ||
                                                    "Unassigned"}
                                            </strong>
                                        </p>

                                        {task.dueDate && (
                                            <p>
                                                Due:{" "}
                                                {new Date(
                                                    task.dueDate
                                                ).toLocaleDateString()}
                                            </p>
                                        )}

                                        {/* ================================
                        EDIT TASK BUTTON
                    ================================= */}

                                        <button
                                            onClick={() =>
                                                handleEditTask(
                                                    task
                                                )
                                            }
                                        >
                                            Edit Task
                                        </button>

                                        {/* ================================
                        EDIT TASK FORM
                    ================================= */}

                                        {editingTaskId ===
                                            task.id && (
                                                <section>
                                                    <h4>
                                                        Edit Task
                                                    </h4>

                                                    <form
                                                        onSubmit={
                                                            handleUpdateTaskSubmit
                                                        }
                                                    >
                                                        {/* TITLE */}

                                                        <div>
                                                            <label
                                                                htmlFor={`edit-title-${task.id}`}
                                                            >
                                                                Title
                                                            </label>

                                                            <input
                                                                id={`edit-title-${task.id}`}
                                                                type="text"
                                                                value={
                                                                    editTaskTitle
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    setEditTaskTitle(
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                disabled={
                                                                    updatingTask
                                                                }
                                                            />
                                                        </div>

                                                        {/* DESCRIPTION */}

                                                        <div>
                                                            <label
                                                                htmlFor={`edit-description-${task.id}`}
                                                            >
                                                                Description
                                                            </label>

                                                            <textarea
                                                                id={`edit-description-${task.id}`}
                                                                value={
                                                                    editTaskDescription
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    setEditTaskDescription(
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                rows={4}
                                                                disabled={
                                                                    updatingTask
                                                                }
                                                            />
                                                        </div>

                                                        {/* PRIORITY */}

                                                        <div>
                                                            <label
                                                                htmlFor={`edit-priority-${task.id}`}
                                                            >
                                                                Priority
                                                            </label>

                                                            <select
                                                                id={`edit-priority-${task.id}`}
                                                                value={
                                                                    editTaskPriority
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    setEditTaskPriority(
                                                                        event
                                                                            .target
                                                                            .value as
                                                                        | "LOW"
                                                                        | "MEDIUM"
                                                                        | "HIGH"
                                                                        | "URGENT"
                                                                    )
                                                                }
                                                                disabled={
                                                                    updatingTask
                                                                }
                                                            >
                                                                <option value="LOW">
                                                                    Low
                                                                </option>

                                                                <option value="MEDIUM">
                                                                    Medium
                                                                </option>

                                                                <option value="HIGH">
                                                                    High
                                                                </option>

                                                                <option value="URGENT">
                                                                    Urgent
                                                                </option>
                                                            </select>
                                                        </div>

                                                        {/* DUE DATE */}

                                                        <div>
                                                            <label
                                                                htmlFor={`edit-due-date-${task.id}`}
                                                            >
                                                                Due Date
                                                            </label>

                                                            <input
                                                                id={`edit-due-date-${task.id}`}
                                                                type="date"
                                                                value={
                                                                    editTaskDueDate
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    setEditTaskDueDate(
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                disabled={
                                                                    updatingTask
                                                                }
                                                            />
                                                        </div>

                                                        {/* ASSIGNEE */}

                                                        <div>
                                                            <label
                                                                htmlFor={`edit-assignee-${task.id}`}
                                                            >
                                                                Assignee
                                                            </label>

                                                            <select
                                                                id={`edit-assignee-${task.id}`}
                                                                value={
                                                                    editTaskAssigneeId
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    setEditTaskAssigneeId(
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                disabled={
                                                                    updatingTask
                                                                }
                                                            >
                                                                <option value="">
                                                                    Unassigned
                                                                </option>

                                                                {members.map(
                                                                    (
                                                                        member
                                                                    ) => (
                                                                        <option
                                                                            key={
                                                                                member
                                                                                    .user
                                                                                    .id
                                                                            }
                                                                            value={
                                                                                member
                                                                                    .user
                                                                                    .id
                                                                            }
                                                                        >
                                                                            {
                                                                                member
                                                                                    .user
                                                                                    .name
                                                                            }
                                                                        </option>
                                                                    )
                                                                )}
                                                            </select>
                                                        </div>

                                                        {/* ERROR */}

                                                        {updateTaskError && (
                                                            <p>
                                                                {
                                                                    updateTaskError
                                                                }
                                                            </p>
                                                        )}

                                                        {/* SUCCESS */}

                                                        {updateTaskSuccess && (
                                                            <p>
                                                                {
                                                                    updateTaskSuccess
                                                                }
                                                            </p>
                                                        )}

                                                        {/* SAVE */}

                                                        <button
                                                            type="submit"
                                                            disabled={
                                                                updatingTask
                                                            }
                                                        >
                                                            {updatingTask
                                                                ? "Saving..."
                                                                : "Save Changes"}
                                                        </button>

                                                        {/* CANCEL */}

                                                        <button
                                                            type="button"
                                                            onClick={
                                                                handleCancelEdit
                                                            }
                                                            disabled={
                                                                updatingTask
                                                            }
                                                        >
                                                            Cancel
                                                        </button>
                                                    </form>
                                                </section>
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

export default ProjectDetails;