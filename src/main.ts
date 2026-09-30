import "./style.css";
import {
  allAnswered,
  calculateResult,
  createSession,
  getFilteredQuestions,
  getQuestionStatus,
  QUIZ_COUNTS,
  selectQuestions,
} from "./quiz";
import { questions } from "./questions";
import { validateQuestions } from "./questionValidation";
import { explainKnowledge } from "./knowledge";
import {
  clearSession,
  loadSession,
  saveSession,
  SessionStorageError,
} from "./storage";
import type {
  Answer,
  Question,
  QuestionStatus,
  ReviewFilter,
  SessionSnapshot,
} from "./types";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("アプリケーションの描画先が見つかりません。");
}

const validationIssues = validateQuestions(questions);
if (validationIssues.length > 0) {
  app.innerHTML = renderFatal(
    "問題データを読み込めません",
    validationIssues.join(" "),
  );
  throw new Error(`問題データの検証に失敗しました: ${validationIssues.join("; ")}`);
}

const questionMap = new Map(questions.map((question) => [question.id, question]));
const choiceLetters = ["A", "B", "C", "D"] as const;
const sourceTypeLabels: Record<string, string> = {
  "official-syllabus": "公式シラバス",
  "official-example": "公式例題",
  "third-party-mock": "第三者模擬問題",
  original: "オリジナル問題",
};

type Screen = "home" | "quiz" | "result" | "list";

let screen: Screen = "home";
let session: SessionSnapshot | null = null;
let resultFilter: ReviewFilter = "all";
let notice = "";
let storageNotice = "";

