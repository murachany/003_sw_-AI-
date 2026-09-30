/**
 * @vitest-environment jsdom
 */

import { beforeAll, describe, expect, it } from "vitest";

describe("quiz application flow", () => {
  beforeAll(async () => {
    window.confirm = () => true;
    window.localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
    await import("./main");
  });

  it("starts a quiz, submits answers, and displays review results", () => {
    const startButton = document.querySelector<HTMLButtonElement>(
      'button[data-action="start"][data-count="10"]',
    );
    expect(startButton).not.toBeNull();
    expect(
      document.querySelector<HTMLButtonElement>(
        'button[data-action="start"][data-count="60"]',
      ),
    ).not.toBeNull();
    startButton?.click();

    expect(document.querySelector(".question-card")).not.toBeNull();
    expect(
      document.querySelectorAll('button[data-action="answer"]'),
    ).toHaveLength(5);

    document
      .querySelector<HTMLButtonElement>(
        'button[data-action="answer"][data-answer="0"]',
      )
      ?.click();
    const selectedAnswer = document.querySelector<HTMLButtonElement>(
      'button[data-action="answer"][aria-pressed="true"]',
    );
    expect(
      selectedAnswer?.classList.contains("is-correct") ||
        selectedAnswer?.classList.contains("is-incorrect"),
    ).toBe(true);
    expect(
      document.querySelectorAll(".answer-button.is-correct-answer"),
    ).toHaveLength(1);
    expect(document.querySelector(".answer-feedback")).not.toBeNull();
    expect(document.querySelector(".answer-feedback")?.textContent).toContain(
      "正誤の理由",
    );
    expect(document.querySelector(".knowledge-explanation")).not.toBeNull();

    for (let index = 0; index < 10; index += 1) {
      document
        .querySelector<HTMLButtonElement>(
          'button[data-action="answer"][data-answer="0"]',
        )
        ?.click();
      if (index < 9) {
        document
          .querySelector<HTMLButtonElement>('button[data-action="next"]')
          ?.click();
      }
    }
    document
      .querySelector<HTMLButtonElement>('button[data-action="submit"]')
      ?.click();

    expect(document.querySelector(".score-panel")?.textContent).toContain("%");
    expect(document.querySelectorAll(".review-card")).toHaveLength(10);
    expect(document.querySelector(".result-actions")).not.toBeNull();
  });

  it("opens the categorized question list and exposes explanations", () => {
    document
      .querySelector<HTMLButtonElement>('button[data-action="question-list"]')
      ?.click();

    expect(document.querySelector(".question-list-shell")).not.toBeNull();
    expect(document.querySelectorAll(".question-category")).toHaveLength(5);
    expect(document.querySelectorAll(".question-list-item")).toHaveLength(200);

    const firstItem = document.querySelector<HTMLDetailsElement>(
      ".question-list-item",
    );
    expect(firstItem).not.toBeNull();
    firstItem?.setAttribute("open", "");
    expect(firstItem?.querySelector(".question-list-detail")?.textContent).toContain(
      "正解",
    );
    expect(firstItem?.querySelector(".explanation")?.textContent).toContain(
      "正誤の理由",
    );
  });
});
