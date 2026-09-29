import { describe, expect, it } from "vitest";
import { questions } from "./questions";
import { validateQuestions } from "./questionValidation";

describe("question data", () => {
  it("contains the required number of questions", () => {
    expect(questions).toHaveLength(50);
  });

  it("passes the data validation rules", () => {
    expect(validateQuestions(questions)).toEqual([]);
  });

  it("uses unique IDs and covers the intended categories", () => {
    expect(new Set(questions.map((question) => question.id)).size).toBe(50);
    expect(new Set(questions.map((question) => question.category))).toEqual(
      new Set([
        "AI基礎",
        "生成AIの技術",
        "生成AIの動向",
        "情報リテラシー・リスク",
        "プロンプト・活用",
      ]),
    );
  });

  it("distributes correct answers across all four positions", () => {
    expect(new Set(questions.map((question) => question.answerIndex))).toEqual(
      new Set([0, 1, 2, 3]),
    );
  });

  it("uses official syllabus references without claiming past questions", () => {
    expect(
      questions.every(
        (question) =>
          question.source.type === "official-syllabus" &&
          question.source.url === "https://guga.or.jp/assets/syllabus.pdf" &&
          question.source.questionNumber === undefined,
      ),
    ).toBe(true);
  });
});
