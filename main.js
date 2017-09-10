const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const fs = require('fs')
const path = require('path')
const url = require('url')
const nesRom = require('./nesRom.js')
const menu = require('./menu.js')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 928, height: 624})

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Emitted when the window is loaded.
  //mainWindow.webContents.on('did-finish-load', () => {
  //})

  menu.setApplicationMenu(mainWindow)

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
 * Event to open ROM file.
 */
ipcMain.on('openROM', (event) => {
  const selectedFileNames = showOpenDialog()
  if (!selectedFileNames) return
  const selectedFileName = selectedFileNames[0]

  console.log('Loading ROM '+selectedFileName)
  const rom = nesRom.readRom(fs.readFileSync(selectedFileName))
  // HACK: As of Electron 1.6.11, rom sent in sendSync does not appear to deserialize correctly because rom.buffer.length is undefined.

  mainWindow.webContents.send('openROMComplete', selectedFileName, rom)
})

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
 * Event to save ROM file.
 */
ipcMain.on('saveROM', (event, saveAs, fileName, rom) => {
  if (saveAs) {
    const selectedFileName = showSaveDialog()
    if (selectedFileName) fileName = selectedFileName
  }

  fs.writeFileSync(fileName, rom.buffer)
  console.log('Saved ROM '+fileName)
  event.returnValue = {fileName: fileName}
})

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

