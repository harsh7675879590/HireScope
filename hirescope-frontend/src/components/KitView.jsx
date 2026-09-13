import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Calendar, BookOpen, Award, Building2, CheckCircle,
  AlertCircle, Pin, Trash2, Edit3, Plus, RotateCw, RefreshCw,
  ChevronRight, Star, ExternalLink, Activity, ShieldCheck, Zap
} from "lucide-react";
import { api } from "../api/client.js";

export default function KitView({ kitId, onBack }) {
  const [kitRecord, setKitRecord] = useState(null);
  const [activeTab, setActiveTab] = useState("schedule"); // schedule, questions, flashcards, brief, coverage, weakspots
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter for questions tab
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Active recall flashcard session state
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionCards, setSessionCards] = useState([]);

  // Weak spots data
  const [weakSpotsData, setWeakSpotsData] = useState(null);

  // Edit / Add modal state
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestionForm, setNewQuestionForm] = useState({
    category: "technical",
    question: "",
    why_relevant: "",
    difficulty: 2,
    estimated_minutes: 20
  });

  // Regenerate section modal
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenSection, setRegenSection] = useState("questions:technical");
  const [regenLoading, setRegenLoading] = useState(false);

  const fetchKit = async () => {
    try {
      setLoading(true);
      const data = await api.getKit(kitId);
      setKitRecord(data);
      if (data.kit?.flashcards) {
        setSessionCards(data.kit.flashcards.filter((f) => !f._state?.deleted));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeakSpots = async () => {
    try {
      const data = await api.getWeakSpots(kitId);
      setWeakSpotsData(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchKit();
    fetchWeakSpots();
  }, [kitId]);

  // Start active practice session
  const handleStartPractice = async () => {
    try {
      const res = await api.startPracticeSession(kitId);
      setSessionId(res.sessionId);
      setSessionCards(res.cards);
      setActiveCardIndex(0);
      setIsFlipped(false);
      setActiveTab("flashcards");
    } catch (err) {
      alert("Error starting practice session: " + err.message);
    }
  };

  // Record confidence rating on flashcard
  const handleRateCard = async (confidence) => {
    const currentCard = sessionCards[activeCardIndex];
    if (!currentCard) return;

    try {
      if (sessionId) {
        await api.recordCardAnswer(kitId, sessionId, currentCard.id, confidence);
      }
      setIsFlipped(false);
      if (activeCardIndex + 1 < sessionCards.length) {
        setActiveCardIndex((prev) => prev + 1);
      } else {
        alert("Practice session finished! Great job! Checking weak spots...");
        fetchWeakSpots();
        setActiveTab("weakspots");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Question operations
  const handleTogglePin = async (qid) => {
    try {
      await api.togglePinQuestion(kitId, qid);
      fetchKit();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteQuestion = async (qid) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await api.deleteQuestion(kitId, qid);
      fetchKit();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveQuestionEdit = async (e) => {
    e.preventDefault();
    try {
      await api.patchQuestion(kitId, editingQuestion.id, {
        question: editingQuestion.question,
        why_relevant: editingQuestion.why_relevant,
        difficulty: Number(editingQuestion.difficulty),
        estimated_minutes: Number(editingQuestion.estimated_minutes)
      });
      setEditingQuestion(null);
      fetchKit();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      await api.addQuestion(kitId, newQuestionForm);
      setIsAddingQuestion(false);
      setNewQuestionForm({
        category: "technical",
        question: "",
        why_relevant: "",
        difficulty: 2,
        estimated_minutes: 20
      });
      fetchKit();
    } catch (err) {
      alert(err.message);
    }
  };

  // Section regeneration
  const handleRegenerate = async () => {
    setRegenLoading(true);
    try {
      await api.regenerateSection(kitId, regenSection);
      setIsRegenerating(false);
      fetchKit();
    } catch (err) {
      alert("Regeneration failed: " + (err.data?.message || err.message));
    } finally {
      setRegenLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: "80px auto", textAlign: "center", color: "var(--text-muted)" }}>
        <RefreshCw size={36} className="animate-spin" style={{ margin: "0 auto 16px" }} />
        <div>Loading Preparation Kit...</div>
      </div>
    );
  }

  if (error || !kitRecord || !kitRecord.kit) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center" }} className="glass-card">
        <AlertCircle size={48} color="var(--accent-rose)" style={{ margin: "0 auto 16px" }} />
        <h3>Failed to load kit</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>{error || "Kit is not ready yet."}</p>
        <button onClick={onBack} className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  const kit = kitRecord.kit;
  const questions = kit.questions || [];
  const schedule = kit.schedule || [];
  const flashcards = kit.flashcards || [];
  const brief = kit.company_brief || {};
  const coverage = kit.coverage || { uncovered_requirement_ids: [], passes: 1 };

  const filteredQuestions = categoryFilter === "all"
    ? questions
    : questions.filter((q) => q.category === categoryFilter);

  const activeFlashcard = sessionCards[activeCardIndex] || flashcards[0];

  return (
    <div className="kit-view-container" style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      {/* Back Button & Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <button
            onClick={onBack}
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <ArrowLeft size={15} /> Back to Kits
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 800 }}>
              {kit.role}
            </h2>
            <span className="badge badge-tech">{kit.seniority}</span>
            <span className="badge badge-nice">Status: {kitRecord.status}</span>
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: 4 }}>
            {kitRecord.input?.company_url} • {kitRecord.input?.days} Days Preparation Plan
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            id="btn-practice-top"
            onClick={handleStartPractice}
            className="btn btn-primary btn-sm"
          >
            <Zap size={16} /> Start Active Practice
          </button>
          <button
            id="btn-regenerate-modal"
            onClick={() => setIsRegenerating(true)}
            className="btn btn-secondary btn-sm"
          >
            <RotateCw size={15} /> Regenerate Section
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{
        display: "flex",
        gap: 8,
        borderBottom: "1px solid var(--border-subtle)",
        marginBottom: 32,
        overflowX: "auto",
        paddingBottom: 4
      }}>
        {[
          { id: "schedule", label: "Schedule Roadmap", icon: Calendar },
          { id: "questions", label: `Interview Questions (${questions.length})`, icon: BookOpen },
          { id: "flashcards", label: `Active Recall (${flashcards.length})`, icon: Award },
          { id: "brief", label: "Company Brief", icon: Building2 },
          { id: "coverage", label: "Coverage Matrix", icon: ShieldCheck },
          { id: "weakspots", label: "Weak Spots & Readiness", icon: Activity }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn btn-sm"
              style={{
                background: isActive ? "var(--bg-glass)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                border: "1px solid",
                borderColor: isActive ? "var(--border-active)" : "transparent",
                borderRadius: "var(--radius-md) var(--radius-md) 0 0",
                boxShadow: isActive ? "0 0 15px rgba(99, 102, 241, 0.2)" : "none"
              }}
            >
              <Icon size={16} color={isActive ? "var(--accent-cyan)" : "currentColor"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SCHEDULE ROADMAP */}
      {activeTab === "schedule" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Deterministic priority distribution across exactly {schedule.length} days. Higher-priority material occurs earlier.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {schedule.map((day) => {
              const dayQuestions = day.question_ids
                .map((qid) => questions.find((q) => q.id === qid))
                .filter(Boolean);

              return (
                <div key={day.day} className="glass-card" style={{ padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: "var(--radius-pill)",
                        background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "0.9rem"
                      }}>
                        D{day.day}
                      </div>
                      <div>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{day.focus}</h4>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          {day.question_ids.length} questions allocated
                        </span>
                      </div>
                    </div>

                    <span className="badge badge-nice">
                      {day.minutes} Minutes
                    </span>
                  </div>

                  {/* Questions under this day */}
                  {dayQuestions.length === 0 ? (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic", padding: "12px 0" }}>
                      Free review / rest & reflection day.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {dayQuestions.map((q) => (
                        <div
                          key={q.id}
                          style={{
                            background: "var(--bg-primary)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "var(--radius-md)",
                            padding: "12px 16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <div>
                            <span className={`badge ${
                              q.category === "technical" ? "badge-tech" :
                              q.category === "system-design" ? "badge-system" :
                              q.category === "behavioural" ? "badge-behav" : "badge-fit"
                            }`} style={{ marginRight: 8 }}>
                              {q.category}
                            </span>
                            <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                              {q.question}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            Diff: {q.difficulty}/3 • {q.estimated_minutes || 20}m
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: QUESTIONS LIST */}
      {activeTab === "questions" && (
        <div className="animate-fade-in">
          {/* Filter and Add Question */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["all", "technical", "system-design", "behavioural", "company-fit"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`btn btn-sm ${categoryFilter === cat ? "btn-primary" : "btn-secondary"}`}
                >
                  {cat.replace("-", " ")}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsAddingQuestion(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={16} /> Add Custom Question
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredQuestions.map((q) => {
              const isPinned = q._state?.pinned;
              const isEdited = q._state?.edited;
              const isManual = q._state?.origin === "manual";

              return (
                <div key={q.id} className="glass-card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span className={`badge ${
                        q.category === "technical" ? "badge-tech" :
                        q.category === "system-design" ? "badge-system" :
                        q.category === "behavioural" ? "badge-behav" : "badge-fit"
                      }`}>
                        {q.category}
                      </span>
                      <span className="badge badge-nice">Difficulty: {q.difficulty}/3</span>
                      {isPinned && <span className="badge badge-behav">📌 Pinned</span>}
                      {isEdited && <span className="badge badge-system">✏️ Edited</span>}
                      {isManual && <span className="badge badge-must">👤 Manual</span>}
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => handleTogglePin(q.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: 6, color: isPinned ? "var(--accent-amber)" : "var(--text-muted)" }}
                        title={isPinned ? "Unpin question" : "Pin question (protects from regeneration)"}
                      >
                        <Pin size={15} />
                      </button>
                      <button
                        onClick={() => setEditingQuestion(q)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: 6 }}
                        title="Edit question"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: 6, color: "var(--accent-rose)" }}
                        title="Delete question"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>
                    {q.question}
                  </h3>

                  <div style={{
                    background: "var(--bg-primary)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 16px",
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                    marginBottom: 10
                  }}>
                    <strong style={{ color: "var(--text-primary)" }}>Why Relevant: </strong>
                    {q.why_relevant}
                  </div>

                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Estimated time: {q.estimated_minutes || 20}m • Linked requirements: {(q.requirement_ids || []).join(", ") || "None"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVE RECALL FLASHCARDS */}
      {activeTab === "flashcards" && (
        <div className="animate-fade-in" style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Card {activeCardIndex + 1} of {sessionCards.length || flashcards.length}
            </span>
            <button onClick={handleStartPractice} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} /> Reset Session
            </button>
          </div>

          {activeFlashcard ? (
            <div className="card-perspective" style={{ marginBottom: 28 }}>
              <div
                className={`flashcard-inner ${isFlipped ? "is-flipped" : ""}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className="flashcard-front glass-card">
                  <span className="badge badge-tech" style={{ marginBottom: 16 }}>
                    Front • Click or Press Space to Flip
                  </span>
                  <p style={{ fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.5 }}>
                    {activeFlashcard.front}
                  </p>
                </div>

                <div className="flashcard-back glass-card">
                  <span className="badge badge-nice" style={{ marginBottom: 16 }}>
                    Back • Explanation
                  </span>
                  <p style={{ fontSize: "1.1rem", lineHeight: 1.6, color: "var(--text-primary)" }}>
                    {activeFlashcard.back}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: 40 }}>No flashcards found.</div>
          )}

          {/* Rating Stepper (1 to 5 Confidence) */}
          <div style={{ background: "var(--bg-glass)", padding: 20, borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 12 }}>
              Rate your recall confidence (1 = Didn't know, 5 = Mastered):
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRateCard(rating)}
                  className="btn btn-secondary"
                  style={{
                    width: 44,
                    height: 44,
                    padding: 0,
                    fontWeight: 700,
                    borderRadius: "var(--radius-pill)",
                    background: rating <= 2 ? "rgba(244, 63, 94, 0.15)" : rating === 3 ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                    borderColor: rating <= 2 ? "var(--accent-rose)" : rating === 3 ? "var(--accent-amber)" : "var(--accent-emerald)"
                  }}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPANY BRIEF */}
      {activeTab === "brief" && (
        <div className="animate-fade-in glass-card" style={{ padding: 32 }}>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 16 }}>
            {brief.company_name || "Company Overview"}
          </h3>

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: "1rem", color: "var(--accent-cyan)", marginBottom: 8 }}>Overview</h4>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{brief.overview}</p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: "1rem", color: "var(--accent-cyan)", marginBottom: 8 }}>Culture & Values</h4>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{brief.culture}</p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: "1rem", color: "var(--accent-cyan)", marginBottom: 8 }}>Expected Interview Style</h4>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{brief.interview_process}</p>
          </div>

          <div>
            <h4 style={{ fontSize: "1rem", color: "var(--accent-cyan)", marginBottom: 8 }}>Sources & Crawled Data</h4>
            <ul style={{ paddingLeft: 20, color: "var(--text-muted)", fontSize: "0.85rem" }}>
              {(brief.sources || []).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB 5: COVERAGE MATRIX */}
      {activeTab === "coverage" && (
        <div className="animate-fade-in glass-card" style={{ padding: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Deterministic Coverage Analysis</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                100% of must-have requirements must be covered across interview questions.
              </p>
            </div>
            <span className="badge badge-nice">
              Passes Executed: {coverage.passes || 1} / 3
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(kit.requirements || []).map((req) => {
              const isUncovered = (coverage.uncovered_requirement_ids || []).includes(req.id);
              return (
                <div
                  key={req.id}
                  style={{
                    background: "var(--bg-primary)",
                    border: `1px solid ${isUncovered ? "var(--accent-rose)" : "var(--border-subtle)"}`,
                    borderRadius: "var(--radius-md)",
                    padding: "14px 18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <span className={`badge ${req.priority === "must" ? "badge-must" : "badge-nice"}`} style={{ marginRight: 10 }}>
                      {req.priority}
                    </span>
                    <span style={{ fontSize: "0.95rem" }}>{req.text}</span>
                  </div>

                  <span className={`badge ${isUncovered ? "badge-must" : "badge-nice"}`}>
                    {isUncovered ? "Uncovered" : "Covered ✓"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: WEAK SPOTS & READINESS (CREATIVE FEATURE) */}
      {activeTab === "weakspots" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {weakSpotsData ? (
            <>
              {/* Readiness Score Card */}
              <div className="glass-card" style={{ padding: 32, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
                <div>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 8 }}>
                    Interview Readiness Diagnostic
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 540 }}>
                    {weakSpotsData.recommendation}
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{
                    width: 90,
                    height: 90,
                    borderRadius: "var(--radius-pill)",
                    background: `conic-gradient(var(--accent-cyan) ${weakSpotsData.readinessScore}%, rgba(255,255,255,0.05) 0)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 8
                  }}>
                    <div style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "var(--radius-pill)",
                      background: "var(--bg-primary)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <span style={{ fontSize: "1.4rem", fontWeight: 800 }}>{weakSpotsData.readinessScore}%</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Practiced Cards</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                      {weakSpotsData.practicedCount} / {weakSpotsData.totalFlashcards}
                    </div>
                  </div>
                </div>
              </div>

              {/* Weak Cards Flagged */}
              <div className="glass-card" style={{ padding: 24 }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, color: "var(--accent-rose)" }}>
                  Priority Weak Spots (Avg Confidence &lt; 3.2)
                </h4>

                {weakSpotsData.weakCards.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontStyle: "italic" }}>
                    No weak cards detected! Either run more practice rounds or maintain your high rating.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {weakSpotsData.weakCards.map((wc) => (
                      <div
                        key={wc.flashcardId}
                        style={{
                          background: "var(--bg-primary)",
                          border: "1px solid rgba(244, 63, 94, 0.3)",
                          borderRadius: "var(--radius-md)",
                          padding: "14px 18px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 4 }}>{wc.front}</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{wc.back}</div>
                        </div>
                        <span className="badge badge-must">
                          Avg: {wc.avgConfidence}/5 ({wc.attempts} tries)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="glass-card" style={{ padding: 32, textAlign: "center" }}>
              Start an active practice recall round to populate diagnostic weak-spot data.
            </div>
          )}
        </div>
      )}

      {/* MODAL: EDIT QUESTION */}
      {editingQuestion && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(5, 7, 13, 0.85)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          zIndex: 120
        }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: 540, padding: 28 }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 16 }}>Edit Question</h3>
            <form onSubmit={handleSaveQuestionEdit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 6 }}>Question Prompt</label>
                <textarea
                  className="textarea-field"
                  rows={3}
                  value={editingQuestion.question}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 6 }}>Why Relevant</label>
                <textarea
                  className="textarea-field"
                  rows={2}
                  value={editingQuestion.why_relevant}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, why_relevant: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 6 }}>Difficulty (1-3)</label>
                  <select
                    className="select-field"
                    value={editingQuestion.difficulty}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value })}
                  >
                    <option value={1}>1 - Foundational</option>
                    <option value={2}>2 - Mid-Level</option>
                    <option value={3}>3 - Senior</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 6 }}>Est. Minutes</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editingQuestion.estimated_minutes || 20}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, estimated_minutes: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setEditingQuestion(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM QUESTION */}
      {isAddingQuestion && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(5, 7, 13, 0.85)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          zIndex: 120
        }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: 540, padding: 28 }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 16 }}>Add Custom Question</h3>
            <form onSubmit={handleAddQuestion} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 6 }}>Category</label>
                <select
                  className="select-field"
                  value={newQuestionForm.category}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, category: e.target.value })}
                >
                  <option value="technical">Technical</option>
                  <option value="system-design">System Design</option>
                  <option value="behavioural">Behavioural</option>
                  <option value="company-fit">Company Fit</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 6 }}>Question Prompt</label>
                <textarea
                  required
                  className="textarea-field"
                  rows={3}
                  placeholder="Enter the question..."
                  value={newQuestionForm.question}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, question: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 6 }}>Why Relevant</label>
                <textarea
                  className="textarea-field"
                  rows={2}
                  placeholder="Rationale or skills tested..."
                  value={newQuestionForm.why_relevant}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, why_relevant: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 6 }}>Difficulty (1-3)</label>
                  <select
                    className="select-field"
                    value={newQuestionForm.difficulty}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, difficulty: e.target.value })}
                  >
                    <option value={1}>1 - Foundational</option>
                    <option value={2}>2 - Mid-Level</option>
                    <option value={3}>3 - Senior</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 6 }}>Est. Minutes</label>
                  <input
                    type="number"
                    className="input-field"
                    value={newQuestionForm.estimated_minutes}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, estimated_minutes: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setIsAddingQuestion(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGENERATE SECTION */}
      {isRegenerating && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(5, 7, 13, 0.85)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          zIndex: 120
        }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: 480, padding: 28 }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 12 }}>
              Regenerate Section
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 20 }}>
              Preserves pinned, manually created, and edited items. Only generated items in the target section are safely refreshed.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 6 }}>
                Select Section
              </label>
              <select
                className="select-field"
                value={regenSection}
                onChange={(e) => setRegenSection(e.target.value)}
              >
                <option value="questions:technical">Questions: Technical</option>
                <option value="questions:system-design">Questions: System Design</option>
                <option value="questions:behavioural">Questions: Behavioural</option>
                <option value="questions:company-fit">Questions: Company Fit</option>
                <option value="flashcards">Flashcards</option>
                <option value="brief">Company Brief</option>
                <option value="schedule">Schedule Allocation</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setIsRegenerating(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleRegenerate} disabled={regenLoading} className="btn btn-primary">
                {regenLoading ? "Regenerating..." : "Start Regeneration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
