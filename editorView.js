// Code for the editorView that allows editing of a tile.
// Unscaled coordinates are tile coordinates.  An 8x8 grid.
// Scaled coordinates are screen pixels.  If 16 screen pixels represent one tile pixel then tile coord 1,1 is screen coord 16,16.

const {ipcRenderer} = require('electron');
const cmn = require('./common.js');
const {CHR_WIDTH, CHR_HEIGHT} = require('./nesPatternTable.js');
const tiles = require('./nesRomTiles.js');

const EDITOR_SCALE = 16;

let _appState = {};

let _unscaledCanvas;  // Offscreen canvas.
let _mouseDown = false;  // Is the mouse currently pressed down?
let _tile;  // Deinterlaced tile.
let _onTileDataChangedFn;  // Called when tile data has changed.

/** Called by renderer.js to initialize. */
exports.init = function(appState) {
  _appState = appState;

  initEditorCanvas();
  _unscaledCanvas = createUnscaledCanvas();
}

/** Initialize visible canvas. */
function initEditorCanvas() {
  let canvas = document.getElementById('editorCanvas');
  // Resize the canvas.
  canvas.width = EDITOR_SCALE * CHR_WIDTH;
  canvas.height = EDITOR_SCALE * CHR_HEIGHT;

  let ctx = cmn.getContext2DNA(canvas);
  ctx.imageSmoothingEnabled = false;
  ctx.scale(EDITOR_SCALE, EDITOR_SCALE);

  // Canvas is white by default.
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, CHR_WIDTH, CHR_HEIGHT);

  canvas.addEventListener('mousedown', function (me) { _mouseDown = true; onMouseMove(me); });
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', function (me) { _mouseDown = false; });
  canvas.addEventListener('mouseleave', function (me) { _mouseDown = false; });
}

function createUnscaledCanvas() {
  let canvas = document.createElement('canvas');
  canvas.width = CHR_WIDTH;
  canvas.height = CHR_HEIGHT;
  return canvas;
}

exports.onTileDataChanged = function(fn) {
  _onTileDataChangedFn = fn;
}

exports.loadROM = function() {
  // Reset in case this is not the first ROM we have loaded.
  _tile = null;

  // Clear the canvas in case this is not the first ROM we have loaded.
  clearEditorView();
}

/** Loads a tile into the Editor View. */
exports.selectedTileChanged = function() {
  _tile = tiles.readTile(_appState.rom, _appState.selectedTileIndex);
  drawEditorView(_tile);
}

function clearEditorView() {
  // Draw off-screen canvas to the scaled on-screen canvas.
  const canvas = document.getElementById('editorCanvas');
  let ctx = cmn.getContext2DNA(canvas);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawEditorView(tile) {
  // Write pixels to the off-screen unscaled canvas.
  // getContext with {alpha: false} is important here because we re-draw over the old tile.
  let ctx = cmn.getContext2DNA(_unscaledCanvas);
  let imgData = ctx.createImageData(CHR_WIDTH, CHR_HEIGHT);
  cmn.writeImageData(imgData, tile, 0, 0, _appState.palette.data);
  ctx.putImageData(imgData, 0, 0);

  // Draw off-screen canvas to the scaled on-screen canvas.
  const canvas = document.getElementById('editorCanvas');
  let ctx2 = cmn.getContext2DNA(canvas);
  ctx2.drawImage(_unscaledCanvas, 0, 0);
}

function onMouseMove(mouseEvent) {
  if (!_mouseDown) return;
  if (!_appState.rom) return;

  // Mouse coordinates are in screen coordinates.

  // Get the top-left of the tile pixel in screen coordinates.
  const x = mouseEvent.offsetX - (mouseEvent.offsetX % EDITOR_SCALE);
  const y = mouseEvent.offsetY - (mouseEvent.offsetY % EDITOR_SCALE);

  // Get unscaled tile coordinates.
  const ux = ~~(x / EDITOR_SCALE);
  const uy = ~~(y / EDITOR_SCALE);

  // Erase if Option+Click
  const palNum = mouseEvent.altKey ? _appState.palette.backIndex : _appState.palette.foreIndex;

  const tileColor = _tile[uy * CHR_WIDTH + ux];
  if (tileColor != palNum) {
    changePixel(ux, uy, palNum);
  }
}

/** Changes a pixel on the tile. */
function changePixel(ux, uy, palNum) {
  _tile[uy * CHR_WIDTH + ux] = palNum;

  tiles.writeTile(_appState.rom, _tile, _appState.selectedTileIndex);
  _appState.isDirty = true;

  drawPixel(ux, uy, palNum);

  if (_onTileDataChangedFn) {
    _onTileDataChangedFn();
  }
}

/** Draws a pixel on scaled canvas given unscaled coordinates. */
function drawPixel(ux, uy, palNum) {
  // Draw a 1x1 fillRect direclty on the scaled canvas.
  const canvas = document.getElementById('editorCanvas');
  let ctx = cmn.getContext2DNA(canvas);
  ctx.fillStyle = cmn.toCSSColorStr(_appState.palette.data[palNum]);
  ctx.fillRect(ux, uy, 1, 1);
}

/** Re-draws with the new palette */
exports.paletteChanged = function() {
  if (_tile) drawEditorView(_tile);
}
