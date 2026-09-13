import React, { useState } from "react";
import { api } from "../api/client.js";
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function AuthModal({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const fn = isRegister ? api.register : api.login;
      const user = await fn(email, password);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.data?.message || err.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail("candidate@hirescope.ai");
    setPassword("DemoPassword123!");
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(5, 7, 13, 0.85)",
      backdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      zIndex: 100
    }}>
      <div className="glass-card animate-fade-in" style={{ width: "100%", maxWidth: 440, padding: 36 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 24px var(--accent-glow)"
          }}>
            <ShieldCheck size={28} color="#fff" />
          </div>
          <h2 style={{ fontSize: "1.6rem", marginBottom: 6 }}>
            {isRegister ? "Create your Account" : "Welcome Back"}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            {isRegister
              ? "Start generating tailored, deterministic interview prep kits."
              : "Sign in to access your interview kits and weak-spot analytics."}
          </p>
        </div>

        {error && (
          <div style={{
            background: "rgba(244, 63, 94, 0.15)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
            color: "#fb7185",
            fontSize: "0.85rem",
            marginBottom: 20
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="input-auth-email"
                type="email"
                required
                className="input-field"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 40 }}
              />
              <Mail size={18} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: 14 }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="input-auth-password"
                type="password"
                required
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: 40 }}
              />
              <Lock size={18} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: 14 }} />
            </div>
          </div>

          <button
            id="btn-auth-submit"
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 8, padding: 12 }}
          >
            {loading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: "none", border: "none", color: "var(--accent-primary)", fontSize: "0.85rem", cursor: "pointer", fontWeight: 600 }}
          >
            {isRegister ? "Already have an account? Sign In" : "Don't have an account? Register now"}
          </button>

          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={handleQuickDemo}
              style={{
                background: "rgba(99, 102, 241, 0.1)",
                border: "1px dashed var(--accent-primary)",
                color: "var(--text-accent)",
                padding: "6px 14px",
                borderRadius: "var(--radius-pill)",
                fontSize: "0.75rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <Sparkles size={14} /> Prefill Demo Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
