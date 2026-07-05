const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kaka', {
  openFolder: () => ipcRenderer.invoke('dialog:open-folder'),
  scanFolder: (folderPath) => ipcRenderer.invoke('fs:scan-folder', folderPath),
  analyzeTask: (payload) => ipcRenderer.invoke('model:analyze-task', payload),
  testModel: () => ipcRenderer.invoke('model:test'),
  listSkills: () => ipcRenderer.invoke('skills:list'),
  runCommand: (payload) => ipcRenderer.invoke('command:run', payload),
  saveState: (state) => ipcRenderer.invoke('app:save-state', state),
  getStartupContext: () => ipcRenderer.invoke('app:get-startup-context')
});
