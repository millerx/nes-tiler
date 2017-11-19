const assert = require('assert');
assert.dsequal = assert.deepStrictEqual;
const cmn = require('../common.js');

// Test CSS RGB conversion functions.
(function() {
  assert.dsequal([50,51,52,255], cmn.toRGBA('rgb(50, 51, 52)'))
  assert('#FF0032', cmn.toCSSColorStr([255,0,50]));
})();
