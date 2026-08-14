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
  } | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
         * We already have the team-projects endpoint.
         * Find this project from the team's project list.
         */
        const teamsResponse = await api.get("/teams");

        const teams = teamsResponse.data.teams || [];

        let foundProject: Project | null = null;

        for (const team of teams) {
          try {
            const response = await api.get(
              `/teams/${team.id}`
            );

            const projects = response.data.team?.projects || [];

            const matchingProject = projects.find(
              (item: Project) => item.id === projectId
            );

            if (matchingProject) {
              foundProject = {
                ...matchingProject,
                teamId: team.id,
                tasks: matchingProject.tasks || [],
              };

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
         * The team project response currently contains
         * task counts rather than complete task records.
         *
         * We'll load the project's tasks from the task API
         * if the endpoint is available.
         */
        try {
          const tasksResponse = await api.get(
            `/projects/${projectId}/tasks`
          );

          foundProject.tasks =
            tasksResponse.data.tasks || [];
        } catch (taskError) {
          /*
           * Task listing will be implemented fully in the
           * next milestone. For now an empty task list is
           * acceptable.
           */
          console.log(
            "Tasks are not available yet:",
            taskError
          );

          foundProject.tasks = [];
        }

        setProject(foundProject);
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
        {/* Project Information */}
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

        {/* Tasks */}
        <section>
          <div>
            <h2>Tasks</h2>

            <button>
              + Create Task
            </button>
          </div>

          {project.tasks.length === 0 ? (
            <div>
              <p>No tasks yet.</p>

              <p>
                Create your first task to start
                working on this project.
              </p>
            </div>
          ) : (
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

                  {task.assignee && (
                    <p>
                      Assigned to:{" "}
                      {task.assignee.name}
                    </p>
                  )}

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