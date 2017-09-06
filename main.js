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
    vibrancy: 'dark',
    webPreferences: {
      scrollBounce: true
    }
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
const PouchDB = require('pouchdb');
const sanitizeHtml = require('sanitize-html');

const genius = new Genius(config.geniusClientAccessToken);
const lastfm = new LastFmNode({
  api_key: config.lastfmApiKey,
  secret: config.lastfmSecret,
  useragent: 'choon/v0.1.0 Choon'
});
const xray = Xray();
const lastfmStream = lastfm.stream(config.lastfmUsername);
const errorMsg = "We can't find that one. Sorry!";

// database
const db = new PouchDB(app.getPath('userData'));

db.info().then(info => {
  console.log(info);
  mainWindow.webContents.send('db-info', info);
});

ipcMain.on('synchronous-message', (event, arg) => {
  event.returnValue = 'pong';
});

const handleStreamingTrack = track => {
  if (typeof track === 'undefined') return updateWindow(errorMsg, {});
  if (!track.artist || !track.name) return updateWindow(errorMsg, {});
  track.artist = track.artist['#text']; // dmo
  track.backgroundImage = getBackgroundImage(track);
  track.release = getReleaseName(track);
  const query = `${track.artist} ${stripExtras(track.name)}`;
  console.log('Searching for', query);
  genius.search(query).then(res => {
    let url = res.hits.length > 0 ? res.hits[0].result.url : null;
    if (!url) return updateWindow(errorMsg, track);
    let geniusId = res.hits[0].result.id;
    console.log('Scraping', url);
    xray(url, '.lyrics@html')((err, body) => {
      if (err) return updateWindow(errorMsg, track);
      console.log('Ok.');
      updateWindow(body, track);
      if (geniusId) {
        saveToDatabase(geniusId, url, track, body);
      }
    });
  });
};

const updateWindow = (body, track) => {
  mainWindow.webContents.send('new-track', {
    lyrics: body,
    artist: track.artist,
    title: track.name,
    release: track.release,
    backgroundImage: track.backgroundImage
  });
};

const saveToDatabase = (geniusId, url, track, body) => {
  const lyric = {
    _id: '' + geniusId + '',
    artist: track.artist,
    release: track.release,
    title: track.name,
    lyric: sanitizeLyric(body),
    url: url,
    backgroundImage: track.backgroundImage
  };
  db
    .put(lyric)
    .then(function() {
      console.log(`Saved ${track.name} to db.`);
    })
    .catch(function(err) {
      if (err.name === 'conflict') {
        console.log(`${track.name} is already in the database.`);
      } else {
        console.log('There was an error', err);
      }
    });
  db.info().then(info => {
    mainWindow.webContents.send('db-info', info.doc_count);
  });
};

const getBackgroundImage = track => {
  if (!track.image || !track.image.length) return '';
  const image = track.image[track.image.length - 1]['#text'];
  return image;
};

const getReleaseName = track => {
  if (!track.album) return '';
  return track.album['#text'];
};

const stripExtras = name => {
  return name
    .toLowerCase()
    .replace('(live)', '')
    .split('-')[0];
};

const sanitizeLyric = lyric => {
  return sanitizeHtml(lyric, {
    allowedTags: ['em']
  }).trim();
};

// hook up to last fm
lastfmStream.on('nowPlaying', handleStreamingTrack);

lastfmStream.on('lastPlayed', function(track) {
  console.log('Last played: ' + track.name);
});

lastfmStream.on('nowPlaying', function(track) {
  console.log('Now playing: ' + track.name);
});

lastfmStream.on('scrobbled', function(track) {
  console.log('Scrobbled: ' + track.name);
});

lastfmStream.on('stoppedPlaying', function(track) {
  console.log('Stopped playing: ' + track.name);
});

lastfmStream.on('error', function(error) {
  console.log('Error: ' + error.message);
});

lastfmStream.start();
