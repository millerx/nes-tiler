// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer} = require('electron')

const CHR_WIDTH = 8
const CHR_HEIGHT = 8
const CHR_PIXEL_SIZE = 8*8
const RGBA_LEN = 4

// Not used.
function drawGrayscaleBytes(canvas, rom) {
  let ctx = canvas.getContext('2d')

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
        imgData.data[idI++] = 0
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
  const TILE_WIDTH = 40  // Tiles to draw on a single row.
  canvas.height = tiles.length / TILE_WIDTH * CHR_HEIGHT

  let ctx = canvas.getContext('2d')

  imgData = ctx.createImageData(canvas.width, canvas.height)

  for (i = 0; i < tiles.length; ++i) {
    writeImageData(imgData, tiles[i], (i % TILE_WIDTH), ~~(i / TILE_WIDTH))
  }

  ctx.putImageData(imgData, 0, 0)
}

/**
 * Called when the tileset is loaded.
 * tileSet  Array of tiles.  Tiles are 8*8 ArrayBuffers.
 */
ipcRenderer.on('tileSet-loaded', (event, tileSet) => {
  drawTileSet(tileSet)
})
