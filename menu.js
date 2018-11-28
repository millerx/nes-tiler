const {app, Menu} = require('electron');

// https://electronjs.org/docs/api/menu-item#roles

exports.setApplicationMenu = function(mainWindow) {
  let template = [
    {
      label: 'File',
      submenu: [
        {label: 'Open...', accelerator: 'CommandOrControl+O', click: function () {mainWindow.webContents.send('openROM');}},
        {label: 'Save', accelerator: 'CommandOrControl+S', click: function () {mainWindow.webContents.send('saveROM', false);}},
        {label: 'Save As...', accelerator: 'Shift+CommandOrControl+S', click: function () {mainWindow.webContents.send('saveROM', true);}}
      ]
    },{
      label: 'Edit',
      submenu: [
        {role: 'undo'},
        {role: 'redo'},
        {type: 'separator'},
        {role: 'copy'},
        {role: 'paste'},
        {type: 'separator'},
        {label: 'Swap Pen Colors', accelerator: 'CommandOrControl+P', click: function () {mainWindow.webContents.send('swapPenColors');}},
      ]
    },{
      label: 'View',
      submenu: [
        {role: 'reload'},
        {role: 'forcereload'},
        {type: 'separator'},
        {role: 'togglefullscreen'},
        {type: 'separator'},
        {role: 'toggledevtools'},
      ]
    },{
      role: 'window',
      submenu: [
        {role: 'minimize'},
        {role: 'close'}
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
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
    });

    // Window menu
    template[4].submenu = [
      {role: 'close'},
      {role: 'minimize'},
      {role: 'zoom'},
      {type: 'separator'},
      {role: 'front'}
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}