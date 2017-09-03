var Genius = require('genius-api');
var genius = new Genius('genius_api_key');

var LastFmNode = require('lastfm').LastFmNode;
var lastfm = new LastFmNode({
  api_key: 'api_key',
  secret: 'api_seret',
  useragent: 'choon/v0.1.0 Choon'
});

var Xray = require('x-ray');
var xray = Xray();

var trackStream = lastfm.stream('gigglesticks');

const { ipcMain } = require('electron');
ipcMain.on('asynchronous-message', (event, arg) => {
  console.log(arg); // prints "ping"
  event.sender.send('asynchronous-reply', 'ses');
});

ipcMain.on('synchronous-message', (event, arg) => {
  console.log(arg); // prints "ping"
  event.returnValue = 'sause';
});

trackStream.on('nowPlaying', function(track) {
  // console.log('Last played: ', track.name, track.artist['#text']);
  genius
    .search(track.name + ' ' + track.artist['#text'])
    .then(function(response) {
      // console.log('hits', response.hits[0]);

      xray(response.hits[0].result.url, '.lyrics')(function(err, body) {
        console.log(track.artist['#text'], '-', track.name);
        console.log(body); // google
      });
    });
});

trackStream.start();

console.log(mainWindow);
