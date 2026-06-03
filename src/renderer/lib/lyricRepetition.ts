export type RepetitionCategory = "word" | "phrase" | "line";

export interface RepetitionPart {
  text: string;
  category?: RepetitionCategory;
}

export interface RepetitionNode {
  type: "text" | "break";
  text?: string;
}

export const REPETITION_CATEGORIES: Array<{
  id: RepetitionCategory;
  label: string;
}> = [
  { id: "word", label: "Words" },
  { id: "phrase", label: "Phrases" },
  { id: "line", label: "Lines" },
];

interface TokenOccurrence {
  nodeIndex: number;
  start: number;
  end: number;
  lineIndex: number;
  normal: string;
}

interface LyricLine {
  text: string;
  tokens: TokenOccurrence[];
  ranges: Array<{
    nodeIndex: number;
    start: number;
    end: number;
  }>;
}

const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)?/gu;
const PHRASE_LENGTHS = [4, 3, 2] as const;
const REPETITION_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "been",
  "being",
  "but",
  "by",
  "for",
  "from",
  "in",
  "is",
  "of",
  "on",
  "or",
  "the",
  "to",
  "was",
  "were",
  "with",
]);

export function annotateLyricRepetition(
  nodes: RepetitionNode[],
): Record<number, RepetitionPart[]> {
  const textNodes = nodes.map((node) => (node.type === "text" ? node.text ?? "" : ""));
  const marks = textNodes.map((text) =>
    Array<RepetitionCategory | undefined>(text.length).fill(undefined),
  );
  const lines = collectLines(nodes);
  const allTokens = lines.flatMap((line) => line.tokens);

  markRepeatedLines(lines, marks);
  markRepeatedPhrases(lines, marks);
  markRepeatedWords(allTokens, marks);

  return Object.fromEntries(
    textNodes.map((text, index) => [index, buildParts(text, marks[index])]),
  );
}

function collectLines(nodes: RepetitionNode[]): LyricLine[] {
  const lines: LyricLine[] = [createLine()];

  nodes.forEach((node, nodeIndex) => {
    if (node.type === "break") {
      lines.push(createLine());
      return;
    }

    const text = node.text ?? "";
    const line = lines[lines.length - 1];
    line.text += text;

    if (text.length > 0) {
      line.ranges.push({
        nodeIndex,
        start: 0,
        end: text.length,
      });
    }

    for (const match of text.matchAll(WORD_PATTERN)) {
      const start = match.index ?? 0;
      line.tokens.push({
        nodeIndex,
        start,
        end: start + match[0].length,
        lineIndex: lines.length - 1,
        normal: normalizeWord(match[0]),
      });
    }
  });

  return lines;
}

function createLine(): LyricLine {
  return {
    text: "",
    tokens: [],
    ranges: [],
  };
}

function markRepeatedLines(
  lines: LyricLine[],
  marks: Array<Array<RepetitionCategory | undefined>>,
): void {
  const lineCounts = new Map<string, number>();

  for (const line of lines) {
    const key = normalizeLine(line);
    if (!key) continue;
    lineCounts.set(key, (lineCounts.get(key) ?? 0) + 1);
  }

  lines.forEach((line) => {
    const key = normalizeLine(line);
    if (!key || (lineCounts.get(key) ?? 0) < 2) return;

    for (const range of line.ranges) {
      markRange(marks, range.nodeIndex, range.start, range.end, "line");
    }
  });
}

function markRepeatedPhrases(
  lines: LyricLine[],
  marks: Array<Array<RepetitionCategory | undefined>>,
): void {
  const phraseOccurrences = new Map<string, TokenOccurrence[][]>();

  for (const line of lines) {
    for (const length of PHRASE_LENGTHS) {
      if (line.tokens.length < length) continue;

      for (let index = 0; index <= line.tokens.length - length; index += 1) {
        const phraseTokens = line.tokens.slice(index, index + length);
        if (!isMeaningfulPhrase(phraseTokens)) continue;

        const key = phraseTokens.map((token) => token.normal).join(" ");
        const occurrences = phraseOccurrences.get(key) ?? [];
        occurrences.push(phraseTokens);
        phraseOccurrences.set(key, occurrences);
      }
    }
  }

  for (const length of PHRASE_LENGTHS) {
    for (const occurrences of phraseOccurrences.values()) {
      if (occurrences.length < 2 || occurrences[0]?.length !== length) continue;

      for (const occurrence of occurrences) {
        if (occurrence.some((token) => isMarked(marks, token))) continue;
        for (const token of occurrence) {
          markRange(marks, token.nodeIndex, token.start, token.end, "phrase");
        }
      }
    }
  }
}

function markRepeatedWords(
  tokens: TokenOccurrence[],
  marks: Array<Array<RepetitionCategory | undefined>>,
): void {
  const wordCounts = new Map<string, number>();

  for (const token of tokens) {
    if (!isMeaningfulWord(token.normal)) continue;
    wordCounts.set(token.normal, (wordCounts.get(token.normal) ?? 0) + 1);
  }

  for (const token of tokens) {
    if ((wordCounts.get(token.normal) ?? 0) < 2 || isMarked(marks, token)) {
      continue;
    }
    markRange(marks, token.nodeIndex, token.start, token.end, "word");
  }
}

function buildParts(
  text: string,
  marks: Array<RepetitionCategory | undefined>,
): RepetitionPart[] {
  if (!text) return [{ text }];

  const parts: RepetitionPart[] = [];
  let start = 0;
  let currentCategory = marks[0];

  for (let index = 1; index <= text.length; index += 1) {
    const nextCategory = marks[index];
    if (nextCategory === currentCategory && index < text.length) continue;

    parts.push({
      text: text.slice(start, index),
      category: currentCategory,
    });
    start = index;
    currentCategory = nextCategory;
  }

  return parts;
}

function normalizeLine(line: LyricLine): string {
  if (/^\s*\[[^\]]+\]\s*$/.test(line.text)) return "";
  return line.tokens.map((token) => token.normal).filter(Boolean).join(" ");
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/’/g, "'");
}

function isMeaningfulPhrase(tokens: TokenOccurrence[]): boolean {
  return tokens.some((token) => isMeaningfulWord(token.normal));
}

function isMeaningfulWord(word: string): boolean {
  if (!word || REPETITION_STOP_WORDS.has(word)) return false;
  return word.length > 2 || /^(i|me|my|we|us|you|no)$/.test(word);
}

function isMarked(
  marks: Array<Array<RepetitionCategory | undefined>>,
  token: TokenOccurrence,
): boolean {
  return marks[token.nodeIndex]?.slice(token.start, token.end).some(Boolean) ?? false;
}

function markRange(
  marks: Array<Array<RepetitionCategory | undefined>>,
  nodeIndex: number,
  start: number,
  end: number,
  category: RepetitionCategory,
): void {
  const nodeMarks = marks[nodeIndex];
  if (!nodeMarks) return;

  for (let index = start; index < end; index += 1) {
    nodeMarks[index] = category;
  }
}
