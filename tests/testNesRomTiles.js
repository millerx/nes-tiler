const assert = require('assert');
assert.sequal = assert.strictEqual;
assert.dsequal = assert.deepStrictEqual;
const cmn = require('../common.js');
const nesChr = require('../nesPatternTable.js');
const {CHR_PIXEL_SIZE, CHR_BYTE_SIZE} = require('../nesPatternTable.js');
const tiles = require('../nesRomTiles.js');

function makeTileBytesOfColor(color) {
  const tile = new Uint8Array(CHR_PIXEL_SIZE).fill(color)
  return nesChr.interlaceTile(tile)
}

// Make tiles of color [0..3]
const TILE_BYTES_0 = new Uint8Array(CHR_BYTE_SIZE)
const TILE_BYTES_1 = makeTileBytesOfColor(1)
const TILE_BYTES_2 = makeTileBytesOfColor(2)

function makeRomBuffer(tileByteArr) {
  var buffer = new Uint8Array(tileByteArr.length * CHR_BYTE_SIZE)
  for (let i = 0; i < tileByteArr.length; ++i) {
    buffer.set(tileByteArr[i], i*CHR_BYTE_SIZE)
  }
  return buffer
}

function arrayContainsOnly(arr, value) {
  for (let i = 0; i < arr.length; ++i) {
    if (value !== arr[i]) return false
  }
  return true
}

// Tests reading and writing tiles
(function(){
  const rom = {
    dataOffset: 0,
    buffer: makeRomBuffer([TILE_BYTES_0, TILE_BYTES_1, TILE_BYTES_2])
  }

  // Read tile 1 as all 1's.
  const tileBefore = tiles.readTile(rom, 1)
  assert(arrayContainsOnly(tileBefore, 1))

  // Write all 3's to tile 1.
  const tile3 = new Uint8Array(CHR_PIXEL_SIZE).fill(3)
  tiles.writeTile(rom, tile3, 1)

  // Now read tile 1 as all 3's.
  const tileAfter = tiles.readTile(rom, 1)
  assert(arrayContainsOnly(tileAfter, 3))
})()
