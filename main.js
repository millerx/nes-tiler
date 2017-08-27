const {app, BrowserWindow, ipcMain} = require('electron')
const fs = require('fs')
const path = require('path')
const url = require('url')
const nesRom = require('./nesRom.js')
const menu = require('./menu.js')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

// Name of the file that is currently open.
let openFileName = null

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 928, height: 624})

  menu.setApplicationMenu()

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Emitted when the window is loaded.
  //mainWindow.webContents.on('did-finish-load', () => {
  //})

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Opens dialog to select a ROM, loads that ROM into memory and sends that to the render thread.
 */
menu.setOpenFn(() => {
  // TODO: Open File dialog
  openFileName = './BlasterMaster.nes'

  const rom = nesRom.readRom(openFileName)
  mainWindow.webContents.send('rom-loaded', rom)
})

/**
 * Send a message to renderer to "save" which updates in-memory ROM and sends that
 * in-memory ROM back to the main process on another "save" message.
 */
menu.setSaveFn(() => {
  mainWindow.webContents.send('save')
})

/**
 * Message with ROM contents to save to disk.
 */
ipcMain.on('save', (event, rom) => {
  fs.writeFileSync(openFileName, rom.rom)
  console.log('Saved ROM')
})
