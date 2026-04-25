import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
        <NavLink to="/">Home</NavLink>
        {!user && <NavLink to="/login">Login</NavLink>}
        {!user && <NavLink to="/register">Register</NavLink>}
        {user?.role === "student" && <NavLink to="/student">Dashboard</NavLink>}
        {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
        {user && (
          <button type="button" className="ghost-button" onClick={handleLogout}>
            Logout
          </button>
        )}
      </nav>
    </header>
  );
};

