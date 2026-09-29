export const QUESTION_SOURCE_TYPES = [
  "official-syllabus",
  "official-example",
  "third-party-mock",
  "original",
] as const;

export type QuestionSourceType = (typeof QUESTION_SOURCE_TYPES)[number];
export type Answer = 0 | 1 | 2 | 3 | "unknown" | null;
export type ReviewFilter = "all" | "incorrect" | "unknown";
export type SessionStatus = "in-progress" | "completed";

export type QuestionSource = {
  type: QuestionSourceType;
  title: string;
  publishedAt?: string;
  questionNumber?: string;
  url: string;
  accessedAt: string;
};

export type Question = {
  id: string;
  category: string;
  question: string;
  choices: readonly [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
  explanation: string;
  relatedKnowledge: readonly string[];
  source: QuestionSource;
  syllabusVersion?: string;
  reviewedAt: string;
};

export type SessionSnapshot = {
  version: 1;
  status: SessionStatus;
  questionIds: string[];
  answers: Record<string, Answer>;
  currentIndex: number;
  questionCount: number;
  startedAt: string;
  completedAt?: string;
};

export type QuestionStatus =
  | "unanswered"
  | "unknown"
  | "correct"
  | "incorrect";

export type QuizResult = {
  correct: number;
  incorrect: number;
  unknown: number;
  unanswered: number;
  percentage: number;
};
