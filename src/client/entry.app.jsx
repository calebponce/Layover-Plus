import React from "react";

import App from "./App";
import { AuthProvider } from "./hooks/useAuth.jsx";

export default function AppEntry() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
