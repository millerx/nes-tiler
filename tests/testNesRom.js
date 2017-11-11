const assert = require('assert');
assert.sequal = assert.strictEqual;
assert.dsequal = assert.deepStrictEqual;
const nesRom = require('../nesRom');

// Not a real ROM header but flags contain values that are easy to spot.
// Mapper 71 (0x47) is encoded in the high bytes of flags6 and flags7.
const INES_HEADER = [0x4e, 0x45, 0x53, 0x1a, 0x08, 0x10, 0x76, 0x47, 0x08, 0x09, 0x0a]

const PADDED_INES_SIZE = 16

function makeLinearArray(size) {
  let buffer = new Uint8Array(size)
  for (let i = 0; i < size; ++i) {
    buffer[i] = i
  }
  return buffer
}
const TEST_DATA = makeLinearArray(8)

// iNES header padded to 16 bytes followed by a linearly incrementing set of test bytes.
function makeTestRom() {
  let buffer = new Uint8Array(PADDED_INES_SIZE + TEST_DATA.length)
  buffer.set(INES_HEADER)
  buffer.set(TEST_DATA, PADDED_INES_SIZE)
  return buffer
}
const TEST_ROM = makeTestRom();

// Test readRom()
(function(){
  { // Basic functionality.
    const rom = nesRom.readRom(TEST_ROM)
    assert.dsequal({
      prgRomSize: 8,
      chrRomSize: 16,
      flags6: 0x76,
      flags7: 0x47,
      prgRamSize: 8,
      flags9: 9,
      flags10: 10,
      mapper: 71
    }, rom.inesHeader)
    assert.sequal(TEST_ROM, rom.buffer)
    assert.equal(16, rom.dataOffset)
  }

  { // ROM without iNES header.
    const rom = nesRom.readRom(TEST_DATA)
    assert.sequal(null, rom.inesHeader)
    assert.dsequal(TEST_DATA, rom.buffer)
    assert.equal(0, rom.dataOffset)
  }
})()