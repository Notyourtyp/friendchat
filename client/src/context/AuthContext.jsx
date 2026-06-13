// client/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../api";
import { initCometChat, loginCometChat, logoutCometChat } from "../cometchat";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    async function restore() {
      const token = localStorage.getItem("token");
      if (!token) { setLoading(false); return; }

      try {
        await initCometChat();
        const { data } = await authAPI.me();
        setUser(data.user);
        // Log into CometChat with the fresh token returned by /auth/me
        await loginCometChat(data.user.id, data.ccAuthToken);
      } catch (_) {
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  async function login(email, password) {
    await initCometChat();
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    await loginCometChat(data.user.id, data.ccAuthToken);
    return data;
  }

  async function register(username, email, password) {
    await initCometChat();
    const { data } = await authAPI.register({ username, email, password });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    await loginCometChat(data.user.id, data.ccAuthToken);
    return data;
  }

  async function logout() {
    await logoutCometChat();
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
