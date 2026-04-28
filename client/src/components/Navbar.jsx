import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navClass = ({ isActive }) => (isActive ? "active" : undefined);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        Placement Portal
      </Link>
      <nav className="navlinks">
        <NavLink to="/" className={navClass}>
          Home
        </NavLink>
        {!user && (
          <NavLink to="/login" className={navClass}>
            Login
          </NavLink>
        )}
        {!user && (
          <NavLink to="/register" className={navClass}>
            Register
          </NavLink>
        )}
        {user?.role === "student" && (
          <NavLink to="/student" className={navClass}>
            Dashboard
          </NavLink>
        )}
        {user?.role === "student" && (
          <NavLink to="/student/growth-planner" className={navClass}>
            Growth Planner
          </NavLink>
        )}
        {user?.role === "admin" && (
          <NavLink to="/admin" className={navClass}>
            Admin
          </NavLink>
        )}
        {user && (
          <button type="button" className="ghost-button" onClick={handleLogout}>
            Logout
          </button>
        )}
      </nav>
    </header>
  );
};

