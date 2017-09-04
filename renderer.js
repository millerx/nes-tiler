// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer} = require('electron')
const {CHR_BYTE_SIZE} = require('./nesPatternTable.js')
const tileSetView = require('./tileSetView.js')
const editorView = require('./editorView.js')

let _rom = null

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
 * Called when a ROM is loaded.
 * rom  NES ROM object.
 */
ipcRenderer.on('rom-loaded', (event, rom) => {
  _rom = rom
  tileSetView.loadTileSet(rom)
  editorView.usingROM(rom)
})

/**
 * Called when the ROM needs to be saved.  Update the in-memory ROM stored here and send it
 * to the main process on another "save" message.
 */
ipcRenderer.on('save', (event) => {
  console.log('Saving ROM.')
  ipcRenderer.send('save', _rom)
})
