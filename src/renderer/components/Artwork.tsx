import { Disc3 } from "lucide-react";
import { cn } from "../lib/utils";

interface ArtworkProps {
  src?: string;
  alt: string;
  className?: string;
}

export function Artwork({ src, alt, className }: ArtworkProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          "shrink-0 rounded-[7px] object-cover shadow-[0_9px_22px_rgba(0,0,0,0.28)] ring-1 ring-white/14",
          className,
        )}
        draggable={false}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-[7px] bg-[radial-gradient(120%_90%_at_18%_12%,rgb(42,74,107)_0%,rgb(20,38,59)_42%,rgb(8,21,33)_100%)] text-white/48 shadow-[0_9px_22px_rgba(0,0,0,0.28),inset_0_0_0_1px_rgba(255,255,255,0.1)]",
        className,
      )}
      aria-label={alt}
    >
      <Disc3 size={28} />
    </div>
  );
}
