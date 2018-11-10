const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
const menu = require('./menu.js');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let colorSelectWindow;

// Builds an URL to a file relative to the app path.
function appUrl(filename) {
  return url.format({
    pathname: path.join(app.getAppPath(), filename),
    protocol: 'file:',
    slashes: true
  });
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 928, height: 700});

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Emitted when the window is loaded.
  //mainWindow.webContents.on('did-finish-load', function () {})

  menu.setApplicationMenu(mainWindow);

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // and load the index.html of the app.
  mainWindow.loadURL(appUrl('index.html'));
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// Open the color-selector window as a modal child window.
ipcMain.on('open-color-selector', function (event, palette, palIndex) {
  if (colorSelectWindow) {
    colorSelectWindow.show();
  } else {
    colorSelectWindow = new BrowserWindow({
      width: 400, height: 200,
      parent: mainWindow, show: false});

    colorSelectWindow.on('closed', function() {
      colorSelectWindow = null;
    });

    colorSelectWindow.loadURL(appUrl('color-selector.html'));

    colorSelectWindow.once('ready-to-show', function () {
      colorSelectWindow.webContents.send('palette-update', palette, palIndex);
      colorSelectWindow.show();
    });
  }
});

// Color-selector has changed the palette. Tell the main view.
ipcMain.on('palette-update', function (event, palette) {
  mainWindow.webContents.send('palette-update', palette);
});