// --- SYSTEM STATE ---
let systemState = {
    theme: localStorage.getItem('aura_theme') || 'dark',
    wallpaper: localStorage.getItem('aura_wallpaper') || 'https://images.unsplash.com/photo-1506744626753-1fa44df31c22?q=80&w=1920',
    setupComplete: localStorage.getItem('aura_setup') === 'true',
    username: localStorage.getItem('aura_user') || 'User',
    installedApps: JSON.parse(localStorage.getItem('aura_installed')) || []
};

let highestZIndex = 100;

// --- INITIALIZATION ---
window.onload = () => {
    // Apply saved theme & wallpaper
    document.body.setAttribute('data-theme', systemState.theme);
    updateThemeText();
    document.body.style.backgroundImage = `url('${systemState.wallpaper}')`;

    // Handle Boot Sequence
    setTimeout(() => {
        document.getElementById('boot-screen').style.display = 'none';
        
        if (!systemState.setupComplete) {
            document.getElementById('welcome-modal').style.display = 'flex';
        } else {
            document.getElementById('lock-screen').style.display = 'flex';
            document.getElementById('lock-username').innerText = systemState.username;
        }
    }, 2000);

    // Initialize Clock & Lock Widget
    setInterval(updateClock, 1000);
    updateClock();
    setInterval(updateLockScreenWidget, 60000);
    updateLockScreenWidget();

    // Re-render installed apps
    renderInstalledApps();
    
    // Setup Custom Wallpaper Upload
    document.getElementById('wallpaper-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                setWallpaper(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // Make windows draggable
    document.querySelectorAll('.window').forEach(win => {
        makeDraggable(win, win.querySelector('.window-header'));
        win.addEventListener('mousedown', () => bringToFront(win));
    });
};

// --- SETUP (OOBE) ---
function closeWelcomeModal() {
    document.getElementById('welcome-modal').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'flex';
}

function processSetupStep1() {
    const name = document.getElementById('setup-name-input').value.trim();
    if(name) {
        systemState.username = name;
        localStorage.setItem('aura_user', name);
    }
    document.getElementById('setup-step-1').classList.remove('active');
    document.getElementById('setup-step-2').classList.add('active');
}

function processSetupStep2(skip) {
    if(!skip) {
        const pass = document.getElementById('setup-pass-input').value;
        if(pass) localStorage.setItem('aura_pass', pass);
    }
    document.getElementById('setup-step-2').classList.remove('active');
    document.getElementById('setup-step-3').classList.add('active');
}

function finalizeSetup() {
    localStorage.setItem('aura_setup', 'true');
    systemState.setupComplete = true;
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('lock-screen').style.display = 'flex';
    document.getElementById('lock-username').innerText = systemState.username;
}

// --- LOCK SCREEN ---
function unlockOS() {
    const savedPass = localStorage.getItem('aura_pass');
    const inputPass = document.getElementById('lock-password').value;
    
    if (!savedPass || inputPass === savedPass) {
        document.getElementById('lock-screen').style.display = 'none';
        document.getElementById('lock-password').value = '';
        document.getElementById('lock-error').style.display = 'none';
        showToast("System Unlocked", "Welcome back, " + systemState.username);
    } else {
        document.getElementById('lock-error').style.display = 'block';
    }
}

function lockSystem() {
    closeMenu();
    closeQuickSettings();
    document.getElementById('context-menu').style.display = 'none';
    document.getElementById('lock-screen').style.display = 'flex';
    document.getElementById('lock-error').style.display = 'none';
}

function updateLockScreenWidget() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    document.getElementById('lock-time').innerText = hours + ':' + minutes;
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    document.getElementById('lock-date').innerText = now.toLocaleDateString('en-US', options);
}

// Security Settings
function showSecurityQuestion() {
    const q = localStorage.getItem('aura_sec_q');
    if(q) {
        document.getElementById('security-hint').style.display = 'block';
        document.getElementById('lock-question-text').innerText = "Hint: " + q;
    } else {
        alert("No security question was set during setup or in Settings.");
    }
}

function saveSecuritySettings() {
    const pass = document.getElementById('set-password').value;
    const q = document.getElementById('set-question').value;
    const a = document.getElementById('set-answer').value;
    
    if(pass) localStorage.setItem('aura_pass', pass);
    if(q) localStorage.setItem('aura_sec_q', q);
    if(a) localStorage.setItem('aura_sec_a', a);
    
    document.getElementById('security-save-msg').style.display = 'block';
    setTimeout(() => { document.getElementById('security-save-msg').style.display = 'none'; }, 3000);
}

function factoryReset() {
    if(confirm("Are you sure? This will delete all settings, wallpapers, and installed apps.")) {
        localStorage.clear();
        location.reload();
    }
}

// --- TASKBAR & SYSTEM UI ---
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let ampm = hours >= 12 ? ' PM' : ' AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    document.getElementById('clock').innerText = hours + ':' + minutes + ampm;
}

