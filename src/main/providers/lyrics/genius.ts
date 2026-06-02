import * as cheerio from "cheerio";
import type {
  LyricsCandidate,
  LyricsProvider,
  LyricsResult,
  Settings,
  Track,
} from "@/shared/types";
import {
  normalizeComparable,
  sanitizeLyricsHtml,
  stripTrackExtras,
} from "../../sanitize";

interface GeniusHit {
  result?: {
    primary_artist?: {
      name?: string;
    };
    artist_names?: string;
    full_title?: string;
    title?: string;
    url?: string;
  };
}

interface GeniusSearchResponse {
  response?: {
    hits?: GeniusHit[];
  };
}

export class GeniusLyricsProvider implements LyricsProvider {
  id = "genius";
  name = "Genius";

  async search(track: Track, settings: Settings): Promise<LyricsCandidate[]> {
    if (!settings.geniusAccessToken) {
      throw new Error("Genius access token is required");
    }

    const query = `${track.artist} ${stripTrackExtras(track.name)}`;
    const url = new URL("https://api.genius.com/search");
    url.searchParams.set("q", query);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${settings.geniusAccessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Genius search returned ${response.status}`);
    }

    const payload = (await response.json()) as GeniusSearchResponse;
    const hits = payload.response?.hits ?? [];

    return hits
      .map((hit) => toCandidate(hit, track, this.id, this.name))
      .filter((candidate): candidate is LyricsCandidate => Boolean(candidate))
      .sort((a, b) => b.score - a.score);
  }

  async fetch(candidate: LyricsCandidate): Promise<LyricsResult> {
    const response = await fetch(candidate.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) LyricSheet/0.2",
      },
    });

    if (!response.ok) {
      throw new Error(`Genius lyrics returned ${response.status}`);
    }

    const page = await response.text();
    const $ = cheerio.load(page);
    const containers = $('[data-lyrics-container="true"]');
    const html =
      containers.length > 0
        ? containers
            .map((_, element) => $(element).html() || "")
            .get()
            .join("<br>")
        : $(".lyrics").html() || "";
    const sanitized = sanitizeLyricsHtml(html);

    if (!sanitized) {
      throw new Error("No lyrics found on Genius page");
    }

    return {
      providerId: this.id,
      providerName: this.name,
      html: sanitized,
      sourceUrl: candidate.url,
      fetchedAt: new Date().toISOString(),
    };
  }
}

function toCandidate(
  hit: GeniusHit,
  track: Track,
  providerId: string,
  providerName: string,
): LyricsCandidate | undefined {
  const result = hit.result;
  if (!result?.url || !result.title) return undefined;

  const artist =
    result.primary_artist?.name || result.artist_names || "Unknown artist";
  const title = result.title;

  return {
    providerId,
    providerName,
    artist,
    title,
    url: result.url,
    score: scoreCandidate(track, title, artist, result.full_title || ""),
  };
}

function scoreCandidate(
  track: Track,
  candidateTitle: string,
  candidateArtist: string,
  fullTitle: string,
): number {
  const wantedTitle = normalizeComparable(stripTrackExtras(track.name));
  const wantedArtist = normalizeComparable(track.artist);
  const title = normalizeComparable(candidateTitle);
  const artist = normalizeComparable(candidateArtist);
  const full = normalizeComparable(fullTitle);

  let score = 0;
  if (title === wantedTitle) score += 60;
  if (title.includes(wantedTitle) || wantedTitle.includes(title)) score += 25;
  if (artist === wantedArtist) score += 35;
  if (artist.includes(wantedArtist) || wantedArtist.includes(artist)) score += 20;
  if (full.includes(wantedTitle)) score += 10;
  if (/translation|romanized|live|cover|remix/.test(full)) score -= 20;

  return score;
}
