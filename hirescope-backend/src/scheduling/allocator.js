/**
 * HireScope — Deterministic Schedule Allocator (Section H)
 *
 * Pure function, no I/O, no LLM.
 * Allocates questions across exactly N days based on priority scoring.
 *
 * Output matches ScheduleDaySchema:
 * { day: number, focus: string, question_ids: string[], minutes: number }
 */

import { scoreQuestion } from "./scoring.js";

const DEFAULT_QUESTION_MINUTES = {
  1: 15,
  2: 20,
  3: 30
};

function getQuestionMinutes(question) {
  if (question && Number.isInteger(question.estimated_minutes) && question.estimated_minutes > 0) {
    return question.estimated_minutes;
  }
  const diff = Number(question?.difficulty) || 2;
  return DEFAULT_QUESTION_MINUTES[diff] || 20;
}

/**
 * Pure schedule allocation function.
 *
 * @param {object[]} questions - Array of Question objects
 * @param {object[]} requirements - Array of Requirement objects
 * @param {number} days - Desired number of preparation days
 * @returns {object[]} Array of DaySchedule objects: { day, focus, question_ids, minutes }
 */
export function allocateSchedule(questions = [], requirements = [], days = 5) {
  const safeDays = Math.max(1, Math.min(90, Math.floor(Number(days) || 1)));

  // Build requirement map
  const reqMap = new Map();
  for (const r of requirements) {
    if (r && r.id) {
      reqMap.set(r.id, r);
    }
  }

  // Deduplicate and score questions
  const validQuestions = (questions || []).filter((q) => q && q.id);
  const scored = validQuestions.map((q) => ({
    question: q,
    score: scoreQuestion(q, requirements),
    isMust: (q.requirement_ids || []).some((rid) => {
      const r = reqMap.get(rid);
      return r && r.priority === "must";
    })
  }));

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Initialize day buckets
  const schedule = Array.from({ length: safeDays }, (_, i) => ({
    day: i + 1,
    focus: "",
    question_ids: [],
    minutes: 0
  }));

  if (scored.length === 0) {
    return schedule.map((d) => ({
      ...d,
      focus: "General overview and research",
      minutes: 0
    }));
  }

  // Separate must-priority and regular questions
  const mustQuestions = scored.filter((s) => s.isMust);
  const otherQuestions = scored.filter((s) => !s.isMust);

  const earlyDaysCount = Math.max(1, Math.ceil(safeDays / 2));

  // 1. Distribute must questions across the earlier half of days
  mustQuestions.forEach((item, idx) => {
    const targetDayIndex = idx % earlyDaysCount;
    schedule[targetDayIndex].question_ids.push(item.question.id);
  });

  // 2. Distribute remaining questions across all days, biasing toward thinner days
  otherQuestions.forEach((item) => {
    let bestDayIdx = 0;
    let minCount = schedule[0].question_ids.length;

    for (let d = 0; d < safeDays; d++) {
      if (schedule[d].question_ids.length < minCount) {
        minCount = schedule[d].question_ids.length;
        bestDayIdx = d;
      }
    }
    schedule[bestDayIdx].question_ids.push(item.question.id);
  });

  // 3. Guarantee: every must-have requirement with questions has a representative in schedule
  const scheduledQuestionIds = new Set(schedule.flatMap((d) => d.question_ids));
  const mustReqsWithQuestions = requirements.filter(
    (r) => r.priority === "must" && validQuestions.some((q) => (q.requirement_ids || []).includes(r.id))
  );

  for (const mReq of mustReqsWithQuestions) {
    const isCoveredInSchedule = validQuestions.some(
      (q) => (q.requirement_ids || []).includes(mReq.id) && scheduledQuestionIds.has(q.id)
    );
    if (!isCoveredInSchedule) {
      const candidate = validQuestions.find((q) => (q.requirement_ids || []).includes(mReq.id));
      if (candidate) {
        schedule[0].question_ids.push(candidate.id);
        scheduledQuestionIds.add(candidate.id);
      }
    }
  }

  // 4. Compute minutes and formulate focus for each day
  const qMap = new Map(validQuestions.map((q) => [q.id, q]));

  for (let d = 0; d < safeDays; d++) {
    const dayItem = schedule[d];
    let totalMinutes = 0;
    const categoryCounts = {};

    for (const qid of dayItem.question_ids) {
      const q = qMap.get(qid);
      if (q) {
        totalMinutes += getQuestionMinutes(q);
        categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1;
      }
    }

    dayItem.minutes = Math.round(totalMinutes);

    if (dayItem.question_ids.length === 0) {
      dayItem.focus = "Free review / rest & reflection";
    } else if (safeDays === 1) {
      dayItem.focus = "Comprehensive core preparation & high-priority review";
    } else {
      let topCategory = "technical";
      let maxCatCount = 0;
      for (const [cat, count] of Object.entries(categoryCounts)) {
        if (count > maxCatCount) {
          maxCatCount = count;
          topCategory = cat;
        }
      }
      const catFormatted = topCategory.replace("-", " ");
      const capitalized = catFormatted.charAt(0).toUpperCase() + catFormatted.slice(1);

      if (d === 0) {
        dayItem.focus = `Core Foundations & ${capitalized} Deep Dive`;
      } else if (d === safeDays - 1) {
        dayItem.focus = `Final Polish, ${capitalized} & Mock Scenarios`;
      } else {
        dayItem.focus = `${capitalized} Focus & Targeted Problem Solving`;
      }
    }
  }

  return schedule;
}
