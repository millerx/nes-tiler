// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer, remote} = require('electron')
const {dialog} = remote
const {CHR_BYTE_SIZE} = require('./nesPatternTable.js')
const tileSetView = require('./tileSetView.js')
const editorView = require('./editorView.js')

let _openFileName  // Name of the file that is currently open.
let _rom  // ROM being edited.

/**
 * Initialize views.
 */
function init() {
  tileSetView.init()
  editorView.init()

  tileSetView.onSelected(editorView.editTile)

  editorView.onTileChanged(tileSetView.updateTile)
}
init()

const DLG_SAVE = 0
const DLG_CANCEL = 1
const DLG_DONT_SAVE = 2

/**
 * Shows a prompt warning of unsaved changes and asks if user would like to continue.
 */
function showUnsavedChangesPrompt() {
  return dialog.showMessageBox(remote.getCurrentWindow(), {
    type: 'question',
    message: "Do you want to save changes you made?",
    detail: "Your changes will be lost if you don't save them.",
    buttons: ["Save", "Cancel", "Don't Save"]  // Buttons are displayed right to left.
  })
}

/**
 * Open ROM event from menu.
 */
ipcRenderer.on('openROM', (event) => {
  if (editorView.isROMDirty()) {
    const ret = showUnsavedChangesPrompt()
    if (ret === DLG_CANCEL) return;
    if (ret === DLG_SAVE) saveROM(null, false);
    // if DLG_DONT_SAVE then just continue
  }
  ipcRenderer.send('openROM')
})

// See HACK in main.js why this is async.
ipcRenderer.on('openROMComplete', (event, fileName, rom) => {
  _openFileName = fileName
  _rom = rom
  tileSetView.loadROM(_rom)
  editorView.loadROM(_rom)
})

/**
 * Save or SaveAs ROM event from menu.
 */
function saveROM(event, saveAs) {
  if (editorView.isROMDirty()) {
    console.log('Saving ROM.')
    const ret = ipcRenderer.sendSync('saveROM', saveAs, _openFileName, _rom)
    _openFileName = ret.fileName
    editorView.clearROMDirty()
  }
}

ipcRenderer.on('saveROM', (event, saveAs) => saveROM)
