// This file is required by the color-selector.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// TODO: Refactor common code with paletteView.js

const {ipcRenderer} = require('electron');
const cmn = require('./common.js');
const domu = require('./domUtils.js');

let _palette = []; // Current palette colors.
let _palIndex = 0; // Index of currently selected palette color.
let _palElems; // Array of DOM elements the palette.

function paletteIndex(id) {
  return parseInt(id.substr(-1));
}

function setPalette(palette) {
  _palette = palette;
  _palette.forEach((p,i) => _palElems[i].style.backgroundColor = cmn.toCSSColorStr(p));
}

function selectPalette(palIndex) {
  // Clear the old selected style.
  _palElems[_palIndex].classList.remove('selected');
  // And set the new selected style.
  _palIndex = palIndex;
  _palElems[_palIndex].classList.add('selected');
}

/**
 * Sets the color of a palette.
 * @param backgroundColor CSS color string in rgb() form.
 */
function setPaletteColor(palIndex, backgroundColor) {
  _palette[palIndex] = cmn.toRGBA(backgroundColor);
  _palElems[palIndex].style.backgroundColor = backgroundColor;
}

function onColorTableClicked(event) {
  setPaletteColor(_palIndex, event.srcElement.style.backgroundColor);
  ipcRenderer.send('palette-update', _palette);
}

function onPaletteColorClicked(event) {
  const palIndex = paletteIndex(event.srcElement.id);
  selectPalette(palIndex);
}

function init() {
  // colorTable
  document.getElementById('colorTable').addEventListener('click', onColorTableClicked);

  // palette
  // Must be reversed since they float right they are declared right-to-left.
  _palElems = domu.getChildElements(document.getElementById('palette')).reverse();
  _palElems.forEach(p => p.addEventListener('click', onPaletteColorClicked));
}
init();

/**
 * Updates the palette being edited.
 * @param palette Array of palette colors each color is an [r,g,b,a]
 * @param palIndex Index of selected palette color.
 */
ipcRenderer.on('palette-update', function (event, palette, palIndex) {
  setPalette(palette);
  selectPalette(palIndex);
});
