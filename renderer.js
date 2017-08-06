// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer} = require('electron')

const CHR_WIDTH = 8
const CHR_HEIGHT = 8
const CHR_PIXEL_SIZE = 8*8
const RGBA_LEN = 4
const TILESET_WIDTH = 40  // Tiles to draw on a single row.
const EDITOR_SCALE = 16

let _tileSet = null

// Not used.
function drawGrayscaleBytes(canvas, rom) {
  let ctx = canvas.getContext('2d', {alpha: false})

  let id = ctx.createImageData(canvas.width, canvas.height)
  for (let i = 0; i < rom.length; ++i) {
    let di = i * RGBA_LEN
    id.data[di++] = rom[i]
    id.data[di++] = rom[i]
    id.data[di++] = rom[i]
    id.data[di++] = 255
  }
  ctx.putImageData(id, 0, 0)
}

// Not used.
function drawRom(rom) {
  let canvas = document.getElementById('romCanvas')
  // Resize the height of the canvas based on the size of the rom.
  canvas.height = rom.length / canvas.width

  drawGrayscaleBytes(canvas, rom)
}

/**
 * Called when a ROM is loaded.
 * rom  Buffer containing rom data.
 */
// Not used.
ipcRenderer.on('rom-loaded', (event, rom) => {
  drawRom(rom)
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

  let ctx = canvas.getContext('2d', {alpha: false})

  imgData = ctx.createImageData(canvas.width, canvas.height)

  for (i = 0; i < tiles.length; ++i) {
    writeImageData(imgData, tiles[i], (i % TILESET_WIDTH), ~~(i / TILESET_WIDTH))
  }

  ctx.putImageData(imgData, 0, 0)
}

/**
 * Called when the tileset is loaded.
 * tileSet  Array of tiles.  Tiles are 8*8 ArrayBuffers.
 */
ipcRenderer.on('tileSet-loaded', (event, tileSet) => {
  _tileSet = tileSet
  init()
  drawTileSet(tileSet)
})

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

  drawEditorCanvas(tileX, tileY)
}

function initRomCanvas() {
  let canvas = document.getElementById('romCanvas')
  canvas.addEventListener('click', onRomCanvasClick)
}

function initEditorCanvas() {
  let canvas = document.getElementById('editorCanvas')
  // Resize the canvas.
  canvas.width = EDITOR_SCALE * CHR_WIDTH
  canvas.height = EDITOR_SCALE * CHR_HEIGHT

  let ctx = canvas.getContext('2d', {alpha: false})
  ctx.imageSmoothingEnabled = false
  ctx.scale(EDITOR_SCALE, EDITOR_SCALE)
}

/**
 * Draws a tile in the Editor window.
 * tileX/Y are tile coordinates.
 */
function drawEditorCanvas(tileX, tileY) {
  let canvas = document.getElementById('editorCanvas')

  const romCanvas = document.getElementById('romCanvas')

  // getContext with {alpha: false} is important here because we re-draw over the old tile.
  let ctx = canvas.getContext('2d', {alpha: false})

  ctx.drawImage(romCanvas,
    tileX*CHR_WIDTH, tileY*CHR_HEIGHT, CHR_WIDTH, CHR_HEIGHT,
    0, 0, CHR_WIDTH, CHR_HEIGHT)
}

function init() {
  initRomCanvas()
  initEditorCanvas()
}