# PrepForge AI — Architecture & Implementation Plan

*(Milestones A–M, per Section 17 of the brief. No application code yet.)*

---

## A. Requirement Decomposition

Grouping the brief into orthogonal capabilities, each mapped to the scoring rubric so effort tracks points.

| # | Capability | Scored under | Weight |
|---|---|---|---|
| 1 | Auth (register/login/logout, session, ownership) | Robustness / Human review | — |
| 2 | JD paste + company URL + days + batch upload UI | Interaction design | 10 |
| 3 | Requirement extraction from JD (must/nice, kind) | Automated | **20** |
| 4 | Company crawl: homepage → link discovery/ranking → fetch subpages | Research & sequencing | 10 |
| 5 | Public interview-process discussion search | Research & sequencing | (part of 10) |
| 6 | Company brief generation | Human review (builder) | — |
| 7 | Per-category question generation (technical/behavioural/system-design/company-fit) | Research & sequencing | (part of 10) |
| 8 | Flashcard generation | Builder | (part of 15) |
| 9 | Deterministic coverage check (pass 1) | Coverage & schedule | **15** |
| 10 | Gap-filling generation (pass 2) + re-check (bounded loop) | Coverage & schedule | (part of 15) |
| 11 | Deterministic schedule allocation across exactly N days | Coverage & schedule | (part of 15) |
| 12 | Kit schema validation before persistence | Robustness | 10 |
| 13 | Edit/reorder/add/delete for questions & flashcards | Builder | **15** |
| 14 | Per-section regeneration w/ generated/edited/pinned state model | Builder | (part of 15) |
| 15 | Practice mode w/ confidence tracking + weak-card prioritization | Practice & creative | 10 |
| 16 | Failure handling matrix (13 named edge cases) | Robustness | (part of 10) |
| 17 | Security (SSRF, content-type/size limits, prompt-injection resistance) | Robustness (implicit) | — |
| 18 | `npm run evaluate` batch entry point, reusing app pipeline | Robustness + is a hard gate | (part of 10, but also gating — see risk register) |
| 19 | Creative feature: "Interview Weak Spots" | Practice & creative | (part of 10) |
| 20 | Tests: coverage checker, schedule allocator, schema validator | Robustness | (part of 10) |
| 21 | Deployment (public FE+BE) | Submission requirement, not directly scored line-item but gates everything | — |
| 22 | README | Human review | 10 |

**Key insight driving the whole design:** the two heaviest automated buckets (35 of 55 points) are *requirement extraction* and *coverage/schedule* — both of which are explicitly required to be deterministic, testable TypeScript, not LLM output. This plan treats the LLM as a **content generator behind a narrow, schema-validated interface**, and treats extraction-comparison-allocation as **pure functions with unit tests**. That split is the spine of the architecture.

---

## B. Architecture

Layered, pipeline-oriented backend; thin Express routes; a Next.js frontend that talks to the backend over a versioned REST API. The **evaluate CLI and the HTTP API call the exact same pipeline module** — this is non-negotiable per the brief and the biggest single robustness risk if violated.

```
┌─────────────────────────────────────────────────────────────┐
│ Next.js Frontend (App Router, TS, Tailwind)                  │
│  - pages/routes, React state, SWR/fetch for API calls        │
└───────────────────────────┬───────────────────────────────────┘
                             │ HTTPS (session cookie)
┌───────────────────────────▼───────────────────────────────────┐
│ Express Backend                                                │
│  routes/        → thin, only calls controllers                │
│  controllers/   → HTTP concerns (parse req, call service,     │
│                    map result/errors to HTTP)                 │
│  services/      → orchestration (KitService, AuthService,     │
│                    PracticeService)                           │
│  domain/         → PipelineOrchestrator (the 16 stages),       │
│                    pure types, KitStateModel                  │
│  retrieval/      → HttpFetcher, RobotsChecker, LinkDiscoverer, │
│                    PageCleaner, SsrfGuard                      │
│  llm/            → LlmClient (provider-agnostic), PromptBuilder,│
│                    ResponseSchemas (Zod), RetryPolicy          │
│  generation/     → RequirementExtractor, QuestionGenerator,     │
│                    FlashcardGenerator, BriefGenerator           │
│  scheduling/     → ScoringFn, Allocator (pure, deterministic)   │
│  validation/     → CoverageChecker (pure), KitSchema (Zod)      │
│  persistence/    → Mongo repositories (User, Kit, Practice)     │
│  middleware/     → auth, error handler, rate limiter, logger    │
│  utils/          → ids, time, result-type helpers               │
└───────────────────────────┬───────────────────────────────────┘
                             │
┌───────────────────────────▼───────────────────────────────────┐
│ scripts/evaluate.ts  → CLI: reads cases.json, calls the SAME    │
│   domain/PipelineOrchestrator per case, writes kits.json        │
└─────────────────────────────────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │    MongoDB       │
                    └──────────────────┘
```

