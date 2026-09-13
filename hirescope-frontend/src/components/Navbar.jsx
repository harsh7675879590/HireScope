import React from "react";
import { Sparkles, Plus, LogOut, User, Compass, BrainCircuit } from "lucide-react";

export default function Navbar({ user, onOpenNewKit, onLogout, onHomeClick }) {
  return (
    <header className="navbar-container" style={{
      borderBottom: "1px solid var(--border-subtle)",
      background: "rgba(10, 13, 20, 0.8)",
      backdropFilter: "blur(12px)",
      position: "sticky",
      top: 0,
      zIndex: 50,
      padding: "16px 24px"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Brand */}
        <div
          onClick={onHomeClick}
          style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)"
          }}>
            <BrainCircuit size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
              Hire<span style={{ color: "var(--accent-cyan)" }}>Scope</span>
            </h1>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 500 }}>
              AI Interview Prep Pipeline
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {user ? (
            <>
              <button
                id="btn-new-kit"
                onClick={onOpenNewKit}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} /> New Prep Kit
              </button>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                background: "var(--bg-glass)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                fontSize: "0.85rem",
                color: "var(--text-secondary)"
              }}>
                <User size={14} color="var(--accent-primary)" />
                <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </span>
              </div>

              <button
                id="btn-logout"
                onClick={onLogout}
                className="btn btn-secondary btn-sm"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Welcome to HireScope
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
