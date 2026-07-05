import type { Track, WindowMode } from "@/shared/types";
import { cn } from "../lib/utils";
import { Artwork } from "./Artwork";

interface TrackCardProps {
  track?: Track;
  mode: WindowMode;
  subtitle: string;
}

export function TrackCard({ track, mode, subtitle }: TrackCardProps) {
  const compact = mode === "compact";
  const content = (
    <>
      <Artwork
        src={track?.artworkUrl}
        alt={track ? `${track.name} artwork` : "Album artwork"}
        className="h-12 w-12"
      />
      <div className={cn("min-w-0", compact ? "pr-24" : "pr-[148px]")}>
        <h1 className="truncate text-[15.5px] font-semibold leading-[22px] text-white/96">
          {track?.name || "Waiting for Last.fm"}
        </h1>
        <p className="truncate text-[12.5px] leading-[18px] text-white/56">
          {subtitle}
        </p>
      </div>
    </>
  );

  const className = cn(
    "grid w-full grid-cols-[48px_minmax(0,1fr)] items-center gap-3 text-left",
    compact ? "px-4 py-3" : "px-4 pb-3 pt-[13px]",
  );

  return (
    <header className={className}>
      {content}
    </header>
  );
}
