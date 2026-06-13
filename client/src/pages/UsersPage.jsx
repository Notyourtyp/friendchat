// client/src/pages/UsersPage.jsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { usersAPI, friendRequestsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import styles from "./UsersPage.module.css";

const STATUS_CONFIG = {
  none: { label: "Add Friend", actionable: true, style: "primary" },
  request_sent: { label: "Request Sent", actionable: false, style: "muted" },
  request_received: { label: "Respond ↗", actionable: false, style: "amber" },
  friends: { label: "✓ Friends", actionable: false, style: "green" },
};

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null); // userId being acted on

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const { data } = await usersAPI.getAll();
      setUsers(data.users);
    } catch (_) {
      toast.error("Could not load users");
    } finally {
      setLoading(false);
    }
  }

  async function sendRequest(userId) {
    setSending(userId);
    try {
      await friendRequestsAPI.send(userId);
      toast.success("Friend request sent!");
      // Optimistically update status
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, relationshipStatus: "request_sent" } : u
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not send request");
    } finally {
      setSending(null);
    }
  }

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Discover People</h2>
          <p className={styles.sub}>{users.length} users on FriendChat</p>
        </div>
        <input
          className={styles.search}
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      {loading ? (
        <div className={styles.center}>
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.center}>
          <p className={styles.empty}>
            {search ? "No users match your search." : "No other users yet."}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((u) => {
            const cfg = STATUS_CONFIG[u.relationshipStatus] ?? STATUS_CONFIG.none;
            return (
              <div key={u.id} className={styles.card}>
                <img src={u.avatar} alt={u.username} className={styles.avatar} />
                <div className={styles.info}>
                  <span className={styles.username}>{u.username}</span>
                  <span className={styles.email}>{u.email}</span>
                </div>
                <button
                  className={`${styles.actionBtn} ${styles[cfg.style]}`}
                  disabled={!cfg.actionable || sending === u.id}
                  onClick={() => cfg.actionable && sendRequest(u.id)}
                >
                  {sending === u.id ? "…" : cfg.label}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 32, height: 32, border: "3px solid var(--border)",
      borderTopColor: "var(--accent)", borderRadius: "50%",
      animation: "spin 0.8s linear infinite"
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
