// Code for the tileSetView that displays all tiles in a ROM.

const {ipcRenderer} = require('electron')
const {CHR_WIDTH, CHR_HEIGHT} = require('./nesPatternTable.js')
const cmn = require('./common.js')

const TILESET_WIDTH = 40  // Tiles to draw on a single row.

let _tileSet = null
let _onSelectedFn = null

/**
 * Called by renderer.js to initialize.
 */
exports.init = function() {
  let canvas = document.getElementById('tileSetCanvas')
  canvas.addEventListener('click', onTileSetCanvasClick)
}

/**
 * Draws the given tileset.
 */
exports.drawTileSet = function(tiles) {
  _tileSet = tiles
  
  let canvas = document.getElementById('tileSetCanvas')

  // Adjust canvas size to number of tiles.
  canvas.height = tiles.length / TILESET_WIDTH * CHR_HEIGHT

  let ctx = cmn.getContext2DNA(canvas)

  imgData = ctx.createImageData(canvas.width, canvas.height)

  for (i = 0; i < tiles.length; ++i) {
    cmn.writeImageData(imgData, tiles[i], (i % TILESET_WIDTH), ~~(i / TILESET_WIDTH))
  }

  ctx.putImageData(imgData, 0, 0)
}

/**
 * Not used but keeping for debugging.
 */
function drawGreenBox(canvas, x, y) {
  let ctx = canvas.getContext('2d')
  ctx.fillStyle = "rgba(0, 255, 0, 0.5)"
  ctx.fillRect(x, y, 8, 8)
}

/**
 * Set function called when tile is selected.
 */
exports.onSelected = function(fn) {
  _onSelectedFn = fn
}

function onTileSetCanvasClick(mouseEvent) {
  // pixelXY = mouseEvent.offset*
  // tileXY = mouseEvent.offset* >> 3 // Div 8
  // pixelInTileXY = mouseEvent.offset* % 8

  const tileX = mouseEvent.offsetX >> 3  // Divide by 8
  const tileY = mouseEvent.offsetY >> 3  // Divide by 8
  const tileIndex = (tileY * TILESET_WIDTH) + tileX

  if (_onSelectedFn) _onSelectedFn(_tileSet[tileIndex])
}
