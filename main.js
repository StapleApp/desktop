import { app, BrowserWindow, Menu, Tray, shell, dialog, ipcMain, globalShortcut } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_URL = 'https://web.stapleapp.com';

let mainWindow;
let tray;

// Ana pencere oluştur
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'assets', 'icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true
        },
        show: false
    });

    // Menü çubuğunu kaldır (File, Edit vb.)
    Menu.setApplicationMenu(null);

    // Sayfa yüklendiğinde pencereyi göster
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Varsayılan URL'yi yükle
    mainWindow.loadURL(DEFAULT_URL);

    // F5 tuşu için global shortcut kaydet
    globalShortcut.register('F5', () => {
        if (mainWindow && mainWindow.isFocused()) {
            mainWindow.webContents.reload();
        }
    });

    // Alternatif olarak, pencere odakta iken klavye olaylarını dinle
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F5' && input.type === 'keyDown') {
            mainWindow.webContents.reload();
        }
    });

    // Pencere kapatılmaya çalışıldığında sistem tepsisine gizle
    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
            return false;
        }
    });

    // Yeni pencere açma isteklerini varsayılan tarayıcıda aç
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

// Sistem tepsisi ikonu oluştur
function createTray() {
    let iconPath = path.join(__dirname, 'assets', 'icon.ico');
    tray = new Tray(iconPath);
    
    // Tray tooltip
    tray.setToolTip('Staple App');

    // Tray menüsü oluştur
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Ana Sayfa',
            click: () => {
                mainWindow.loadURL(DEFAULT_URL);
                mainWindow.show();
            }
        },
        {
            label: 'Yenile',
            click: () => {
                mainWindow.webContents.reload();
            }
        },
        { type: 'separator' },
        {
            label: 'Çıkış',
            click: () => {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]);

    // Context menüyü ayarla
    tray.setContextMenu(contextMenu);

    // Çift tıklama ile pencereyi göster/gizle
    tray.on('double-click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

// Uygulama hazır olduğunda
app.whenReady().then(() => {
    createWindow();
    createTray();

    // macOS'ta dock'tan tıklandığında pencereyi tekrar aç
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else {
            mainWindow.show();
        }
    });
});

// Tüm pencereler kapatıldığında
app.on('window-all-closed', () => {
    // Global shortcut'ları temizle
    globalShortcut.unregisterAll();
    
    // macOS dışında uygulamayı kapat
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Uygulama kapatılmadan önce
app.on('before-quit', () => {
    app.isQuiting = true;
    // Global shortcut'ları temizle
    globalShortcut.unregisterAll();
});

// Sistem kapatılırken
app.on('will-quit', (event) => {
    if (tray) {
        tray.destroy();
    }
    // Global shortcut'ları temizle
    globalShortcut.unregisterAll();
});