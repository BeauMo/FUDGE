import { Dirent } from "fs";

namespace DirectoryBrowser {
  import ƒ = FudgeCore;
  const ipcRenderer: Electron.IpcRenderer = require("electron").ipcRenderer;
  const remote: Electron.Remote = require("electron").remote;
  const { readdirSync } = require("fs");

  ipcRenderer.on("Open", (_event: Electron.IpcRendererEvent, _args: unknown[]) => {
    ƒ.Debug.log("openPanelGraph");
    console.log("Remote", remote);

    let paths: string[] = remote.dialog.showOpenDialogSync(null, { title: "Load Project", buttonLabel: "Load Project", properties: ["openDirectory"] });
    let entries: Dirent[] = readdirSync(paths[0], { withFileTypes: true });
    let div: HTMLDivElement = document.querySelector("div");
    div.innerHTML = "";
    for (let entry of entries) {
      ƒ.Debug.log(entry);
      div.innerHTML += (entry.isDirectory() ? "+" : "") + entry.name + "<br/>";
    }
  });
}