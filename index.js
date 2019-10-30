const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Tray
} = require('electron')
const electron = require('electron');

const AutoLaunch = require('auto-launch');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

let config = store.get('config');

let setupWindow;
let fileManagerWindow;
let logoPickerWindow;
let mainWindow;
let manageWindow;
let optionsWindow;
let screenSize;
let scWidth = 1;
let scHeight = 1;
let tray = null;
let width;
let height;

let SupertigerAutoLauncher = new AutoLaunch({
  name: 'Supertiger Launcher'
});

if (config === undefined || config.startup == undefined || config.startup == true) {
  SupertigerAutoLauncher.enable();
} else {
  SupertigerAutoLauncher.disable();
}

function createWindow() {
  screenSize = electron.screen.getAllDisplays()[0].size;
  if (store.get().games === undefined || store.get().games == "") {
    setupWindow = new BrowserWindow({
      width: 800 * scWidth,
      height: 600 * scHeight,
      frame: false,
      transparent: true,
      resizable: false
    })
    setupWindow.loadFile('src/setup/index.html')
  } else {
    loadMainApp();
  }

}

ipcMain.on('close-file-browser', (evt, arg) => {
  fileManagerWindow.close();
  logoPickerWindow = new BrowserWindow({
    width: 600 * scWidth,
    height: 400 * scHeight,
    frame: false,
    transparent: true,
    resizable: false
  })
  logoPickerWindow.loadFile('src/logoPicker/index.html')
  //logoPickerWindow.webContents.openDevTools()

  logoPickerWindow.webContents.once('dom-ready', () => {
    logoPickerWindow.webContents.send('path', arg)
  });



})


ipcMain.on('close-me-setup', () => {
  loadMainApp();
  setupWindow.close();
  setupWindow = null;
})


ipcMain.on('open-icon-picker', (event, gameID) => {
  logoPickerWindow = new BrowserWindow({
    width: 600 * scWidth,
    height: 400 * scHeight,
    frame: false,
    transparent: true,
    resizable: false
  })
  logoPickerWindow.loadFile('src/logoPicker/index.html')

  logoPickerWindow.webContents.once('dom-ready', () => {
    logoPickerWindow.webContents.send('gameID', gameID)
  });


})

ipcMain.on('close-logo-picker', (evt, filePath, logoPath, nickname, gameID) => {
  logoPickerWindow.close();

  if (gameID !== undefined) {
    store.set('games.' + gameID + ".nickname", nickname);
    store.set('games.' + gameID + ".icon", logoPath);
    mainWindow.send('reloadList')

    if (manageWindow !== null || manageWindow !== undefined) {
      manageWindow.webContents.send('reload');
    }

    return;
  }

  const details = {
    gamePath: filePath,
    icon: logoPath,
    nickname: nickname
  }

  store.set('games.' + Date.now(), details)

  if (setupWindow === null || setupWindow === undefined) {
    mainWindow.send('reloadList')
    if (manageWindow !== null || manageWindow !== undefined) {
      manageWindow.webContents.send('reload');
    }
  } else {
    setupWindow.webContents.send('get-game', details);
  }


})

ipcMain.on('open-file-browser-manage', () => {

  fileManagerWindow = new BrowserWindow({
    width: 600 * scWidth,
    height: 400 * scHeight,
    frame: false,
    transparent: true,
    resizable: false
  })
  fileManagerWindow.loadFile('src/fileBrowser/index.html')

})

ipcMain.on('open-file-browser', (evt, arg) => {


  fileManagerWindow = new BrowserWindow({
    width: 600 * scWidth,
    height: 400 * scHeight,
    frame: false,
    transparent: true,
    resizable: false
  })
  fileManagerWindow.loadFile('src/fileBrowser/index.html')

})

ipcMain.on("expand-main-window", () => {
  let num = 830 * scHeight
  mainWindow.setSize(mainWindow.getSize()[0], 830)
  console.log(mainWindow.getSize()[0])
})

ipcMain.on("shrink-main-window", () => {
  let num = 70*scHeight
  mainWindow.setBounds({
    x: mainWindow.getPosition()[0],
    y: mainWindow.getPosition()[1],
    width: mainWindow.getSize()[0],
    height: Math.floor(170 * scHeight+num)
  })
})

ipcMain.on('close-me-logo-picker', () => {
  logoPickerWindow.close();
})

ipcMain.on('reloadList', () => {
  mainWindow.send('reloadList')
})

ipcMain.on('close-me-file-browser', () => {
  fileManagerWindow.close();
})

ipcMain.on('close-me-options', (evt, arg) => {
  optionsWindow.close()
  optionsWindow = null;
})

ipcMain.on('close-me-manage', (evt, arg) => {
  manageWindow.close()
  manageWindow = null;
})

ipcMain.on('close-me', (evt, arg) => {
  app.quit()
})

ipcMain.on('reload-theme', () => {
  config = store.get('config');
  if (config === undefined || config.startup == undefined || config.startup == true) {
    SupertigerAutoLauncher.enable();
  } else {
    SupertigerAutoLauncher.disable();
  }
  mainWindow.send('reload-theme')
})

function loadMainApp() {

  let num = 900 * scWidth
  let num2 = Math.floor(170 * scHeight)
  mainWindow = new BrowserWindow({
    width: screenSize.width - num,
    height: num2,
    frame: false,
    transparent: true,
    resizable: false
  })

  mainWindow.setSkipTaskbar(true)

  let centerWindow = (screenSize.width - num) / 2;
  let centerScreen = screenSize.width / 2;

  mainWindow.setPosition(centerScreen - centerWindow, 0)
  mainWindow.loadFile('src/main/index.html')

  tray = new Tray(__dirname + "/assets/logo.ico");
  const contextMenu = Menu.buildFromTemplate([{
      label: 'Manage',
      click: () => {
        manageWindowLoad()
      }
    },
    {
      label: 'Options',
      click: () => {
        optionsWindowLoad()
      }
    },
    {
      label: 'Exit',
      click: () => {
        app.quit();
      }
    }
  ])
  tray.setToolTip("Supertiger Launcher")
  tray.setContextMenu(contextMenu)

}


function optionsWindowLoad() {

  optionsWindow = new BrowserWindow({
    width: 600 * scWidth,
    height: 700 * scHeight,
    frame: false,
    transparent: true,
    resizable: false
  })

  optionsWindow.loadFile('src/options/index.html')

}

function manageWindowLoad() {

  manageWindow = new BrowserWindow({
    width: 600 * scWidth,
    height: 800 * scHeight,
    frame: false,
    transparent: true,
    resizable: false
  })

  manageWindow.loadFile('src/manage/index.html')

}

app.on('ready', () => {
  createWindow();
  screenSize = electron.screen.getAllDisplays()[0].size;
  width = screenSize.width;
  height = screenSize.height
  scWidth = width / 1920;
  scHeight = height / 1080;
  console.log(scHeight)
});