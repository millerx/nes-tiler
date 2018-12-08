// Code for the tileSetView that displays all tiles in a ROM.

const cmn = require('./common.js');
const domu = require('./domUtils.js');
const nesChr = require('./nesPatternTable.js');
const {CHR_WIDTH, CHR_HEIGHT, CHR_BYTE_SIZE} = require('./nesPatternTable.js');

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

let _appState = {};

let _zoomFactor = 2;
let _tileSetWidth = 0;  // Tiles to draw on a single row.
let _canvasHeight = 0;  // Pixel height of a canvas that makes up the tileSet.
let _romPartitionSize = 0;  // ROM data partitioned per canvas element.

let _selectedCanvas;  // Canvas element of the selected tile.
let _unscaledCanvas;  // Offscreen canvas.

/** Calculates module fields based off the given zoom factor. */
function calcZoomFactor(zf) {
  _zoomFactor = zf;
  _tileSetWidth = ~~(40 / _zoomFactor);
  _canvasHeight = ~~(1024 / _zoomFactor);
  _romPartitionSize = CHR_BYTE_SIZE * _tileSetWidth * ~~(_canvasHeight / CHR_HEIGHT);
}

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
    // TODO: Re-use the same tile buffer instead of creating one with every call to deinterlaceTile.
    const tileBytes = romBuffer.slice(i, i+CHR_BYTE_SIZE);
    const tile = nesChr.deinterlaceTile(tileBytes);
    cmn.writeImageData(imgData, tile, (ti % _tileSetWidth), ~~(ti / _tileSetWidth), _appState.palette.data);
    ++ti;
  }

  ctx.putImageData(imgData, 0, 0);

  // Draw off-screen canvas to the scaled on-screen canvas.
  const ctx2 = cmn.getContext2DNA(canvas);
  ctx2.drawImage(_unscaledCanvas, 0, 0);
}

/** Creates a canvas element from a ROM buffer. */
function createTileCanvas(romBuffer) {
  const canvas = document.createElement('canvas');
  canvas.width = _tileSetWidth * CHR_WIDTH * _zoomFactor;  // 320
  canvas.height = Math.ceil(romBuffer.length / CHR_BYTE_SIZE / _tileSetWidth) * CHR_HEIGHT * _zoomFactor;
  canvas.addEventListener('click', onCanvasClick);
  const ctx = cmn.getContext2DNA(canvas);
  ctx.imageSmoothingEnabled = false;
  ctx.scale(_zoomFactor, _zoomFactor);
  drawRomBuffer(romBuffer, canvas);
  return canvas;
}

/** Generator that partition's the ROM's buffer into chunks to be rendered in canvases. */
function* partitionRomBufferForCanvases() {
  let dataOffset = _appState.rom.dataOffset;
  while (dataOffset < _appState.rom.buffer.length) {
    yield _appState.rom.buffer.slice(dataOffset, dataOffset + _romPartitionSize);
    dataOffset += _romPartitionSize;
  }
}

