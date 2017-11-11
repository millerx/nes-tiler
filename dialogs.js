const {remote, dialog, BrowserWindow} = require('electron')

exports.DLG_SAVE = 0
exports.DLG_CANCEL = 1
exports.DLG_DONT_SAVE = 2

function getDialog() {
  return (process && process.type === 'browser') ? dialog : remote.dialog
}

function getWindow() {
  return (process && process.type === 'browser') ? BrowserWindow.getFocusedWindow() : remote.getCurrentWindow()
}

const fileDialogFilters = [
  {name: 'NES ROMs', extensions: ['nes']},
  {name: 'All Files', extensions: ['*']}
]

exports.showOpenDialog = function() {
  return getDialog().showOpenDialog(getWindow(), {
    filters: fileDialogFilters
  })
}

exports.showSaveDialog = function() {
  let fileName = getDialog().showSaveDialog(getWindow(), {
    filters: fileDialogFilters
  })

  // Append default extension.  I am surpsied showSaveDialog does not have an option to do this for us.
  if (fileName && fileName.indexOf('.') < 0) {
    fileName += '.nes'
  }

  return fileName
}

/**
 * Shows a prompt warning of unsaved changes and asks if user would like to continue.
 */
exports.showUnsavedChangesPrompt = function() {
  return getDialog().showMessageBox(getWindow(), {
    type: 'question',
    message: "Do you want to save changes you made?",
    detail: "Your changes will be lost if you don't save them.",
    buttons: ["Save", "Cancel", "Don't Save"]  // Buttons are displayed right to left.
  })
}

