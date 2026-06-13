// client/src/pages/DashboardLayout.jsx
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { friendRequestsAPI } from "../api";
import { CometChat } from "../cometchat";
import styles from "./DashboardLayout.module.css";

const NAV = [
  { to: "/users", label: "Discover", icon: "🔍" },
  { to: "/requests", label: "Requests", icon: "🤝" },
  { to: "/conversations", label: "Conversations", icon: "💬" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [requestCount, setRequestCount] = useState(0);

  // Poll incoming requests count
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, []);

  // Real-time listener for incoming friend requests via CometChat custom messages
  useEffect(() => {
    const listenerID = "fr_layout_listener";
    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onCustomMessageReceived: (msg) => {
          if (msg.type === "friend_request") {
            toast("📨 New friend request!", { icon: "🤝" });
            fetchCount();
          }
        },
      })
    );
    return () => CometChat.removeMessageListener(listenerID);
  }, []);

  async function fetchCount() {
    try {
      const { data } = await friendRequestsAPI.getIncoming();
      setRequestCount(data.requests.length);
    } catch (_) {}
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>💬</span>
          <span className={styles.brandName}>FriendChat</span>
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navActive : ""}`
              }
            >
              <span className={styles.navIcon}>{icon}</span>
              <span className={styles.navLabel}>{label}</span>
              {to === "/requests" && requestCount > 0 && (
                <span className={styles.badge}>{requestCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={styles.userSection}>
          <img
            src={user?.avatar}
            alt={user?.username}
            className={styles.avatar}
          />
          <div className={styles.userInfo}>
            <span className={styles.username}>{user?.username}</span>
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className={styles.logoutBtn}
            title="Sign out"
          >
            ↩
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet context={{ refreshRequestCount: fetchCount }} />
      </main>
    </div>
  );
}
