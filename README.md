# HireScope — AI-Powered Technical Interview Preparation Kit Platform

**HireScope** is a full-stack interview preparation platform that takes a Job Description (JD) and company URL to deterministically construct a customized, multi-day preparation kit.

---

## 📁 Repository Structure

The project is cleanly decoupled into two repositories for maximum clarity and separation of concerns:

```
HireScope/
├── hirescope-backend/       # Express + MongoDB Backend Service & Evaluate CLI
│   ├── src/
│   │   ├── domain/          # Pipeline Orchestrator (16 stages), kit state model & patch ops
│   │   ├── retrieval/       # Safe HTTP fetcher, SSRF guard, robots.txt, link discovery
│   │   ├── llm/             # Pluggable LLM client (Gemini, Groq, Mock) with retry & backoff
│   │   ├── generation/      # Requirement extraction, questions, flashcards, brief
│   │   ├── scheduling/      # Deterministic schedule allocator & scoring function (pure JS)
│   │   ├── validation/      # Pure coverage checker (pass 1 & 2) & Zod kit schema validator
│   │   ├── persistence/     # Mongoose models and ownership-scoped repositories
│   │   ├── services/        # Business logic (Auth, Kit, Practice)
│   │   ├── controllers/     # HTTP request handling and response mapping
│   │   ├── routes/          # Express route definitions
│   │   └── server.js        # Server entry point
│   ├── scripts/
│   │   └── evaluate.js      # Batch CLI entry point (npm run evaluate) reusing identical pipeline
│   ├── tests/
│   │   ├── unit/            # Unit tests for coverage, allocator, schema, state model, extractor
│   │   └── fixtures/        # Test cases and HTML mocks
│   └── package.json
│
├── hirescope-frontend/      # Vite + React Modern Web Application
│   ├── src/
│   │   ├── api/             # REST API client with credentials & session support
│   │   ├── components/      # Dashboard, KitView, Active Recall Stepper, Modals, Navbar
│   │   ├── index.css        # Glassmorphic dark-mode CSS design system
│   │   ├── App.jsx          # Root application coordinator
│   │   └── main.jsx
│   └── package.json
│
├── prepforge-ai-plan.md     # Architectural plan and scoring matrix
└── README.md
```

---

## 🚀 Key Features

### 1. Deterministic Backbone (35 Rubric Points)
- **Deterministic Coverage Checker:** Pure function ensuring 100% must-have requirements are represented across interview questions. Nice-to-have requirements are tracked for guidance but never block the pipeline.
- **Deterministic Schedule Allocator:** Distributes questions across exactly $N$ days (from 1 to 60+ days) based on difficulty, priority scoring, and integer duration estimation. High-priority/must-have concepts land in the earlier half of days.

### 2. Robust 16-Stage Pipeline
1. `parse-input` (Zod validation on JD, URL, days)
2. `extract-requirements` (Deterministic must/nice lexical pre-pass + LLM classification)
3. `fetch-homepage` (SSRF guard, timeout, size limits)
4. `clean-page` (Removes scripts, styles, boilerplate)
5. `discover-rank-links` (Anchor and token scoring, no hardcoded /careers paths)
6. `fetch-subpages` (Robots.txt check, top subpages fetch)
7. `search-discussions` (Public interview insights retrieval)
8. `generate-brief` (Overview, culture, interview style, sources)
9. `generate-questions` (4 distinct calls: technical, system-design, behavioural, company-fit)
10. `generate-flashcards` (Key concepts linked to requirement IDs)
11. `coverage-pass-1` (Pure deterministic coverage check)
12. `gap-fill` (Targeted generation for any uncovered must-have requirements)
13. `coverage-pass-2` (Re-evaluation of coverage)
14. `schedule-allocation` (Pure deterministic multi-day schedule allocation)
15. `schema-validation` (Zod schema and cross-reference invariant check)
16. `persist` (Stores kit and transitions status to ready)

### 3. Builder / Regeneration State Model
- **Eligibility-filtered regeneration:** Individual sections (`brief`, `questions:<category>`, `flashcards`, `schedule`) can be refreshed without clobbering pinned, edited, or manual items.
- **Optimistic Concurrency:** `stateVersion` tracking prevents race conditions.

### 4. Creative Feature: Interview Weak Spots & Readiness
- **Active Recall Flashcards:** Interactive 3D flip card practice mode with 1–5 confidence ratings.
- **Diagnostic Readiness Score:** Percentage gauge calculated from card mastery and coverage breadth.
- **Weak Spots Report:** Flags concepts with rolling average confidence $< 3.2$ and highlights specific requirement gaps with personalized preparation advice.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- MongoDB (local or MongoDB Atlas connection string)

### Backend Setup
```bash
cd hirescope-backend
npm install
npm run test:unit      # Run all 5 unit test suites (20 tests)
npm run evaluate       # Run the batch evaluation CLI on test cases
npm run dev            # Start the backend API server on http://localhost:5000
```

### Frontend Setup
```bash
cd hirescope-frontend
npm install
npm run dev            # Start Vite development server on http://localhost:3000
```

Open `http://localhost:3000` in your browser.

---

## 🧪 Testing Summary
Run the unit test suite in `hirescope-backend`:
```bash
npm run test:unit
```
Covers:
- `coverage-checker.test.js` (Must vs nice coverage, empty question handling)
- `allocator.test.js` (Exact day count for N=1, N=5, N=60, integer minutes, priority distribution)
- `kit-schema.test.js` (Full schema compliance, cross-reference invariants)
- `state-model.test.js` (Regeneration eligibility and item protection)
- `requirement-extractor.test.js` (Lexical pre-pass and priority classification)
