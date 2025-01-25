import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import fs from 'fs';
import SrtParser2 from 'srt-parser-2';

const __dirname = path.resolve();
const parser = new SrtParser2();


if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'src/preload.js'),
      devTools: false,
    },
    
  });

  const menu = Menu.buildFromTemplate([
    {
        label: 'Media',
        submenu: [
            {
                label: 'File',
                click: async () => {
                    const result = await dialog.showOpenDialog(mainWindow, {
                        properties: ['openFile'],
                        filters: [
                            { name: 'Videos', extensions: ['mp4', 'mkv', 'avi'] },
                        ],
                    });

                    if (!result.canceled) {
                        console.log('Selected file:', result.filePaths[0]);
                        mainWindow.webContents.send('file-selected', result.filePaths[0]);
                    }
                },
            },
            {
              label: 'Stream',
              submenu: [
                  {
                      label: 'Open Stream URL',
                      click: async () => {
                          const childWindow = new BrowserWindow({
                              parent: mainWindow,
                              modal: true,
                              width: 400,
                              height: 250,
                              resizable: false,
                              webPreferences: {
                                  preload: path.join(__dirname, 'src/preload.js'),
                                  contextIsolation: true,
                                  nodeIntegration: false,
                              },
                          });
                          childWindow.setMenu(null);
                          childWindow.loadFile(path.join(__dirname, 'src/urlInput.html'));
          
                          
                          ipcMain.once('stream-url', (event, url) => {
                              console.log('Received URL:', url);
                              mainWindow.webContents.send('play-stream', url);
                              childWindow.close();
                          });
                      },
                  },
              ],
          }
        ],
    },

    {
      label: 'Subtitle',
      submenu: [
          {
              label: 'Open Subtitle',
              click: async () => {
                  const result = await dialog.showOpenDialog(mainWindow, {
                      properties: ['openFile'],
                      filters: [{ name: 'Subtitles', extensions: ['srt'] }],
                  });

                  if (!result.canceled) {
                      console.log('Selected subtitle:', result.filePaths[0]);

                      
                      fs.readFile(result.filePaths[0], 'utf8', (err, data) => {
                          if (err) {
                              console.error('Error reading subtitle file:', err);
                              mainWindow.webContents.send('subtitle-error', 'Failed to load subtitles.');
                          } else {
                              try {
                                  const subtitles = parser.fromSrt(data);
                                  console.log('Parsed Subtitles:', subtitles[0]);

                                  const vttContent =
                                      `WEBVTT\n\n` +
                                      subtitles
                                          .map(
                                              ({ id, startTime, endTime, text }) =>
                                                  `${id}\n${startTime.replace(',', '.')} --> ${endTime.replace(',', '.')}\n${text}`
                                          )
                                          .join('\n\n');

                                  mainWindow.webContents.send('subtitle-loaded', vttContent);
                              } catch (parseError) {
                                  console.error('Error parsing subtitle file:', parseError);
                                  mainWindow.webContents.send('subtitle-error', 'Invalid subtitle format.');
                              }
                          }
                      });
                  }
              },
          },
      ],
  },
]);

Menu.setApplicationMenu(menu);

  mainWindow.loadFile(path.join(__dirname, 'src/index.html'));

  
  mainWindow.on('enter-full-screen', () => {
    console.log('Entered full-screen mode');
    mainWindow.setAutoHideMenuBar(true); 
    mainWindow.setMenuBarVisibility(false);
});

mainWindow.on('leave-full-screen', () => {
    console.log('Exited full-screen mode');
    mainWindow.setAutoHideMenuBar(false); 
    mainWindow.setMenuBarVisibility(true);
});

  mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
