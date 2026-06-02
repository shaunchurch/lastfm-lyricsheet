import type {
  NowPlayingHandlers,
  NowPlayingProvider,
  Settings,
  Track,
} from "@/shared/types";
import { getTrackKey } from "../../sanitize";

interface LastFmImage {
  "#text"?: string;
  size?: string;
}

interface LastFmTrack {
  "@attr"?: {
    nowplaying?: string;
  };
  artist?: {
    "#text"?: string;
    name?: string;
    mbid?: string;
  };
  album?: {
    "#text"?: string;
  };
  image?: LastFmImage[];
  date?: {
    uts?: string;
    "#text"?: string;
  };
  name?: string;
  mbid?: string;
  url?: string;
}

interface LastFmResponse {
  error?: number;
  message?: string;
  recenttracks?: {
    track?: LastFmTrack | LastFmTrack[];
  };
}

export class LastFmRecentTracksProvider implements NowPlayingProvider {
  id = "lastfm";
  name = "Last.fm";

  private timer: NodeJS.Timeout | undefined;
  private lastTrackKey = "";
  private settings: Settings | undefined;
  private handlers: NowPlayingHandlers | undefined;

  start(settings: Settings, handlers: NowPlayingHandlers): void {
    this.stop();
    this.settings = settings;
    this.handlers = handlers;
    this.handlers.onStatus("connecting");
    void this.poll();
    this.timer = setInterval(
      () => void this.poll(),
      settings.pollIntervalSeconds * 1000,
    );
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.lastTrackKey = "";
  }

  private async poll(): Promise<void> {
    if (!this.settings || !this.handlers) return;

    try {
      const url = new URL("https://ws.audioscrobbler.com/2.0/");
      url.searchParams.set("method", "user.getrecenttracks");
      url.searchParams.set("user", this.settings.lastfmUsername);
      url.searchParams.set("api_key", this.settings.lastfmApiKey);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "2");

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Last.fm returned ${response.status}`);
      }

      const payload = (await response.json()) as LastFmResponse;
      if (payload.error) {
        throw new Error(payload.message || `Last.fm error ${payload.error}`);
      }

      const rawTracks = payload.recenttracks?.track;
      const rawTrack = Array.isArray(rawTracks) ? rawTracks[0] : rawTracks;
      if (!rawTrack) {
        this.handlers.onStatus("listening");
        return;
      }

      const track = mapTrack(rawTrack);
      const nextTrackKey = `${getTrackKey(track)}:${track.nowPlaying ? "now" : "last"}:${track.playedAt ?? ""}`;

      this.handlers.onStatus("listening");
      if (nextTrackKey !== this.lastTrackKey) {
        this.lastTrackKey = nextTrackKey;
        this.handlers.onTrack(track);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to read Last.fm";
      this.handlers?.onStatus("error");
      this.handlers?.onError(message);
    }
  }
}

function mapTrack(rawTrack: LastFmTrack): Track {
  const name = rawTrack.name?.trim() || "Unknown track";
  const artist =
    rawTrack.artist?.["#text"]?.trim() ||
    rawTrack.artist?.name?.trim() ||
    "Unknown artist";
  const album = rawTrack.album?.["#text"]?.trim() || "";
  const artworkUrl =
    rawTrack.image
      ?.map((image) => image["#text"]?.trim() || "")
      .filter(Boolean)
      .at(-1) || "";
  const nowPlaying = rawTrack["@attr"]?.nowplaying === "true";
  const playedAt = rawTrack.date?.uts
    ? new Date(Number(rawTrack.date.uts) * 1000).toISOString()
    : undefined;

  return {
    id: `${artist}:${name}:${rawTrack.mbid || playedAt || "now"}`,
    name,
    artist,
    album,
    artworkUrl,
    lastfmUrl: rawTrack.url,
    mbid: rawTrack.mbid,
    nowPlaying,
    playedAt,
  };
}
