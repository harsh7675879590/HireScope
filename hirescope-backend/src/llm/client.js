/**
 * HireScope — Provider-Agnostic LLM Client
 *
 * Supports:
 * 1. Google Gemini (@google/generative-ai)
 * 2. Groq (groq-sdk)
 * 3. Mock Provider (for offline tests & evaluate fallback without requiring live API keys)
 *
 * Strictly parses and validates structured JSON output.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { withRetry } from "./retry.js";
import logger from "../utils/logger.js";

/**
 * Extract clean JSON string from possible markdown fences: ```json ... ```
 */
export function extractJsonFromResponse(text) {
  if (!text || typeof text !== "string") return "{}";

  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(fenceRegex);
  if (match && match[1]) {
    return match[1].trim();
  }

  // Find first { or [
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");

  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx !== -1) {
    const isObject = text[startIdx] === "{";
    const endChar = isObject ? "}" : "]";
    const lastIdx = text.lastIndexOf(endChar);
    if (lastIdx > startIdx) {
      return text.substring(startIdx, lastIdx + 1).trim();
    }
  }

  return text.trim();
}

export class LlmClient {
  constructor(options = {}) {
    this.provider = options.provider || process.env.LLM_PROVIDER || "mock";
    this.apiKey = options.apiKey || process.env.LLM_API_KEY || "";
    this.model = options.model || process.env.LLM_MODEL || "";

    if (this.provider === "gemini" && this.apiKey) {
      this.gemini = new GoogleGenerativeAI(this.apiKey);
    } else if (this.provider === "groq" && this.apiKey) {
      this.groq = new Groq({ apiKey: this.apiKey });
    }
  }

  /**
   * Complete prompt and parse JSON according to optional schema.
   */
  async completeJson(prompt, schema = null, options = {}) {
    return withRetry(
      async () => {
        const rawText = await this._generateRawText(prompt, options);
        const jsonString = extractJsonFromResponse(rawText);

        let parsed;
        try {
          parsed = JSON.parse(jsonString);
        } catch (parseError) {
          logger.error(`Failed to parse LLM response as JSON: ${parseError.message}\nRaw text: ${rawText}`);
          throw new Error(`LLM output was not valid JSON: ${parseError.message}`);
        }

        if (schema && typeof schema.parse === "function") {
          return schema.parse(parsed);
        }

        return parsed;
      },
      {
        operationName: options.operationName || `LLM_${this.provider}`,
        maxRetries: options.maxRetries || 3
      }
    );
  }

