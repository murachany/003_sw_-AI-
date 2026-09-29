import type { Answer, SessionSnapshot } from "./types";

export const STORAGE_KEY = "genai-passport-quiz-session";
export const STORAGE_VERSION = 1;

export class SessionStorageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "SessionStorageError";
  }
}

export type SessionLoadResult = {
  session: SessionSnapshot | null;
  error?: string;
};

const isAnswer = (value: unknown): value is Answer =>
  value === null ||
  value === "unknown" ||
  value === 0 ||
  value === 1 ||
  value === 2 ||
  value === 3;

export const parseSession = (raw: string | null): SessionLoadResult => {
  if (raw === null) {
    return { session: null };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { session: null, error: "保存データの形式が不正です。" };
    }

    const candidate = parsed as Partial<SessionSnapshot>;
    if (
      candidate.version !== STORAGE_VERSION ||
      (candidate.status !== "in-progress" && candidate.status !== "completed") ||
      !Array.isArray(candidate.questionIds) ||
      candidate.questionIds.some((id) => typeof id !== "string") ||
      typeof candidate.answers !== "object" ||
      candidate.answers === null ||
      typeof candidate.currentIndex !== "number" ||
      !Number.isInteger(candidate.currentIndex) ||
      typeof candidate.questionCount !== "number" ||
      !Number.isInteger(candidate.questionCount) ||
      typeof candidate.startedAt !== "string"
    ) {
      return {
        session: null,
        error:
          "保存データのバージョンまたは形式が対応していません。新しい演習を開始してください。",
      };
    }

    if (
      candidate.questionCount !== candidate.questionIds.length ||
      candidate.currentIndex < 0 ||
      candidate.currentIndex >= candidate.questionCount
    ) {
      return {
        session: null,
        error: "保存データの問題数または現在位置が不正です。",
      };
    }

    const answers = candidate.answers as Record<string, unknown>;
    for (const questionId of candidate.questionIds) {
      if (!isAnswer(answers[questionId])) {
        return {
          session: null,
          error: "保存データの回答状態が不正です。",
        };
      }
    }

    return { session: candidate as SessionSnapshot };
  } catch (error) {
    return {
      session: null,
      error:
        error instanceof SyntaxError
          ? "保存データを読み込めません。新しい演習を開始してください。"
          : "保存データの読み込みに失敗しました。",
    };
  }
};

const getBrowserStorage = (): Storage => {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new SessionStorageError(
      "このブラウザでは学習状態を保存できません。ブラウザの設定を確認してください。",
    );
  }
  return window.localStorage;
};

export const loadSession = (): SessionLoadResult => {
  const storage = getBrowserStorage();
  try {
    return parseSession(storage.getItem(STORAGE_KEY));
  } catch (error) {
    if (error instanceof SessionStorageError) {
      throw error;
    }
    throw new SessionStorageError(
      "学習状態の読み込みに失敗しました。ブラウザの保存領域を確認してください。",
      { cause: error },
    );
  }
};

export const saveSession = (session: SessionSnapshot): void => {
  const storage = getBrowserStorage();
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    throw new SessionStorageError(
      "学習状態を保存できませんでした。ブラウザの保存領域を確認してください。",
      { cause: error },
    );
  }
};

export const clearSession = (): void => {
  const storage = getBrowserStorage();
  try {
    storage.removeItem(STORAGE_KEY);
  } catch (error) {
    throw new SessionStorageError(
      "保存済みの学習状態を削除できませんでした。",
      { cause: error },
    );
  }
};
