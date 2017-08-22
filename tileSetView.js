// Code for the tileSetView that displays all tiles in a ROM.

const {ipcRenderer} = require('electron')
const cmn = require('./common.js')
const nesChr = require('./nesPatternTable.js')
const {CHR_WIDTH, CHR_HEIGHT, CHR_BYTE_SIZE} = require('./nesPatternTable.js')

const TILESET_WIDTH = 40  // Tiles to draw on a single row.

let _tileSetBytes = null
let _onSelectedFn = null

/**
 * Called by renderer.js to initialize.
 */
exports.init = function() {
  let canvas = document.getElementById('tileSetCanvas')
  canvas.width = TILESET_WIDTH * CHR_WIDTH  // 320
  canvas.addEventListener('click', onClick)
}

/**
 * Loads and displays the given tileset.
 */
exports.loadTileSet = function(tileSetBytes) {
  _tileSetBytes = tileSetBytes
  let canvas = document.getElementById('tileSetCanvas')

  // Adjust canvas size to number of tiles.
  const tileCount = ~~(tileSetBytes.length / CHR_BYTE_SIZE)
  canvas.height = (tileCount / TILESET_WIDTH) * CHR_HEIGHT

  let ctx = cmn.getContext2DNA(canvas)

  const imgData = ctx.createImageData(canvas.width, canvas.height)

  // TODO: What if tileSetBytes.length is not evenly divisible by CHR_BYTE_SIZE
  let ti = 0  // tileIndex
  for (let i = 0; i < tileSetBytes.length; i += CHR_BYTE_SIZE) {
    const tileBytes = tileSetBytes.slice(i, i+CHR_BYTE_SIZE)
    const tile = nesChr.deinterlaceTile(tileBytes)
    cmn.writeImageData(imgData, tile, (ti % TILESET_WIDTH), ~~(ti / TILESET_WIDTH))
    ++ti
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

/**
 * Look up selected tile and call the onSelected function.
 */
function onClick(mouseEvent) {
  if (!_onSelectedFn) return

  // pixelXY = mouseEvent.offset*
  // tileXY = mouseEvent.offset* >> 3 // Div 8
  // pixelInTileXY = mouseEvent.offset* % 8

  const tileX = mouseEvent.offsetX >> 3  // Divide by 8
  const tileY = mouseEvent.offsetY >> 3  // Divide by 8
  const tileIndex = (tileY * TILESET_WIDTH) + tileX
  const byteIndex = tileIndex * CHR_BYTE_SIZE

  const tileBytes = _tileSetBytes.slice(byteIndex, byteIndex + CHR_BYTE_SIZE)
  _onSelectedFn(tileBytes)
}
