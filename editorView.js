// Code for the editorView that allows editing of a tile.

const cmn = require('./common.js')
const {CHR_WIDTH, CHR_HEIGHT} = require('./nesPatternTable.js')

const EDITOR_SCALE = 16

let _editorUnscaledCanvas = null  // Offscreen canvas.

/**
 * Called by renderer.js to initialize.
 */
exports.init = function() {
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

  _editorUnscaledCanvas = document.createElement('canvas')
  _editorUnscaledCanvas.width = CHR_WIDTH
  _editorUnscaledCanvas.height = CHR_HEIGHT
}

/**
 * Draws a tile in the Editor window.
 */
exports.drawEditorCanvas = function(tile) {
  // Write pixels to offscreen unscaled canvas then drawImage to visible scaled canvas.

  // getContext with {alpha: false} is important here because we re-draw over the old tile.
  let ctx = cmn.getContext2DNA(_editorUnscaledCanvas)
  imgData = ctx.createImageData(CHR_WIDTH, CHR_HEIGHT)
  cmn.writeImageData(imgData, tile, 0, 0)
  ctx.putImageData(imgData, 0, 0)

  let canvas = document.getElementById('editorCanvas')
  let ctx2 = cmn.getContext2DNA(canvas)
  ctx2.drawImage(_editorUnscaledCanvas, 0, 0)
}
