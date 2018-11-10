const assert = require('assert');
assert.sequal = assert.strictEqual;
assert.dsequal = assert.deepStrictEqual;
const nesPTable = require('../nesPatternTable.js');
const cmn = require('../common.js');

const PATTERN_TABLE = new Uint8Array([
 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7e, 0x3c,
 0x3c, 0x7e, 0x7e, 0xff, 0xff, 0xff, 0x42, 0x00]);

const COLOR_TILE = new Uint8Array([
 0, 0, 2, 2, 2, 2, 0, 0,
 0, 2, 2, 2, 2, 2, 2, 0,
 0, 2, 2, 2, 2, 2, 2, 0,
 2, 2, 2, 2, 2, 2, 2, 2,
 2, 2, 2, 2, 2, 2, 2, 2,
 2, 2, 2, 2, 2, 2, 2, 2,
 0, 3, 1, 1, 1, 1, 3, 0,
 0, 0, 1, 1, 1, 1, 0, 0]);

// Tests deinterlaceTile and interlaceTile functions.
(function(){
  const colorTile = nesPTable.deinterlaceTile(PATTERN_TABLE)
  assert.dsequal(COLOR_TILE, colorTile)
  //console.log(cmn.colorTileToString(colorTile))

  const tile = nesPTable.interlaceTile(colorTile)
  assert.dsequal(PATTERN_TABLE, tile)
  //cmn.printInterlacedTile(tile)

  // From the above we have proven reversability.
  // deinterlaceTile(PATTERN_TABLE) -> interlaceTile(colorTile) -> PATTERN_TABLE
})();
