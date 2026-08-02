import { contextBridge, ipcRenderer } from "electron";

import {
  SYSTEM_GET_APP_INFO_CHANNEL,
  type SdjDesktopApi,
} from "../shared/contracts";

const desktopApi: SdjDesktopApi = Object.freeze({
  system: Object.freeze({
    getAppInfo: () => ipcRenderer.invoke(SYSTEM_GET_APP_INFO_CHANNEL),
  }),
});

contextBridge.exposeInMainWorld("sdj", desktopApi);
