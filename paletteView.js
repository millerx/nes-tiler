// Code for the paletteView that allows changing the palette used to display the tiles and also
// changing the palette colors used as foreground and background colors.

const cmn = require('./common.js')
const {ipcRenderer} = require('electron')

const defaultPalette = [  // Array of colors.  Each color is an rgba array.  [[r,g,b,a]]
[0, 0, 0, 255], // black
[255, 0, 0, 255], // red
[0, 0, 255, 255], // blue
[255, 255, 255, 255] // white
]
let _palette = defaultPalette.slice()  // Clone defaultPalette
let _foreIndex = 3
let _backIndex = 0
let _onPaletteChangedFn  // fn(palette)  Function called when the palette has changed.
let _onForeBackIndexChangedFn  // fn(foreIndex, backIndex)  Function called when either the foreground or background palette index has changed.


/**
 * Sets backgroundColor of the element to the paletteColor.
 * @param paletteColor [r,g,b,a]
 */
function setBackgroundToPaletteColor(elemName, paletteColor) {
  document.getElementById(elemName).style.backgroundColor = cmn.toCSSColorStr(paletteColor)
}

/**
 * Sets the colors of the foreground and background divs.
 */
function setForeBackDivs() {
  setBackgroundToPaletteColor('paletteBack', _palette[_backIndex])
  setBackgroundToPaletteColor('paletteFore', _palette[_foreIndex])
}

/**
 * Sets the colors of all the divs.
 */
function setPaletteDivs() {
  _palette.forEach((v,i) => setBackgroundToPaletteColor('paletteColor' + (i+1), v))

  setForeBackDivs()
}

/**
 * Called by renderer.js to initialize.
 */
exports.init = function() {
  setPaletteDivs()

  for (let i = 1; i < 5; ++i) {
    document.getElementById('paletteColor' + i).addEventListener('click', onPaletteClick)
  }

  document.getElementById('resetPalette').addEventListener('click', onResetPaletteClick)
}

/**
 * Returns the current palette [[r,g,b,a]]
 */
exports.getPalette = function() {
	return _palette
}

/**
 * Fired when the palette has changed.
 */
exports.onPaletteChanged = function(fn) {
  _onPaletteChangedFn = fn
}

exports.getForegroundIndex = function() {
  return _foreIndex
}

exports.getBackgroundIndex = function() {
  return _backIndex
}

/**
 * Fired when either the foreground or background palette index has changed.
 */
exports.onForeBackIndexChanged = function(fn) {
  _onForeBackIndexChangedFn = fn
}

/**
 * Swaps the foreground and backbround palette indexes.
 */
exports.swapForeBackColors = function() {
  const tmp = _foreIndex
  _foreIndex = _backIndex
  _backIndex = tmp

  setForeBackDivs()
  if (_onForeBackIndexChangedFn) _onForeBackIndexChangedFn(_foreIndex, _backIndex)
}

function getPaletteIndexFromMouseEvent(event) {
  // id = 'paletteColor2'
  const id = event.srcElement.id
  const lastChar = id[id.length-1]
  // lastChar is a one-based offset.
  return parseInt(lastChar) - 1
}

function onPaletteClick(event) {
  const palIndex = getPaletteIndexFromMouseEvent(event)
  if (event.altKey) { // option
    ipcRenderer.send('open-color-selector', _palette, palIndex)
  } else {
    // Set foreground color from clicked palette div.
    _foreIndex = palIndex
    setForeBackDivs()
    if (_onForeBackIndexChangedFn) _onForeBackIndexChangedFn(_foreIndex, _backIndex)
  }
}

function onResetPaletteClick(event) {
  _palette = defaultPalette.slice()
  setPaletteDivs()
  if (_onPaletteChangedFn) _onPaletteChangedFn(_palette)
}

ipcRenderer.on('palette-update', function (event, palette) {
  _palette = palette
  setPaletteDivs()
  if (_onPaletteChangedFn) _onPaletteChangedFn(_palette)
})