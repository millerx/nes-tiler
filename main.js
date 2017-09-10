const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const fs = require('fs')
const path = require('path')
const url = require('url')
const nesRom = require('./nesRom.js')
const menu = require('./menu.js')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

// Name of the file that is currently open.
let _openFileName

let _main = this

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 928, height: 624})

  menu.setApplicationMenu(_main)

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
exports.openROM = function() {
  // TODO: Prompt if ROM is dirty.
  //showUnsavedChangesPrompt()

  const selectedFiles = showOpenDialog()
  if (!selectedFiles) return
  _openFileName = selectedFiles[0]

  console.log('Loading ROM '+_openFileName)
  const rom = nesRom.readRom(fs.readFileSync(_openFileName))
  mainWindow.webContents.send('rom-loaded', rom)
}

const fileDialogFilters = [
  {name: 'NES ROMs', extensions: ['nes']},
  {name: 'All Files', extensions: ['*']}
]

function showOpenDialog() {
  return dialog.showOpenDialog(mainWindow, {
    filters: fileDialogFilters
  })
}

/**
 * Shows a prompt warning of unsaved changes and asks if user would like to continue.
 * Returns true if user chooses to continue else false.
 */
function showUnsavedChangesPrompt() {
  dialog.showMessageBox(mainWindow, {
    type: 'question',
    message: "Do you want to save changes you made?",
    detail: "Your changes will be lost if you don't save them.",
    buttons: ["Save", "Cancel", "Don't Save"]  // Order is reversed when this is displayed.
  })
}

/**
 * Send a message to renderer to "save" which updates in-memory ROM and sends that
 * in-memory ROM back to the main process on another "save" message.
 */
exports.saveROM = function(saveAs) {
  if (!_openFileName) return

  mainWindow.webContents.send('save', saveAs)
}

function showSaveDialog() {
  let fileName = dialog.showSaveDialog(mainWindow, {
    filters: fileDialogFilters
  })

  // Append default extension.  I am surpsied showSaveDialog does not have an option to do this for us.
  if (fileName && fileName.indexOf('.') < 0) {
    fileName += '.nes'
  }

  return fileName
}

/**
 * Message with ROM contents to save to disk.
 */
ipcMain.on('save', (event, saveAs, rom) => {
  let fileName = _openFileName
  if (saveAs) {
    const selectedFileName = showSaveDialog()
    if (selectedFileName) fileName = selectedFileName
  }

  fs.writeFileSync(fileName, rom.buffer)
  _openFileName = fileName
  console.log('Saved ROM '+fileName)
  mainWindow.webContents.send('saveComplete')
})