**Why this shape:**
- `domain/PipelineOrchestrator` has zero knowledge of Express or the CLI — it takes `{ jd, company_url, days }` and returns `Result<Kit, KitError>`. Both entry points (HTTP route, CLI) call it. This directly satisfies "the same pipeline used by the UI must be reused by evaluate" and removes an entire class of scoring risk.
- `llm/` is isolated so the provider is swappable via env var and the rest of the app only sees typed, validated responses — never raw LLM text.
- `scheduling/` and parts of `validation/` (coverage) are pure functions with no I/O, which is what makes them unit-testable in isolation (Milestone requirement: tests for coverage + schedule + schema).
- `retrieval/` centralizes all outbound HTTP so SSRF guarding, robots.txt, size/timeout limits live in one place, not scattered per-caller.

**Dependency direction:** routes → controllers → services → domain/generation/scheduling/validation → retrieval/llm/persistence. Domain layer depends on interfaces (e.g., `LlmClient`, `Fetcher`) injected in, not concrete implementations — this is the "DI where it materially improves testability" the brief asks for (lets tests inject a fake LLM client and a fake fetcher instead of hitting the network).

---

## C. Folder Structure

```
prepforge-ai/
├── frontend/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (auth)/register/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── kits/new/page.tsx
│   │   ├── kits/[id]/page.tsx
│   │   ├── kits/[id]/practice/page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── kit/ (QuestionList, QuestionEditor, FlashcardEditor,
│   │   │         ScheduleView, CoveragePanel, BriefPanel, RegenerateButton)
│   │   ├── generation/ (ProgressStepper, ErrorBanner)
│   │   ├── practice/ (FlashcardStepper, ConfidenceControl, WeakSpotsReport)
│   │   └── ui/ (shared primitives)
│   ├── lib/ (apiClient.ts, types.ts — mirrors shared/types)
│   └── hooks/ (useKit, useGenerationProgress, usePracticeSession)
│
├── backend/
│   ├── src/
│   │   ├── routes/ (auth.routes.ts, kits.routes.ts, practice.routes.ts)
│   │   ├── controllers/
│   │   ├── services/ (kit.service.ts, auth.service.ts, practice.service.ts)
│   │   ├── domain/
│   │   │   ├── pipeline/ (orchestrator.ts, stages/*.ts — one file per stage)
│   │   │   ├── kit-state/ (state-model.ts, patch-ops.ts)
│   │   │   └── types.ts
│   │   ├── retrieval/ (fetcher.ts, ssrf-guard.ts, robots.ts,
│   │   │               link-discoverer.ts, page-cleaner.ts, search-client.ts)
│   │   ├── llm/ (client.ts, provider.<name>.ts, schemas.ts, prompts/*.ts, retry.ts)
│   │   ├── generation/ (requirement-extractor.ts, question-generator.ts,
│   │   │                flashcard-generator.ts, brief-generator.ts)
│   │   ├── scheduling/ (scoring.ts, allocator.ts)
│   │   ├── validation/ (coverage-checker.ts, kit-schema.ts)
│   │   ├── persistence/ (mongo/client.ts, repositories/*.ts, models/*.ts)
│   │   ├── middleware/ (auth.ts, error-handler.ts, rate-limit.ts, request-logger.ts)
│   │   ├── utils/ (ids.ts, result.ts, logger.ts)
│   │   └── app.ts / server.ts
│   ├── scripts/evaluate.ts
│   └── tests/
│       ├── unit/ (coverage-checker.test.ts, allocator.test.ts, kit-schema.test.ts,
│       │          requirement-extractor.test.ts, state-model.test.ts)
│       ├── integration/ (pipeline.test.ts using fixture HTML server + fake LLM)
│       └── fixtures/ (jds/*.txt, html-pages/*.html, cases.json)
│
├── shared/
│   └── types/ (kit.ts, api-contracts.ts) — imported by both FE and BE via TS project refs
│
├── .env.example
├── README.md
└── package.json (workspaces: frontend, backend, shared)
```

