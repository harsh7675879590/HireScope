import React from "react";
import { Plus, BookOpen, Calendar, CheckCircle, Clock, Trash2, ArrowRight, Activity, Award } from "lucide-react";

export default function Dashboard({ kits = [], onSelectKit, onOpenNewKit, onDeleteKit }) {
  const readyKits = kits.filter((k) => k.status === "ready");

  return (
    <div className="dashboard-container" style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      {/* Top Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 8 }}>
            Interview Preparation Kits
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Deterministic, requirement-aligned study roadmaps with interactive practice & weak spot diagnostics.
          </p>
        </div>

        <button
          id="btn-create-kit-dashboard"
          onClick={onOpenNewKit}
          className="btn btn-primary"
        >
          <Plus size={18} /> New Prep Kit
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 20,
        marginBottom: 40
      }}>
        <div className="glass-card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-md)",
            background: "rgba(99, 102, 241, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <BookOpen size={24} color="var(--accent-primary)" />
          </div>
          <div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{kits.length}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Total Prep Kits</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-md)",
            background: "rgba(16, 185, 129, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <CheckCircle size={24} color="var(--accent-emerald)" />
          </div>
          <div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{readyKits.length}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Ready Kits</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-md)",
            background: "rgba(6, 182, 212, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Activity size={24} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>100%</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Must-Have Coverage Goal</div>
          </div>
        </div>
      </div>

      {/* Kits List */}
      {kits.length === 0 ? (
        <div className="glass-card" style={{ padding: "64px 32px", textAlign: "center" }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: "var(--radius-pill)",
            background: "var(--bg-glass)",
            margin: "0 auto 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <BookOpen size={32} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: "1.3rem", marginBottom: 8 }}>No Interview Prep Kits Yet</h3>
          <p style={{ color: "var(--text-secondary)", maxWidth: 440, margin: "0 auto 24px", fontSize: "0.95rem" }}>
            Paste any Job Description and target company URL to generate an end-to-end interview kit with custom questions and daily schedules.
          </p>
          <button onClick={onOpenNewKit} className="btn btn-primary">
            <Plus size={18} /> Create Your First Kit
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 24 }}>
          {kits.map((k) => {
            const role = k.kit?.role || "Software Engineer";
            const seniority = k.kit?.seniority || "Mid-Level";
            const days = k.input?.days || 5;
            const isReady = k.status === "ready";
            const questionsCount = k.kit?.questions?.length || 0;
            const flashcardsCount = k.kit?.flashcards?.length || 0;

            return (
              <div
                key={k._id}
                className="glass-card"
                style={{
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  position: "relative"
                }}
                onClick={() => onSelectKit(k._id)}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <span className={`badge ${isReady ? "badge-nice" : k.status === "failed" ? "badge-must" : "badge-tech"}`}>
                      {k.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this prep kit?")) onDeleteKit(k._id);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: 6, color: "var(--text-muted)" }}
                      title="Delete kit"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 4 }}>
                    {role}
                  </h3>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-accent)", marginBottom: 16 }}>
                    {seniority} • {k.input?.company_url || "Target Company"}
                  </div>

                  <div style={{ display: "flex", gap: 16, fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 20 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Calendar size={14} /> {days} Days
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <BookOpen size={14} /> {questionsCount} Questions
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Award size={14} /> {flashcardsCount} Cards
                    </span>
                  </div>
                </div>

                <div style={{
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Updated {new Date(k.updatedAt || k.createdAt).toLocaleDateString()}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--accent-primary)", fontWeight: 600 }}>
                    Open Kit <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
