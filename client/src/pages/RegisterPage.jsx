// client/src/pages/RegisterPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate("/users");
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>💬</span>
          <h1 className={styles.logoText}>FriendChat</h1>
        </div>
        <p className={styles.subtitle}>Create your account</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="username">Username</label>
            <input
              id="username" name="username" type="text"
              placeholder="john_doe"
              value={form.username} onChange={handleChange} required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email" name="email" type="email"
              placeholder="you@example.com"
              value={form.email} onChange={handleChange} required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password" name="password" type="password"
              placeholder="At least 6 characters"
              value={form.password} onChange={handleChange} required
            />
          </div>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className={styles.switch}>
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
