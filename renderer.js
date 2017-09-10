// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer} = require('electron')
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

/**
 * Open ROM event from menu.
 */
ipcRenderer.on('openROM', (event) => {
  // See HACK in main.js why this is async.
  ipcRenderer.send('openROM', editorView.isROMDirty())
})

ipcRenderer.on('openROMComplete', (event, fileName, rom) => {
  _openFileName = fileName
  _rom = rom
  tileSetView.loadROM(_rom)
  editorView.loadROM(_rom)
})

/**
 * Save or SaveAs ROM event from menu.
 */
ipcRenderer.on('saveROM', (event, saveAs) => {
  if (editorView.isROMDirty()) {
    console.log('Saving ROM.')
    const ret = ipcRenderer.sendSync('saveROM', saveAs, _openFileName, _rom)
    _openFileName = ret.fileName
    editorView.clearROMDirty()
  }
})

