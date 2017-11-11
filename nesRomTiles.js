/**
 * Manipulates tiles in an NES ROM.
 */

const cmn = require('./common.js')
const nesChr = require('./nesPatternTable.js')
const {CHR_BYTE_SIZE} = require('./nesPatternTable.js')

function getByteIndexOfTile(rom, tileIndex) {
  return (tileIndex * CHR_BYTE_SIZE) + rom.dataOffset
}

function sliceTileBytes(rom, tileIndex) {
  const byteIndex = getByteIndexOfTile(rom, tileIndex)
  return rom.buffer.slice(byteIndex, byteIndex + CHR_BYTE_SIZE)
}

exports.readTile = function(rom, tileIndex) {
  const tileBytes = sliceTileBytes(rom, tileIndex)
  return nesChr.deinterlaceTile(tileBytes)
}

exports.writeTile = function(rom, tile, tileIndex) {
  const tileBytes = nesChr.interlaceTile(tile)
  const byteIndex = getByteIndexOfTile(rom, tileIndex)
  cmn.copyIntoArray(rom.buffer, byteIndex, tileBytes)
}