// Code for the tileSetView that displays all tiles in a ROM.

const {ipcRenderer} = require('electron');
const cmn = require('./common.js');
const nesChr = require('./nesPatternTable.js');
const {CHR_WIDTH, CHR_HEIGHT, CHR_BYTE_SIZE} = require('./nesPatternTable.js');
const tiles = require('./nesRomTiles.js');

/* TileSetView is composed of a series of canvas elements 320x1024. Except for the last canvas
 * who's height is trimmed. I experimented with a canvas-per-tile but Chrome cannot handle
 * that many elements. Here are the results of my experiments.
 * 
 * 16x16 blocks. 4 canvases per iter.
 * #iters  time
 *    100      7.2 ms
 *   1000     93.7 ms
 *  10000   1532.6 ms
 * 100000  50180.8 ms
 */

const ZOOM_FACTOR = 2;
const TILESET_WIDTH = ~~(40 / ZOOM_FACTOR);  // Tiles to draw on a single row.
const CANVAS_HEIGHT = ~~(1024 / ZOOM_FACTOR);  // Pixel height of a canvas that makes up the tileSet.
const ROM_PARTITION_SIZE = CHR_BYTE_SIZE * TILESET_WIDTH * ~~(CANVAS_HEIGHT / CHR_HEIGHT);

let _rom;  // ROM being viewed.
let _selectedTileIndex = -1;  // Index of selected tile.  -1 if no tile is selected.
let _selectedCanvas;  // Canvas element of the selected tile.
let _palette ;  // Palette [[r,g,b,a]] to draw the file.
let _unscaledCanvas;  // Offscreen canvas.
let _onSelectedFn;  // fn(tileBytes)  Function called when a tile is selected.

/** Not used but keeping for debugging. */
function drawGreenBox(canvas, x, y) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
  ctx.fillRect(x, y, 8, 8);
}

function drawRomBuffer(romBuffer, canvas) {
  const ctx = cmn.getContext2DNA(_unscaledCanvas);
  const imgData = ctx.createImageData(_unscaledCanvas.width, _unscaledCanvas.height);

  let ti = 0;
  for (let i = 0; i < romBuffer.length; i += CHR_BYTE_SIZE) {
    // TODO: Remove the slice below by passing in an offset to deinterlaceTile and have it read
    // no more then CHR_BYTE_SIZE.
    // TODO: Reuse the same tile buffer instead of creating one with every call to deinterlaceTile.
    const tileBytes = romBuffer.slice(i, i+CHR_BYTE_SIZE);
    const tile = nesChr.deinterlaceTile(tileBytes);
    cmn.writeImageData(imgData, tile, (ti % TILESET_WIDTH), ~~(ti / TILESET_WIDTH), _palette);
    ++ti;
  }

  ctx.putImageData(imgData, 0, 0);

  // Draw off-screen canvas to the scaled on-screen canvas.
  const ctx2 = cmn.getContext2DNA(canvas);
  ctx2.imageSmoothingEnabled = false;
  ctx2.scale(ZOOM_FACTOR, ZOOM_FACTOR);
  ctx2.drawImage(_unscaledCanvas, 0, 0);
}

/** Creates a canvas element from a ROM buffer. */
function createTileCanvas(romBuffer) {
  const canvas = document.createElement('canvas');
  canvas.width = TILESET_WIDTH * CHR_WIDTH * ZOOM_FACTOR;  // 320
  canvas.height = Math.ceil(romBuffer.length / CHR_BYTE_SIZE / TILESET_WIDTH) * CHR_HEIGHT * ZOOM_FACTOR;
  canvas.addEventListener('click', onCanvasClick);
  drawRomBuffer(romBuffer, canvas);
  return canvas;
}

/** Generator that partition's the ROM's buffer into chunks to be rendered in canvases. */
function* partitionRomBufferForCanvases() {
  let dataOffset = _rom.dataOffset;
  while (dataOffset < _rom.buffer.length) {
    yield _rom.buffer.slice(dataOffset, dataOffset + ROM_PARTITION_SIZE);
    dataOffset += ROM_PARTITION_SIZE;
  }
}

/** Draws the entire tile set from _rom. Creates canvas elements. */
function drawTileSet() {
  const tileSetDiv = document.getElementById('tileSetWindow');
  let tileIndex = 0;
  for (let romChunk of partitionRomBufferForCanvases()) {
    const canvas = createTileCanvas(romChunk);
    canvas._tileIndex = tileIndex;
    tileSetDiv.appendChild(canvas);
    tileIndex += ~~(ROM_PARTITION_SIZE / CHR_BYTE_SIZE);
  }
}

/** Redraws the ROM on existing canvases. */
function redrawTileSet() {
  const tileSetDiv = document.getElementById('tileSetWindow');
  let canvas = tileSetDiv.firstElementChild;
  for (let romChunk of partitionRomBufferForCanvases()) {
    drawRomBuffer(romChunk, canvas);
    canvas = canvas.nextSibling;
  }
}

/** Draws the tile at the given index. */
function drawSelectedTile(tile) {
  if (!_selectedCanvas) return;

  const ctx = cmn.getContext2DNA(_selectedCanvas);
  const imgData = ctx.createImageData(CHR_WIDTH, CHR_HEIGHT);

  cmn.writeImageData(imgData, tile, 0, 0, _palette);

  const tileIndex = _selectedTileIndex - _selectedCanvas._tileIndex;
  const x = (tileIndex % TILESET_WIDTH) * CHR_WIDTH;
  const y = ~~(tileIndex / TILESET_WIDTH) * CHR_HEIGHT;
  ctx.putImageData(imgData, x, y);
}

/** Look up selected tile and call the onSelected function. */
function onCanvasClick(event) {
  if (!_onSelectedFn) return;
  if (!_rom) return;

  // pixelXY = mouseEvent.offset*
  // tileXY = mouseEvent.offset* >> 3 // Div 8
  // pixelInTileXY = mouseEvent.offset* % 8

  _selectedCanvas = event.srcElement;
  const tileX = ~~(event.offsetX / CHR_WIDTH / ZOOM_FACTOR);
  const tileY = ~~(event.offsetY / CHR_HEIGHT / ZOOM_FACTOR);
  _selectedTileIndex = _selectedCanvas._tileIndex + (tileY * TILESET_WIDTH) + tileX;
  _onSelectedFn(_selectedTileIndex);
}

/** Called by renderer.js to initialize. */
exports.init = function() {
  _unscaledCanvas = document.createElement('canvas');
  _unscaledCanvas.width = TILESET_WIDTH * CHR_WIDTH;
  _unscaledCanvas.height = CANVAS_HEIGHT;
}

/** Set function called when tile is selected. */
exports.onSelected = function(fn) {
  _onSelectedFn = fn;
}

/** Loads and displays the tileset of the given ROM. */
exports.loadROM = function(rom) {
  _rom = rom;
  _selectedTileIndex = -1;  // Reset in case this is not the first ROM we have opened.
  _selectedCanvas = null;
  drawTileSet();
}

exports.updateTile = function(tileIndex) {
  const tile = tiles.readTile(_rom, tileIndex);
  drawSelectedTile(tile);
}

exports.setPalette = function(palette) {
  _palette = palette;
  if (_rom) redrawTileSet();
}

ipcRenderer.on('palette-update', function (event, palette) {
  exports.setPalette(palette);
});
