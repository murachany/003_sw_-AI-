import { describe, expect, it } from "vitest";
import {
  allAnswered,
  calculateResult,
  createSession,
  getFilteredQuestions,
  getQuestionStatus,
  selectQuestions,
} from "./quiz";
import { questions } from "./questions";

describe("quiz logic", () => {
  it("selects unique questions while balancing categories", () => {
    const selected = selectQuestions(questions, 10, () => 0.25);
    expect(selected).toHaveLength(10);
    expect(new Set(selected.map((question) => question.id)).size).toBe(10);
    expect(new Set(selected.map((question) => question.category)).size).toBe(5);
  });

  it("creates an unanswered session", () => {
    const selected = questions.slice(0, 10);
    const session = createSession(selected, new Date("2026-09-29T00:00:00Z"));
    expect(session.status).toBe("in-progress");
    expect(session.questionCount).toBe(10);
    expect(Object.values(session.answers).every((answer) => answer === null)).toBe(
      true,
    );
  });

  it("calculates correct, incorrect, unknown, unanswered and percentage", () => {
    const selected = questions.slice(0, 4);
    const wrongAnswer = ((selected[1].answerIndex + 1) % 4) as 0 | 1 | 2 | 3;
    const answers = {
      [selected[0].id]: selected[0].answerIndex,
      [selected[1].id]: wrongAnswer,
      [selected[2].id]: "unknown" as const,
      [selected[3].id]: null,
    };

    expect(calculateResult(selected, answers)).toEqual({
      correct: 1,
      incorrect: 1,
      unknown: 1,
      unanswered: 1,
      percentage: 25,
    });
    expect(allAnswered(selected, answers)).toBe(false);
  });

  it("distinguishes unknown from incorrect", () => {
    const question = questions[0];
    expect(getQuestionStatus(question, "unknown")).toBe("unknown");
    expect(getQuestionStatus(question, 1)).toBe("incorrect");
    expect(getQuestionStatus(question, question.answerIndex)).toBe("correct");
  });

  it("filters review questions", () => {
    const selected = questions.slice(0, 3);
    const wrongAnswer = ((selected[1].answerIndex + 1) % 4) as 0 | 1 | 2 | 3;
    const answers = {
      [selected[0].id]: selected[0].answerIndex,
      [selected[1].id]: wrongAnswer,
      [selected[2].id]: "unknown" as const,
    };

    expect(getFilteredQuestions(selected, answers, "incorrect")).toEqual([
      selected[1],
    ]);
    expect(getFilteredQuestions(selected, answers, "unknown")).toEqual([
      selected[2],
    ]);
  });
});
