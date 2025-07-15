import React, { useState } from "react";

const Login: React.FC<{ onLogin: (token: string) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        onLogin(data.token);
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 320, margin: "2rem auto", padding: 24, border: "1px solid #ccc", borderRadius: 8, background: "#fff" }}>
      <h2>Login</h2>
      <div style={{ marginBottom: 12 }}>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Username"
          autoFocus
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          style={{ width: "100%", padding: 8 }}
        />
      </div>
      <button type="submit" disabled={loading} style={{ width: "100%", padding: 10 }}>
        {loading ? "Logging in..." : "Login"}
      </button>
      {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
    </form>
  );
};

export default Login; 