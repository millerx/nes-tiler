const {CHR_WIDTH, CHR_HEIGHT, CHR_PIXEL_SIZE, CHR_BYTE_SIZE} = require('./nesPatternTable.js')

const RGBA_LEN = 4

exports.getContext2DNA = function(canvas) {
  return canvas.getContext('2d', {alpha: false})
}

/**
 * Array of colors.  Each color is an rgba array.
 **/
exports.palette = [
  [0, 0, 0, 255], // black
  [255, 0, 0, 255], // red
  [0, 0, 255, 255], // blue
  [255, 255, 255, 255] // white
]

/**
 * Writes pixels of a tile to ImageData.
 * imgData  ImageData to write to.
 * tile     Tile to write.
 * x,y      Coordinates in tiles of where to write the pixels.  1,1 would be pixel position 8,8.
 */
exports.writeImageData = function(imgData, tile, x, y) {
  let idI = (y * CHR_HEIGHT * imgData.width * RGBA_LEN) + (x * CHR_WIDTH * RGBA_LEN)  // index into imageData
  let tI = 0  // index into tile data
  while (tI < CHR_PIXEL_SIZE) {
    const color = exports.palette[tile[tI]]
    imgData.data[idI++] = color[0]
    imgData.data[idI++] = color[1]
    imgData.data[idI++] = color[2]
    imgData.data[idI++] = color[3]

    if (++tI % CHR_WIDTH === 0) {
      idI += (imgData.width - CHR_WIDTH) * RGBA_LEN
    }
  }
}

function to2DigitHex(d) {
  if (d < 16) {
    return '0'+d.toString(16)
  } else {
    return d.toString(16)
  }
}

/**
 * Takes an RGBA array and turns it into a CSS color string.
 */
exports.toCSSColorStr = function(color) {
  // Using # notation the alpha channel is not represented.
  return '#'+to2DigitHex(color[0])+to2DigitHex(color[1])+to2DigitHex(color[2])
}

exports.copyIntoArray = function(targetArray, targetOffset, sourceArray, sourceOffset, sourceLength) {
  sourceOffset = sourceOffset || 0
  sourceLength = sourceLength || sourceArray.length

  const sourceEndOffset = sourceOffset + sourceLength
  while (sourceOffset < sourceEndOffset) {
    targetArray[targetOffset] = sourceArray[sourceOffset]
    ++targetOffset
    ++sourceOffset
  }
}

exports.colorTileToString = function(colorTile) {
  let arr = []
  for (let i = 0; i < CHR_PIXEL_SIZE; i+=CHR_WIDTH) {
    arr.push(colorTile.slice(i, i+CHR_WIDTH).join(' '))
  }
  return arr.join('\n')
}

exports.printInterlacedTile = function(tile) {
  tile.forEach((i) => process.stdout.write(i.toString(16)+' '))
  console.log()
}
