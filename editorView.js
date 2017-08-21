// Code for the editorView that allows editing of a tile.

const cmn = require('./common.js')
const {CHR_WIDTH, CHR_HEIGHT} = require('./nesPatternTable.js')

const EDITOR_SCALE = 16

let _unscaledCanvas = null  // Offscreen canvas.

/**
 * Initialize visible canvas.
 */
function initEditorCanvas() {
  let canvas = document.getElementById('editorCanvas')
  // Resize the canvas.
  canvas.width = EDITOR_SCALE * CHR_WIDTH
  canvas.height = EDITOR_SCALE * CHR_HEIGHT

  let ctx = cmn.getContext2DNA(canvas)
  ctx.imageSmoothingEnabled = false
  ctx.scale(EDITOR_SCALE, EDITOR_SCALE)

  // Canvas is white by default.
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, CHR_WIDTH, CHR_HEIGHT)
}

function createUnscaledCanvas() {
  let canvas = document.createElement('canvas')
  canvas.width = CHR_WIDTH
  canvas.height = CHR_HEIGHT
  return canvas
}

/**
 * Called by renderer.js to initialize.
 */
exports.init = function() {
  initEditorCanvas()
  _unscaledCanvas = createUnscaledCanvas()
}

/**
 * Draws a tile in the Editor window.
 */
exports.drawEditorCanvas = function(tile) {
  // Write pixels to the off-screen unscaled canvas.
  // getContext with {alpha: false} is important here because we re-draw over the old tile.
  let ctx = cmn.getContext2DNA(_unscaledCanvas)
  let imgData = ctx.createImageData(CHR_WIDTH, CHR_HEIGHT)
  cmn.writeImageData(imgData, tile, 0, 0)
  ctx.putImageData(imgData, 0, 0)

  // Draw off-screen canvas to the scaled on-screen canvas.
  let canvas = document.getElementById('editorCanvas')
  let ctx2 = cmn.getContext2DNA(canvas)
  ctx2.drawImage(_unscaledCanvas, 0, 0)
}
