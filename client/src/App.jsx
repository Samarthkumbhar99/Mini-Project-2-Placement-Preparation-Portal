import { Navigate, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { AuthPage } from "./pages/AuthPage";
import { StudentDashboard } from "./pages/StudentDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";

const App = () => {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to={user ? (user.role === "admin" ? "/admin" : "/student") : "/login"} replace />} />
        <Route path="/login" element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace /> : <AuthPage mode="login" />} />
        <Route path="/register" element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace /> : <AuthPage mode="register" />} />
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;

