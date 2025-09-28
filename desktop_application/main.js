const { app, BrowserWindow } = require('electron');
const path = require('path');
const contextMenu = require('electron-context-menu').default;

contextMenu({
	showInspectElement: false,
	labels: {
		copy: 'Копировать',
		paste: 'Вставить',
		cut: 'Вырезать',
		selectAll: 'Выбрать все',
	}
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  mainWindow.setMenu(null);
  mainWindow.loadFile(path.join(__dirname, 'app/index.html'));
}

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});