const {CHR_WIDTH, CHR_HEIGHT, CHR_PIXEL_SIZE} = require('./nesPatternTable.js')

const RGBA_LEN = 4

exports.getContext2DNA = function(canvas) {
  return canvas.getContext('2d', {alpha: false})
}

/**
 * Writes pixels of a tile to ImageData.
 * imgData  ImageData to write to.
 * tile     Tile to write.
 * x,y      Coordinates in tiles of where to write the pixels.  1,1 would be pixel position 8,8.
 */
exports.writeImageData = function(imgData, tile, x, y) {
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
