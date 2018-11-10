// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer, remote} = require('electron');
const fs = remote.require('fs');
const nesRom = require('./nesRom.js');
const tileSetView = require('./tileSetView.js');
const editorView = require('./editorView.js');
const paletteView = require('./paletteView.js');
const dialogs = require('./dialogs.js');

let _openFileName;  // Name of the file that is currently open.
let _rom;  // ROM being edited.

/**
 * Initialize views.
 */
function init() {
  // Init views
  tileSetView.init();
  editorView.init();
  paletteView.init();

  // Wire up events.
  tileSetView.onSelected(editorView.editTile);
  editorView.onTileChanged(tileSetView.updateTile);
  paletteView.onPaletteChanged(function (palette) {
    editorView.setPalette(palette);
    tileSetView.setPalette(palette);
  });
  paletteView.onForeBackIndexChanged(editorView.setForeBackPaletteIndex);

  // Set palette for the first time.
  editorView.setPalette(paletteView.getPalette());
  tileSetView.setPalette(paletteView.getPalette());
  // Set the editor's foreground/background palette index for the first time.
  editorView.setForeBackPaletteIndex(paletteView.getForegroundIndex(), paletteView.getBackgroundIndex());
}
init();

/**
 * Open ROM event from menu.
 */
ipcRenderer.on('openROM', function (event) {
  if (editorView.isROMDirty()) {
    const ret = dialogs.showUnsavedChangesPrompt();
    if (ret === dialogs.DLG_CANCEL) return;
    if (ret === dialogs.DLG_SAVE) saveROM(null, false);
    // if DLG_DONT_SAVE then just continue
  }

  const selectedFileNames = dialogs.showOpenDialog();
  if (!selectedFileNames) return;  // User cancelled.
  const selectedFileName = selectedFileNames[0];
  // We don't set _openFileName until file is opened successfully.

  console.log('Loading ROM '+selectedFileName);
  _rom = nesRom.readRom(fs.readFileSync(selectedFileName));
  _openFileName = selectedFileName;
  tileSetView.loadROM(_rom);
  editorView.loadROM(_rom);
});

/**
 * Save or SaveAs ROM event from menu.
 */
function saveROM(event, saveAs) {
  if (!editorView.isROMDirty()) return;

  console.log('Saving ROM.')
  let fileName = _openFileName;
  if (saveAs) {
    fileName = dialogs.showSaveDialog();
    // We only update _openFileName after save is successful.
    if (!fileName) return;  // User cancelled.
  }

  fs.writeFileSync(fileName, _rom.buffer);
  console.log('Saved ROM '+fileName);

  _openFileName = fileName;
  editorView.clearROMDirty();
}
ipcRenderer.on('saveROM', saveROM);

ipcRenderer.on('swapPenColors', function(event) {
  paletteView.swapForeBackColors();
});