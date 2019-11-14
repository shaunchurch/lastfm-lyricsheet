// Native
import { join } from "path";
import { format } from "url";

// Packages
import { BrowserWindow, app, ipcMain, IpcMainEvent } from "electron";
import isDev from "electron-is-dev";
import prepareNext from "electron-next";
import Store from "electron-store";
const store = new Store();

// Prepare the renderer once the app is ready
app.on("ready", async () => {
  await prepareNext("./renderer");

  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      preload: join(__dirname, "preload.js")
    }
  });

  const url = isDev
    ? "http://localhost:8000/"
    : format({
        pathname: join(__dirname, "../renderer/index.html"),
        protocol: "file:",
        slashes: true
      });

  mainWindow.loadURL(url);
});

// Quit the app once all windows are closed
app.on("window-all-closed", app.quit);

ipcMain.on("req-settings", (event: IpcMainEvent, message: any) => {
  event.reply("rec-settings", store.get("settings"));
  console.log(message);
});

ipcMain.on("save-settings", (event: IpcMainEvent, message: any) => {
  try {
    console.log("Saving settings...", message);
    store.set("settings", message);
  } catch (e) {
    console.error(e);
    event.reply("save-settings", e);
  }
});
