import { ExternalLink, RefreshCw } from "lucide-react";
import type { LyricsState, Track } from "@/shared/types";
import { Button } from "./ui/button";

interface LyricsViewProps {
  track?: Track;
  lyrics: LyricsState;
  onOpenSource(url: string): void;
  onRetry(): void;
}

export function LyricsView({
  track,
  lyrics,
  onOpenSource,
  onRetry,
}: LyricsViewProps) {
  if (!track) {
    return <EmptyMessage title="Waiting for Last.fm" />;
  }

  if (lyrics.status === "loading") {
    return <EmptyMessage title="Looking up lyrics" />;
  }

  if (lyrics.status === "error" || lyrics.status === "not-found") {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-sm text-white/62">
          {lyrics.error || "Lyrics not found"}
        </p>
        <Button type="button" variant="subtle" onClick={onRetry}>
          <RefreshCw size={16} />
          Retry
        </Button>
      </div>
    );
  }

  if (!lyrics.html) {
    return <EmptyMessage title="Waiting for lyrics" />;
  }

  return (
    <section className="app-no-drag flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className="lyrics-scroll min-h-0 flex-1 overflow-y-auto px-[18px] pb-0 pt-[18px] text-left text-[14px] font-normal leading-[21px] text-white/72"
        dangerouslySetInnerHTML={{ __html: lyrics.html }}
      />
      {lyrics.sourceUrl && (
        <div className="flex shrink-0 items-center justify-start px-[18px] pb-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="default"
            className="h-auto min-w-0 justify-start px-0 text-left text-[12px] font-normal leading-[16.5px] text-white/40 hover:bg-transparent hover:text-white/62"
            onClick={() => lyrics.sourceUrl && onOpenSource(lyrics.sourceUrl)}
          >
            <ExternalLink size={12} className="shrink-0" />
            <span className="truncate">{formatSourceLabel(lyrics.sourceUrl)}</span>
          </Button>
        </div>
      )}
    </section>
  );
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

function EmptyMessage({ title }: { title: string }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center px-8 text-center text-sm text-white/58">
      {title}
    </div>
  );
}
