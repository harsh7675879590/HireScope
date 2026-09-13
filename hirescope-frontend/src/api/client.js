/**
 * HireScope — API Client
 *
 * REST API client with cookie credentials and standard error handling.
 */

const BASE_URL = "/api/v1";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    credentials: "include"
  };

  if (options.body && typeof options.body === "object") {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, config);

  if (res.status === 204) {
    return { ok: true, data: null };
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || data.error || `HTTP ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // ── Auth ──
  register: (email, password) => request("/auth/register", { method: "POST", body: { email, password } }),
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  logout: () => request("/auth/logout", { method: "POST" }),
  getMe: () => request("/auth/me", { method: "GET" }),

  // ── Kits ──
  listKits: () => request("/kits", { method: "GET" }),
  createKit: (data) => request("/kits", { method: "POST", body: data }),
  getKit: (id) => request(`/kits/${id}`, { method: "GET" }),
  deleteKit: (id) => request(`/kits/${id}`, { method: "DELETE" }),
  getProgress: (id) => request(`/kits/${id}/progress`, { method: "GET" }),
  regenerateSection: (id, section) => request(`/kits/${id}/regenerate`, { method: "POST", body: { section } }),

  // ── Questions ──
  addQuestion: (kitId, question) => request(`/kits/${kitId}/questions`, { method: "POST", body: question }),
  patchQuestion: (kitId, qid, patch) => request(`/kits/${kitId}/questions/${qid}`, { method: "PATCH", body: patch }),
  deleteQuestion: (kitId, qid) => request(`/kits/${kitId}/questions/${qid}`, { method: "DELETE" }),
  togglePinQuestion: (kitId, qid) => request(`/kits/${kitId}/questions/${qid}/pin`, { method: "POST" }),
  reorderQuestions: (kitId, orderedIds) => request(`/kits/${kitId}/questions/reorder`, { method: "PATCH", body: { orderedIds } }),

  // ── Flashcards ──
  addFlashcard: (kitId, card) => request(`/kits/${kitId}/flashcards`, { method: "POST", body: card }),
  patchFlashcard: (kitId, fid, patch) => request(`/kits/${kitId}/flashcards/${fid}`, { method: "PATCH", body: patch }),
  deleteFlashcard: (kitId, fid) => request(`/kits/${kitId}/flashcards/${fid}`, { method: "DELETE" }),

  // ── Brief ──
  patchBrief: (kitId, patch) => request(`/kits/${kitId}/brief`, { method: "PATCH", body: patch }),

  // ── Practice & Weak Spots ──
  startPracticeSession: (kitId) => request(`/kits/${kitId}/practice/sessions`, { method: "POST" }),
  recordCardAnswer: (kitId, sessionId, flashcardId, confidence) =>
    request(`/kits/${kitId}/practice/sessions/${sessionId}`, {
      method: "PATCH",
      body: { flashcardId, confidence }
    }),
  getWeakSpots: (kitId) => request(`/kits/${kitId}/practice/weak-spots`, { method: "GET" })
};
