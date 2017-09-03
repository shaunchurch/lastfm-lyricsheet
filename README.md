# Last.fm Lyric Sheet

A tiny app to display lyrics for the song you're currently scrobbling to last.fm.

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/shaunchurch/lastfm-lyric-sheet
# Go into the repository
cd lastfm-lyric-sheet
# Install dependencies
npm install
# Config
cp config.sample.json config.json - fill in api keys
# Run the app
npm start
```

## Build app commands

macOS: `electron-packager . LyricSheet --platform=darwin --out=./build --overwrite`
