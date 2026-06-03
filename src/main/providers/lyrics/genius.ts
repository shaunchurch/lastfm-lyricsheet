import { gunzipSync } from "node:zlib";
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

const MIN_CANDIDATE_SCORE = 50;

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
      .filter((candidate) => candidate.score >= MIN_CANDIDATE_SCORE)
      .sort((a, b) => b.score - a.score);
  }

  async fetch(candidate: LyricsCandidate): Promise<LyricsResult> {
    const response = await fetch(candidate.url, {
      headers: {
        Accept: "text/html",
        "Accept-Encoding": "identity",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) LyricSheet/0.2",
      },
    });

    if (!response.ok) {
      throw new Error(`Genius lyrics returned ${response.status}`);
    }

    const page = await readResponseText(response);
    const sanitized = extractGeniusLyrics(page);

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

function extractGeniusLyrics(page: string): string {
  const $ = cheerio.load(page);
  const containers = $('[data-lyrics-container="true"]');

  if (containers.length === 0) {
    return sanitizeLyricsHtml($(".lyrics").html() || "");
  }

  return containers
    .map((_, element) => {
      const container = $(element).clone();
      container.find('[data-exclude-from-selection="true"]').remove();
      return sanitizeLyricsHtml(container.html() || "");
    })
    .get()
    .filter(Boolean)
    .join("<br><br>");
}

async function readResponseText(response: Response): Promise<string> {
  const body = Buffer.from(await response.arrayBuffer());

  if (isGzip(body)) {
    return gunzipSync(body).toString("utf8");
  }

  return body.toString("utf8");
}

function isGzip(body: Buffer): boolean {
  return body.length >= 2 && body[0] === 0x1f && body[1] === 0x8b;
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
    result.artist_names || result.primary_artist?.name || "Unknown artist";
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
  const titleMatches =
    title === wantedTitle ||
    title.includes(wantedTitle) ||
    wantedTitle.includes(title) ||
    full.includes(wantedTitle);
  const artistMatches =
    artist === wantedArtist ||
    artist.includes(wantedArtist) ||
    wantedArtist.includes(artist) ||
    full.includes(wantedArtist);

  if (!titleMatches || !artistMatches) return 0;

  let score = 0;
  if (title === wantedTitle) score += 60;
  if (title.includes(wantedTitle) || wantedTitle.includes(title)) score += 25;
  if (artist === wantedArtist) score += 35;
  if (artist.includes(wantedArtist) || wantedArtist.includes(artist)) score += 20;
  if (full.includes(wantedTitle)) score += 10;
  if (full.includes(wantedArtist)) score += 10;
  if (/translation|romanized|live|cover|remix/.test(full)) score -= 20;

  return score;
}
