/// <reference types="next" />
/// <reference types="next/types/global" />

import { IpcRenderer } from "electron";

declare global {
  namespace NodeJS {
    interface Global {
      ipcRenderer: IpcRenderer;
    }
  }
}

import "styled-components";

// and extend them!
declare module "styled-components" {
  export interface DefaultTheme {
    foreground: string;
    background: string;
    fontFamily: string;
    padding: number;
    radius: number;
  }
}