try {
  const loaded = loadSession();
  if (loaded.session) {
    const hasCurrentQuestions = loaded.session.questionIds.every((id) =>
      questionMap.has(id),
    );
    if (hasCurrentQuestions) {
      session = loaded.session;
    } else {
      storageNotice =
        "保存済みの演習は現在の問題データと一致しないため再開できません。保存データを削除して新しい演習を開始してください。";
    }
  }
  if (loaded.error) {
    storageNotice = loaded.error;
  }
} catch (error) {
  storageNotice =
    error instanceof SessionStorageError
      ? error.message
      : "保存済みの学習状態を読み込めませんでした。";
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getSelectedQuestions = (
  currentSession: SessionSnapshot,
): Question[] | null => {
  const selected = currentSession.questionIds.map((id) => questionMap.get(id));
  return selected.every((question): question is Question => question !== undefined)
    ? selected
    : null;
};

const getStatusLabel = (status: QuestionStatus): string => {
  switch (status) {
    case "correct":
      return "正解";
    case "incorrect":
      return "不正解";
    case "unknown":
      return "要復習";
    case "unanswered":
      return "未回答";
  }
};

const getAnswerLabel = (answer: Answer): string => {
  if (answer === null) {
    return "未回答";
  }
  if (answer === "unknown") {
    return "？（わからない）";
  }
  return choiceLetters[answer];
};

const renderNotice = (): string => {
  const messages = [storageNotice, notice].filter(Boolean);
  if (messages.length === 0) {
    return "";
  }
  return `<div class="alert" role="alert">${messages
    .map((message) => `<p>${escapeHtml(message)}</p>`)
    .join("")}</div>`;
};

const renderHeader = (showHomeLink = false): string => `
  <header class="site-header">
    <div>
      <p class="eyebrow">GUGA / STUDY TOOL</p>
      <p class="site-title">生成AIパスポート一問一答</p>
    </div>
    ${
      showHomeLink
        ? '<button class="text-button" type="button" data-action="go-home">トップへ戻る</button>'
        : `<button class="text-button" type="button" data-action="question-list">
            問題一覧（${questions.length}問）
          </button>`
    }
  </header>
`;

const renderSource = (question: Question): string => {
  const source = question.source;
  const date = source.publishedAt
    ? `（${escapeHtml(source.publishedAt)}）`
    : "";
  const questionNumber = source.questionNumber
    ? `・問題${escapeHtml(source.questionNumber)}`
    : "・本試験過去問ではありません";
  return `
    <div class="source-box">
      <p class="source-label">出典</p>
      <p>
        ${escapeHtml(sourceTypeLabels[source.type] ?? source.type)}
        ${date}${questionNumber}
      </p>
      <a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">
        ${escapeHtml(source.title)}（参照日：${escapeHtml(source.accessedAt)}）
      </a>
    </div>
  `;
};

const renderRelatedKnowledge = (question: Question): string => `
  <ul class="knowledge-list">
    ${question.relatedKnowledge
      .map(
        (knowledge) => `
          <li>
            <strong class="knowledge-term">${escapeHtml(knowledge)}</strong>
            <span class="knowledge-explanation">${escapeHtml(explainKnowledge(knowledge))}</span>
          </li>
        `,
      )
      .join("")}
  </ul>
`;

const renderHome = (): string => {
  const resumableSession =
    session?.status === "in-progress" ? session : undefined;
  return `
    <main class="app-shell">
      ${renderHeader()}
      <section class="hero">
        <p class="eyebrow">GENERATIVE AI PASSPORT</p>
        <h1>生成AIパスポート<br />一問一答</h1>
        <p class="lead">
          GUGAの生成AIパスポート試験を、問題・解説・周辺知識と一緒に学習できます。
        </p>
      </section>
      ${renderNotice()}
      ${
        resumableSession
          ? `
            <section class="resume-card" aria-labelledby="resume-title">
              <h2 id="resume-title">演習を再開できます</h2>
              <p>${resumableSession.questionCount}問の演習が保存されています。</p>
              <div class="button-row">
                <button class="primary-button" type="button" data-action="resume">
                  続きから再開
                </button>
                <button class="secondary-button" type="button" data-action="clear-saved">
                  保存データを削除
                </button>
              </div>
            </section>
          `
          : ""
      }
      <section class="start-card" aria-labelledby="start-title">
        <h2 id="start-title">問題数を選んで開始</h2>
        <p>カテゴリが偏らないように、登録済みの問題から重複なく出題します。</p>
        <div class="count-grid">
          ${QUIZ_COUNTS.map(
            (count) => `
              <button class="count-button" type="button" data-action="start" data-count="${count}">
                <strong>${count}</strong>
                <span>問で開始</span>
              </button>
            `,
          ).join("")}
        </div>
      </section>
      <section class="info-card" aria-labelledby="policy-title">
        <h2 id="policy-title">この教材について</h2>
        <ul class="feature-list">
          <li>回答を選ぶと、その場で正誤・正誤の理由・周辺知識を確認できます。</li>
          <li>「？」は要復習として記録され、正答率には含まれません。</li>
          <li>問題は公式シラバスを参照したオリジナル問題です。</li>
          <li>GUGAの本試験過去問を転載するものではありません。</li>
        </ul>
        <p class="official-links">
          <a href="https://guga.or.jp/outline/" target="_blank" rel="noreferrer">
            GUGA公式概要
          </a>
          <a href="https://guga.or.jp/assets/syllabus.pdf" target="_blank" rel="noreferrer">
            公式シラバス
          </a>
        </p>
      </section>
      <footer class="footer">
        <p>学習状態はこのブラウザのlocalStorageにのみ保存されます。</p>
      </footer>
    </main>
  `;
};

const renderQuestionList = (): string => {
  const questionsByCategory = new Map<string, Question[]>();
  for (const question of questions) {
    const categoryQuestions = questionsByCategory.get(question.category) ?? [];
    categoryQuestions.push(question);
    questionsByCategory.set(question.category, categoryQuestions);
  }

  return `
    <main class="app-shell question-list-shell">
      ${renderHeader(true)}
      ${renderNotice()}
      <section class="question-list-hero" aria-labelledby="question-list-title">
        <p class="eyebrow">QUESTION BANK</p>
        <h1 id="question-list-title">問題一覧</h1>
        <p class="lead">
          全${questions.length}問をカテゴリ別に確認できます。問題を開くと正解・解説・周辺知識を表示します。
        </p>
      </section>
      <div class="question-category-list">
        ${[...questionsByCategory.entries()]
          .map(
            ([category, categoryQuestions]) => `
              <section class="question-category" aria-labelledby="category-${escapeHtml(category)}">
                <div class="section-heading">
                  <h2 id="category-${escapeHtml(category)}">${escapeHtml(category)}</h2>
                  <span>${categoryQuestions.length}問</span>
                </div>
                <div class="question-list">
                  ${categoryQuestions
                    .map(
                      (question) => `
                        <details class="question-list-item">
                          <summary>
                            <span class="question-summary-meta">
                              <span class="category-badge">${escapeHtml(question.category)}</span>
                              <span class="question-id">${escapeHtml(question.id)}</span>
                            </span>
                            <span class="question-list-text">${escapeHtml(question.question)}</span>
                          </summary>
                          <div class="question-list-detail">
                            <div class="list-answer">
                              <h3>正解</h3>
                              <p>${choiceLetters[question.answerIndex]}：${escapeHtml(question.choices[question.answerIndex])}</p>
                            </div>
                            <div class="explanation">
                              <h3>正誤の理由</h3>
                              <p>${escapeHtml(question.explanation)}</p>
                              <h3>試験対策として覚える周辺知識</h3>
                              ${renderRelatedKnowledge(question)}
                            </div>
                            ${renderSource(question)}
                          </div>
                        </details>
                      `,
                    )
                    .join("")}
                </div>
              </section>
            `,
          )
          .join("")}
      </div>
      <footer class="footer">
        <p>問題は公式シラバスを参照したオリジナル問題です。本試験過去問の転載ではありません。</p>
      </footer>
    </main>
  `;
};

const renderProgress = (
  currentIndex: number,
  questionCount: number,
): string => `
  <div class="progress-wrap" aria-label="進捗">
    <div class="progress-text">
      <span>問題 ${currentIndex + 1} / ${questionCount}</span>
      <span>${Math.round(((currentIndex + 1) / questionCount) * 100)}%</span>
    </div>
    <div class="progress-track">
      <div class="progress-value" style="width: ${((currentIndex + 1) / questionCount) * 100}%"></div>
    </div>
  </div>
`;

const renderQuestionStatusList = (
  currentSession: SessionSnapshot,
  selectedQuestions: readonly Question[],
): string => `
  <ol class="status-list" aria-label="回答状況">
    ${selectedQuestions
      .map((question, index) => {
        const status = getQuestionStatus(
          question,
          currentSession.answers[question.id] ?? null,
        );
        const isCurrent = index === currentSession.currentIndex;
        return `
          <li>
            <button
              class="status-button status-${status} ${isCurrent ? "is-current" : ""}"
              type="button"
              data-action="go-question"
              data-index="${index}"
              aria-label="問題${index + 1} ${getStatusLabel(status)}"
              ${isCurrent ? 'aria-current="step"' : ""}
            >
              <span>${index + 1}</span>
              <small>${getStatusLabel(status)}</small>
            </button>
          </li>
        `;
      })
      .join("")}
  </ol>
`;

const renderAnswerFeedback = (
  question: Question,
  answer: Answer,
): string => {
  if (answer === null) {
    return "";
  }

  const status = getQuestionStatus(question, answer);
  const heading =
    status === "correct"
      ? "正解です"
      : status === "incorrect"
        ? "不正解です"
        : "要復習です";
  const answerText =
    answer === "unknown"
      ? "？（わからない・要復習）"
      : `${choiceLetters[answer]}：${question.choices[answer]}`;

  return `
    <section class="answer-feedback feedback-${status}" aria-live="polite">
      <h2>${heading}</h2>
      <p>あなたの回答：${escapeHtml(answerText)}</p>
      <p><strong>正解：${choiceLetters[question.answerIndex]}：${escapeHtml(question.choices[question.answerIndex])}</strong></p>
      <div class="explanation">
        <h3>正誤の理由</h3>
        <p>${escapeHtml(question.explanation)}</p>
        <h3>試験対策として覚える周辺知識</h3>
        ${renderRelatedKnowledge(question)}
      </div>
    </section>
  `;
};

const renderQuiz = (currentSession: SessionSnapshot): string => {
  const selectedQuestions = getSelectedQuestions(currentSession);
  if (!selectedQuestions) {
    return renderFatal(
      "演習を再開できません",
      "保存された問題が現在の問題データに存在しません。トップ画面から保存データを削除してください。",
    );
  }

  const currentQuestion = selectedQuestions[currentSession.currentIndex];
  if (!currentQuestion) {
    return renderFatal("問題を表示できません", "現在の問題位置が不正です。");
  }

  const answer = currentSession.answers[currentQuestion.id] ?? null;
  const isLastQuestion =
    currentSession.currentIndex === selectedQuestions.length - 1;
  const unanswered = selectedQuestions.filter(
    (question) => (currentSession.answers[question.id] ?? null) === null,
  ).length;

  return `
    <main class="app-shell quiz-shell">
      ${renderHeader(true)}
      ${renderNotice()}
      ${renderProgress(currentSession.currentIndex, selectedQuestions.length)}
      <section class="question-card" aria-labelledby="question-title">
        <div class="question-heading">
          <span class="category-badge">${escapeHtml(currentQuestion.category)}</span>
          <span class="question-id">${escapeHtml(currentQuestion.id)}</span>
        </div>
        <h1 id="question-title">${escapeHtml(currentQuestion.question)}</h1>
        <div class="answer-group" role="group" aria-labelledby="question-title">
          ${currentQuestion.choices
            .map(
              (choice, index) => `
                <button
                  class="answer-button ${
                    answer !== null && index === currentQuestion.answerIndex
                      ? "is-correct-answer"
                      : ""
                  } ${
                    answer === index
                      ? answer === currentQuestion.answerIndex
                        ? "is-correct"
                        : "is-incorrect"
                      : ""
                  } ${answer === index ? "is-selected" : ""}"
                  type="button"
                  data-action="answer"
                  data-answer="${index}"
                  aria-pressed="${answer === index}"
                  aria-label="${choiceLetters[index]}：${escapeHtml(choice)}${
                    answer !== null && index === currentQuestion.answerIndex
                      ? "（正解）"
                      : answer === index
                        ? "（不正解）"
                        : ""
                  }"
                >
                  <span class="choice-letter">${choiceLetters[index]}</span>
                  <span>${escapeHtml(choice)}</span>
                </button>
              `,
            )
            .join("")}
          <button
            class="unknown-button ${answer === "unknown" ? "is-selected" : ""}"
            type="button"
            data-action="answer"
            data-answer="unknown"
            aria-pressed="${answer === "unknown"}"
          >
            <span class="choice-letter">?</span>
            <span>わからない・要復習</span>
          </button>
        </div>
        ${renderAnswerFeedback(currentQuestion, answer)}
      </section>
      ${
        notice
          ? `<p class="inline-alert" role="alert">${escapeHtml(notice)}</p>`
          : ""
      }
      <div class="button-row navigation-buttons">
        <button
          class="secondary-button"
          type="button"
          data-action="previous"
          ${currentSession.currentIndex === 0 ? "disabled" : ""}
        >
          前の問題
        </button>
        ${
          isLastQuestion
            ? `
              <button class="primary-button" type="button" data-action="submit">
                提出する
              </button>
            `
            : `
              <button class="primary-button" type="button" data-action="next">
                次の問題
              </button>
            `
        }
      </div>
      <section class="navigation-card" aria-labelledby="navigation-title">
        <div class="section-heading">
          <h2 id="navigation-title">回答状況</h2>
          <span>${selectedQuestions.length - unanswered}/${selectedQuestions.length}問回答済み</span>
        </div>
        ${renderQuestionStatusList(currentSession, selectedQuestions)}
      </section>
    </main>
  `;
};

