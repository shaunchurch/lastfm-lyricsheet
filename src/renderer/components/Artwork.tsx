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
        className={cn("shrink-0 rounded-[6px] object-cover", className)}
        draggable={false}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-[radial-gradient(120%_90%_at_18%_12%,rgb(42,74,107)_0%,rgb(20,38,59)_42%,rgb(8,21,33)_100%)] text-white/48 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
        className,
      )}
      aria-label={alt}
    >
      <Disc3 size={28} />
    </div>
  );
}
