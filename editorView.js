// Code for the editorView that allows editing of a tile.
// Unscaled coordinates are tile coordinates.  An 8x8 grid.
// Scaled coordinates are screen pixels.  If 16 screen pixels represent one tile pixel then tile coord 1,1 is screen coord 16,16.

const {ipcRenderer} = require('electron');
const cmn = require('./common.js');
const {CHR_WIDTH, CHR_HEIGHT} = require('./nesPatternTable.js');
const tiles = require('./nesRomTiles.js');

const EDITOR_SCALE = 16;

let _unscaledCanvas;  // Offscreen canvas.
let _mouseDown = false;  // Is the mouse currently pressed down?
let _rom;  // ROM being edited.
let _tileIndex = -1;  // Index of tile being edited.
let _tile;  // Deinterlaced tile.
let _isROMDirty = false;  // True if the ROM has been updated since last save.
let _onTileChangedFn;  // fn(tileBytes) Function called when a tile has changed.
let _palette;  // Palette [[r,g,b,a]] to draw the file.
let _forePalIndex = 3;  // Palette index of the forebround color.
let _backPalIndex = 0;  // Palette index of the background color.

/**
 * Called by renderer.js to initialize.
 */
exports.init = function() {
  initEditorCanvas()
  _unscaledCanvas = createUnscaledCanvas()
}

/**
 * Initialize visible canvas.
 */
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

exports.onTileChanged = function(fn) {
  _onTileChangedFn = fn;
}

exports.loadROM = function(rom) {
  _rom = rom;
  // Reset in case this is not the first ROM we have loaded.
  _tileIndex = -1;
  _tile = null;
  _isROMDirty = false;

  // Clear the canvas in case this is not the first ROM we have loaded.
  clearEditorView();
}

exports.isROMDirty = function() {
  return _isROMDirty;
}

exports.clearROMDirty = function() {
  _isROMDirty = false;
}

/**
 * Loads a tile into the Editor View.
 */
exports.editTile = function(tileIndex) {
  _tileIndex = tileIndex;
  _tile = tiles.readTile(_rom, _tileIndex);
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
  cmn.writeImageData(imgData, tile, 0, 0, _palette);
  ctx.putImageData(imgData, 0, 0);

  // Draw off-screen canvas to the scaled on-screen canvas.
  const canvas = document.getElementById('editorCanvas');
  let ctx2 = cmn.getContext2DNA(canvas);
  ctx2.drawImage(_unscaledCanvas, 0, 0);
}

function onMouseMove(mouseEvent) {
  if (!_mouseDown) return;
  if (!_rom) return;

  // Mouse coordinates are in screen coordinates.

  // Get the top-left of the tile pixel in screen coordinates.
  const x = mouseEvent.offsetX - (mouseEvent.offsetX % EDITOR_SCALE);
  const y = mouseEvent.offsetY - (mouseEvent.offsetY % EDITOR_SCALE);

  // Get unscaled tile coordinates.
  const ux = ~~(x / EDITOR_SCALE);
  const uy = ~~(y / EDITOR_SCALE);

  // Erase if Option+Click
  const palNum = mouseEvent.altKey ? _backPalIndex : _forePalIndex;

  const tileColor = _tile[uy * CHR_WIDTH + ux];
  if (tileColor != palNum) {
    changePixel(ux, uy, palNum);
  }
}

/**
 * Changes a pixel on the tile.
 */
function changePixel(ux, uy, palNum) {
  _tile[uy * CHR_WIDTH + ux] = palNum;

  tiles.writeTile(_rom, _tile, _tileIndex);
  _isROMDirty = true;

  drawPixel(ux, uy, palNum);

  if (_onTileChangedFn) {
    _onTileChangedFn(_tileIndex);
  }
}

/**
 * Draws a pixel on scaled canvas given unscaled coordinates.
 */
function drawPixel(ux, uy, palNum) {
  // Draw a 1x1 fillRect direclty on the scaled canvas.
  const canvas = document.getElementById('editorCanvas');
  let ctx = cmn.getContext2DNA(canvas);
  ctx.fillStyle = cmn.toCSSColorStr(_palette[palNum]);
  ctx.fillRect(ux, uy, 1, 1);
}

/**
 * Sets the palette of form [[r,g,b,a]].
 */
exports.setPalette = function(palette) {
  _palette = palette;
  if (_tile) drawEditorView(_tile);
}

/**
 * Sets the foreground and background palette index.
 */
exports.setForeBackPaletteIndex = function(forePalIndex, backPalIndex) {
  _forePalIndex = forePalIndex;
  _backPalIndex = backPalIndex;
}

ipcRenderer.on('palette-update', function (event, palette) {
  exports.setPalette(palette);
});