`shared/` holds only types and Zod schemas so frontend and backend can't drift on the kit shape — the schema in `validation/kit-schema.ts` (backend) re-exports from `shared/types`.

---

## D. Data Model (MongoDB)

**`users`**
```
{ _id, email (unique idx), passwordHash, createdAt }
```

**`kits`**
```
{
  _id,
  userId (idx),
  status: "draft" | "generating" | "ready" | "failed",
  input: { jd, company_url, days },
  kit: <Appendix A structure, extended with per-item state>,
  meta: {
    generationLog: [ { stage, status, startedAt, finishedAt, error? } ],
    stateVersion: number,       // optimistic concurrency
    dedupeKey: sha256(jd + company_url)  // for duplicate-submission detection
  },
  createdAt, updatedAt
}
```
Compound index `{ userId: 1, "meta.dedupeKey": 1 }` to detect duplicate submissions per user (see Section 8 handling). Index `{ userId: 1, updatedAt: -1 }` for dashboard listing.

**Extending Appendix A internally:** each `question` and `flashcard` gets an internal-only `_state` field (not exposed to the batch `kit` output, since Appendix A is exact — see Milestone I for how this is stripped on serialization):
```
_state: {
  origin: "generated" | "manual",
  edited: boolean,
  pinned: boolean,
  deleted: boolean,
  generationBatch: number   // which coverage/regeneration pass produced it
}
```

**`practice_sessions`**
```
{ _id, userId, kitId (idx), startedAt, finishedAt, cardResults: [
    { flashcardId, confidence: 1-5, answeredAt }
  ]
}
```

**`practice_records`** (derived, denormalized per-card rolling state — avoids recomputing weak spots from full session history every time)
```
{ _id, userId, kitId, flashcardId, lastConfidence, attempts, avgConfidence, lastSeenAt }
compound unique idx { kitId, flashcardId, userId }
```

Ownership enforced at the repository layer: every kit/practice query is scoped by `userId` from the session, never trusted from the request body.

---

## E. API Design

Base path `/api/v1`. Session cookie auth (httpOnly, secure in prod) via `express-session` + Mongo store, or a signed JWT-in-httpOnly-cookie — decision documented in README with rationale (likely sessions, simplest to reason about for "sign out" and expiry semantics the brief asks for).

```
POST   /auth/register            { email, password }
POST   /auth/login               { email, password }
POST   /auth/logout
GET    /auth/me

GET    /kits                     -> list current user's kits
POST   /kits                     { jd, company_url, days } -> creates draft, starts async generation, returns kitId
POST   /kits/batch               multipart file upload of pairs -> creates N drafts
GET    /kits/:id                 -> full kit + status + generationLog
DELETE /kits/:id

GET    /kits/:id/progress        -> SSE or poll endpoint for generation progress
POST   /kits/:id/regenerate      { section: "brief"|"role"|"questions:<category>"|"flashcards"|"schedule" }

PATCH  /kits/:id/questions/:qid  -> edit (sets _state.edited)
POST   /kits/:id/questions       -> manual add (_state.origin = "manual")
DELETE /kits/:id/questions/:qid  -> soft delete (_state.deleted = true)
PATCH  /kits/:id/questions/reorder  { orderedIds, category? }
PATCH  /kits/:id/flashcards/:fid
POST   /kits/:id/flashcards
DELETE /kits/:id/flashcards/:fid
PATCH  /kits/:id/brief
POST   /kits/:id/questions/:qid/pin   -> toggle pinned

POST   /kits/:id/practice/sessions          -> start session, returns ordered card queue
PATCH  /kits/:id/practice/sessions/:sid     { flashcardId, confidence } -> record answer
GET    /kits/:id/practice/weak-spots        -> creative feature endpoint
```