/** Draws the entire tile set from ROM. Creates canvas elements. */
function drawTileSet() {
  const tileSetDiv = document.getElementById('tileSetWindow');
  let tileIndex = 0;
  for (let romChunk of partitionRomBufferForCanvases()) {
    const canvas = createTileCanvas(romChunk);
    canvas._tileIndex = tileIndex;
    tileSetDiv.appendChild(canvas);
    tileIndex += ~~(_romPartitionSize / CHR_BYTE_SIZE);
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

  const ctx = cmn.getContext2DNA(_unscaledCanvas);
  const imgData = ctx.createImageData(CHR_WIDTH, CHR_HEIGHT);

  cmn.writeImageData(imgData, tile, 0, 0, _appState.palette.data);
  ctx.putImageData(imgData, 0, 0);

  // Draw off-screen canvas to the scaled on-screen canvas.
  const ctx2 = cmn.getContext2DNA(_selectedCanvas);
  const tileIndex = _appState.selectedTileIndex - _selectedCanvas._tileIndex;
  const x = (tileIndex % _tileSetWidth) * CHR_WIDTH;
  const y = ~~(tileIndex / _tileSetWidth) * CHR_HEIGHT;
  ctx2.drawImage(_unscaledCanvas,
    0, 0, CHR_WIDTH, CHR_HEIGHT, // src
    x, y, CHR_WIDTH, CHR_HEIGHT); // dest
}

/** Look up selected tile and fire the tileSelected event. */
function onCanvasClick(event) {
  if (!_appState.rom) return;

  // pixelXY = mouseEvent.offset*
  // tileXY = mouseEvent.offset* >> 3 // Div 8
  // pixelInTileXY = mouseEvent.offset* % 8

  _selectedCanvas = event.srcElement;
  const tileX = ~~(event.offsetX / CHR_WIDTH / _zoomFactor);
  const tileY = ~~(event.offsetY / CHR_HEIGHT / _zoomFactor);
  _appState.selectedTileIndex = _selectedCanvas._tileIndex + (tileY * _tileSetWidth) + tileX;
  document.dispatchEvent(new Event('tileSelected'));
}

/** Remove canvas elements under the tileSetWindow. */
function removeCanvases() {
  domu.getChildElements(
    document.getElementById('tileSetWindow'))
    .forEach(c => c.remove());
}

/** Changes the zoom factor and redraws the tileSet. */
function onZoomClick(event) {
  // Parse the # from 'zoom1x'
  const zoomFactor = parseInt(event.srcElement.id.substr(-2, 1));
  if (zoomFactor === _zoomFactor) return;
  // Change CSS classes to show which zoom factor is selected.
  event.srcElement.className = 'buttonLikeSelectedText';
  document.getElementById(`zoom${_zoomFactor}x`).className = 'buttonLikeText';

  const tileSetWindow = document.getElementById('tileSetWindow');
  const scrollTop = tileSetWindow.scrollTop;
  const zoomRatio = zoomFactor / _zoomFactor;

  calcZoomFactor(zoomFactor);
  _unscaledCanvas = createUnscaledCanvas();
  removeCanvases(); // TODO: Re-use existing canvases?
  if (!_appState.rom) return;
  drawTileSet();

  // HACK: Finely tuned to continue looking at the middle tiles after zoom.
  if (zoomRatio > 3) {
    tileSetWindow.scrollTop = (scrollTop * zoomRatio * zoomRatio) + (tileSetWindow.clientHeight * 7);
  } else if (zoomRatio > 1) {
    tileSetWindow.scrollTop = (scrollTop * zoomRatio * zoomRatio) + (tileSetWindow.clientHeight * 1.5);
  } else { // zoomRatio < 1
    tileSetWindow.scrollTop = (scrollTop * zoomRatio * zoomRatio) - (tileSetWindow.clientHeight * zoomRatio);
  }
}

function createUnscaledCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = _tileSetWidth * CHR_WIDTH;
  canvas.height = _canvasHeight;
  return canvas;
}

function onTileDataChanged(e) {
  drawSelectedTile(e.detail.tile);
}

function onPaletteChanged() {
  if (_appState.rom) redrawTileSet();
}

/** Called by renderer.js to initialize. */
document.addEventListener('appInit', function(e) {
  _appState = e.detail.appState;

  calcZoomFactor(2);
  document.getElementById('zoom2x').className = 'buttonLikeSelectedText';
  _unscaledCanvas = createUnscaledCanvas();

  _unscaledCanvas = document.createElement('canvas');
  _unscaledCanvas.width = _tileSetWidth * CHR_WIDTH;
  _unscaledCanvas.height = _canvasHeight;

  document.getElementById('zoom1x').addEventListener('click', onZoomClick);
  document.getElementById('zoom2x').addEventListener('click', onZoomClick);
  document.getElementById('zoom4x').addEventListener('click', onZoomClick);

  document.addEventListener('tileDataChanged', onTileDataChanged);
  document.addEventListener('paletteChanged', onPaletteChanged);
});

/** Loads and displays the tileset of the given ROM. */
exports.loadROM = function() {
  _selectedCanvas = null;

  // TODO: Re-use canvases?
  removeCanvases();
  drawTileSet();
}
