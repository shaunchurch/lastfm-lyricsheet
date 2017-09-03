// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// In renderer process (web page).
const { ipcRenderer } = require('electron');
console.log(ipcRenderer.sendSync('synchronous-message', 'ping')); // prints "pong"

ipcRenderer.on('new-track', (event, arg) => {
  window.document.body.innerHTML = '';
  window.document.body.innerHTML =
    '<strong>' +
    arg.artist +
    ' - ' +
    arg.title +
    '</strong><br />' +
    arg.lyrics +
    '<br /><small>' +
    new Date(Date.now()).toLocaleString() +
    '</small>';
  window.document.title = arg.artist + ' - ' + arg.title + ' lyrics';
  var anchors = document.getElementsByTagName('a');
  for (var i = 0; i < anchors.length; i++) {
    anchors[i].onclick = function() {
      return false;
    };
  }
});
ipcRenderer.send('asynchronous-message', 'ping');
