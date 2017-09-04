// Code for the tileSetView that displays all tiles in a ROM.

const {ipcRenderer} = require('electron')
const cmn = require('./common.js')
const nesChr = require('./nesPatternTable.js')
const {CHR_WIDTH, CHR_HEIGHT, CHR_BYTE_SIZE} = require('./nesPatternTable.js')

const TILESET_WIDTH = 40  // Tiles to draw on a single row.

let _rom = null  // ROM being viewed.
let _selectedTileIndex = -1  // Index of selected tile.  -1 if no tile is selected.
let _onSelectedFn = null  // fn(tileBytes)  Function called when a tile is selected.

/**
 * Called by renderer.js to initialize.
 */
exports.init = function() {
  let canvas = document.getElementById('tileSetCanvas')
  canvas.width = TILESET_WIDTH * CHR_WIDTH  // 320
  canvas.addEventListener('click', onClick)
}

/**
 * Loads and displays the tileset of the given ROM.
 */
exports.loadTileSet = function(rom) {
  _rom = rom
  let canvas = document.getElementById('tileSetCanvas')

  // Adjust canvas size to number of tiles.
  const tileCount = ~~((rom.buffer.length - rom.dataOffset) / CHR_BYTE_SIZE)
  canvas.height = (tileCount / TILESET_WIDTH) * CHR_HEIGHT

  let ctx = cmn.getContext2DNA(canvas)

  const imgData = ctx.createImageData(canvas.width, canvas.height)

  let ti = 0  // tileIndex
  for (let i = _rom.dataOffset; i < _rom.buffer.length; i += CHR_BYTE_SIZE) {
    // TODO: Remove the slice below by passing in an offset to deinterlaceTile and have it read no more then CHR_BYTE_SIZE
    // TODO: Reuse the same tile buffer instead of creating one with every call to deinterlaceTile.
    const tileBytes = _rom.buffer.slice(i, i+CHR_BYTE_SIZE)
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
  _selectedTileIndex = (tileY * TILESET_WIDTH) + tileX
  _onSelectedFn(_selectedTileIndex)
}

exports.updateTile = function(tileIndex) {
  const tileBytes = cmn.sliceTileBytes(_rom, tileIndex)
  const tile = nesChr.deinterlaceTile(tileBytes)
  drawTile(tile)
}

function drawTile(tile) {
  let canvas = document.getElementById('tileSetCanvas')
  let ctx = cmn.getContext2DNA(canvas)
  const imgData = ctx.createImageData(CHR_WIDTH, CHR_HEIGHT)

  cmn.writeImageData(imgData, tile, 0, 0)

  const x = (_selectedTileIndex % TILESET_WIDTH) * CHR_WIDTH
  const y = ~~(_selectedTileIndex / TILESET_WIDTH) * CHR_HEIGHT
  ctx.putImageData(imgData, x, y)
}