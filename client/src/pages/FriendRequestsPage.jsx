// client/src/pages/FriendRequestsPage.jsx
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { friendRequestsAPI } from "../api";
import { CometChat } from "../cometchat";
import styles from "./FriendRequestsPage.module.css";

export default function FriendRequestsPage() {
  const { refreshRequestCount } = useOutletContext();
  const [incoming, setIncoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  useEffect(() => {
    loadRequests();

    // Real-time: listen for custom "friend_request" messages from CometChat
    const listenerID = "friend_requests_page";
    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onCustomMessageReceived: (msg) => {
          if (msg.type === "friend_request") {
            loadRequests();
          }
        },
      })
    );
    return () => CometChat.removeMessageListener(listenerID);
  }, []);

  async function loadRequests() {
    try {
      const { data } = await friendRequestsAPI.getIncoming();
      setIncoming(data.requests);
    } catch (_) {
      toast.error("Could not load requests");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(id) {
    setActing(id);
    try {
      await friendRequestsAPI.accept(id);
      toast.success("Friend request accepted! You can now chat.");
      setIncoming((prev) => prev.filter((r) => r.id !== id));
      refreshRequestCount();
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not accept request");
    } finally {
      setActing(null);
    }
  }

  async function handleReject(id) {
    setActing(id);
    try {
      await friendRequestsAPI.reject(id);
      toast("Request rejected", { icon: "❌" });
      setIncoming((prev) => prev.filter((r) => r.id !== id));
      refreshRequestCount();
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not reject request");
    } finally {
      setActing(null);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>Friend Requests</h2>
        <span className={styles.count}>{incoming.length} pending</span>
      </header>

      {loading ? (
        <div className={styles.center}><Spinner /></div>
      ) : incoming.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🕊️</span>
          <p>No pending friend requests.</p>
          <p className={styles.emptyHint}>
            Head to <strong>Discover</strong> to find people to connect with.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {incoming.map((req) => (
            <div key={req.id} className={styles.card}>
              <img
                src={req.sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.sender_username}`}
                alt={req.sender_username}
                className={styles.avatar}
              />
              <div className={styles.info}>
                <span className={styles.username}>{req.sender_username}</span>
                <span className={styles.time}>
                  {formatRelative(req.created_at)}
                </span>
              </div>
              <div className={styles.actions}>
                <button
                  className={styles.acceptBtn}
                  disabled={acting === req.id}
                  onClick={() => handleAccept(req.id)}
                >
                  {acting === req.id ? "…" : "Accept"}
                </button>
                <button
                  className={styles.rejectBtn}
                  disabled={acting === req.id}
                  onClick={() => handleReject(req.id)}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRelative(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
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
