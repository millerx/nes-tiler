// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer} = require('electron')

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
ipcRenderer.on('rom-loaded', (event, rom) => {
  drawRom(rom)
})