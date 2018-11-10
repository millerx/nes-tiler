// Code for the paletteView that allows changing the palette used to display the tiles and also
// changing the palette colors used as foreground and background colors.

const cmn = require('./common.js');
const domu = require('./domUtils.js');
const {ipcRenderer} = require('electron');

const defaultPalette = [  // Array of colors.  Each color is an rgba array.  [[r,g,b,a]]
  [0, 0, 0, 255], // black
  [255, 0, 0, 255], // red
  [0, 0, 255, 255], // blue
  [255, 255, 255, 255]]; // white
let _palette = defaultPalette.slice();  // Clone defaultPalette
let _foreIndex = 3;
let _backIndex = 0;
let _onPaletteChangedFn;  // fn(palette)  Function called when the palette has changed.
let _onForeBackIndexChangedFn;  // fn(foreIndex, backIndex)  Function called when either the foreground or background palette index has changed.
let _palForeElem;
let _palBackElem;
let _palElems = [];


/** Sets the colors of the foreground and background divs. */
function setForeBackDivs() {
  _palBackElem.style.backgroundColor = cmn.toCSSColorStr(_palette[_backIndex]);
  _palForeElem.style.backgroundColor = cmn.toCSSColorStr(_palette[_foreIndex]);
}

/** Sets the colors of all the divs. */
function setPaletteDivs() {
  _palette.forEach((color,i) => _palElems[i].style.backgroundColor = cmn.toCSSColorStr(color));
  setForeBackDivs();
}

function paletteIndex(id) {
  return id.substr(-1);
}

/** Returns the current palette [[r,g,b,a]] */
exports.getPalette = function() {
	return _palette;
}

exports.onPaletteChanged = function(fn) {
  _onPaletteChangedFn = fn;
}

exports.getForegroundIndex = function() {
  return _foreIndex;
}

exports.getBackgroundIndex = function() {
  return _backIndex;
}

exports.onForeBackIndexChanged = function(fn) {
  _onForeBackIndexChangedFn = fn;
}

exports.swapForeBackColors = function() {
  const tmp = _foreIndex;
  _foreIndex = _backIndex;
  _backIndex = tmp;

  setForeBackDivs()
  if (_onForeBackIndexChangedFn) _onForeBackIndexChangedFn(_foreIndex, _backIndex);
}

function onPaletteClick(event) {
  const palIndex = paletteIndex(event.srcElement.id);
  if (event.altKey) { // option
    ipcRenderer.send('open-color-selector', _palette, palIndex);
  } else {
    // Set foreground or background color from clicked palette div.
    if (event.shiftKey) {
      _backIndex = palIndex;
    } else {
      _foreIndex = palIndex;
    }

    setForeBackDivs();
    if (_onForeBackIndexChangedFn) _onForeBackIndexChangedFn(_foreIndex, _backIndex);
  }
}

function onResetPaletteClick(event) {
  _palette = defaultPalette.slice();
  setPaletteDivs();
  if (_onPaletteChangedFn) _onPaletteChangedFn(_palette);
}

ipcRenderer.on('palette-update', function (event, palette) {
  _palette = palette;
  setPaletteDivs();
});

/** Called by renderer.js to initialize. */
exports.init = function() {
  const elems = domu.getChildElements(document.getElementById('palette'));
  _palBackElem = elems[0];
  _palForeElem = elems[1];
  _palElems = elems.slice(2).reverse();

  setPaletteDivs();

  _palElems.forEach(p => p.addEventListener('click', onPaletteClick));
  document.getElementById('resetPalette').addEventListener('click', onResetPaletteClick);
}
