// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// In renderer process (web page).
const { ipcRenderer } = require("electron");

console.log(ipcRenderer.sendSync("synchronous-message", "ping")); // prints "pong"

ipcRenderer.on("new-track", (event, arg) => {
  window.document.body.innerHTML = "";
  window.document.body.innerHTML =
    '<div class="background-art"></div>' +
    '<div class="background-gradient"></div>' +
    '<div class="lyric-body">' +
    '<img class="artwork" src="' +
    arg.backgroundImage +
    '" /><br />' +
    arg.artist +
    "<br /><em>" +
    arg.release +
    "</em>" +
    '<br /><strong class="title">' +
    arg.title +
    "</strong><br />" +
    arg.lyrics +
    "<br /><small>" +
    new Date(Date.now()).toLocaleString() +
    "</small>" +
    "</div>" +
    '<div id="dbrecords"></div>' +
    '<div class="footer">Words:&nbsp;<strong>' +
    arg.lyrics.split(" ").length +
    "</strong></div>";

  window.document.title = arg.artist + " - " + arg.title + " lyrics";

  // background image
  document.getElementsByClassName(
    "background-art"
  )[0].style.backgroundImage = `url(${arg.backgroundImage})`;

  // ignore anchors
  ignoreAnchors();

  // scroll to the top
  document.location.href = "#top";
});

const ignoreAnchors = () => {
  var anchors = document.getElementsByTagName("a");
  for (var i = 0; i < anchors.length; i++) {
    anchors[i].onclick = function() {
      // window.open(this.getAttribute('href'), '_blank');
      return false;
    };
  }
};

ipcRenderer.send("asynchronous-message", "ping");
