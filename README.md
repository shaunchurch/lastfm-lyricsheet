# Last.fm Lyric Sheet

A tiny always-on desktop lyric sheet for the song you're currently scrobbling to Last.fm.

![Lyric Sheet](https://i.imgur.com/Ckhqb83.png)

## Develop

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm package
pnpm make
```

`pnpm make` creates a macOS ZIP by default. Use `pnpm make:dmg` on a local machine
or CI runner that supports `hdiutil` disk image creation.

## Setup

LyricSheet currently needs:

- Last.fm API key
- Last.fm username
- Genius access token for search

Lyrics are still fetched locally by scraping the matched Genius page.