function toggleMenu() {
    const menu = document.getElementById('launcher-menu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    closeQuickSettings();
}

function closeMenu() { document.getElementById('launcher-menu').style.display = 'none'; }

function toggleQuickSettings() {
    const qs = document.getElementById('quick-settings');
    qs.style.display = qs.style.display === 'none' ? 'block' : 'none';
    closeMenu();
}

function closeQuickSettings() { document.getElementById('quick-settings').style.display = 'none'; }

function toggleTheme() {
    systemState.theme = systemState.theme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', systemState.theme);
    localStorage.setItem('aura_theme', systemState.theme);
    updateThemeText();
}

function updateThemeText() {
    const text = document.getElementById('theme-text');
    if(text) text.innerText = systemState.theme === 'dark' ? 'Light Theme' : 'Dark Theme';
}

function setWallpaper(url) {
    document.body.style.backgroundImage = `url('${url}')`;
    localStorage.setItem('aura_wallpaper', url);
}

// --- LAUNCHER LOGIC ---
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

function filterLauncher() {
    const search = document.getElementById('launcher-search').value.toLowerCase();
    const items = document.querySelectorAll('.launcher-item:not(.folder-item)');
    
    // Always switch back to main view when searching to find everything
    if(search.length > 0) {
        document.getElementById('launcher-main-view').style.display = 'grid';
        document.querySelectorAll('.launcher-folder-view').forEach(f => f.style.display = 'none');
        document.querySelector('.folder-item').style.display = 'none';
    } else {
        document.querySelector('.folder-item').style.display = 'flex';
    }

    items.forEach(item => {
        const text = item.querySelector('.l-text').innerText.toLowerCase();
        item.style.display = text.includes(search) ? 'flex' : 'none';
    });
}

// --- WINDOW MANAGEMENT ---
function openApp(id) {
    const win = document.getElementById(id);
    if (win) {
        win.style.display = 'flex';
        bringToFront(win);
        
        // Load iframe source if it has a data-src (lazy loading)
        const iframe = win.querySelector('iframe');
        if (iframe && iframe.getAttribute('data-src') && !iframe.src) {
            iframe.src = iframe.getAttribute('data-src');
        }

        // Highlight taskbar icon if it exists
        const tbIcons = document.querySelectorAll('.app-icon');
        tbIcons.forEach(icon => {
            if(icon.getAttribute('onclick').includes(id)) {
                icon.classList.add('open');
            }
        });
    }
    closeMenu();
}

function closeApp(id) {
    const win = document.getElementById(id);
    if (win) win.style.display = 'none';
    
    const tbIcons = document.querySelectorAll('.app-icon');
    tbIcons.forEach(icon => {
        if(icon.getAttribute('onclick').includes(id)) {
            icon.classList.remove('open');
        }
    });
}

function toggleApp(id) {
    const win = document.getElementById(id);
    if (win.style.display === 'none' || win.style.display === '') {
        openApp(id);
    } else if (win.style.zIndex < highestZIndex) {
        bringToFront(win);
    } else {
        win.style.display = 'none';
        const tbIcons = document.querySelectorAll('.app-icon');
        tbIcons.forEach(icon => {
            if(icon.getAttribute('onclick').includes(id)) icon.classList.remove('open');
        });
    }
}

function minimizeApp(id) { document.getElementById(id).style.display = 'none'; }

function maximizeApp(id) {
    const win = document.getElementById(id);
    if (win.dataset.maximized === 'true') {
        win.style.width = win.dataset.origWidth;
        win.style.height = win.dataset.origHeight;
        win.style.top = win.dataset.origTop;
        win.style.left = win.dataset.origLeft;
        win.dataset.maximized = 'false';
    } else {
        win.dataset.origWidth = win.style.width;
        win.dataset.origHeight = win.style.height;
        win.dataset.origTop = win.style.top;
        win.dataset.origLeft = win.style.left;
        win.style.width = '100%';
        win.style.height = 'calc(100% - 50px)';
        win.style.top = '0';
        win.style.left = '0';
        win.dataset.maximized = 'true';
    }
}

function bringToFront(element) {
    highestZIndex++;
    element.style.zIndex = highestZIndex;
}

// Drag & Drop / Snapping Logic
function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;
        
        element.style.top = Math.max(0, newTop) + "px";
        element.style.left = newLeft + "px";

        // Window Snapping Preview
        const preview = document.getElementById('snap-preview');
        const screenWidth = window.innerWidth;
        if (e.clientX < 20) {
            preview.style.display = 'block';
            preview.style.top = '0'; preview.style.left = '0';
            preview.style.width = '50%'; preview.style.height = 'calc(100% - 50px)';
        } else if (e.clientX > screenWidth - 20) {
            preview.style.display = 'block';
            preview.style.top = '0'; preview.style.left = '50%';
            preview.style.width = '50%'; preview.style.height = 'calc(100% - 50px)';
        } else {
            preview.style.display = 'none';
        }
    }

    function closeDragElement(e) {
        document.onmouseup = null;
        document.onmousemove = null;
        
        // Execute Snap
        const preview = document.getElementById('snap-preview');
        if (preview.style.display === 'block') {
            element.style.top = preview.style.top;
            element.style.left = preview.style.left;
            element.style.width = preview.style.width;
            element.style.height = preview.style.height;
            element.dataset.maximized = 'false';
            preview.style.display = 'none';
        }
    }
}

