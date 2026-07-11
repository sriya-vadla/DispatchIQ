import React, { useState } from "react";
import { Monitor, AlertCircle, EyeOff, Eye, Info } from "lucide-react";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    // Simulate standard secure authorization delay (1.2 seconds)
    setTimeout(() => {
      const lowerEmail = email.trim().toLowerCase();
      if (lowerEmail === "ceo@dispatchiq.com" && password === "CEO@123") {
        onLogin({
          name: "Alex Johnson",
          email: "ceo@dispatchiq.com",
          role: "CEO"
        });
      } else if ((lowerEmail === "admin@dispatch.com" || lowerEmail === "sriya@dispatch.com" || lowerEmail === "sriya@dispatchiq.com" || lowerEmail === "amit@dispatchiq.com") && password === "admin123") {
        onLogin({
          name: "Sriya Vadla",
          email: "sriya@dispatchiq.com",
          role: "Operations Director"
        });
      } else if (lowerEmail === "sriyavadla@gmail.com" && (password === "Lead@123" || password === "OpsLead@123")) {
        onLogin({
          name: "Sriya Vadla",
          email: "sriyavadla@gmail.com",
          role: "Operations Lead"
        });
      } else if (lowerEmail === "manager@dispatch.com" && password === "manager123") {
        onLogin({
          name: "Ananya Sharma",
          email: "manager@dispatch.com",
          role: "Manager"
        });
      } else if (lowerEmail === "agent@dispatch.com" && password === "agent123") {
        onLogin({
          name: "Ravi Kumar",
          email: "agent@dispatch.com",
          role: "Agent"
        });
      } else if (lowerEmail === "analyst@dispatchiq.com" && password === "Analyst@123") {
        onLogin({
          name: "Ananya Sen",
          email: "analyst@dispatchiq.com",
          role: "Business Analyst"
        });
      } else {
        setError("Invalid email address or password.");
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="login-page-container">
      {/* Dynamic Glowing Ambient Blobs */}
      <div className="login-bg-glow blob-1"></div>
      <div className="login-bg-glow blob-2"></div>

      <div className="login-card">
        <div className="login-header-logo">
          <div className="login-logo-circle">
            <Monitor size={24} color="var(--accent-blue)" strokeWidth={2.5} />
          </div>
          <h2>Dispatch Control Portal</h2>
          <p>Sign in to launch your mitigation dashboard</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {error && (
            <div className="login-error-alert" role="alert">
              <AlertCircle size={16} color="var(--accent-red)" strokeWidth={2.5} />
              <span>{error}</span>
            </div>
          )}

          <div className="login-field">
            <label htmlFor="email">Email Address</label>
            <input
              type="text"
              id="email"
              placeholder="admin@dispatch.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Security Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                style={{ width: "100%", boxSizing: "border-box", paddingRight: "40px" }}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-login-submit" disabled={loading} style={{ marginTop: "10px" }}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                <span className="login-spinner" />
                Authorizing...
              </span>
            ) : (
              "Sign In to Workspace"
            )}
          </button>
        </form>

        <div className="login-credentials-hint" style={{ marginTop: "20px", padding: "12px 16px", borderRadius: "10px", backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color)", textAlign: "left" }}>
          <p style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontSize: "0.82rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
            <Info size={13} color="var(--accent-blue)" strokeWidth={2.5} />
            Demo Credentials
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span><strong style={{ color: "var(--text-primary)" }}>🏢 CEO:</strong> ceo@dispatchiq.com</span>
              <code style={{ color: "var(--text-primary)" }}>CEO@123</code>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span><strong style={{ color: "var(--text-primary)" }}>🛡️ Operations Director:</strong> sriya@dispatchiq.com</span>
              <code style={{ color: "var(--text-primary)" }}>admin123</code>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span><strong style={{ color: "var(--text-primary)" }}>🤝 Customer Success Manager:</strong> manager@dispatch.com</span>
              <code style={{ color: "var(--text-primary)" }}>manager123</code>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span><strong style={{ color: "var(--text-primary)" }}>🎯 Operations Lead:</strong> sriyavadla@gmail.com</span>
              <code style={{ color: "var(--text-primary)" }}>Lead@123</code>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span><strong style={{ color: "var(--text-primary)" }}>🎧 Support Agent:</strong> agent@dispatch.com</span>
              <code style={{ color: "var(--text-primary)" }}>agent123</code>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span><strong style={{ color: "var(--text-primary)" }}>📈 Business Analyst:</strong> analyst@dispatchiq.com</span>
              <code style={{ color: "var(--text-primary)" }}>Analyst@123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
