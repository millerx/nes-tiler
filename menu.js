const {app, Menu} = require('electron')

const _template = [
  {
    label: 'File',
    submenu: [
      {label: 'Open...', accelerator: 'CommandOrControl+O'},
      {label: 'Save', accelerator: 'CommandOrControl+S'}
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {role: 'undo'},
      {role: 'redo'},
      {type: 'separator'},
      {role: 'cut'},
      {role: 'copy'},
      {role: 'paste'},
      {role: 'pasteandmatchstyle'},
      {role: 'delete'},
      {role: 'selectall'}
    ]
  },
  {
    label: 'View',
    submenu: [
      {role: 'reload'},
      {role: 'forcereload'},
      {role: 'toggledevtools'},
      {type: 'separator'},
      {role: 'resetzoom'},
      {role: 'zoomin'},
      {role: 'zoomout'},
      {type: 'separator'},
      {role: 'togglefullscreen'}
    ]
  },
  {
    role: 'window',
    submenu: [
      {role: 'minimize'},
      {role: 'close'}
    ]
  }
]

if (process.platform === 'darwin') {
  _template.unshift({
    label: app.getName(),
    submenu: [
      {role: 'about'},
      {type: 'separator'},
      {role: 'services', submenu: []},
      {type: 'separator'},
      {role: 'hide'},
      {role: 'hideothers'},
      {role: 'unhide'},
      {type: 'separator'},
      {role: 'quit'}
    ]
  })

  // Window menu
  _template[4].submenu = [
    {role: 'close'},
    {role: 'minimize'},
    {role: 'zoom'},
    {type: 'separator'},
    {role: 'front'}
  ]
}

let _menu = Menu.buildFromTemplate(_template)

exports.setApplicationMenu = function() {
  Menu.setApplicationMenu(_menu)
}

exports.setOpenFn = function(openFn) {
  _menu.items[1].submenu.items[0].click = openFn
}

exports.setSaveFn = function(saveFn) {
  _menu.items[1].submenu.items[1].click = saveFn
}
