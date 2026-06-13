// client/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a1d27",
              color: "#f0f0ff",
              border: "1px solid #2a2f45",
              borderRadius: "10px",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "#1a1d27" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#1a1d27" } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
