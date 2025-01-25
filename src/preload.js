const { contextBridge, ipcRenderer } = require('electron');



contextBridge.exposeInMainWorld('electron', {
    
    onFileSelected: (callback) => ipcRenderer.on('file-selected', (event, filePath) => callback(filePath)),

     
     onSubtitleSelected: (callback) => ipcRenderer.on('subtitle-loaded', (event, vttContent) => callback(vttContent)),
     onSubtitleError: (callback) => ipcRenderer.on('subtitle-error', (event, message) => callback(message)),

    
    onPlayStream: (callback) => ipcRenderer.on('play-stream', (event, url) => callback(url)),

    
    sendStreamUrl: (url) => ipcRenderer.send('stream-url', url),
});
