import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { DragEvent, FormEvent } from "react";
import api from "../services/api";
import "../ProjectDetails_UI_Refined.css";

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
    const [taskSearch, setTaskSearch] = useState("");
    const [taskStatusFilter, setTaskStatusFilter] =
        useState<"ALL" | Task["status"]>("ALL");

    const [taskPriorityFilter, setTaskPriorityFilter] =
        useState<"ALL" | Task["priority"]>("ALL");

    const [taskAssigneeFilter, setTaskAssigneeFilter] =
        useState("ALL");

    const [taskSort, setTaskSort] = useState<
        "NEWEST" | "OLDEST" | "DUE_DATE" | "PRIORITY"
    >("NEWEST");

    // =========================================================
    // TASK VIEW STATE
    // =========================================================

    const [taskView, setTaskView] = useState<"LIST" | "KANBAN">(() => {
        if (!projectId) {
            return "LIST";
        }

        const savedView = localStorage.getItem(
            `teamflow_project_view_${projectId}`
        );

        return savedView === "KANBAN" ? "KANBAN" : "LIST";
    });

    const handleTaskViewChange = (
        view: "LIST" | "KANBAN"
    ) => {
        setTaskView(view);

        if (projectId) {
            localStorage.setItem(
                `teamflow_project_view_${projectId}`,
                view
            );
        }
    };

    // =========================================================
    // KANBAN DRAG & DROP STATE
    // =========================================================

    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

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

    const displayedTasks = [...(project?.tasks || [])]
        .filter((task) => {
            const search = taskSearch.trim().toLowerCase();

            if (!search) {
                return true;
            }

            return (
                task.title.toLowerCase().includes(search) ||
                (task.description || "")
                    .toLowerCase()
                    .includes(search)
            );
        })
        .filter((task) => {
            if (taskStatusFilter === "ALL") {
                return true;
            }

            return task.status === taskStatusFilter;
        })
        .filter((task) => {
            if (taskPriorityFilter === "ALL") {
                return true;
            }

            return task.priority === taskPriorityFilter;
        })
        .filter((task) => {
            if (taskAssigneeFilter === "ALL") {
                return true;
            }

            if (taskAssigneeFilter === "UNASSIGNED") {
                return !task.assignee;
            }

            return task.assignee?.id === taskAssigneeFilter;
        })
        .sort((a, b) => {
            switch (taskSort) {
                case "OLDEST":
                    return (
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime()
                    );

                case "DUE_DATE": {
                    if (!a.dueDate && !b.dueDate) {
                        return 0;
                    }

                    if (!a.dueDate) {
                        return 1;
                    }

                    if (!b.dueDate) {
                        return -1;
                    }

                    return (
                        new Date(a.dueDate).getTime() -
                        new Date(b.dueDate).getTime()
                    );
                }

                case "PRIORITY": {
                    const priorityOrder: Record<
                        Task["priority"],
                        number
                    > = {
                        URGENT: 4,
                        HIGH: 3,
                        MEDIUM: 2,
                        LOW: 1,
                    };

                    return (
                        priorityOrder[b.priority] -
                        priorityOrder[a.priority]
                    );
                }

                case "NEWEST":
                default:
                    return (
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    );
            }
        });
    const kanbanColumns: {
        status: Task["status"];
        label: string;
    }[] = [
        { status: "TODO", label: "TODO" },
        { status: "IN_PROGRESS", label: "IN PROGRESS" },
        { status: "IN_REVIEW", label: "IN REVIEW" },
        { status: "DONE", label: "DONE" },
    ];

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

    // Restore the saved task view whenever the project changes.
    useEffect(() => {
        if (!projectId) {
            setTaskView("LIST");
            return;
        }

        const savedView = localStorage.getItem(
            `teamflow_project_view_${projectId}`
        );

        setTaskView(
            savedView === "KANBAN" ? "KANBAN" : "LIST"
        );
    }, [projectId]);

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

    const handleKanbanDragStart = (taskId: string) => {
        setDraggedTaskId(taskId);
    };

    const handleKanbanDragEnd = () => {
        setDraggedTaskId(null);
    };

    const handleKanbanDragOver = (
        event: DragEvent<HTMLElement>
    ) => {
        event.preventDefault();
    };

    const handleKanbanDrop = async (
        event: DragEvent<HTMLElement>,
        targetStatus: Task["status"]
    ) => {
        event.preventDefault();

        const taskId = draggedTaskId;

        setDraggedTaskId(null);

        if (!taskId) {
            return;
        }

        const task = project?.tasks.find(
            (item) => item.id === taskId
        );

        if (!task || task.status === targetStatus) {
            return;
        }

        await handleStatusChange(taskId, targetStatus);
    };

    const handleDeleteTask = async (taskId: string) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this task?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await api.delete(`/tasks/${taskId}`);

            setProject((currentProject) => {
                if (!currentProject) {
                    return currentProject;
                }

                return {
                    ...currentProject,
                    tasks: currentProject.tasks.filter(
                        (task) => task.id !== taskId
                    ),
                };
            });
        } catch (error: any) {
            console.error("Delete task failed:", error);

            alert(
                error.response?.data?.message ||
                "Failed to delete task. Please try again."
            );
        }
    };

    // =========================================================
    // PROJECT PROGRESS
    // =========================================================

    const totalTasks = project?.tasks.length || 0;

    const todoTasks =
        project?.tasks.filter(
            (task) => task.status === "TODO"
        ).length || 0;

    const inProgressTasks =
        project?.tasks.filter(
            (task) => task.status === "IN_PROGRESS"
        ).length || 0;

    const inReviewTasks =
        project?.tasks.filter(
            (task) => task.status === "IN_REVIEW"
        ).length || 0;

    const completedTasks =
        project?.tasks.filter(
            (task) => task.status === "DONE"
        ).length || 0;

    const completionPercentage =
        totalTasks === 0
            ? 0
            : Math.round(
                  (completedTasks / totalTasks) * 100
              );

    // =========================================================
    // PRIORITY DISTRIBUTION
    // =========================================================

    const lowPriorityTasks =
        project?.tasks.filter(
            (task) => task.priority === "LOW"
        ).length || 0;

    const mediumPriorityTasks =
        project?.tasks.filter(
            (task) => task.priority === "MEDIUM"
        ).length || 0;

    const highPriorityTasks =
        project?.tasks.filter(
            (task) => task.priority === "HIGH"
        ).length || 0;

    const urgentPriorityTasks =
        project?.tasks.filter(
            (task) => task.priority === "URGENT"
        ).length || 0;

    const lowPriorityPercentage =
        totalTasks === 0
            ? 0
            : Math.round(
                  (lowPriorityTasks / totalTasks) * 100
              );

    const mediumPriorityPercentage =
        totalTasks === 0
            ? 0
            : Math.round(
                  (mediumPriorityTasks / totalTasks) * 100
              );

    const highPriorityPercentage =
        totalTasks === 0
            ? 0
            : Math.round(
                  (highPriorityTasks / totalTasks) * 100
              );

    const urgentPriorityPercentage =
        totalTasks === 0
            ? 0
            : Math.round(
                  (urgentPriorityTasks / totalTasks) * 100
              );

    // =========================================================
    // ASSIGNEE WORKLOAD
    // =========================================================

    const assigneeWorkload = members.map((member) => {
        const assignedTaskCount =
            project?.tasks.filter(
                (task) =>
                    task.assignee?.id === member.user.id
            ).length || 0;

        return {
            id: member.user.id,
            name: member.user.name,
            taskCount: assignedTaskCount,
        };
    });

    const unassignedTaskCount =
        project?.tasks.filter(
            (task) => !task.assignee
        ).length || 0;

    const maxAssignedTaskCount =
        assigneeWorkload.reduce(
            (maximum, member) =>
                Math.max(maximum, member.taskCount),
            0
        );

    const workloadMaximum = Math.max(
        maxAssignedTaskCount,
        unassignedTaskCount
    );

    // =========================================================
    // TASK STATUS DISTRIBUTION
    // =========================================================

    const taskStatusDistribution = [
        {
            label: "TODO",
            count: todoTasks,
        },
        {
            label: "IN PROGRESS",
            count: inProgressTasks,
        },
        {
            label: "IN REVIEW",
            count: inReviewTasks,
        },
        {
            label: "DONE",
            count: completedTasks,
        },
    ];

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

            <main className="details-page">
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
            PROJECT PROGRESS
        ====================================================== */}

                <section>
                    <h2>Project Progress</h2>

                    <div>
                        <p>
                            Total Tasks:{" "}
                            <strong>{totalTasks}</strong>
                        </p>

                        <p>
                            TODO:{" "}
                            <strong>{todoTasks}</strong>
                        </p>

                        <p>
                            In Progress:{" "}
                            <strong>{inProgressTasks}</strong>
                        </p>

                        <p>
                            In Review:{" "}
                            <strong>{inReviewTasks}</strong>
                        </p>

                        <p>
                            Completed:{" "}
                            <strong>{completedTasks}</strong>
                        </p>

                        <p>
                            Completion:{" "}
                            <strong>
                                {completionPercentage}%
                            </strong>
                        </p>

                        <progress
                            value={completionPercentage}
                            max={100}
                            aria-label="Project completion progress"
                        >
                            {completionPercentage}%
                        </progress>
                    </div>
                </section>

                {/* =====================================================
            PRIORITY DISTRIBUTION
        ====================================================== */}

                <section>
                    <h2>Priority Distribution</h2>

                    <div>
                        <p>
                            LOW{" "}
                            <strong>
                                {lowPriorityTasks}{" "}
                                {lowPriorityTasks === 1
                                    ? "task"
                                    : "tasks"}{" "}
                                ({lowPriorityPercentage}%)
                            </strong>
                        </p>

                        <progress
                            value={lowPriorityPercentage}
                            max={100}
                            aria-label="Low priority task distribution"
                        >
                            {lowPriorityPercentage}%
                        </progress>

                        <p>
                            MEDIUM{" "}
                            <strong>
                                {mediumPriorityTasks}{" "}
                                {mediumPriorityTasks === 1
                                    ? "task"
                                    : "tasks"}{" "}
                                ({mediumPriorityPercentage}%)
                            </strong>
                        </p>

                        <progress
                            value={mediumPriorityPercentage}
                            max={100}
                            aria-label="Medium priority task distribution"
                        >
                            {mediumPriorityPercentage}%
                        </progress>

                        <p>
                            HIGH{" "}
                            <strong>
                                {highPriorityTasks}{" "}
                                {highPriorityTasks === 1
                                    ? "task"
                                    : "tasks"}{" "}
                                ({highPriorityPercentage}%)
                            </strong>
                        </p>

                        <progress
                            value={highPriorityPercentage}
                            max={100}
                            aria-label="High priority task distribution"
                        >
                            {highPriorityPercentage}%
                        </progress>

                        <p>
                            URGENT{" "}
                            <strong>
                                {urgentPriorityTasks}{" "}
                                {urgentPriorityTasks === 1
                                    ? "task"
                                    : "tasks"}{" "}
                                ({urgentPriorityPercentage}%)
                            </strong>
                        </p>

                        <progress
                            value={urgentPriorityPercentage}
                            max={100}
                            aria-label="Urgent priority task distribution"
                        >
                            {urgentPriorityPercentage}%
                        </progress>
                    </div>
                </section>

                {/* =====================================================
            ASSIGNEE WORKLOAD
        ====================================================== */}

                <section>
                    <h2>Assignee Workload</h2>

                    {assigneeWorkload.length === 0 ? (
                        <p>No team members found.</p>
                    ) : (
                        <div>
                            {assigneeWorkload.map(
                                (member) => {
                                    const workloadPercentage =
                                        workloadMaximum === 0
                                            ? 0
                                            : Math.round(
                                                  (member.taskCount /
                                                      workloadMaximum) *
                                                      100
                                              );

                                    return (
                                        <div
                                            key={member.id}
                                        >
                                            <p>
                                                <strong>
                                                    {member.name}
                                                </strong>{" "}
                                                {member.taskCount}{" "}
                                                {member.taskCount === 1
                                                    ? "task"
                                                    : "tasks"}
                                            </p>

                                            <progress
                                                value={
                                                    workloadPercentage
                                                }
                                                max={100}
                                                aria-label={`${member.name} workload`}
                                            >
                                                {workloadPercentage}%
                                            </progress>
                                        </div>
                                    );
                                }
                            )}

                            <div>
                                <p>
                                    <strong>
                                        Unassigned
                                    </strong>{" "}
                                    {unassignedTaskCount}{" "}
                                    {unassignedTaskCount === 1
                                        ? "task"
                                        : "tasks"}
                                </p>

                                <progress
                                    value={
                                        workloadMaximum === 0
                                            ? 0
                                            : Math.round(
                                                  (unassignedTaskCount /
                                                      workloadMaximum) *
                                                      100
                                              )
                                    }
                                    max={100}
                                    aria-label="Unassigned task workload"
                                >
                                    {workloadMaximum === 0
                                        ? 0
                                        : Math.round(
                                              (unassignedTaskCount /
                                                  workloadMaximum) *
                                                  100
                                          )}
                                    %
                                </progress>
                            </div>
                        </div>
                    )}
                </section>

                {/* =====================================================
            TASK STATUS DISTRIBUTION
        ====================================================== */}

                <section>
                    <h2>Task Status Distribution</h2>

                    {totalTasks === 0 ? (
                        <p>No tasks available for analytics.</p>
                    ) : (
                        <div>
                            {taskStatusDistribution.map(
                                (status) => {
                                    const percentage = Math.round(
                                        (status.count / totalTasks) * 100
                                    );

                                    return (
                                        <div key={status.label}>
                                            <div>
                                                <strong>
                                                    {status.label}
                                                </strong>{" "}
                                                <span>
                                                    {status.count} task
                                                    {status.count === 1
                                                        ? ""
                                                        : "s"}
                                                    {" "}
                                                    ({percentage}%)
                                                </span>
                                            </div>

                                            <progress
                                                value={status.count}
                                                max={totalTasks}
                                                aria-label={`${status.label} task distribution`}
                                            >
                                                {percentage}%
                                            </progress>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}
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

                            <div>
                                {/* SEARCH */}
                                <div>
                                    <label htmlFor="task-search">
                                        Search Tasks
                                    </label>

                                    <input
                                        id="task-search"
                                        type="text"
                                        value={taskSearch}
                                        onChange={(event) =>
                                            setTaskSearch(event.target.value)
                                        }
                                        placeholder="Search by title or description"
                                    />
                                </div>

                                {/* STATUS FILTER */}
                                <div>
                                    <label htmlFor="task-status-filter">
                                        Status
                                    </label>

                                    <select
                                        id="task-status-filter"
                                        value={taskStatusFilter}
                                        onChange={(event) =>
                                            setTaskStatusFilter(
                                                event.target.value as
                                                | "ALL"
                                                | Task["status"]
                                            )
                                        }
                                    >
                                        <option value="ALL">All</option>
                                        <option value="TODO">To Do</option>
                                        <option value="IN_PROGRESS">
                                            In Progress
                                        </option>
                                        <option value="IN_REVIEW">
                                            In Review
                                        </option>
                                        <option value="DONE">Done</option>
                                    </select>
                                </div>

                                {/* PRIORITY FILTER */}
                                <div>
                                    <label htmlFor="task-priority-filter">
                                        Priority
                                    </label>

                                    <select
                                        id="task-priority-filter"
                                        value={taskPriorityFilter}
                                        onChange={(event) =>
                                            setTaskPriorityFilter(
                                                event.target.value as
                                                | "ALL"
                                                | Task["priority"]
                                            )
                                        }
                                    >
                                        <option value="ALL">All</option>
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="URGENT">Urgent</option>
                                    </select>
                                </div>

                                {/* ASSIGNEE FILTER */}
                                <div>
                                    <label htmlFor="task-assignee-filter">
                                        Assignee
                                    </label>

                                    <select
                                        id="task-assignee-filter"
                                        value={taskAssigneeFilter}
                                        onChange={(event) =>
                                            setTaskAssigneeFilter(
                                                event.target.value
                                            )
                                        }
                                    >
                                        <option value="ALL">All</option>

                                        <option value="UNASSIGNED">
                                            Unassigned
                                        </option>

                                        {members.map((member) => (
                                            <option
                                                key={member.user.id}
                                                value={member.user.id}
                                            >
                                                {member.user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* SORT */}
                                <div>
                                    <label htmlFor="task-sort">
                                        Sort By
                                    </label>

                                    <select
                                        id="task-sort"
                                        value={taskSort}
                                        onChange={(event) =>
                                            setTaskSort(
                                                event.target.value as
                                                | "NEWEST"
                                                | "OLDEST"
                                                | "DUE_DATE"
                                                | "PRIORITY"
                                            )
                                        }
                                    >
                                        <option value="NEWEST">
                                            Newest
                                        </option>

                                        <option value="OLDEST">
                                            Oldest
                                        </option>

                                        <option value="DUE_DATE">
                                            Due Date
                                        </option>

                                        <option value="PRIORITY">
                                            Priority
                                        </option>
                                    </select>
                                </div>
                            </div>

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
              FILTERED RESULTS
          ==================================================== */}

                    {project.tasks.length > 0 &&
                        displayedTasks.length === 0 && (
                            <div>
                                <p>No tasks match your current filters.</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTaskSearch("");
                                        setTaskStatusFilter("ALL");
                                        setTaskPriorityFilter("ALL");
                                        setTaskAssigneeFilter("ALL");
                                        setTaskSort("NEWEST");
                                    }}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}

                    {/* ===================================================
              TASK VIEW
          ==================================================== */}

                    <div>
                        <button
                            type="button"
                            onClick={() => handleTaskViewChange("LIST")}
                            disabled={taskView === "LIST"}
                        >
                            List View
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTaskViewChange("KANBAN")}
                            disabled={taskView === "KANBAN"}
                        >
                            Kanban View
                        </button>
                    </div>

                    {taskView === "LIST" &&
                        project.tasks.length > 0 &&
                        displayedTasks.length > 0 && (
                        <div>
                            {displayedTasks.map((task) => (
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

                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                    >
                                        Delete Task
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

                    {taskView === "KANBAN" && (
                        <div>
                            {kanbanColumns.map((column) => {
                                const columnTasks = displayedTasks.filter(
                                    (task) => task.status === column.status
                                );

                                return (
                                    <section
                                        key={column.status}
                                        onDragOver={handleKanbanDragOver}
                                        onDrop={(event) =>
                                            handleKanbanDrop(
                                                event,
                                                column.status
                                            )
                                        }
                                    >
                                        <h3>
                                            {column.label} ({columnTasks.length})
                                        </h3>

                                        {columnTasks.length === 0 ? (
                                            <p>No tasks.</p>
                                        ) : (
                                            <div>
                                                {columnTasks.map((task) => (
                                                    <article
                                                        key={task.id}
                                                        draggable
                                                        onDragStart={() =>
                                                            handleKanbanDragStart(
                                                                task.id
                                                            )
                                                        }
                                                        onDragEnd={
                                                            handleKanbanDragEnd
                                                        }
                                                    >
                                                        <h4>{task.title}</h4>

                                                        <p>
                                                            {task.description ||
                                                                "No description provided."}
                                                        </p>

                                                        <p>
                                                            Priority:{" "}
                                                            <strong>{task.priority}</strong>
                                                        </p>

                                                        <p>
                                                            Assignee:{" "}
                                                            <strong>
                                                                {task.assignee?.name ||
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

                                                        <div>
                                                            <label
                                                                htmlFor={`kanban-status-${task.id}`}
                                                            >
                                                                Status:
                                                            </label>

                                                            <select
                                                                id={`kanban-status-${task.id}`}
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

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handleTaskViewChange("LIST");
                                                                handleEditTask(task);
                                                            }}
                                                        >
                                                            Edit Task
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDeleteTask(task.id)
                                                            }
                                                        >
                                                            Delete Task
                                                        </button>
                                                    </article>
                                                ))}
                                            </div>
                                        )}
                                    </section>
                                );
                            })}
                        </div>
                    )}

                </section>
            </main>
        </div>
    );
};

export default ProjectDetails;