// --- DESKTOP CONTEXT MENU ---
const desktop = document.getElementById('desktop');
const contextMenu = document.getElementById('context-menu');

desktop.addEventListener('contextmenu', (e) => {
    // Only show if clicking directly on desktop or icons container
    if(e.target.id === 'desktop' || e.target.id === 'desktop-icons-container') {
        e.preventDefault();
        contextMenu.style.display = 'block';
        contextMenu.style.left = e.pageX + 'px';
        contextMenu.style.top = e.pageY + 'px';
        document.getElementById('context-uninstall').style.display = 'none';
    }
});

// Hide menu on normal click
document.addEventListener('click', () => {
    contextMenu.style.display = 'none';
});

// --- APP: CALCULATOR ---
let calcDisplay = document.getElementById('calc-display');
function calcPress(val) { calcDisplay.value = calcDisplay.value === '0' ? val : calcDisplay.value + val; }
function calcClear() { calcDisplay.value = '0'; }
function calcEval() {
    try { calcDisplay.value = eval(calcDisplay.value); }
    catch(e) { calcDisplay.value = 'Error'; }
}

// --- APP: WORDPAD ---
function notepadSave() { showToast("Wordpad", "File saved temporarily to memory."); }
function notepadSaveAs() { showToast("Wordpad", "Save As feature coming soon."); }
function notepadOpen() { showToast("Wordpad", "File Explorer integration coming soon."); }

// --- APP: CHROME ---
function navigateChrome() {
    let url = document.getElementById('chrome-url').value;
    if (!url.startsWith('http')) {
        url = 'https://www.google.com/search?q=' + encodeURIComponent(url) + '&igu=1';
    }
    document.getElementById('chrome-frame').src = url;
}
function chromeBack() { showToast("Chrome", "Back navigation locked in iframe."); }
function chromeForward() { showToast("Chrome", "Forward navigation locked in iframe."); }
function chromeReload() { document.getElementById('chrome-frame').src = document.getElementById('chrome-frame').src; }

document.getElementById('chrome-url').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') navigateChrome();
});

// --- PLAY STORE LOGIC ---
function switchStoreTab(tab) {
    document.querySelectorAll('.play-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.store-tab-content').forEach(c => c.classList.remove('active'));
    
    if(tab === 'games') {
        document.querySelectorAll('.play-tab')[0].classList.add('active');
        document.getElementById('store-games-tab').classList.add('active');
    } else {
        document.querySelectorAll('.play-tab')[1].classList.add('active');
        document.getElementById('store-apps-tab').classList.add('active');
    }
}

function installApp(windowId, emoji, name, buttonElement) {
    if (systemState.installedApps.includes(windowId)) return;

    buttonElement.style.display = 'none';
    const progressContainer = document.getElementById(`progress-container-${windowId}`);
    const progressBar = document.getElementById(`progress-bar-${windowId}`);
    
    progressContainer.style.display = 'block';
    
    let width = 0;
    const interval = setInterval(() => {
        width += Math.random() * 15;
        if (width >= 100) {
            clearInterval(interval);
            progressBar.style.width = '100%';
            
            setTimeout(() => {
                progressContainer.style.display = 'none';
                buttonElement.style.display = 'block';
                buttonElement.innerText = 'Installed';
                buttonElement.disabled = true;
                buttonElement.style.background = 'transparent';
                buttonElement.style.color = 'var(--play-green)';
                
                // Save to state
                systemState.installedApps.push(windowId);
                localStorage.setItem('aura_installed', JSON.stringify(systemState.installedApps));
                
                showToast("Installation Complete", `${name} has been installed to your Launcher.`);
                renderInstalledApps();
            }, 500);
        } else {
            progressBar.style.width = width + '%';
        }
    }, 300);
}

function renderInstalledApps() {
    // Check all store buttons and update their UI if they are in the installed list
    systemState.installedApps.forEach(windowId => {
        const btn = document.getElementById(`install-btn-${windowId}`);
        if(btn) {
            btn.innerText = 'Installed';
            btn.disabled = true;
            btn.style.background = 'transparent';
            btn.style.color = 'var(--play-green)';
        }
    });
}

// --- UTILS ---
function showToast(title, message) {
    const container = document.getElementById('notification-toast-container');
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `<div><strong>${title}</strong><br><span style="font-size:12px; color:var(--sys-text-muted);">${message}</span></div>`;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
