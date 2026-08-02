import type { BrowserWindow, IpcMainInvokeEvent } from "electron";

export function assertTrustedMainWindowSender(
  event: IpcMainInvokeEvent,
  mainWindow: BrowserWindow,
  expectedRendererUrl: string,
): void {
  const expectedWebContents = mainWindow.webContents;
  const isTrusted =
    !mainWindow.isDestroyed() &&
    event.sender === expectedWebContents &&
    event.sender.id === expectedWebContents.id &&
    event.senderFrame === expectedWebContents.mainFrame &&
    event.senderFrame.url === expectedRendererUrl &&
    expectedWebContents.getURL() === expectedRendererUrl;

  if (!isTrusted) {
    throw new Error("Rejected IPC request from an untrusted sender.");
  }
}
