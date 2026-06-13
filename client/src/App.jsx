// client/src/App.jsx
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardLayout from "./pages/DashboardLayout";
import UsersPage from "./pages/UsersPage";
import FriendRequestsPage from "./pages/FriendRequestsPage";
import ConversationsPage from "./pages/ConversationsPage";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  return user ? <Navigate to="/users" replace /> : children;
}

function FullPageSpinner() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg)"
    }}>
      <div style={{
        width: 40, height: 40, border: "3px solid var(--border)",
        borderTopColor: "var(--accent)", borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/users" replace />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="requests" element={<FriendRequestsPage />} />
        <Route path="conversations" element={<ConversationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
