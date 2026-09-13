import React, { useEffect, useState } from "react";
import { CheckCircle2, Clock, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { api } from "../api/client.js";

const STAGES = [
  "parse-input",
  "extract-requirements",
  "fetch-homepage",
  "clean-page",
  "discover-rank-links",
  "fetch-subpages",
  "search-discussions",
  "generate-brief",
  "generate-questions",
  "generate-flashcards",
  "coverage-pass-1",
  "gap-fill",
  "coverage-pass-2",
  "schedule-allocation",
  "schema-validation",
  "persist"
];

export default function ProgressModal({ kitId, onComplete, onCancel }) {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [currentStageName, setCurrentStageName] = useState("parse-input");
  const [isDone, setIsDone] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    let interval = null;
    let pollCount = 0;

    const poll = async () => {
      try {
        pollCount++;
        const kitData = await api.getKit(kitId);

        if (kitData.status === "ready") {
          setIsDone(true);
          clearInterval(interval);
          setTimeout(() => {
            onComplete(kitId);
          }, 1000);
          return;
        }

        if (kitData.status === "failed") {
          setHasFailed(true);
          clearInterval(interval);
          return;
        }

        // Check in-flight progress
        const prog = await api.getProgress(kitId).catch(() => null);
        if (prog && prog.stageIndex !== undefined) {
          setCurrentStageIdx(prog.stageIndex);
          setCurrentStageName(prog.stage);
        } else {
          // Synthetic progress if server is fast
          setCurrentStageIdx((prev) => Math.min(STAGES.length - 2, prev + 1));
          setCurrentStageName(STAGES[Math.min(STAGES.length - 2, currentStageIdx + 1)]);
        }
      } catch (err) {
        // Retry
      }
    };

    interval = setInterval(poll, 1200);
    poll();

    return () => clearInterval(interval);
  }, [kitId, onComplete, currentStageIdx]);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(5, 7, 13, 0.9)",
      backdropFilter: "blur(14px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      zIndex: 110
    }}>
      <div className="glass-card animate-fade-in" style={{ width: "100%", maxWidth: 600, padding: 36, textAlign: "center" }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: "var(--radius-pill)",
          background: isDone
            ? "rgba(16, 185, 129, 0.15)"
            : hasFailed
            ? "rgba(244, 63, 94, 0.15)"
            : "rgba(99, 102, 241, 0.15)",
          margin: "0 auto 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${isDone ? "var(--accent-emerald)" : hasFailed ? "var(--accent-rose)" : "var(--accent-primary)"}`
        }}>
          {isDone ? (
            <CheckCircle2 size={30} color="var(--accent-emerald)" />
          ) : hasFailed ? (
            <AlertTriangle size={30} color="var(--accent-rose)" />
          ) : (
            <Loader2 size={30} color="var(--accent-primary)" className="animate-spin" />
          )}
        </div>

        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 8 }}>
          {isDone
            ? "Prep Kit Ready!"
            : hasFailed
            ? "Generation Encountered Issues"
            : "Synthesizing Preparation Kit"}
        </h2>

        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 28 }}>
          {isDone
            ? "All 16 deterministic and generative stages completed successfully."
            : hasFailed
            ? "The pipeline could not complete all stages. Inspect kit for partial items."
            : `Executing Stage ${currentStageIdx + 1} of 16: ${currentStageName.replace("-", " ")}`}
        </p>

        {/* Progress Bar */}
        <div style={{
          width: "100%",
          height: 8,
          background: "var(--bg-glass)",
          borderRadius: "var(--radius-pill)",
          overflow: "hidden",
          marginBottom: 28,
          border: "1px solid var(--border-subtle)"
        }}>
          <div style={{
            width: `${isDone ? 100 : Math.max(8, ((currentStageIdx + 1) / 16) * 100)}%`,
            height: "100%",
            background: isDone
              ? "linear-gradient(90deg, #10b981 0%, #06b6d4 100%)"
              : "linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)",
            transition: "width 0.4s ease"
          }} />
        </div>

        {/* Stage List Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          textAlign: "left",
          maxHeight: 240,
          overflowY: "auto",
          padding: 12,
          background: "var(--bg-primary)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          marginBottom: 24
        }}>
          {STAGES.map((s, idx) => {
            const isFinished = isDone || idx < currentStageIdx;
            const isCurrent = !isDone && idx === currentStageIdx;

            return (
              <div
                key={s}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "0.8rem",
                  color: isFinished
                    ? "var(--text-primary)"
                    : isCurrent
                    ? "var(--accent-cyan)"
                    : "var(--text-muted)"
                }}
              >
                {isFinished ? (
                  <CheckCircle2 size={14} color="var(--accent-emerald)" />
                ) : isCurrent ? (
                  <Loader2 size={14} color="var(--accent-cyan)" className="animate-spin" />
                ) : (
                  <Clock size={14} color="var(--text-muted)" />
                )}
                <span>{idx + 1}. {s.replace("-", " ")}</span>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          {isDone ? (
            <button
              onClick={() => onComplete(kitId)}
              className="btn btn-primary"
            >
              Open Prep Kit <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={onCancel}
              className="btn btn-secondary btn-sm"
            >
              Continue in Background
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