const renderReviewItem = (
  question: Question,
  currentSession: SessionSnapshot,
): string => {
  const answer = currentSession.answers[question.id] ?? null;
  const status = getQuestionStatus(question, answer);
  const correctAnswer = question.answerIndex;
  return `
    <article class="review-card review-${status}">
      <div class="review-heading">
        <div>
          <span class="category-badge">${escapeHtml(question.category)}</span>
          <h3>${escapeHtml(question.question)}</h3>
        </div>
        <span class="result-badge result-${status}">${getStatusLabel(status)}</span>
      </div>
      <dl class="answer-summary">
        <div>
          <dt>あなたの回答</dt>
          <dd>${escapeHtml(getAnswerLabel(answer))}</dd>
        </div>
        <div>
          <dt>正解</dt>
          <dd>${choiceLetters[correctAnswer]}：${escapeHtml(question.choices[correctAnswer])}</dd>
        </div>
      </dl>
      <div class="explanation">
        <h4>正誤の理由</h4>
        <p>${escapeHtml(question.explanation)}</p>
        <h4>試験対策として覚える周辺知識</h4>
        ${renderRelatedKnowledge(question)}
      </div>
      ${renderSource(question)}
    </article>
  `;
};

const renderResult = (currentSession: SessionSnapshot): string => {
  const selectedQuestions = getSelectedQuestions(currentSession);
  if (!selectedQuestions) {
    return renderFatal(
      "結果を表示できません",
      "保存された問題が現在の問題データに存在しません。",
    );
  }

  const result = calculateResult(selectedQuestions, currentSession.answers);
  const filteredQuestions = getFilteredQuestions(
    selectedQuestions,
    currentSession.answers,
    resultFilter,
  );

  return `
    <main class="app-shell result-shell">
      ${renderHeader()}
      ${renderNotice()}
      <section class="result-hero" aria-labelledby="result-title">
        <p class="eyebrow">RESULT</p>
        <h1 id="result-title">演習結果</h1>
        <p>今回の演習を振り返り、要復習の問題を確認しましょう。</p>
        <div class="score-panel">
          <span class="score-label">正答率</span>
          <strong>${result.percentage.toFixed(1)}<small>%</small></strong>
        </div>
      </section>
      <section class="stats-grid" aria-label="結果の内訳">
        <div class="stat-card stat-correct"><span>正解</span><strong>${result.correct}</strong></div>
        <div class="stat-card stat-incorrect"><span>不正解</span><strong>${result.incorrect}</strong></div>
        <div class="stat-card stat-unknown"><span>要復習（？）</span><strong>${result.unknown}</strong></div>
        <div class="stat-card stat-unanswered"><span>未回答</span><strong>${result.unanswered}</strong></div>
      </section>
      <section class="review-section" aria-labelledby="review-title">
        <div class="section-heading review-title-row">
          <div>
            <h2 id="review-title">問題別レビュー</h2>
            <p>正解・不正解・要復習の状態を確認できます。</p>
          </div>
          <div class="filter-group" role="group" aria-label="レビューの絞り込み">
            ${(["all", "incorrect", "unknown"] as const)
              .map(
                (filter) => `
                  <button
                    class="filter-button ${resultFilter === filter ? "is-selected" : ""}"
                    type="button"
                    data-action="filter"
                    data-filter="${filter}"
                    aria-pressed="${resultFilter === filter}"
                  >
                    ${filter === "all" ? "すべて" : filter === "incorrect" ? "不正解" : "？"}
                  </button>
                `,
              )
              .join("")}
          </div>
        </div>
        ${
          filteredQuestions.length > 0
            ? filteredQuestions
                .map((question) => renderReviewItem(question, currentSession))
                .join("")
            : '<p class="empty-state">この条件に該当する問題はありません。</p>'
        }
      </section>
      <div class="button-row result-actions">
        <button class="secondary-button" type="button" data-action="go-home">トップへ戻る</button>
        <button class="primary-button" type="button" data-action="start" data-count="${selectedQuestions.length}">
          もう一度挑戦
        </button>
      </div>
      <footer class="footer">
        <p>この正答率は学習用の指標であり、公式試験の合否判定ではありません。</p>
      </footer>
    </main>
  `;
};