Generation is **async**: `POST /kits` returns `202 { kitId, status: "generating" }` immediately; the pipeline runs in-process (or a queued job for the deployed version) and the frontend polls/streams `/kits/:id/progress`. This directly serves "visible generation progress" and "handle a long-running generation" without blocking the HTTP request past typical gateway timeouts.

All mutation endpoints require `req.session.userId === kit.userId` (enforced in middleware, checked again in repository as defense in depth).

---

## F. Research / Generation Pipeline (16 stages)

Each stage is a small, independently testable function of shape `(ctx) => Result<Partial<Ctx>, StageError>`, composed by the orchestrator. Failure in a *retrieval* stage degrades gracefully (recorded, pipeline continues); failure in a *validation* stage is fatal for that case.

1. **Parse & validate input** — Zod schema on `{ jd, company_url, days }`; reject empty JD, malformed URL, non-positive/non-integer days early with a clear error code.
2. **Extract requirements from JD** — LLM call #1, narrow prompt, Zod-validated response `{ role, seniority, responsibilities, requirements[] }`. Requirement `priority` derivation is assisted by a **deterministic pre-pass**: a lexical scan for phrasing cues ("must", "required", "X+ years") vs ("nice to have", "bonus", "preferred") is done in code and passed to the LLM as a hint/constraint, and the code does a final sanity pass (e.g., can't have zero requirements from a non-trivial JD) — LLM classifies, code doesn't blindly trust it for anything downstream-critical like coverage.
3. **Fetch company homepage** — `retrieval/fetcher.ts`, through SSRF guard, with timeout + size cap.
4. **Clean the page** — strip nav/scripts/styles, collapse whitespace, cap length before it ever reaches the LLM context.
5. **Discover & rank links** — parse `<a href>`, resolve relative URLs, score by anchor text + path tokens against a keyword set (careers, hiring, jobs, about, culture, interview, engineering blog, handbook) — this scoring is deterministic code, not an LLM call, per "the path cannot be hard-coded" but also per "deterministic logic must not be handed to the model" (ranking is a scoring function, not content generation).
6. **Fetch top-N ranked pages** (config, e.g. N=5), same fetcher/guard pipeline, robots.txt checked per-host before stage 3 and 6.
7. **Search public interview-process discussion** — via a search API (see risk register — needs a free-tier option) constrained to informational retrieval; results are treated as untrusted data like everything else.
8. **Generate company brief** — LLM call #2, given only cleaned page text + search snippets, explicitly instructed (and constrained by prompt template, not by trusting the source text) to say "not found" rather than invent when sources are thin.
9. **Generate questions per category** — 4 separate LLM calls (technical, behavioural, system-design, company-fit), each scoped to a subset of requirements relevant to that category (e.g., "5+ years React" → technical; "mentoring" → behavioural) — this is the "should not come from the same call" requirement. Each call is schema-validated independently.
10. **Generate flashcards** — derived from the requirements + generated questions (LLM call #5), one flashcard per key concept, `requirement_ids` populated.
11. **Coverage pass 1** — pure deterministic function (Milestone G).
12. **Gap-fill generation** — if `uncovered_requirement_ids` non-empty, one targeted LLM call per uncovered *must* requirement (or batched call listing them), same category logic as stage 9.
13. **Coverage pass 2** — re-run the same pure function.
14. **Schedule allocation** — pure deterministic function (Milestone H).
15. **Full kit schema validation** — Zod against Appendix A shape + internal invariants (question_ids reference real questions, difficulty 1–3, integer minutes).
16. **Persist** — write to Mongo; only now is status flipped to `"ready"`.

Every LLM call goes through one chokepoint (`llm/client.ts`) that applies retry-with-backoff and rate-limit handling (Milestone risk register — this is explicitly called out as the most common point-loss).

---

## G. Coverage Algorithm

Pure function, no I/O, so trivially unit-testable:

```ts
function checkCoverage(requirements: Requirement[], questions: Question[]): CoverageResult {
  const mustIds = new Set(requirements.filter(r => r.priority === "must").map(r => r.id));
  const covered = new Set(questions.flatMap(q => q.requirement_ids));
  const uncovered = [...mustIds].filter(id => !covered.has(id));
  return { uncovered_requirement_ids: uncovered, passes: /* set by caller */ 0 };
}
```

**Loop control (orchestrator, not the function itself):**
- Max passes = **3** (initial generation counts as pass 1; up to 2 gap-fill rounds). Rationale documented in README: pass 1 typically covers the large majority of requirements; a second pass targeting only the residual gap-list handles LLM omissions; a third exists as a safety margin for a stubborn requirement (e.g., ambiguous phrasing) without risking runaway latency/cost against a free-tier rate limit. Unbounded retries would violate the "complete within 15 minutes for 5 cases" batch constraint.
- If, after 3 passes, `uncovered_requirement_ids` is still non-empty → **fail validation for that case** (per brief: "fail validation rather than silently shipping an incomplete kit"). In the batch output this becomes `status: "failed"`, `error.code: "COVERAGE_INCOMPLETE"`. In the UI, the kit is saved as `status: "failed"` with the partial kit retained for inspection/manual completion rather than discarded — a user should still be able to see what was generated and add the missing question by hand.
- Note re: nice-to-have requirements — intentionally **not** part of the fail condition, matching the brief's must/nice distinction; nice-to-have coverage is tracked for information but never blocks the pipeline.

---

## H. Schedule Algorithm

Also pure and deterministic. Two parts: a **scoring function** per question, and an **allocator** that distributes scored questions across exactly N days.

**Scoring** (higher = more urgent = earlier):
```
score(q) =
    (requirement.priority === "must" ? 100 : 0)
  + difficulty(q) * 10                 // 1–3 → 10–30
  + categoryWeight(q.category)         // small tie-breaker, e.g. system-design/technical slightly ahead of company-fit
  + (q.requirement_ids.length)         // questions covering more requirements score marginally higher (efficient use of limited days)
```
Sort descending by score. This directly implements "harder and higher-priority material should occur earlier."

**Allocation:**
1. Compute `daysAvailable = clamp(N, 1, MAX_DAYS)` — no artificial upper clamp is applied to the *schedule itself* (the brief explicitly tests 60-day), but a sanity ceiling (e.g. 90) prevents pathological input; document this.
2. Bucket questions into `daysAvailable` day-slots. Walk the sorted list and assign round-robin-with-priority-bias: must-requirement questions are distributed across the *earliest half* of days first (to satisfy "not the night before"), then remaining nice/lower-difficulty content fills out later days and backfills any day left thin.
3. **Guarantee every must-have requirement appears somewhere**: after initial allocation, do a coverage sweep over the *schedule* itself (distinct from the earlier requirement-coverage check) — for any must requirement whose covering question(s) didn't get placed (can happen only if `daysAvailable` is very small relative to question count, e.g. 1 day), force-place at least one covering question for it, even if that means a heavier single day.
4. **Duration per day** — each question is assigned an estimated integer minutes value (function of difficulty, e.g. 10/15/20 min baseline for difficulty 1/2/3, plus a fixed review buffer), summed per day and rounded to nearest integer. No floats ever leave this function.
5. **Edge cases:**
   - `days = 1`: all must-have-covering questions plus as much nice content as fits go into a single, longer day; `focus` = "Full review".
   - `days = 60` with, say, 15 questions total: don't fabricate 60 days of distinct content — spread real content across the first K days (K = number of days that can hold at least one question) and let remaining days have an empty `question_ids: []` with `focus: "Free review / rest"` and `minutes: 0`. This avoids "impossible or nonsensical allocations" (padding with duplicates) while still satisfying "exactly N days" structurally.
6. Output conforms exactly to the `schedule` shape in Appendix A; `question_ids` values are asserted (in the same function's tests) to always reference IDs present in `questions[]`.

---

## I. State / Edit / Regeneration Strategy

**Model:** every question and flashcard carries an internal `_state` (Milestone D) with an explicit lifecycle:

```
generated → (user edits it) → edited
generated → (user pins it)  → pinned          // explicit "protect this" without editing
generated → (user deletes)  → deleted (soft)
(user creates new)          → manual
manual/edited/pinned items are never touched by regeneration
```

**Regeneration semantics per section**, driven by an explicit *eligibility rule* rather than a full-document replace:

- `regenerate("brief")` → only affects `company_brief` if it has no `_state.edited` flag of its own (brief gets its own lightweight state flag, not per-field); if the user edited the brief, regeneration is blocked with a clear UI message ("this section has manual edits — overwrite?") requiring explicit confirmation, never silent overwrite.
- `regenerate("questions:technical")` → operates only on questions where `category === "technical" AND _state.origin === "generated" AND !_state.edited AND !_state.pinned`. Those are removed and replaced by a fresh generation call; everything else (other categories, edited/pinned/manual technical questions) is left untouched in place. New questions get fresh IDs; existing untouched question IDs are preserved so schedule/coverage references elsewhere don't dangle.
- `regenerate("schedule")` → always safe to fully recompute (schedule has no user-authored prose, only references), but a manually-reordered schedule counts as "edited" too — the brief calls reordering an editing action — so a manual reorder also sets a `schedule._state.edited` flag that must be explicitly overridden.
- After any regeneration, coverage is **re-run** (Milestone G) since removing/adding questions can reopen or close gaps, and the kit is **re-validated** (Milestone: Stage 15) before the new state is persisted.

**Why patch semantics over whole-document replace:** the brief calls this "the hardest state problem" and explicitly penalizes clobbering. A version/ownership model (each field/array item tagged with who "owns" it and whether it's protected) is the standard way to make partial regeneration safe and is directly testable: a unit test regenerates a category with one pinned question and asserts that exact question is present, unchanged, by ID, in the output — this is one of the required tests (Milestone J).

**Concurrency:** `meta.stateVersion` optimistic locking prevents a stale regeneration request from clobbering an edit that happened in another tab/request in between — increment on every mutation, reject writes carrying a stale version with `409 Conflict`.

---

## J. Testing Strategy

Prioritized to match the automated scoring weights.

**Unit (pure functions, no I/O, fastest, highest priority):**
- `coverage-checker.test.ts` — every must-have requirement gets covered by at least one question; correct `uncovered_requirement_ids` given a known requirement/question fixture (mirrors the brief's own r1/r2/r3 example); nice-to-have requirements never appear in `uncovered`.
- `allocator.test.ts` — exact day count for N=1, N=5, N=60; every day's `minutes` is an integer; every `question_ids` entry references an existing question ID; must-have-covering questions land in the earlier half of days for a representative fixture; empty-question days for pathological 60-day case don't crash or duplicate content.
- `kit-schema.test.ts` — valid kit passes; kit missing a required field fails with a clear error; a schedule referencing a nonexistent question ID fails; difficulty outside 1–3 fails; non-integer minutes fails.
- `state-model.test.ts` — regenerating a category preserves pinned/edited/manual items by ID and content; deleted items don't reappear on regeneration; new IDs from regeneration don't collide with existing ones.
- `requirement-extractor.test.ts` (with a fake/stubbed LLM client) — "required"-phrased lines classified `must`, "bonus points for"-phrased lines classified `nice`; thin JD produces few/no fabricated requirements (tests that the extractor doesn't pad).

**Integration:**
- `pipeline.test.ts` — runs the full orchestrator against a local fixture HTML server (`http-server`-style, serving canned company pages) and a fake LLM client returning canned-but-schema-valid JSON, asserting: full kit is well-formed; coverage is 100% for musts; company-with-no-hiring-page case still produces a valid (thin but honest) kit rather than failing; a case with a simulated fetch timeout still completes with that source skipped/recorded, not fatal.
- `evaluate.test.ts` — runs the CLI against a small `cases.json` fixture (including one deliberately unreachable `company_url`) and asserts the output JSON matches Appendix B shape, one entry per case, and the run continues past the failed case.

**Manual verification checklist** (per milestone, per Section 17 item 6/7) will accompany each implementation milestone rather than being defined wholesale here.

---

## K. Deployment Strategy

- **Frontend:** Vercel (native Next.js support, generous free tier).
- **Backend:** Render or Railway free tier (Node/Express long-running service — needed because generation is a background async job, not a fit for pure serverless functions with short execution limits).
- **Database:** MongoDB Atlas free tier (M0 cluster).
- **LLM provider:** candidate free-tier providers to finalize in README — leading candidate is Google Gemini (generous free tier, good JSON-mode support) or Groq (fast, free tier, good for staying under time budget); final choice will be confirmed once rate limits are checked against the "5 cases in 15 minutes including retries" constraint, and made swappable via `LLM_PROVIDER` env var regardless.
- **Search for public interview discussion:** a free-tier search API (e.g., Brave Search API free tier, or SerpAPI free tier) behind the same `retrieval/` chokepoint; if no viable free key is available, fallback is a scoped web-crawl of known review-aggregator-style pages reached via the same SSRF-guarded fetcher rather than a paid API — decision to be finalized and documented.
- **Environment variables:** documented in `.env.example` — `MONGODB_URI`, `SESSION_SECRET`, `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `SEARCH_API_KEY`, `NODE_ENV`, `ALLOW_PRIVATE_HOSTS` (dev-only escape hatch for the evaluate command's localhost test server, explicitly disabled when `NODE_ENV=production`).
- **CORS:** backend restricts to the deployed frontend origin; cookies `SameSite=Lax/None` + `Secure` in production.

---

## L. 2–3 Day Implementation Plan

**Day 1 — Backbone + deterministic core (highest point density, lowest risk)**
- Repo scaffold (workspaces, TS configs, lint), shared types, Zod kit schema.
- Auth (register/login/logout/session middleware) + Kit/User Mongo models.
- `retrieval/` (fetcher, SSRF guard, robots.txt, link discoverer, page cleaner) with unit/integration tests against a local fixture server.
- `scheduling/` allocator + `validation/` coverage checker, fully unit-tested (these are pure and can be built/tested before the LLM integration exists at all, using hand-written fixtures).
- `llm/client.ts` with retry/backoff and a pluggable provider, validated against one live free-tier account.

**Day 2 — Pipeline + evaluate CLI + persistence**
- All 16 pipeline stages wired through the orchestrator, using real LLM calls behind Zod validation.
- `scripts/evaluate.ts` calling the orchestrator; verify against Appendix B shape and the 5-cases/15-minutes constraint using a local fixture "company site" server.
- Persistence layer + kit save/reopen; duplicate-submission detection.
- Edge-case pass: unreachable URL, no hiring page, thin JD, malformed LLM JSON, rate-limit simulation — each gets an explicit code path and a test.

**Day 3 — Frontend + builder/regeneration state + practice mode + creative feature + polish**
- Dashboard, new-kit form (+ batch upload), generation progress screen (polling `/progress`).
- Kit page tabs; question/flashcard CRUD + reorder + category move; per-section regenerate wired to the state model.
- Practice mode + confidence tracking + weak-spots creative feature.
- Accessibility/responsiveness pass, deployment, README, walkthrough video.

**Slack day (4th):** buffer for LLM provider quirks, deployment friction, and video recording — not new scope, per the brief's own framing.

---

## M. Risk Register (ordered by assessment scoring impact)

| Risk | Impact if unmitigated | Points at stake | Mitigation |
|---|---|---|---|
| LLM free-tier rate limiting breaks the pipeline mid-run | Batch command fails to complete 5 cases in 15 min; pipeline appears broken to graders on unseen JDs | 20 (extraction) + 15 (coverage/schedule) + 10 (robustness) — this is the single biggest risk named explicitly in the brief | Central `llm/client.ts` with exponential backoff + jitter, provider-reported rate-limit headers respected, and a hard per-case timeout budget so one slow case can't blow the 15-minute window; provider chosen and load-tested before Day 2 ends |
| Evaluate CLI implemented as a parallel/simplified pipeline instead of reusing the real one | Directly violates an explicit "do NOT" rule; likely heavily penalized even if the output looks right | Robustness (10) + integrity of automated pass | `domain/pipeline/orchestrator.ts` has no Express/CLI dependencies; both entry points are thin adapters calling it — enforced structurally, not by discipline alone |
| Coverage/schedule logic accidentally delegated to the LLM (e.g., asking it to "suggest a schedule") | Violates the brief's core "non-negotiable" rule; likely a severe deduction even if plausible-looking output ships | 15 + credibility of whole submission | These functions take zero LLM-shaped input (only requirements/questions arrays) and are unit-tested with fixtures that don't involve any LLM client — impossible to accidentally route through the model |
| Requirement extraction invents requirements not in the JD, or mis-tags must vs nice | Directly scored: "nothing is invented" | 20 (largest single line item) | Deterministic must/nice lexical pre-pass, prompt explicitly forbids invention and requires quoting/paraphrasing back to JD text, and thin-JD fixture test asserts requirement count stays low rather than padded |
| Hard-coded hiring-page paths (`/careers`, `/jobs`) sneak in as a shortcut under time pressure | Explicitly and repeatedly forbidden; graders test exactly this with a company at an unpredictable path | 10 (research/sequencing) + explicit call-out in brief | Link discovery is a scored function over *all* discovered links, no path allowlist; tested against a fixture site where the hiring info lives at a nonstandard path |
| Prompt injection via crawled page content or JD text | Untrusted content could hijack generation, produce garbage or leak instructions | Security is implicit throughout automated + robustness scoring | All retrieved text is wrapped as clearly delimited "DATA" in prompts with explicit system-level instructions that content is never to be treated as instructions; LLM responses are always schema-validated regardless of what the model "decided" to do |
| Regeneration silently overwrites user edits | Explicitly the "hardest state problem," 15 dedicated points | 15 | Eligibility-filtered regeneration (Milestone I) + a dedicated unit test asserting pinned/edited/manual survival by ID |
| Company with no hiring page or thin JD treated as a pipeline failure instead of an honest thin result | Brief explicitly tests this and rewards honest handling over invented content | Robustness (10) + extraction (20) reputational risk | Every pipeline stage returns partial success + recorded gaps rather than throwing; only true unrecoverable failures (company totally unreachable after retries) become `status: "failed"` |
| SSRF via company_url or discovered links pointing at internal/loopback addresses | Security failure, and the evaluate command specifically needs to hit `localhost` test servers, creating a tempting but dangerous "just allow everything" shortcut | Implicit but material to human review (code quality/security judgment) | SSRF guard is env-aware: private/loopback addresses rejected unless `NODE_ENV !== "production"` (or a narrow `ALLOW_PRIVATE_HOSTS` dev flag), so the evaluate command works locally/in CI without weakening production posture |
| Generation triggered twice for the same JD+company (duplicate submission, double-click, retry) | Wastes rate-limited LLM budget, could create duplicate kits | Robustness | `dedupeKey` (hash of jd+company_url) checked per user before starting a new generation; existing in-flight/complete kit is returned instead |
| Frontend not keyboard-accessible / not responsive | Explicit line item in human review | 10 (interaction design) | Semantic HTML, focus management on the practice stepper and editors, tested manually on a narrow viewport as part of Day 3 polish, not deferred to "later" |

---

**Status:** plan only, no application code written yet, per your instruction. Waiting for **"IMPLEMENT MILESTONE 1"** to begin — Day 1 scope above (repo scaffold, auth, retrieval layer, deterministic scheduling/coverage core, LLM client) would be split into a few concrete milestones at that point unless you'd like a different first cut.
