const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const url = require('url');

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 800,
    alwaysOnTop: false,
    transparent: true,
    toolbar: true,
    titleBarStyle: 'hidden',
    darkTheme: true,
    vibrancy: 'dark'
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // auto open dev tools
  // mainWindow.webContents.openDevTools();
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  app.quit(); // quit app, not just window
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow(); // create on dock click
  }
});

/**
 * Do the lyric thing with the example module globals
 */
const config = require('./config.json');
const Genius = require('genius-api');
const LastFmNode = require('lastfm').LastFmNode;
const Xray = require('x-ray');
const { ipcMain } = require('electron');

const genius = new Genius(config.geniusClientAccessToken);
const lastfm = new LastFmNode({
  api_key: config.lastfmApiKey,
  secret: config.lastfmSecret,
  useragent: 'choon/v0.1.0 Choon'
});
const xray = Xray();
const lastfmStream = lastfm.stream(config.lastfmUsername);
const errorMsg = "We can't find that one. Sorry!";

ipcMain.on('synchronous-message', (event, arg) => {
  event.returnValue = 'pong';
});

const handleStreamingTrack = track => {
  if (!track || !track.artist || !track.name) return updateWindow(errorMsg, {});
  track.artist = track.artist['#text']; // dmo
  track.backgroundImage = getBackgroundImage(track);
  const query = `${track.artist} ${track.name}`;
  console.log('Searching for', query);
  genius.search(query).then(res => {
    let url = res.hits.length > 0 ? res.hits[0].result.url : null;
    if (!url) return updateWindow(errorMsg, track);
    console.log('Scraping', url);
    xray(url, '.lyrics@html')((err, body) => {
      if (err) return updateWindow(errorMsg, track);
      console.log('Ok.');
      updateWindow(body, track);
    });
  });
};

const updateWindow = (body, track) => {
  mainWindow.webContents.send('new-track', {
    lyrics: body,
    artist: track.artist,
    title: track.name,
    backgroundImage: track.backgroundImage
  });
};

const getBackgroundImage = track => {
  if (!track.image || !track.image.length) return '';
  const image = track.image[track.image.length - 1]['#text'];
  return image;
};

// hook up to last fm
lastfmStream.on('nowPlaying', handleStreamingTrack);
lastfmStream.start();
