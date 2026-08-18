import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { LayoutTeam, LayoutUser } from "../hooks/useLayoutData";

interface AppLayoutProps {
  children: ReactNode;
  user: LayoutUser | null;
  teams: LayoutTeam[];
  activeNav: "dashboard" | "tasks" | "teams" | "analytics";
  mobileMenuOpen: boolean;
  onMobileMenuOpen: () => void;
  onMobileMenuClose: () => void;
  onLogout: () => void;
}

const AppLayout = ({
  children,
  user,
  teams,
  activeNav,
  mobileMenuOpen,
  onMobileMenuOpen,
  onMobileMenuClose,
  onLogout,
}: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const go = (path: string) => {
    onMobileMenuClose();
    navigate(path);
  };

  return (
    <div className="app-shell">
      {mobileMenuOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={onMobileMenuClose}
        />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">TF</span>
          <span>TeamFlow</span>
          <button
            className="sidebar-close"
            onClick={onMobileMenuClose}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeNav === "dashboard" ? "nav-item-active" : ""}`}
            onClick={() => go("/dashboard")}
          >
            <span className="nav-icon">⌂</span>
            Dashboard
          </button>
          <button
            className={`nav-item ${activeNav === "tasks" ? "nav-item-active" : ""}`}
            onClick={() => go(teams[0] ? `/teams/${teams[0].id}` : "/dashboard")}
          >
            <span className="nav-icon">✓</span>
            Tasks
          </button>
          <button
            className={`nav-item ${activeNav === "teams" ? "nav-item-active" : ""}`}
            onClick={() => go(teams[0] ? `/teams/${teams[0].id}` : "/dashboard")}
          >
            <span className="nav-icon">♙</span>
            Teams
          </button>
          <button
            className={`nav-item ${activeNav === "analytics" ? "nav-item-active" : ""}`}
            onClick={() => go("/dashboard#analytics")}
          >
            <span className="nav-icon">◫</span>
            Analytics
          </button>
        </nav>

        <div className="nav-label nav-label-projects">PROJECTS</div>
        <nav className="sidebar-nav">
          {teams.slice(0, 5).map((team, index) => (
            <button
              key={team.id}
              className={`nav-item project-nav-item ${
                location.pathname === `/teams/${team.id}` ? "nav-item-active" : ""
              }`}
              onClick={() => go(`/teams/${team.id}`)}
            >
              <span className={`project-dot project-dot-${index % 4}`} />
              <span className="project-nav-name">{team.name}</span>
            </button>
          ))}
          {!teams.length && (
            <span className="sidebar-empty">No teams yet</span>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon">✦</div>
            <strong>Stay productive</strong>
            <p>Keep your projects moving and your team aligned.</p>
          </div>

          <button className="nav-item sidebar-logout" onClick={onLogout}>
            <span className="nav-icon">↪</span>
            Logout
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu-button"
            onClick={onMobileMenuOpen}
            aria-label="Open navigation"
          >
            ☰
          </button>

          <div className="topbar-search">
            <span>⌕</span>
            <input type="search" placeholder="Search anything..." aria-label="Search" />
            <kbd>⌘ K</kbd>
          </div>

          <div className="topbar-actions">
            <button className="topbar-icon-button" aria-label="Calendar">□</button>
            <button className="topbar-icon-button" aria-label="Notifications">♧</button>
            <div className="user-menu">
              <div className="avatar">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="user-menu-info">
                <strong>{user?.name || "User"}</strong>
                <span>TeamFlow member</span>
              </div>
              <span className="user-chevron">⌄</span>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
};

export default AppLayout;
