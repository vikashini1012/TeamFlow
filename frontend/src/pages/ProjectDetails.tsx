import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

  // Create task form
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
        /*
         * Load all teams available to the current user.
         */
        const teamsResponse = await api.get("/teams");

        const teams = teamsResponse.data.teams || [];

        let foundProject: Project | null = null;
        let foundMembers: TeamMember[] = [];

        /*
         * Find the team containing this project.
         */
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

        /*
         * The current project API gives task counts rather
         * than complete task records.
         *
         * We keep the existing optional task-list request.
         * If it is not implemented yet, the project still loads.
         */
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

          /*
           * Keep the existing task data if available.
           * Otherwise use an empty list.
           */
          foundProject.tasks = foundProject.tasks || [];
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
    event: React.FormEvent<HTMLFormElement>
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

      /*
       * Immediately add the created task to the UI.
       */
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

      /*
       * Close the form shortly after successful creation.
       */
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

  if (loading) {
    return (
      <div>
        <h1>TeamFlow</h1>
        <p>Loading project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>TeamFlow</h1>

        <p>{error}</p>

        <button
          onClick={() => navigate("/dashboard")}
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
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <header>
        <button
          onClick={() =>
            navigate(`/teams/${project.teamId}`)
          }
        >
          ← Back to Team
        </button>

        <h1>TeamFlow</h1>
      </header>

      <main>
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

        <section>
          <div>
            <h2>Tasks</h2>

            <button onClick={handleCreateTask}>
              + Create Task
            </button>
          </div>

          {showCreateTask && (
            <section>
              <h3>Create New Task</h3>

              <form
                onSubmit={handleCreateTaskSubmit}
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
                    disabled={creatingTask}
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
                    disabled={creatingTask}
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
                    disabled={creatingTask}
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
                    disabled={creatingTask}
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
                    disabled={creatingTask}
                  >
                    <option value="">
                      Unassigned
                    </option>

                    {members.map((member) => (
                      <option
                        key={member.user.id}
                        value={member.user.id}
                      >
                        {member.user.name} (
                        {member.role})
                      </option>
                    ))}
                  </select>
                </div>

                {createTaskError && (
                  <p>{createTaskError}</p>
                )}

                {createTaskSuccess && (
                  <p>{createTaskSuccess}</p>
                )}

                <button
                  type="submit"
                  disabled={creatingTask}
                >
                  {creatingTask
                    ? "Creating..."
                    : "Create Task"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateTask(false)
                  }
                  disabled={creatingTask}
                >
                  Cancel
                </button>
              </form>
            </section>
          )}

          {project.tasks.length === 0 && (
            <div>
              <p>No tasks yet.</p>

              <p>
                Create your first task to start
                working on this project.
              </p>
            </div>
          )}

          {project.tasks.length > 0 && (
            <div>
              {project.tasks.map((task) => (
                <article key={task.id}>
                  <h3>{task.title}</h3>

                  <p>
                    {task.description ||
                      "No description provided."}
                  </p>

                  <p>
                    Status:{" "}
                    <strong>{task.status}</strong>
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
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ProjectDetails;