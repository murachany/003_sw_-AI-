import { describe, expect, it } from "vitest";
import { parseSession } from "./storage";

describe("session storage parsing", () => {
  it("returns no session for empty storage", () => {
    expect(parseSession(null)).toEqual({ session: null });
  });

  it("round-trips a valid session shape", () => {
    const session = {
      version: 1 as const,
      status: "in-progress" as const,
      questionIds: ["ai-001", "ai-002"],
      answers: {
        "ai-001": 0 as const,
        "ai-002": "unknown" as const,
      },
      currentIndex: 1,
      questionCount: 2,
      startedAt: "2026-09-29T00:00:00.000Z",
    };

    expect(parseSession(JSON.stringify(session))).toEqual({ session });
  });

  it("reports malformed JSON instead of silently discarding it", () => {
    const result = parseSession("{invalid");
    expect(result.session).toBeNull();
    expect(result.error).toContain("保存データを読み込めません");
  });

  it("reports inconsistent answer data", () => {
    const result = parseSession(
      JSON.stringify({
        version: 1,
        status: "in-progress",
        questionIds: ["ai-001"],
        answers: { "ai-001": 9 },
        currentIndex: 0,
        questionCount: 1,
        startedAt: "2026-09-29T00:00:00.000Z",
      }),
    );
    expect(result.session).toBeNull();
    expect(result.error).toContain("回答状態");
  });
});
