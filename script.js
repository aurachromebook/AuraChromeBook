// --- System Clock & Widgets ---
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    // Taskbar Clock
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.innerText = hours + ':' + minutes;

    // Lock Screen Widget (Time)
    const lockTimeEl = document.getElementById('lock-time');
    if(lockTimeEl) lockTimeEl.innerText = hours + ':' + minutes;

    // Lock Screen Widget (Date)
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const lockDateEl = document.getElementById('lock-date');
    if(lockDateEl) lockDateEl.innerText = now.toLocaleDateString('en-US', options);
}
setInterval(updateClock, 1000);
updateClock();

// --- Boot & Auth Logic ---
setTimeout(() => {
    document.getElementById('boot-screen').style.display = 'none';
    
    // Check if user has done setup
    if (!localStorage.getItem('aura_setup_complete')) {
        document.getElementById('setup-screen').style.display = 'flex';
    } else {
        document.getElementById('lock-screen').style.display = 'flex';
        document.getElementById('lock-username').innerText = localStorage.getItem('aura_username') || 'User';
    }
}, 2500);

function unlockOS() {
    const pass = document.getElementById('lock-password').value;
    const savedPass = localStorage.getItem('aura_password');
    if (!savedPass || pass === savedPass) {
        document.getElementById('lock-screen').style.display = 'none';
        document.getElementById('lock-password').value = '';
        
        // Show welcome modal once per session
        if(!sessionStorage.getItem('welcomed')) {
            document.getElementById('welcome-modal').style.display = 'flex';
            sessionStorage.setItem('welcomed', 'true');
        }
    } else {
        document.getElementById('lock-error').style.display = 'block';
    }
}

function closeWelcomeModal() {
    document.getElementById('welcome-modal').style.display = 'none';
}

function lockSystem() {
    document.getElementById('context-menu').style.display = 'none';
    document.getElementById('quick-settings').style.display = 'none';
    document.getElementById('launcher-menu').style.display = 'none';
    document.getElementById('lock-screen').style.display = 'flex';
    document.getElementById('lock-error').style.display = 'none';
}

// --- Menus & Folders ---
function toggleMenu() {
    const menu = document.getElementById('launcher-menu');
    menu.style.display = menu.style.display === 'none' || menu.style.display === '' ? 'flex' : 'none';
    document.getElementById('quick-settings').style.display = 'none';
}

function toggleQuickSettings() {
    const qs = document.getElementById('quick-settings');
    qs.style.display = qs.style.display === 'none' || qs.style.display === '' ? 'block' : 'none';
    document.getElementById('launcher-menu').style.display = 'none';
}

// NEW: Launcher Folder Logic
function toggleLauncherFolder(folderId, opening) {
    const mainView = document.getElementById('launcher-main-view');
    const folderView = document.getElementById(folderId);
    
    if (opening) {
        mainView.style.display = 'none';
        folderView.style.display = 'block';
    } else {
        folderView.style.display = 'none';
        mainView.style.display = 'grid'; 
    }
}

function toggleTheme() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.getElementById('theme-text').innerText = isDark ? 'Light Theme' : 'Dark Theme';
}

// --- Window Management ---
let highestZIndex = 100;

function openApp(appId) {
    const win = document.getElementById(appId);
    if (!win) return;
    
    // Load iframe source if it exists and hasn't been loaded
    const iframe = win.querySelector('iframe');
    if (iframe && iframe.getAttribute('src') === '') {
        iframe.setAttribute('src', iframe.getAttribute('data-src'));
    }

    win.style.display = 'flex';
    win.style.zIndex = ++highestZIndex;
    
    // Default centering if no coords set
    if (!win.style.top || win.style.top === '0px') {
        win.style.top = '50px';
        win.style.left = '50px';
    }
    
    document.getElementById('launcher-menu').style.display = 'none';
    
    // Highlight taskbar icon
    document.querySelectorAll('.app-icon').forEach(icon => {
        if(icon.getAttribute('onclick').includes(appId)) icon.classList.add('active');
    });
}

function closeApp(appId) {
    document.getElementById(appId).style.display = 'none';
    document.querySelectorAll('.app-icon').forEach(icon => {
        if(icon.getAttribute('onclick').includes(appId)) icon.classList.remove('active');
    });
}

function minimizeApp(appId) {
    document.getElementById(appId).style.display = 'none';
}

