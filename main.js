const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
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

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

var Genius = require('genius-api');
var genius = new Genius('genius_api_key');

var LastFmNode = require('lastfm').LastFmNode;
var lastfm = new LastFmNode({
  api_key: 'api_key',
  secret: 'api_secret',
  useragent: 'choon/v0.1.0 Choon'
});

var Xray = require('x-ray');
var xray = Xray();

var trackStream = lastfm.stream('gigglesticks');

const { ipcMain } = require('electron');
ipcMain.on('asynchronous-message', (event, arg) => {
  // console.log(arg)  // prints "ping"
  event.sender.send('asynchronous-reply', 'ses');
});

ipcMain.on('synchronous-message', (event, arg) => {
  // console.log(arg)  // prints "ping"
  event.returnValue = 'sause';
});

trackStream.on('nowPlaying', function(track) {
  // console.log('Last played: ', track.name, track.artist['#text']);
  genius
    .search(track.name + ' ' + track.artist['#text'])
    .then(function(response) {
      // console.log('hits', response.hits[0]);

      xray(response.hits[0].result.url, '.lyrics@html')(function(err, body) {
        // console.log(track.artist['#text'], '-', track.name);
        // console.log(body) // google
        mainWindow.webContents.send('new-track', {
          lyrics: body,
          artist: track.artist['#text'],
          title: track.name
        });
      });
    });
});

trackStream.start();
