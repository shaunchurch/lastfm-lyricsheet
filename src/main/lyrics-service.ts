import type { LyricsProvider, LyricsResult, Settings, Track } from "@/shared/types";
import { getCachedLyrics, setCachedLyrics } from "./store";
import { getTrackKey } from "./sanitize";
import { GeniusLyricsProvider } from "./providers/lyrics/genius";

const providers: LyricsProvider[] = [new GeniusLyricsProvider()];

export async function findLyrics(
  track: Track,
  settings: Settings,
  options: { bypassCache?: boolean } = {},
): Promise<LyricsResult & { cached?: boolean }> {
  const trackKey = getTrackKey(track);

  if (!options.bypassCache) {
    const cached = getCachedLyrics(trackKey);
    if (cached) {
      return {
        ...cached,
        cached: true,
      };
    }
  }

  for (const provider of providers) {
    const candidates = await provider.search(track, settings);

    for (const candidate of candidates.slice(0, 5)) {
      try {
        const result = await provider.fetch(candidate);
        setCachedLyrics(trackKey, result);
        return result;
      } catch (error) {
        console.warn("Lyrics candidate failed", candidate.url, error);
      }
    }
  }

  throw new Error("Lyrics not found");
}