function renderFatal(title: string, message: string): string {
  return `
    <main class="app-shell">
      ${renderHeader()}
      <section class="fatal-card" role="alert">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(message)}</p>
        <button class="primary-button" type="button" data-action="go-home">トップへ戻る</button>
      </section>
    </main>
  `;
}

const render = (): void => {
  if (screen === "home") {
    app.innerHTML = renderHome();
  } else if (screen === "list") {
    app.innerHTML = renderQuestionList();
  } else if (screen === "quiz" && session) {
    app.innerHTML = renderQuiz(session);
  } else if (screen === "result" && session) {
    app.innerHTML = renderResult(session);
  } else {
    app.innerHTML = renderFatal(
      "画面を表示できません",
      "演習状態が見つかりません。トップ画面からやり直してください。",
    );
  }
};

const persist = (): void => {
  if (!session) {
    return;
  }
  try {
    saveSession(session);
    storageNotice = "";
  } catch (error) {
    storageNotice =
      error instanceof SessionStorageError
        ? error.message
        : "学習状態を保存できませんでした。";
  }
};

const parseChoiceAnswer = (value: string | undefined): Answer | null => {
  if (value === "unknown") {
    return "unknown";
  }
  if (value === "0" || value === "1" || value === "2" || value === "3") {
    return Number(value) as 0 | 1 | 2 | 3;
  }
  return null;
};

