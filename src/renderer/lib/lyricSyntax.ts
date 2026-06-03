export type SyntaxCategory =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "determiner"
  | "preposition"
  | "conjunction"
  | "question"
  | "expression"
  | "number"
  | "section"
  | "other";

export interface SyntaxPart {
  text: string;
  category?: SyntaxCategory;
}

export const SYNTAX_CATEGORIES: Array<{
  id: SyntaxCategory;
  label: string;
}> = [
  { id: "noun", label: "Nouns" },
  { id: "verb", label: "Verbs" },
  { id: "adjective", label: "Adjectives" },
  { id: "adverb", label: "Adverbs" },
  { id: "pronoun", label: "Pronouns" },
  { id: "determiner", label: "Determiners" },
  { id: "preposition", label: "Prepositions" },
  { id: "conjunction", label: "Conjunctions" },
  { id: "question", label: "Questions" },
  { id: "expression", label: "Expressions" },
  { id: "number", label: "Numbers" },
  { id: "section", label: "Sections" },
  { id: "other", label: "Other" },
];

interface TaggedDoc {
  terms?: TaggedTerm[];
}

interface TaggedTerm {
  text: string;
  tags?: string[];
  normal?: string;
  switch?: string;
  offset?: {
    start: number;
    length: number;
  };
}

interface HiddenRange {
  start: number;
  end: number;
}

type NlpTagger = typeof import("compromise/two").default;

let nlpTaggerPromise: Promise<NlpTagger> | undefined;

export async function annotateLyricSyntax(text: string): Promise<SyntaxPart[]> {
  if (!text.trim()) return [{ text }];

  const nlp = await loadNlpTagger();
  const docs = nlp(text).json({
    offset: true,
    terms: {
      normal: true,
      offset: true,
      tags: true,
      text: true,
    },
  }) as TaggedDoc[];
  const terms = docs
    .flatMap((doc) => doc.terms ?? [])
    .filter((term): term is TaggedTerm & { offset: NonNullable<TaggedTerm["offset"]> } =>
      Boolean(term.offset),
    )
    .sort((a, b) => a.offset.start - b.offset.start);
  const hiddenRanges = findSectionLabelRanges(text);
  const parts: SyntaxPart[] = [];
  let cursor = 0;
  let previousTerm: TaggedTerm | undefined;

  for (const term of terms) {
    const start = term.offset.start;
    const end = start + term.offset.length;
    if (start < cursor) continue;

    if (start > cursor) {
      parts.push({ text: text.slice(cursor, start) });
    }

    const termText = text.slice(start, end);
    const category = isInHiddenRange(start, end, hiddenRanges)
      ? "section"
      : getSyntaxCategory(term, previousTerm);

    parts.push({ text: termText, category });
    cursor = end;
    previousTerm = term;
  }

  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor) });
  }

  return parts.length > 0 ? parts : [{ text }];
}

function loadNlpTagger(): Promise<NlpTagger> {
  nlpTaggerPromise ??= import("compromise/two").then((module) => module.default);
  return nlpTaggerPromise;
}

function getSyntaxCategory(
  term: TaggedTerm,
  previousTerm?: TaggedTerm,
): SyntaxCategory | undefined {
  const tags = new Set(term.tags ?? []);

  if (tags.has("Verb") || shouldTreatAsVerb(term, previousTerm)) return "verb";
  if (tags.has("Pronoun")) return "pronoun";
  if (tags.has("Noun") || tags.has("ProperNoun")) return "noun";
  if (tags.has("Adjective")) return "adjective";
  if (tags.has("Adverb")) return "adverb";
  if (tags.has("Determiner")) return "determiner";
  if (tags.has("Preposition") || tags.has("Particle")) return "preposition";
  if (tags.has("Conjunction")) return "conjunction";
  if (tags.has("QuestionWord")) return "question";
  if (tags.has("Expression")) return "expression";
  if (tags.has("Value") || tags.has("NumericValue")) return "number";

  return "other";
}

function shouldTreatAsVerb(
  term: TaggedTerm,
  previousTerm?: TaggedTerm,
): boolean {
  if (!term.switch?.includes("Verb") || !previousTerm?.tags) return false;

  const previousTags = new Set(previousTerm.tags);
  const canLeadVerb =
    previousTags.has("Noun") ||
    previousTags.has("ProperNoun") ||
    previousTags.has("Pronoun");

  if (!canLeadVerb) return false;

  return /(?:s|ed|ing)$/i.test(term.text) || term.switch.includes("Plural|Verb");
}

function findSectionLabelRanges(text: string): HiddenRange[] {
  const matches = text.matchAll(/\[[^\]]+\]/g);
  return Array.from(matches, (match) => ({
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }));
}

function isInHiddenRange(
  start: number,
  end: number,
  ranges: HiddenRange[],
): boolean {
  return ranges.some((range) => start >= range.start && end <= range.end);
}
