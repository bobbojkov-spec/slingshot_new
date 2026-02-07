import type { Language } from "@/lib/i18n/LanguageContext";

export interface ListingSEOInput {
  language: Language;
  heroTitle?: string;
  heroSubtitle?: string;
  weightedTokens?: Array<{ value: string; score: number }>;
  collectionNames?: string[];
  categoryNames?: string[];
  menuGroupNames?: string[];
  tags?: string[];
  productTypes?: string[];
  productNames?: string[];
  brand?: string;
  fallbackTitle: string;
  fallbackDescription: string;
  siteName?: string;
}

export interface ListingSEOOutput {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
}

const truncate = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trim() + "...";
};

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const cleanToken = (value: string) => value.replace(/\s+/g, " ").trim();

const scoreWeightedTokens = (input: ListingSEOInput) => {
  const weighted: Array<{ value: string; score: number }> = [];

  const pushTokens = (values: string[] | undefined, score: number) => {
    if (!values) return;
    values.filter(Boolean).forEach((value) => weighted.push({ value: cleanToken(value), score }));
  };

  if (input.heroTitle) weighted.push({ value: cleanToken(input.heroTitle), score: 9 });
  if (input.heroSubtitle) weighted.push({ value: cleanToken(input.heroSubtitle), score: 8 });
  if (input.weightedTokens) {
    input.weightedTokens
      .filter((item) => item.value)
      .forEach((item) => weighted.push({ value: cleanToken(item.value), score: item.score }));
  }
  pushTokens(input.collectionNames, 9);
  pushTokens(input.categoryNames, 9);
  pushTokens(input.menuGroupNames, 7);
  pushTokens(input.tags, 6);
  pushTokens(input.productTypes, 5);
  if (input.brand) weighted.push({ value: cleanToken(input.brand), score: 4 });
  pushTokens(input.productNames, 2);

  return weighted;
};

const topTokens = (weighted: Array<{ value: string; score: number }>, limit: number, minScore = 4) => {
  const sorted = weighted
    .filter((item) => item.value && item.score >= minScore)
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of sorted) {
    const key = item.value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item.value);
    if (result.length >= limit) break;
  }

  return result;
};

export const generateListingSEO = (input: ListingSEOInput): ListingSEOOutput => {
  const weighted = scoreWeightedTokens(input);
  const primaryTokens = topTokens(weighted, 3, 6);
  const secondaryTokens = topTokens(weighted, 6, 4);
  const keywordTokens = topTokens(weighted, 10, 2);

  const siteName = input.siteName || "Slingshot Bulgaria";

  const titleParts = unique([
    ...primaryTokens,
    siteName,
  ]).filter(Boolean);

  const descriptionParts = unique([
    input.heroSubtitle || input.fallbackDescription,
    ...secondaryTokens,
  ]).filter(Boolean);

  const title = truncate(titleParts.join(" | ") || input.fallbackTitle, 60);
  const description = truncate(descriptionParts.join(". "), 160);
  const keywords = unique(keywordTokens).join(", ");

  return {
    title,
    description: description || truncate(input.fallbackDescription, 160),
    keywords,
    ogTitle: title,
    ogDescription: description || truncate(input.fallbackDescription, 200),
  };
};