function maximizeApp(appId) {
    const win = document.getElementById(appId);
    if (win.style.width === '100vw') {
        // Restore
        win.style.width = win.getAttribute('data-prev-width') || '800px';
        win.style.height = win.getAttribute('data-prev-height') || '600px';
        win.style.top = win.getAttribute('data-prev-top') || '50px';
        win.style.left = win.getAttribute('data-prev-left') || '50px';
    } else {
        // Maximize
        win.setAttribute('data-prev-width', win.style.width);
        win.setAttribute('data-prev-height', win.style.height);
        win.setAttribute('data-prev-top', win.style.top);
        win.setAttribute('data-prev-left', win.style.left);
        
        win.style.width = '100vw';
        win.style.height = 'calc(100vh - 50px)';
        win.style.top = '0';
        win.style.left = '0';
    }
}

function toggleApp(appId) {
    const win = document.getElementById(appId);
    if (win.style.display === 'none' || win.style.display === '') {
        openApp(appId);
    } else {
        if (win.style.zIndex < highestZIndex) {
            win.style.zIndex = ++highestZIndex;
        } else {
            minimizeApp(appId);
        }
    }
}

// --- Make Windows Draggable ---
document.querySelectorAll('.window').forEach(win => {
    const header = win.querySelector('.window-header');
    let isDragging = false, startX, startY, initialLeft, initialTop;

    header.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return; // Ignore window control buttons
        isDragging = true;
        win.style.zIndex = ++highestZIndex;
        startX = e.clientX; startY = e.clientY;
        initialLeft = win.offsetLeft; initialTop = win.offsetTop;
        
        // Disable iframe pointer events so it doesn't swallow mouse movements
        const iframe = win.querySelector('iframe');
        if(iframe) iframe.style.pointerEvents = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        win.style.left = `${initialLeft + dx}px`;
        win.style.top = `${initialTop + dy}px`;
    });

    document.addEventListener('mouseup', () => {
        if(isDragging) {
            isDragging = false;
            const iframe = win.querySelector('iframe');
            if(iframe) iframe.style.pointerEvents = 'auto';
        }
    });
});

// --- App Store Installation Simulation ---
function switchStoreTab(tab) {
    document.querySelectorAll('.play-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.store-tab-content').forEach(c => c.classList.remove('active'));
    
    if (tab === 'games') {
        document.querySelector('.play-tab:nth-child(1)').classList.add('active');
        document.getElementById('store-games-tab').classList.add('active');
    } else {
        document.querySelector('.play-tab:nth-child(2)').classList.add('active');
        document.getElementById('store-apps-tab').classList.add('active');
    }
}

function installApp(windowId, emoji, name, btnElement) {
    btnElement.style.display = 'none';
    const progressContainer = document.getElementById(`progress-container-${windowId}`);
    const progressBar = document.getElementById(`progress-bar-${windowId}`);
    
    progressContainer.style.display = 'block';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => finishInstall(windowId, emoji, name, btnElement, progressContainer), 500);
        }
        progressBar.style.width = `${progress}%`;
    }, 300);
}

function finishInstall(windowId, emoji, name, btnElement, progressContainer) {
    progressContainer.style.display = 'none';
    
    // Change button to "Open"
    btnElement.innerText = 'Open';
    btnElement.style.display = 'block';
    btnElement.style.background = 'transparent';
    btnElement.style.color = 'var(--play-green)';
    btnElement.onclick = () => openApp(windowId);
    
    // Create Desktop Shortcut
    const desktop = document.getElementById('desktop-icons-container');
    const iconCount = desktop.children.length;
    const topPos = 20 + (Math.floor(iconCount / 2) * 100);
    const leftPos = 20 + ((iconCount % 2) * 100);
    
    const newIcon = document.createElement('div');
    newIcon.className = 'desktop-icon';
    newIcon.style.top = `${topPos}px`;
    newIcon.style.left = `${leftPos}px`;
    newIcon.setAttribute('ondblclick', `openApp('${windowId}')`);
    newIcon.innerHTML = `<div class="icon-emoji">${emoji}</div><div class="icon-text">${name}</div>`;
    
    desktop.appendChild(newIcon);
}

// --- Basic Settings & Customization ---
function setWallpaper(src) {
    document.getElementById('desktop').style.background = `url('${src}') center/cover`;
    document.getElementById('lock-screen').style.background = `url('${src}') center/cover`;
    localStorage.setItem('aura_wallpaper', src);
}

document.getElementById('wallpaper-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) { setWallpaper(e.target.result); }
        reader.readAsDataURL(file);
    }
});

// Load saved wallpaper on boot
window.onload = () => {
    const savedWall = localStorage.getItem('aura_wallpaper');
    if(savedWall) {
        document.getElementById('desktop').style.background = `url('${savedWall}') center/cover`;
        document.getElementById('lock-screen').style.background = `url('${savedWall}') center/cover`;
    }
};