const startQuiz = (count: number): void => {
  if (session?.status === "in-progress") {
    const confirmed = window.confirm(
      "現在の演習を破棄して、新しい演習を開始しますか？",
    );
    if (!confirmed) {
      return;
    }
  }

  try {
    const selected = selectQuestions(questions, count);
    session = createSession(selected);
    screen = "quiz";
    resultFilter = "all";
    notice = "";
    persist();
  } catch (error) {
    notice =
      error instanceof Error
        ? error.message
        : "演習を開始できませんでした。";
  }
  render();
};

const clearSavedSession = (): void => {
  try {
    clearSession();
    session = null;
    storageNotice = "";
    notice = "保存データを削除しました。";
  } catch (error) {
    notice =
      error instanceof SessionStorageError
        ? error.message
        : "保存データを削除できませんでした。";
  }
  render();
};

app.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const button = target.closest<HTMLButtonElement>("button[data-action]");
  if (!button || button.disabled) {
    return;
  }

  const action = button.dataset.action;
  if (action === "start") {
    const count = Number(button.dataset.count);
    if (Number.isInteger(count)) {
      startQuiz(count);
    }
    return;
  }

  if (action === "resume" && session?.status === "in-progress") {
    screen = "quiz";
    notice = "";
    render();
    return;
  }

  if (action === "clear-saved") {
    if (window.confirm("保存済みの演習データを削除しますか？")) {
      clearSavedSession();
    }
    return;
  }

  if (action === "go-home") {
    if (screen === "quiz" && session?.status === "in-progress") {
      const confirmed = window.confirm(
        "演習を中断しますか？進捗は保存され、後から再開できます。",
      );
      if (!confirmed) {
        return;
      }
      persist();
    }
    screen = "home";
    notice = "";
    render();
    return;
  }

  if (action === "question-list") {
    screen = "list";
    notice = "";
    render();
    return;
  }

  if (!session || screen !== "quiz") {
    if (action === "filter" && screen === "result") {
      const filter = button.dataset.filter;
      if (filter === "all" || filter === "incorrect" || filter === "unknown") {
        resultFilter = filter;
        render();
      }
    }
    return;
  }

  const selectedQuestions = getSelectedQuestions(session);
  if (!selectedQuestions) {
    screen = "home";
    notice =
      "保存された問題が現在の問題データに存在しません。新しい演習を開始してください。";
    render();
    return;
  }

  const currentQuestion = selectedQuestions[session.currentIndex];
  if (!currentQuestion) {
    screen = "home";
    notice = "現在の問題位置が不正です。新しい演習を開始してください。";
    render();
    return;
  }

  if (action === "answer") {
    const answer = parseChoiceAnswer(button.dataset.answer);
    if (answer !== null) {
      session.answers[currentQuestion.id] = answer;
      notice = "";
      persist();
      render();
    }
    return;
  }

  if (action === "previous" && session.currentIndex > 0) {
    session.currentIndex -= 1;
    notice = "";
    persist();
    render();
    return;
  }

  if (
    action === "next" &&
    session.currentIndex < selectedQuestions.length - 1
  ) {
    session.currentIndex += 1;
    notice = "";
    persist();
    render();
    return;
  }

  if (action === "go-question") {
    const index = Number(button.dataset.index);
    if (Number.isInteger(index) && index >= 0 && index < selectedQuestions.length) {
      session.currentIndex = index;
      notice = "";
      persist();
      render();
    }
    return;
  }

  if (action === "submit") {
    if (!allAnswered(selectedQuestions, session.answers)) {
      notice = "未回答の問題があります。すべて回答してから提出してください。";
      render();
      return;
    }
    if (!window.confirm("回答を提出して結果を表示しますか？")) {
      return;
    }
    session.status = "completed";
    session.completedAt = new Date().toISOString();
    screen = "result";
    notice = "";
    resultFilter = "all";
    persist();
    render();
  }
});

render();
