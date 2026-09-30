import { QUESTION_SOURCE_TYPES, type Question } from "./types";

const DATE_PATTERN = /^\d{4}-\d{2}(-\d{2})?$/;

export const validateQuestions = (items: readonly Question[]): string[] => {
  const issues: string[] = [];
  const ids = new Set<string>();

  if (items.length < 60) {
    issues.push(`問題数が${items.length}問です。60問以上登録してください。`);
  }

  items.forEach((item, index) => {
    const label = `問題${index + 1} (${item.id || "IDなし"})`;

    if (!item.id.trim()) {
      issues.push(`${label}: idが空です。`);
    } else if (ids.has(item.id)) {
      issues.push(`${label}: idが重複しています。`);
    } else {
      ids.add(item.id);
    }

    if (!item.category.trim()) {
      issues.push(`${label}: categoryが空です。`);
    }
    if (!item.question.trim()) {
      issues.push(`${label}: questionが空です。`);
    }
    if (
      item.choices.length !== 4 ||
      item.choices.some((choice) => !choice.trim())
    ) {
      issues.push(`${label}: choicesは空でない4択で指定してください。`);
    }
    if (![0, 1, 2, 3].includes(item.answerIndex)) {
      issues.push(`${label}: answerIndexは0〜3で指定してください。`);
    }
    if (!item.explanation.trim()) {
      issues.push(`${label}: explanationが空です。`);
    }
    if (
      item.relatedKnowledge.length === 0 ||
      item.relatedKnowledge.some((knowledge) => !knowledge.trim())
    ) {
      issues.push(`${label}: relatedKnowledgeを1つ以上指定してください。`);
    }
    if (!QUESTION_SOURCE_TYPES.includes(item.source.type)) {
      issues.push(`${label}: source.typeが不正です。`);
    }
    if (!item.source.title.trim()) {
      issues.push(`${label}: source.titleが空です。`);
    }
    try {
      const url = new URL(item.source.url);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        issues.push(`${label}: source.urlはHTTP(S) URLにしてください。`);
      }
    } catch {
      issues.push(`${label}: source.urlが不正です。`);
    }
    if (!DATE_PATTERN.test(item.source.accessedAt)) {
      issues.push(`${label}: source.accessedAtはYYYY-MM-DD形式にしてください。`);
    }
    if (!DATE_PATTERN.test(item.reviewedAt)) {
      issues.push(`${label}: reviewedAtはYYYY-MM-DD形式にしてください。`);
    }
  });

  return issues;
};
