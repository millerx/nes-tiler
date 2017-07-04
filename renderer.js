// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer} = require('electron')

const CHR_WIDTH = 8
const CHR_HEIGHT = 8
const CHR_PIXEL_SIZE = 8*8

// Not used.
function drawGrayscaleBytes(canvas, rom) {
  let ctx = canvas.getContext('2d')

  let id = ctx.createImageData(canvas.width, canvas.height)
  for (let i = 0; i < rom.length; ++i) {
    let di = i * 4
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

// Not used.
function generateTestData() {
  const zeroArray = new Uint8Array(8*8)
  const oneArray = new Uint8Array(8*8).fill(1)
  const twoArray = new Uint8Array(8*8).fill(2)
  const threeArray = new Uint8Array(8*8).fill(3)

  return [
    zeroArray, oneArray, twoArray, threeArray,
    zeroArray, oneArray, twoArray, threeArray,
    zeroArray, oneArray, twoArray, threeArray,
    zeroArray, oneArray, twoArray, threeArray
  ]
}

function makePixelImageData(ctx, r, g, b) {
  var id = ctx.createImageData(1, 1)
  id.data[0] = r; id.data[1] = g; id.data[2] = b; id.data[3] = 255
  return id
}

function drawTileSet(tiles) {
  let canvas = document.getElementById('romCanvas')

  // TODO: Adjust canvas size to number of tiles.

  //tiles = generateTestData()

  let ctx = canvas.getContext('2d')

  const palette = [
    makePixelImageData(ctx, 255, 255, 255),
    makePixelImageData(ctx, 255, 0, 0),
    makePixelImageData(ctx, 0, 255, 0),
    makePixelImageData(ctx, 0, 0, 255)
  ]

  let cx = 0; let cy = 0 // canvas x,y
  tiles.forEach(tile => {
    for (ty = 0; ty < CHR_HEIGHT; ++ty) {
      for (tx = 0; tx < CHR_WIDTH; ++tx) {
        const color = palette[tile[ty*CHR_WIDTH + tx]]
        ctx.putImageData(color, cx+tx, cy+ty)
      }
    }

    cx += CHR_WIDTH
    if (cx >= canvas.width) {
      cx %= canvas.width
      cy += CHR_HEIGHT
    }
  })
}

/**
 * Called when the tileset is loaded.
 * tileSet  Array of tiles.  Tiles are 8*8 ArrayBuffers.
 */
ipcRenderer.on('tileSet-loaded', (event, tileSet) => {
  drawTileSet(tileSet)
})
