// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer} = require('electron')
const nesChr = require('./nesPatternTable.js')
const tileSetView = require('./tileSetView.js')
const editorView = require('./editorView.js')

/**
 * Initialize views.
 */
function init() {
  tileSetView.init()
  editorView.init()

  tileSetView.onSelected(tile => {editorView.drawEditorCanvas(tile)})
}
init()

/**
 * Called when a ROM is loaded.
 * rom  NES ROM object.
 */
ipcRenderer.on('rom-loaded', (event, rom) => {
  _tileSet = nesChr.deinterlaceTileSet(rom.rom_no_header)
  tileSetView.drawTileSet(_tileSet)
})
