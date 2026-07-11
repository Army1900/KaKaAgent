const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kaka', {
  openFolder: () => ipcRenderer.invoke('dialog:open-folder'),
  scanFolder: (folderPath) => ipcRenderer.invoke('fs:scan-folder', folderPath),
  readProjectContext: (payload) => ipcRenderer.invoke('fs:read-project-context', payload),
  analyzeTask: (payload) => ipcRenderer.invoke('model:analyze-task', payload),
  testModel: () => ipcRenderer.invoke('model:test'),
  listSkills: () => ipcRenderer.invoke('skills:list'),
  runCommand: (payload) => ipcRenderer.invoke('command:run', payload),
  validateCommand: (command) => ipcRenderer.invoke('command:validate', command),
  runIndependentVerification: (payload) => ipcRenderer.invoke('verification:independent', payload),
  saveState: (state) => ipcRenderer.invoke('app:save-state', state),
  getSettings: () => ipcRenderer.invoke('app:get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('app:save-settings', settings),
  getStartupContext: () => ipcRenderer.invoke('app:get-startup-context'),
  getWorkspaceInfo: () => ipcRenderer.invoke('app:get-workspace-info'),
  initializeProjectEngine: (payload) => ipcRenderer.invoke('engine:init-project', payload),
  createEngineHandoff: (payload) => ipcRenderer.invoke('engine:create-handoff', payload),
  importEngineHandoffResult: (payload) => ipcRenderer.invoke('engine:import-handoff-result', payload),
  checkEngine: (engineId) => ipcRenderer.invoke('engine:check', engineId)
});
