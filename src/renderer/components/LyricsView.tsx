import { ExternalLink, Highlighter, RefreshCw, Repeat2 } from "lucide-react";
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import type { LyricsState, ProviderStatus, Track } from "@/shared/types";
import {
  annotateLyricRepetition,
  REPETITION_CATEGORIES,
  type RepetitionCategory,
  type RepetitionPart,
} from "../lib/lyricRepetition";
import {
  annotateLyricSyntax,
  SYNTAX_CATEGORIES,
  type SyntaxCategory,
  type SyntaxPart,
} from "../lib/lyricSyntax";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

type LyricsDisplayMode = "plain" | "syntax" | "repetition";

type LyricsNode =
  | {
      type: "text";
      text: string;
      section?: boolean;
    }
  | {
      type: "break";
    };

type SyntaxPartsByNode = Record<number, SyntaxPart[]>;
type RepetitionPartsByNode = Record<number, RepetitionPart[]>;

const ALL_SYNTAX_CATEGORY_IDS = SYNTAX_CATEGORIES.map((category) => category.id);
const ALL_REPETITION_CATEGORY_IDS = REPETITION_CATEGORIES.map(
  (category) => category.id,
);

interface LyricsViewProps {
  track?: Track;
  lyrics: LyricsState;
  providerStatus: ProviderStatus;
  onOpenSource(url: string): void;
  onRetry(): void;
}

