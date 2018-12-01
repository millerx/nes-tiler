// Code for the paletteView that allows changing the palette used to display the tiles and also
// changing the palette colors used as foreground and background colors.

const cmn = require('./common.js');
const domu = require('./domUtils.js');
const {ipcRenderer} = require('electron');

const _defaultPalette = [  // Array of colors.  Each color is an rgba array.  [[r,g,b,a]]
  [0, 0, 0, 255], // black
  [255, 0, 0, 255], // red
  [0, 0, 255, 255], // blue
  [255, 255, 255, 255]]; // white

let _appState = {};
let _onPaletteChangedFn;  // Called when the palette has changed.
let _palForeElem;
let _palBackElem;
let _palElems = [];


/** Sets the colors of the foreground and background divs. */
function setForeBackDivs() {
  const backColor = _appState.palette.data[_appState.palette.backIndex];
  _palBackElem.style.backgroundColor = cmn.toCSSColorStr(backColor);

  const foreColor = _appState.palette.data[_appState.palette.foreIndex];
  _palForeElem.style.backgroundColor = cmn.toCSSColorStr(foreColor);
}

/** Sets the colors of all the divs. */
function setPaletteDivs() {
  _appState.palette.data.forEach((color,i) => _palElems[i].style.backgroundColor = cmn.toCSSColorStr(color));
  setForeBackDivs();
}

function paletteIndex(id) {
  return id.substr(-1);
}

/** Returns the default palette [[r,g,b,a]] */
exports.getDefaultPalette = function() {
	return _defaultPalette;
}

exports.onPaletteChanged = function(fn) {
  _onPaletteChangedFn = fn;
}

exports.swapForeBackColors = function() {
  const foreIndex = _appState.palette.foreIndex;
  _appState.palette.foreIndex = _appState.palette.backIndex;
  _appState.palette.backIndex = foreIndex;

  setForeBackDivs()
}

function onPaletteClick(event) {
  const palIndex = paletteIndex(event.srcElement.id);
  if (event.altKey) { // option
    ipcRenderer.send('open-color-selector', _appState.palette.data, palIndex);
  } else {
    // Set foreground or background color from clicked palette div.
    if (event.shiftKey) {
      _appState.palette.backIndex = palIndex;
    } else {
      _appState.palette.foreIndex = palIndex;
    }
    setForeBackDivs();
  }
}

function onResetPaletteClick(event) {
  _appState.palette.data = _defaultPalette.slice();
  setPaletteDivs();
  if (_onPaletteChangedFn) _onPaletteChangedFn();
}

ipcRenderer.on('palette-update', function (event, palette) {
  _appState.palette.data = palette;
  setPaletteDivs();
  if (_onPaletteChangedFn) _onPaletteChangedFn();
});

/** Called by renderer.js to initialize. */
exports.init = function(appState) {
  _appState = appState;

  const elems = domu.getChildElements(document.getElementById('palette'));
  _palBackElem = elems[0];
  _palForeElem = elems[1];
  _palElems = elems.slice(2).reverse();

  setPaletteDivs();

  _palElems.forEach(p => p.addEventListener('click', onPaletteClick));
  document.getElementById('resetPalette').addEventListener('click', onResetPaletteClick);
}
