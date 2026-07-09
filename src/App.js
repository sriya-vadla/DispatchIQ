import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("is_authenticated") === "true";
  });
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleLogin = (user) => {
    localStorage.setItem("is_authenticated", "true");
    localStorage.setItem("user", JSON.stringify(user));
    setIsAuthenticated(true);
    if (window.location.pathname === "/login") {
      window.history.pushState({}, "", "/");
      setCurrentPath("/");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("is_authenticated");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    window.history.pushState({}, "", "/login");
    setCurrentPath("/login");
  };

  if (currentPath === "/login" || !isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}

export default App;