export function LyricsView({
  track,
  lyrics,
  providerStatus,
  onOpenSource,
  onRetry,
}: LyricsViewProps) {
  const [displayMode, setDisplayMode] = useState<LyricsDisplayMode>("plain");
  const [visibleSyntaxCategories, setVisibleSyntaxCategories] = useState(
    () => new Set(ALL_SYNTAX_CATEGORY_IDS),
  );
  const [visibleRepetitionCategories, setVisibleRepetitionCategories] = useState(
    () => new Set(ALL_REPETITION_CATEGORY_IDS),
  );

  function toggleSyntaxCategory(category: SyntaxCategory) {
    setVisibleSyntaxCategories((currentCategories) =>
      getNextFocusedCategorySet(
        currentCategories,
        category,
        ALL_SYNTAX_CATEGORY_IDS,
      ),
    );
  }

  function toggleRepetitionCategory(category: RepetitionCategory) {
    setVisibleRepetitionCategories((currentCategories) =>
      getNextFocusedCategorySet(
        currentCategories,
        category,
        ALL_REPETITION_CATEGORY_IDS,
      ),
    );
  }

  if (!track) {
    if (providerStatus.nowPlaying === "error") {
      return (
        <StatePanel
          title="Last.fm unavailable"
          detail={providerStatus.error || "Unable to read your current track"}
        />
      );
    }

    return (
      <StatePanel
        title={
          providerStatus.nowPlaying === "connecting"
            ? "Connecting to Last.fm"
            : "Waiting for Last.fm"
        }
        detail={
          providerStatus.nowPlaying === "connecting"
            ? "Checking your recent tracks"
            : "Listening for your current track"
        }
      />
    );
  }

  if (lyrics.status === "loading") {
    return (
      <StatePanel
        title="Looking up lyrics"
        detail={`${track.artist} · ${track.name}`}
        loading
      />
    );
  }

  if (lyrics.status === "error" || lyrics.status === "not-found") {
    return (
      <StatePanel
        title={lyrics.status === "not-found" ? "Lyrics not found" : "Lyrics unavailable"}
        detail={lyrics.error || `${track.artist} · ${track.name}`}
        onRetry={onRetry}
      />
    );
  }

  if (!lyrics.html) {
    return (
      <StatePanel
        title="Waiting for lyrics"
        detail={`${track.artist} · ${track.name}`}
      />
    );
  }

  const syntaxActive = displayMode === "syntax";
  const repetitionActive = displayMode === "repetition";

  return (
    <section className="app-no-drag relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <LyricsBody
        html={lyrics.html}
        displayMode={displayMode}
        visibleSyntaxCategories={visibleSyntaxCategories}
        visibleRepetitionCategories={visibleRepetitionCategories}
      />
      {syntaxActive && (
        <div className="legend-rail" aria-label="Syntax legend">
          <div className="syntax-legend">
            {SYNTAX_CATEGORIES.map((category) => {
              const visible = visibleSyntaxCategories.has(category.id);

              return (
                <button
                  key={category.id}
                  type="button"
                  className={cn(
                    "syntax-legend-item",
                    getSyntaxClass(category.id),
                    !visible && "syntax-legend-item-hidden",
                  )}
                  aria-pressed={visible}
                  title={getFilterTitle(
                    category,
                    visibleSyntaxCategories,
                    ALL_SYNTAX_CATEGORY_IDS,
                  )}
                  onClick={() => toggleSyntaxCategory(category.id)}
                >
                  <span className="syntax-legend-dot" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {repetitionActive && (
        <div className="legend-rail" aria-label="Repetition legend">
          <div className="syntax-legend">
            {REPETITION_CATEGORIES.map((category) => {
              const visible = visibleRepetitionCategories.has(category.id);

              return (
                <button
                  key={category.id}
                  type="button"
                  className={cn(
                    "syntax-legend-item",
                    getRepetitionClass(category.id),
                    !visible && "syntax-legend-item-hidden",
                  )}
                  aria-pressed={visible}
                  title={getFilterTitle(
                    category,
                    visibleRepetitionCategories,
                    ALL_REPETITION_CATEGORY_IDS,
                  )}
                  onClick={() => toggleRepetitionCategory(category.id)}
                >
                  <span className="syntax-legend-dot" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="source-footer">
        {lyrics.sourceUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="default"
            className="source-link h-auto min-w-0 justify-start px-0 text-left text-[12px] font-normal leading-[16.5px]"
            onClick={() => lyrics.sourceUrl && onOpenSource(lyrics.sourceUrl)}
          >
            <ExternalLink size={12} className="shrink-0" />
            <span className="truncate">{formatSourceLabel(lyrics.sourceUrl)}</span>
          </Button>
        ) : (
          <span className="source-spacer" aria-hidden="true" />
        )}
        <div className="display-controls">
          <div className="syntax-mode-switch" aria-label="Lyric display mode">
            <button
              type="button"
              className={cn(
                "syntax-mode-button",
                displayMode === "plain" && "syntax-mode-button-active",
              )}
              aria-pressed={displayMode === "plain"}
              onClick={() => setDisplayMode("plain")}
            >
              Plain
            </button>
            <button
              type="button"
              className={cn(
                "syntax-mode-button",
                syntaxActive && "syntax-mode-button-active",
              )}
              aria-pressed={syntaxActive}
              title="Syntax colors"
              onClick={() => setDisplayMode("syntax")}
            >
              <Highlighter size={12} />
              Syntax
            </button>
            <button
              type="button"
              className={cn(
                "syntax-mode-button",
                repetitionActive && "syntax-mode-button-active",
              )}
              aria-pressed={repetitionActive}
              title="Repetition lens"
              onClick={() => setDisplayMode("repetition")}
            >
              <Repeat2 size={12} />
              Repeat
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function getNextFocusedCategorySet<T extends string>(
  currentCategories: ReadonlySet<T>,
  category: T,
  allCategories: T[],
): Set<T> {
  if (areAllCategoriesVisible(currentCategories, allCategories)) {
    return new Set([category]);
  }

  if (currentCategories.has(category) && currentCategories.size === 1) {
    return new Set(allCategories);
  }

  const nextCategories = new Set(currentCategories);
  if (nextCategories.has(category)) {
    nextCategories.delete(category);
  } else {
    nextCategories.add(category);
  }
  return nextCategories;
}

function areAllCategoriesVisible<T extends string>(
  categories: ReadonlySet<T>,
  allCategories: T[],
): boolean {
  return (
    categories.size === allCategories.length &&
    allCategories.every((category) => categories.has(category))
  );
}

function getFilterTitle<T extends string>(
  category: { id: T; label: string },
  visibleCategories: ReadonlySet<T>,
  allCategories: T[],
): string {
  const label = category.label.toLowerCase();

  if (areAllCategoriesVisible(visibleCategories, allCategories)) {
    return `Show only ${label}`;
  }

  if (!visibleCategories.has(category.id)) {
    return `Add ${label}`;
  }

  if (visibleCategories.size === 1) {
    return "Show all categories";
  }

  return `Hide ${label}`;
}

function LyricsBody({
  html,
  displayMode,
  visibleSyntaxCategories,
  visibleRepetitionCategories,
}: {
  html: string;
  displayMode: LyricsDisplayMode;
  visibleSyntaxCategories: ReadonlySet<SyntaxCategory>;
  visibleRepetitionCategories: ReadonlySet<RepetitionCategory>;
}) {
  const nodes = useMemo(() => parseLyricsHtml(html), [html]);
  const syntaxActive = displayMode === "syntax";
  const repetitionActive = displayMode === "repetition";
  const [syntaxPartsByNode, setSyntaxPartsByNode] = useState<SyntaxPartsByNode>(
    {},
  );
  const repetitionPartsByNode = useMemo<RepetitionPartsByNode>(
    () => (repetitionActive ? annotateLyricRepetition(nodes) : {}),
    [nodes, repetitionActive],
  );

  useEffect(() => {
    if (!syntaxActive) return;

    let cancelled = false;
    setSyntaxPartsByNode({});
    const textNodes = nodes
      .map((node, index) => ({ node, index }))
      .filter(
        (entry): entry is { node: Extract<LyricsNode, { type: "text" }>; index: number } =>
          entry.node.type === "text",
      );

    void Promise.all(
      textNodes.map(async ({ node, index }) => [
        index,
        await annotateLyricSyntax(node.text),
      ] as const),
    ).then((entries) => {
      if (cancelled) return;
      setSyntaxPartsByNode(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [nodes, syntaxActive]);

  return (
    <div
      className={cn(
        "lyrics-scroll min-h-0 flex-1 overflow-y-auto px-[18px] pb-0 pt-1 text-left text-[14.5px] font-[450] leading-[22px] text-white/76",
        syntaxActive && "lyrics-scroll-syntax",
        repetitionActive && "lyrics-scroll-repetition",
      )}
    >
      {nodes.map((node, index) => {
        if (node.type === "break") {
          return <br key={`break-${index}`} />;
        }

        if (node.section) {
          return (
            <span key={`section-${index}`} className="lyrics-section-label">
              {formatSectionLabel(node.text)}
            </span>
          );
        }

        if (displayMode === "plain") {
          return <Fragment key={`text-${index}`}>{node.text}</Fragment>;
        }

        if (repetitionActive) {
          return (
            <Fragment key={`repetition-${index}`}>
              {renderRepetitionParts(
                repetitionPartsByNode[index] ?? [{ text: node.text }],
                `repetition-${index}`,
                visibleRepetitionCategories,
              )}
            </Fragment>
          );
        }

        return (
          <Fragment key={`syntax-${index}`}>
            {renderSyntaxParts(
              syntaxPartsByNode[index] ?? [{ text: node.text }],
              `syntax-${index}`,
              visibleSyntaxCategories,
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function renderRepetitionParts(
  parts: RepetitionPart[],
  keyPrefix: string,
  visibleRepetitionCategories: ReadonlySet<RepetitionCategory>,
): ReactNode {
  return parts.map((part, index) => {
    if (!part.category || !visibleRepetitionCategories.has(part.category)) {
      return <Fragment key={`${keyPrefix}-plain-${index}`}>{part.text}</Fragment>;
    }

    return (
      <span
        key={`${keyPrefix}-${part.category}-${index}`}
        className={cn(
          "syntax-token",
          "repetition-token",
          getRepetitionClass(part.category),
        )}
      >
        {part.text}
      </span>
    );
  });
}

function renderSyntaxParts(
  parts: SyntaxPart[],
  keyPrefix: string,
  visibleSyntaxCategories: ReadonlySet<SyntaxCategory>,
): ReactNode {
  return parts.map((part, index) => {
    if (!part.category || !visibleSyntaxCategories.has(part.category)) {
      return <Fragment key={`${keyPrefix}-plain-${index}`}>{part.text}</Fragment>;
    }

    return (
      <span
        key={`${keyPrefix}-${part.category}-${index}`}
        className={cn("syntax-token", getSyntaxClass(part.category))}
      >
        {part.text}
      </span>
    );
  });
}

function parseLyricsHtml(html: string): LyricsNode[] {
  const document = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = document.body.firstElementChild;
  const nodes: LyricsNode[] = [];

  if (!root) return nodes;

  root.childNodes.forEach((node) => visitLyricsNode(node, nodes));
  return normalizeLyricsNodes(nodes);
}

function visitLyricsNode(node: ChildNode, nodes: LyricsNode[]): void {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.textContent) {
      nodes.push({
        type: "text",
        text: node.textContent,
        section: isSectionLabel(node.textContent),
      });
    }
    return;
  }

  if (node.nodeName.toLowerCase() === "br") {
    nodes.push({ type: "break" });
    return;
  }

  node.childNodes.forEach((child) => visitLyricsNode(child, nodes));
}

function normalizeLyricsNodes(nodes: LyricsNode[]): LyricsNode[] {
  const normalized: LyricsNode[] = [];

  for (const node of nodes) {
    if (node.type === "break") {
      const previous = normalized.at(-1);
      const beforePrevious = normalized.at(-2);
      if (previous?.type === "break" && beforePrevious?.type === "break") {
        continue;
      }
      normalized.push(node);
      continue;
    }

    if (node.section) {
      while (
        normalized.at(-1)?.type === "break" &&
        normalized.at(-2)?.type === "break"
      ) {
        normalized.pop();
      }
    }

    normalized.push(node);
  }

  return normalized;
}

function getSyntaxClass(category: SyntaxCategory): string {
  return `syntax-${category}`;
}

function getRepetitionClass(category: RepetitionCategory): string {
  return `repetition-${category}`;
}

function isSectionLabel(text: string): boolean {
  return /^\[[^\]]+\]$/.test(text.trim());
}

function formatSectionLabel(text: string): string {
  return text.trim().replace(/^\[([^\]]+)\]$/, "$1");
}

function formatSourceLabel(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname}`.replace(
      /\/$/,
      "",
    );
  } catch {
    return url;
  }
}

function StatePanel({
  title,
  detail,
  loading = false,
  onRetry,
}: {
  title: string;
  detail: string;
  loading?: boolean;
  onRetry?: () => void;
}) {
  return (
    <section className="app-no-drag flex min-h-0 flex-1 flex-col overflow-hidden px-[18px] pb-4 pt-[18px]">
      <div className="grid gap-2">
        <p className="text-[13px] font-semibold leading-5 text-white/74">{title}</p>
        <p className="truncate text-[12px] leading-[18px] text-white/42">{detail}</p>
      </div>
      <div className="mt-7 grid gap-3">
        <div className="skeleton-block h-3 w-11/12 rounded-full opacity-55" />
        <div className="skeleton-block h-3 w-full rounded-full opacity-45" />
        <div className="skeleton-block h-3 w-4/5 rounded-full opacity-40" />
        {loading && (
          <>
            <div className="skeleton-block h-3 w-10/12 rounded-full opacity-35" />
            <div className="skeleton-block h-3 w-8/12 rounded-full opacity-30" />
          </>
        )}
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="subtle"
          className="mt-auto w-fit bg-white/8 text-white/72 hover:bg-white/12"
          onClick={onRetry}
        >
          <RefreshCw size={15} />
          Retry
        </Button>
      )}
    </section>
  );
}
