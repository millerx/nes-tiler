/**
 * Functions to encode and decode the NES pattern table aka tiles.
 */

exports.CHR_WIDTH = 8
exports.CHR_HEIGHT = 8
exports.CHR_PIXEL_SIZE = 8*8
exports.CHR_BYTE_SIZE = 16  // Bytes in an interlaced tile.

/**
 * Takes 16 bytes that is an interlaced tile.
 * Returns an 8x8 array of bytes.  Each byte is a color value [0..3]
 *
 * https://opcode-defined.quora.com/How-NES-Graphics-Work-Pattern-tables
 * http://wiki.nesdev.com/w/index.php/PPU_pattern_tables
 */
exports.deinterlaceTile = function(bytes) {
  let tile = new Uint8Array(8*8)

  // First interlaced byte
  // Put each bit in into it's own tile byte.
  for (let y = 0; y < 8; ++y) {
    for (let x = 0; x < 8; ++x) {
      tile[(y*8)+x] |= 0x01 & (bytes[y] >> (7-x))
    }
  }

  // Second interlaced byte
  // OR each bit into bit 1 slot in the tile.
  bytes = bytes.slice(8)
  for (let y = 0; y < 8; ++y) {
    for (let x = 0; x < 7; ++x) {
      tile[(y*8)+x] |= 0x02 & (bytes[y] >> (6-x))
    }
    // For the last bit we cannot shift right -1 so we shift left 1
    tile[(y*8)+7] |= 0x02 & (bytes[y] << 1)
  }

  return tile
}

/**
 * Takes an 8x8 array of bytes.  Each byte is a color value [0..3]
 * Returns a 16 byte array that is the interlated tile as encoded by the NES PPU.
 *
 * https://opcode-defined.quora.com/How-NES-Graphics-Work-Pattern-tables
 * http://wiki.nesdev.com/w/index.php/PPU_pattern_tables
 */
exports.interlaceTile = function(colorValues) {
  let tile = new Uint8Array(16)

  for (let y = 0; y < 8; ++y) {
    for (let i = 0; i < 8; ++i) {
      tile[y] |= (colorValues[y*8+i] & 1) << (7-i)
    }

    for (let i = 0; i < 7; ++i) {
      tile[y+8] |= (colorValues[y*8+i] & 2) << (6-i)  // since the value is at 2nd bit we need to shift one less.
    }
    tile[y+8] |= (colorValues[y*8+7] & 2) >> 1 // special case for right-most pixel.  Left shift 1.    
  }

  return tile
}
