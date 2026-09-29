import type {
  Answer,
  Question,
  QuestionStatus,
  QuizResult,
  SessionSnapshot,
} from "./types";

export const QUIZ_COUNTS = [10, 30, 50] as const;

type RandomFunction = () => number;

export const shuffle = <T>(
  items: readonly T[],
  random: RandomFunction = Math.random,
): T[] => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
};

export const selectQuestions = (
  items: readonly Question[],
  count: number,
  random: RandomFunction = Math.random,
): Question[] => {
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error("出題数は1問以上の整数で指定してください。");
  }
  if (count > items.length) {
    throw new Error(
      `出題数${count}問に対して、問題が${items.length}問しかありません。`,
    );
  }

  const grouped = new Map<string, Question[]>();
  for (const item of shuffle(items, random)) {
    const categoryItems = grouped.get(item.category) ?? [];
    categoryItems.push(item);
    grouped.set(item.category, categoryItems);
  }

  const categories = shuffle([...grouped.keys()], random);
  const selected: Question[] = [];
  while (selected.length < count) {
    for (const category of categories) {
      const categoryItems = grouped.get(category);
      if (!categoryItems || categoryItems.length === 0) {
        continue;
      }
      const next = categoryItems.shift();
      if (next) {
        selected.push(next);
      }
      if (selected.length === count) {
        break;
      }
    }
  }

  return shuffle(selected, random);
};

export const createSession = (
  selectedQuestions: readonly Question[],
  now = new Date(),
): SessionSnapshot => {
  if (selectedQuestions.length === 0) {
    throw new Error("問題を1問以上選択してください。");
  }

  return {
    version: 1,
    status: "in-progress",
    questionIds: selectedQuestions.map((item) => item.id),
    answers: Object.fromEntries(
      selectedQuestions.map((item) => [item.id, null as Answer]),
    ),
    currentIndex: 0,
    questionCount: selectedQuestions.length,
    startedAt: now.toISOString(),
  };
};

export const getQuestionStatus = (
  question: Question,
  answer: Answer,
): QuestionStatus => {
  if (answer === null) {
    return "unanswered";
  }
  if (answer === "unknown") {
    return "unknown";
  }
  return answer === question.answerIndex ? "correct" : "incorrect";
};

export const calculateResult = (
  selectedQuestions: readonly Question[],
  answers: Readonly<Record<string, Answer>>,
): QuizResult => {
  let correct = 0;
  let incorrect = 0;
  let unknown = 0;
  let unanswered = 0;

  for (const question of selectedQuestions) {
    const status = getQuestionStatus(question, answers[question.id] ?? null);
    if (status === "correct") {
      correct += 1;
    } else if (status === "incorrect") {
      incorrect += 1;
    } else if (status === "unknown") {
      unknown += 1;
    } else {
      unanswered += 1;
    }
  }

  const percentage =
    selectedQuestions.length === 0
      ? 0
      : Number(((correct / selectedQuestions.length) * 100).toFixed(1));

  return { correct, incorrect, unknown, unanswered, percentage };
};

export const allAnswered = (
  selectedQuestions: readonly Question[],
  answers: Readonly<Record<string, Answer>>,
): boolean =>
  selectedQuestions.every(
    (question) => (answers[question.id] ?? null) !== null,
  );

export const getFilteredQuestions = (
  selectedQuestions: readonly Question[],
  answers: Readonly<Record<string, Answer>>,
  filter: "all" | "incorrect" | "unknown",
): Question[] =>
  selectedQuestions.filter((question) => {
    const status = getQuestionStatus(question, answers[question.id] ?? null);
    return (
      filter === "all" ||
      (filter === "incorrect" && status === "incorrect") ||
      (filter === "unknown" && status === "unknown")
    );
  });
