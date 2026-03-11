import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/apply" className="brand">
          Loan DSA Platform
        </Link>

        <nav className="nav">
          <NavLink to="/apply">Public Form</NavLink>
          <NavLink to="/admin">Dashboard</NavLink>
          {!user ? (
            <NavLink to="/admin/login">Login</NavLink>
          ) : (
            <button className="link-button" onClick={logout}>
              Logout
            </button>
          )}
        </nav>
      </header>

      <main className="container">{children}</main>
    </div>
  );
}