  async _generateRawText(prompt, options = {}) {
    if (this.provider === "gemini" && this.gemini) {
      const modelName = this.model || "gemini-1.5-flash";
      const model = this.gemini.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json"
        }
      });
      const result = await model.generateContent(prompt);
      return result.response.text();
    }

    if (this.provider === "groq" && this.groq) {
      const modelName = this.model || "llama-3.3-70b-versatile";
      const completion = await this.groq.chat.completions.create({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      return completion.choices[0]?.message?.content || "{}";
    }

    // Default: Mock Provider (deterministic intelligent fallback)
    return this._mockGenerate(prompt);
  }

  /**
   * Deterministic mock generator that inspects the prompt to produce schema-accurate responses.
   * Enables evaluating and testing without requiring live external API tokens.
   */
  _mockGenerate(prompt) {
    const p = (prompt || "").toLowerCase();

    // 1. Requirements extraction
    if (p.includes("structured requirements") || p.includes("role & seniority") || p.includes("extract_requirements")) {
      return JSON.stringify({
        role: "Software Engineer",
        seniority: "Mid-Senior",
        responsibilities: [
          "Design, build, and maintain scalable backend services and APIs",
          "Collaborate with cross-functional teams to define architecture and requirements",
          "Ensure high performance, reliability, and code quality through testing and reviews"
        ],
        requirements: [
          { id: "req-1", text: "Proficiency in JavaScript/TypeScript and Node.js backend development", priority: "must", kind: "technical" },
          { id: "req-2", text: "Hands-on experience with relational or NoSQL databases like MongoDB or PostgreSQL", priority: "must", kind: "technical" },
          { id: "req-3", text: "Experience designing RESTful APIs and microservice architectures", priority: "must", kind: "system-design" },
          { id: "req-4", text: "Strong problem solving, data structures, and algorithms fundamentals", priority: "must", kind: "technical" },
          { id: "req-5", text: "Familiarity with cloud platforms (AWS/GCP), Docker, and CI/CD pipelines", priority: "nice", kind: "general" },
          { id: "req-6", text: "Experience with frontend modern frameworks (React/Next.js)", priority: "nice", kind: "technical" }
        ]
      });
    }

    // 2. Company brief
    if (p.includes("company brief") || p.includes("company_brief")) {
      return JSON.stringify({
        company_name: "Target Company",
        overview: "An innovative technology company building high-performance products and solutions for modern scale.",
        culture: "Ownership and customer obsession, bias for action, and transparent collaboration.",
        recent_news: "Recent expansion into new developer infrastructure products.",
        interview_process: "Comprehensive multi-round evaluation covering core technical fundamentals, system design trade-offs, and behavioral culture alignment.",
        hiring_page_url: null,
        sources: [
          "Official company website & career portal",
          "Public engineering community posts & candidate discussions"
        ]
      });
    }

    // 3. Technical Questions
    if (p.includes("category: technical") || p.includes('"technical"')) {
      return JSON.stringify({
        questions: [
          {
            question: "Asynchronous Node.js Event Loop and Concurrency Management",
            category: "technical",
            difficulty: 2,
            estimated_minutes: 20,
            requirement_ids: ["req-1"],
            why_relevant: "Essential for building non-blocking backend services."
          },
          {
            question: "Database Indexing Strategy and Query Optimization in MongoDB",
            category: "technical",
            difficulty: 3,
            estimated_minutes: 30,
            requirement_ids: ["req-2"],
            why_relevant: "Evaluates indexing strategy, compound indexes (ESR rule), and explain() plans."
          }
        ]
      });
    }

    // 4. System Design Questions
    if (p.includes("category: system-design") || p.includes('"system-design"')) {
      return JSON.stringify({
        questions: [
          {
            question: "Design a High-Throughput RESTful API Rate Limiter and Job Queue",
            category: "system-design",
            difficulty: 3,
            estimated_minutes: 30,
            requirement_ids: ["req-3"],
            why_relevant: "Validates distributed systems and API design knowledge."
          }
        ]
      });
    }

    // 5. Behavioural Questions
    if (p.includes("category: behavioural") || p.includes('"behavioural"')) {
      return JSON.stringify({
        questions: [
          {
            question: "Navigating Architectural Disagreements and Cross-Functional Deadlocks",
            category: "behavioural",
            difficulty: 2,
            estimated_minutes: 20,
            requirement_ids: ["req-4"],
            why_relevant: "Assesses STAR methodology, emotional intelligence, and data-driven communication."
          }
        ]
      });
    }

    // 6. Company-Fit Questions
    if (p.includes("category: company-fit") || p.includes('"company-fit"')) {
      return JSON.stringify({
        questions: [
          {
            question: "Demonstrating Ownership and Initiative Under Ambiguous Product Requirements",
            category: "company-fit",
            difficulty: 1,
            estimated_minutes: 15,
            requirement_ids: ["req-4"],
            why_relevant: "Tests alignment with autonomous ownership and startup execution pace."
          }
        ]
      });
    }

    // 7. Flashcards
    if (p.includes("flashcard")) {
      return JSON.stringify({
        flashcards: [
          {
            front: "What is the difference between process.nextTick() and setImmediate() in Node.js?",
            back: "process.nextTick fires immediately after the current operation finishes (before event loop continues), while setImmediate fires during the Check phase of the event loop.",
            requirement_ids: ["req-1"]
          },
          {
            front: "What does the ESR rule stand for in database index design?",
            back: "Equality, Sort, Range. Place exact match keys first, followed by sorting keys, and range filters last.",
            requirement_ids: ["req-2"]
          },
          {
            front: "How does the Sliding Window Log rate limiter differ from Fixed Window?",
            back: "Sliding window logs individual timestamped events to prevent traffic spikes at boundary edges that fixed window algorithms suffer from.",
            requirement_ids: ["req-3"]
          }
        ]
      });
    }

    // Generic fallback object
    return JSON.stringify({ status: "ok", data: [] });
  }
}

export const llmClient = new LlmClient();
