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

let _appState = {
  openFileName: null,
  rom: null,
  selectedTileIndex: -1,  // Index of selected tile.  -1 if no tile is selected.
  isDirty: false,  // True if the ROM has been updated since last save.
  palette: {
    data: paletteView.getDefaultPalette(),
    foreIndex: 3,
    backIndex: 0,
  }
}

/**
 * Initialize views.
 */
function init() {
  // Init views
  tileSetView.init(_appState);
  editorView.init(_appState);
  paletteView.init(_appState);

  // Wire up events.
  tileSetView.onSelected(editorView.selectedTileChanged);
  editorView.onTileDataChanged(tileSetView.tileDataChanged);
  paletteView.onPaletteChanged(function () {
    editorView.paletteChanged();
    tileSetView.paletteChanged();
  });
}
init();

/**
 * Open ROM event from menu.
 */
ipcRenderer.on('openROM', function (event) {
  if (_appState.isDirty) {
    const ret = dialogs.showUnsavedChangesPrompt();
    if (ret === dialogs.DLG_CANCEL) return;
    if (ret === dialogs.DLG_SAVE) saveROM(null, false);
    // if DLG_DONT_SAVE then just continue
  }

  const selectedFileNames = dialogs.showOpenDialog();
  if (!selectedFileNames) return;  // User cancelled.
  const selectedFileName = selectedFileNames[0];
  // We don't set openFileName until file is opened successfully.

  console.log('Loading ROM '+selectedFileName);
  _appState.rom = nesRom.readRom(fs.readFileSync(selectedFileName));
  _appState.openFileName = selectedFileName;
  _appState.selectedTileIndex = -1;  // Reset in case this is not the first ROM we have opened.
  tileSetView.loadROM();
  editorView.loadROM();
});

/**
 * Save or SaveAs ROM event from menu.
 */
function saveROM(event, saveAs) {
  if (!_appState.isDirty) return;

  console.log('Saving ROM.')
  let fileName = _appState.openFileName;
  if (saveAs) {
    fileName = dialogs.showSaveDialog();
    // We only update openFileName after save is successful.
    if (!fileName) return;  // User cancelled.
  }

  fs.writeFileSync(fileName, _appState.rom.buffer);
  console.log('Saved ROM '+fileName);

  _appState.openFileName = fileName;
  _appState.isDirty = false;
}
ipcRenderer.on('saveROM', saveROM);

ipcRenderer.on('swapPenColors', function(event) {
  paletteView.swapForeBackColors();
});