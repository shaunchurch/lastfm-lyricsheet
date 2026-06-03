const assert = require("node:assert/strict");
const { gzipSync } = require("node:zlib");
const { afterEach, test } = require("node:test");

const {
  GeniusLyricsProvider,
} = require("../.cache/test-build/src/main/providers/lyrics/genius.js");

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

test("fetch removes Genius page chrome from the first lyrics container", async () => {
  global.fetch = async () =>
    new Response(
      `
        <div data-lyrics-container="true">
          <div data-exclude-from-selection="true">
            276 ContributorsTranslationsPortuguesPolskiDeutschCreep LyricsRead More
          </div>
          [Verse 1]<br>
          <a href="/annotation">When you were here before</a><br>
          Couldn't look you in the eye
        </div>
        <div data-lyrics-container="true"></div>
        <div data-lyrics-container="true">
          [Chorus]<br>
          <em>But I'm a creep</em>
        </div>
      `,
      { status: 200 },
    );

  const result = await new GeniusLyricsProvider().fetch(candidate());

  assert.equal(
    result.html,
    "[Verse 1]<br>When you were here before<br>Couldn't look you in the eye<br><br>[Chorus]<br><em>But I'm a creep</em>",
  );
});

test("fetch decodes unlabelled gzipped Genius HTML", async () => {
  global.fetch = async () =>
    new Response(
      gzipSync(`
        <!doctype html>
        <div data-lyrics-container="true">[Verse 1]<br>Real lyric line</div>
      `),
      { status: 200 },
    );

  const result = await new GeniusLyricsProvider().fetch(candidate());

  assert.equal(result.html, "[Verse 1]<br>Real lyric line");
});

test("search rejects title-only matches from another artist", async () => {
  global.fetch = async () =>
    new Response(
      JSON.stringify({
        response: {
          hits: [
            {
              result: {
                artist_names: "Wrong Artist",
                full_title: "Creep by Wrong Artist",
                primary_artist: { name: "Wrong Artist" },
                title: "Creep",
                url: "https://genius.com/wrong-artist-creep-lyrics",
              },
            },
            {
              result: {
                artist_names: "Radiohead",
                full_title: "Creep by Radiohead",
                primary_artist: { name: "Radiohead" },
                title: "Creep",
                url: "https://genius.com/Radiohead-creep-lyrics",
              },
            },
          ],
        },
      }),
      { status: 200 },
    );

  const results = await new GeniusLyricsProvider().search(
    {
      album: "Pablo Honey",
      artist: "Radiohead",
      artworkUrl: "",
      id: "track-1",
      name: "Creep",
      nowPlaying: true,
    },
    {
      alwaysOnTop: true,
      geniusAccessToken: "token",
      lastfmApiKey: "lastfm-key",
      lastfmUsername: "listener",
      pollIntervalSeconds: 10,
      windowMode: "expanded",
    },
  );

  assert.deepEqual(
    results.map((result) => result.url),
    ["https://genius.com/Radiohead-creep-lyrics"],
  );
});

function candidate() {
  return {
    artist: "Radiohead",
    providerId: "genius",
    providerName: "Genius",
    score: 100,
    title: "Creep",
    url: "https://genius.com/Radiohead-creep-lyrics",
  };
}
