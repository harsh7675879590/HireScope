import React, { useState } from "react";
import { X, Sparkles, Globe, Calendar, FileText, UploadCloud, Layers } from "lucide-react";
import { api } from "../api/client.js";

const SAMPLE_JDS = {
  backend: `Senior Backend Engineer
About the role:
We are seeking an experienced Backend Engineer to lead development of our distributed event-driven platform.

Must-have requirements:
- Must have 5+ years of experience building scalable backend microservices in Node.js and JavaScript/TypeScript.
- Required: Strong experience with MongoDB or relational databases, query optimization, and data modeling.
- Mandatory: Hands-on experience designing and securing high-throughput REST APIs and WebSocket services.
- Essential: Deep understanding of distributed systems fundamentals, concurrency, and caching strategies.

Nice to have:
- Bonus: Experience with Kubernetes, Docker, and AWS cloud deployment.
- Preferred: Familiarity with message brokers such as Apache Kafka or RabbitMQ.`,

  fullstack: `Full Stack Developer
We are looking for a Full Stack Developer to build delightful candidate and recruiter experiences.

Requirements:
- Must be proficient with modern JavaScript/TypeScript, React, and Node.js.
- Required experience with state management, component architecture, and responsive CSS design.
- Must demonstrate strong analytical problem-solving and clean code practices.
- Nice to have: Experience with CI/CD workflows, automated testing using Jest, and MongoDB.`
};

export default function NewKitModal({ onClose, onCreated }) {
  const [activeTab, setActiveTab] = useState("single"); // "single" | "batch"
  const [jd, setJd] = useState("");
  const [companyUrl, setCompanyUrl] = useState("https://example.com");
  const [days, setDays] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Batch state
  const [batchFile, setBatchFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === "single") {
        const res = await api.createKit({
          jd,
          company_url: companyUrl,
          days: Number(days)
        });
        onCreated(res.kitId);
      } else {
        // Handle batch json upload
        if (!batchFile) {
          throw new Error("Please select a JSON batch file");
        }
        const text = await batchFile.text();
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error("Batch file must contain a JSON array of test cases");
        }
        // Create first kit from batch
        const first = parsed[0];
        const res = await api.createKit({
          jd: first.jd,
          company_url: first.company_url || "https://example.com",
          days: Number(first.days) || 5
        });
        onCreated(res.kitId);
      }
    } catch (err) {
      setError(err.data?.message || err.message);
      setLoading(false);
    }
  };

  const loadSample = (type) => {
    setJd(SAMPLE_JDS[type] || "");
    if (type === "backend") setCompanyUrl("https://stripe.com");
    if (type === "fullstack") setCompanyUrl("https://vercel.com");
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
      <div className="glass-card animate-fade-in" style={{ width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", padding: 32 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Generate Interview Prep Kit</h2>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Deterministic 16-Stage Pipeline • 100% Must-Have Coverage
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: 6 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 12 }}>
          <button
            type="button"
            onClick={() => setActiveTab("single")}
            className={`btn btn-sm ${activeTab === "single" ? "btn-primary" : "btn-secondary"}`}
          >
            <FileText size={15} /> Single Job Description
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("batch")}
            className={`btn btn-sm ${activeTab === "batch" ? "btn-primary" : "btn-secondary"}`}
          >
            <UploadCloud size={15} /> Batch Upload (JSON)
          </button>
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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {activeTab === "single" ? (
            <>
              {/* Sample Loader */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Job Description Text
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => loadSample("backend")}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                  >
                    ⚡ Load Backend JD
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSample("fullstack")}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                  >
                    ⚡ Load Fullstack JD
                  </button>
                </div>
              </div>

              <textarea
                id="textarea-jd"
                required
                className="textarea-field"
                rows={7}
                placeholder="Paste the target job description here..."
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                style={{ resize: "vertical" }}
              />

              {/* Company URL */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>
                  Target Company URL
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="input-company-url"
                    type="url"
                    required
                    className="input-field"
                    placeholder="https://company.com"
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                    style={{ paddingLeft: 40 }}
                  />
                  <Globe size={18} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: 14 }} />
                </div>
              </div>

              {/* Days Allocation Slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                    Preparation Days
                  </label>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-cyan)" }}>
                    {days} Days Schedule
                  </span>
                </div>
                <input
                  id="slider-days"
                  type="range"
                  min={1}
                  max={60}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent-primary)", cursor: "pointer" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                  <span>1 Day (Intensive)</span>
                  <span>7 Days (Standard)</span>
                  <span>30 Days (Deep Dive)</span>
                  <span>60 Days</span>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>
                Upload Cases JSON File
              </label>
              <div style={{
                border: "2px dashed var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: 32,
                textAlign: "center",
                background: "var(--bg-glass)"
              }}>
                <UploadCloud size={36} color="var(--accent-primary)" style={{ margin: "0 auto 12px" }} />
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setBatchFile(e.target.files[0])}
                  style={{ display: "block", margin: "0 auto 12px", color: "var(--text-secondary)" }}
                />
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Upload a JSON file with array of {`{ jd, company_url, days }`} pairs.
                </p>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              id="btn-submit-generate"
              type="submit"
              disabled={loading || (activeTab === "single" && !jd.trim())}
              className="btn btn-primary"
            >
              {loading ? "Starting Pipeline..." : "Generate Kit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
