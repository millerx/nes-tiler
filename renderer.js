// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer} = require('electron')
const nesRom = require('./nesRom.js')
const nesChr = require('./nesPatternTable.js')

const CHR_WIDTH = 8
const CHR_HEIGHT = 8
const CHR_PIXEL_SIZE = 8*8
const RGBA_LEN = 4
const TILESET_WIDTH = 40  // Tiles to draw on a single row.
const EDITOR_SCALE = 16

let _tileSet = null
let _editorUnscaledCanvas = null  // Offscreen canvas for Editor view.

function getContext2DNA(canvas) {
  return canvas.getContext('2d', {alpha: false})
}

/**
 * Initialize functions.
 */

function initRomCanvas() {
  let canvas = document.getElementById('romCanvas')
  canvas.addEventListener('click', onRomCanvasClick)
}

function initEditorCanvas() {
  let canvas = document.getElementById('editorCanvas')
  // Resize the canvas.
  canvas.width = EDITOR_SCALE * CHR_WIDTH
  canvas.height = EDITOR_SCALE * CHR_HEIGHT

  let ctx = getContext2DNA(canvas)
  ctx.imageSmoothingEnabled = false
  ctx.scale(EDITOR_SCALE, EDITOR_SCALE)

  // Canvas is white by default.
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, CHR_WIDTH, CHR_HEIGHT)

  _editorUnscaledCanvas = document.createElement('canvas')
  _editorUnscaledCanvas.width = CHR_WIDTH
  _editorUnscaledCanvas.height = CHR_HEIGHT
}

function init() {
  initRomCanvas()
  initEditorCanvas()
}
init()

/**
 * Called when a ROM is loaded.
 * rom  NES ROM object.
 */
ipcRenderer.on('rom-loaded', (event, rom) => {
  _tileSet = nesChr.deinterlaceTileSet(rom.rom_no_header)
  drawTileSet(_tileSet)
})

/**
 * Writes pixels of a tile to ImageData.
 * imgData  ImageData to write to.
 * tile     Tile to write.
 * x,y      Coordinates in tiles of where to write the pixels.  1,1 would be pixel position 8,8.
 */
function writeImageData(imgData, tile, x, y) {
  var idI = (y * CHR_HEIGHT * imgData.width * RGBA_LEN) + (x * CHR_WIDTH * RGBA_LEN)  // index into imageData
  var tI = 0  // index into tile data
  while (tI < CHR_PIXEL_SIZE) {
    switch (tile[tI]) {
      case 0:
        imgData.data[idI++] = 0
        imgData.data[idI++] = 0
        imgData.data[idI++] = 0
        imgData.data[idI++] = 255
        break
      case 1:
        imgData.data[idI++] = 255
        imgData.data[idI++] = 0
        imgData.data[idI++] = 0
        imgData.data[idI++] = 255
        break
      case 2:
        imgData.data[idI++] = 0
        imgData.data[idI++] = 0
        imgData.data[idI++] = 255
        imgData.data[idI++] = 255
        break
      case 3:
        imgData.data[idI++] = 255
        imgData.data[idI++] = 255
        imgData.data[idI++] = 255
        imgData.data[idI++] = 255
        break
    } // switch

    if (++tI % CHR_WIDTH === 0) {
      idI += (imgData.width - CHR_WIDTH) * RGBA_LEN
    }
  } // while tI
}

function drawTileSet(tiles) {
  let canvas = document.getElementById('romCanvas')

  // Adjust canvas size to number of tiles.
  canvas.height = tiles.length / TILESET_WIDTH * CHR_HEIGHT

  let ctx = getContext2DNA(canvas)

  imgData = ctx.createImageData(canvas.width, canvas.height)

  for (i = 0; i < tiles.length; ++i) {
    writeImageData(imgData, tiles[i], (i % TILESET_WIDTH), ~~(i / TILESET_WIDTH))
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

function onRomCanvasClick(mouseEvent) {
  // pixelXY = mouseEvent.offset*
  // tileXY = mouseEvent.offset* >> 3 // Div 8
  // pixelInTileXY = mouseEvent.offset* % 8

  const tileX = mouseEvent.offsetX >> 3  // Divide by 8
  const tileY = mouseEvent.offsetY >> 3  // Divide by 8
  const tileIndex = (tileY * TILESET_WIDTH) + tileX

  drawEditorCanvas(_tileSet[tileIndex])
}

/**
 * Draws a tile in the Editor window.
 */
function drawEditorCanvas(tile) {
  // Write pixels to offscreen unscaled canvas then drawImage to visible scaled canvas.

  // getContext with {alpha: false} is important here because we re-draw over the old tile.
  let ctx = getContext2DNA(_editorUnscaledCanvas)
  imgData = ctx.createImageData(CHR_WIDTH, CHR_HEIGHT)
  writeImageData(imgData, tile, 0, 0)
  ctx.putImageData(imgData, 0, 0)

  let canvas = document.getElementById('editorCanvas')
  let ctx2 = getContext2DNA(canvas)
  ctx2.drawImage(_editorUnscaledCanvas, 0, 0)
}
