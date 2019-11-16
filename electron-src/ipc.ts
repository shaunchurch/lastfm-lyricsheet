import { ipcMain, IpcMainEvent } from "electron";
import Store from "electron-store";
import Settings from "../interfaces/Settings";

const store = new Store();

export function ipc(onLoadedSettings: Function) {
  ipcMain.on("req-settings", (event: IpcMainEvent) => {
    const settings = store.get("settings");
    event.reply("res-settings", settings);
    onLoadedSettings(settings);
  });

  ipcMain.on("req-save-settings", (event: IpcMainEvent, settings: Settings) => {
    try {
      store.set("settings", settings);
      onLoadedSettings(settings);
    } catch (e) {
      console.error(e);
      event.reply("res-save-settings-error", e);
    }
  });

  return ipcMain;
}
