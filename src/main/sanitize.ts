import sanitizeHtml from "sanitize-html";
import type { Track } from "@/shared/types";

export function stripTrackExtras(name: string): string {
  return name
    .toLowerCase()
    .replace(/\((live|remaster(?:ed)?|mono|stereo|explicit|clean|radio edit)\)/gi, "")
    .replace(/\[(live|remaster(?:ed)?|mono|stereo|explicit|clean|radio edit)\]/gi, "")
    .split(" - ")[0]
    .trim();
}

export function normalizeForKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getTrackKey(track: Pick<Track, "artist" | "name">): string {
  return `${normalizeForKey(track.artist)}:${normalizeForKey(stripTrackExtras(track.name))}`;
}

export function sanitizeLyricsHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["br", "em", "i", "strong"],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  })
    .replace(/\s*<br\s*\/?>\s*/gi, "<br>")
    .replace(/(<br>){3,}/gi, "<br><br>")
    .trim();
}

export function normalizeComparable(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
