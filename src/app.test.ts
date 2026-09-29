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
    startButton?.click();

    expect(document.querySelector(".question-card")).not.toBeNull();
    expect(
      document.querySelectorAll('button[data-action="answer"]'),
    ).toHaveLength(5);

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
});
