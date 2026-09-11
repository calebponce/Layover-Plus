import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth.jsx";
import PortfolioDemo from "./pages/PortfolioDemo.jsx";
import "./styles.css";

const PORTFOLIO_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {PORTFOLIO_DEMO_MODE ? (
      <PortfolioDemo />
    ) : (
      <AuthProvider>
        <App />
      </AuthProvider>
    )}
  </React.StrictMode>
);
