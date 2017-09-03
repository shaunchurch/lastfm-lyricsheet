const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const url = require('url');

let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 500,
    height: 750,
    alwaysOnTop: true,
    transparent: true,
    toolbar: true,
    titleBarStyle: 'hidden-inset'
  });

  // and load the index.html of the app.
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit(); // quit app, not just window
  }
});

app.on('activate', function() {
  if (mainWindow === null) {
    createWindow(); // create on dock click
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
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
const trackStream = lastfm.stream(config.lastfmUsername);
const errorMsg = "We can't find that one. Sorry!";

ipcMain.on('synchronous-message', (event, arg) => {
  event.returnValue = 'pong';
});

const handleStreamingTrack = track => {
  track.artist = track.artist['#text']; // dmo
  const query = `${track.artist} ${track.name}`;
  console.log('Searching for', query);
  genius.search(query).then(res => {
    let url = res.hits.length > 0 ? res.hits[0].result.url : null;
    if (!url) return updateWindow(errorMsg, track);
    console.log('Scraping', url);
    xray(url, '.lyrics@html')((err, body) => {
      if (err) return updateWindow(errorMsg, track);
      updateWindow(body, track);
    });
  });
};

const updateWindow = (body, track) => {
  mainWindow.webContents.send('new-track', {
    lyrics: body,
    artist: track.artist,
    title: track.name
  });
};

trackStream.on('nowPlaying', handleStreamingTrack);
trackStream.start();