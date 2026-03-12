// --- SYSTEM STATE ---
let systemState = {
    theme: localStorage.getItem('aura_theme') || 'dark',
    wallpaper: localStorage.getItem('aura_wallpaper') || 'https://images.unsplash.com/photo-1506744626753-1fa44df31c22?q=100&w=3840',
    setupComplete: localStorage.getItem('aura_setup') === 'true',
    username: localStorage.getItem('aura_user') || 'User',
    // New array that stores Objects instead of just strings, so we know the Icon and Title for the taskbar
    installedApps: JSON.parse(localStorage.getItem('aura_installed_v2')) || [] 
};

let highestZIndex = 100;

// --- INITIALIZATION ---
window.onload = () => {
    document.body.setAttribute('data-theme', systemState.theme);
    document.body.style.backgroundImage = `url('${systemState.wallpaper}')`;

    setTimeout(() => {
        document.getElementById('boot-screen').style.display = 'none';
        
        if (!systemState.setupComplete) {
            document.getElementById('welcome-modal').style.display = 'flex';
        } else {
            document.getElementById('lock-screen').style.display = 'flex';
            document.getElementById('lock-username').innerText = systemState.username;
        }
    }, 2000);

    setInterval(updateClock, 1000); updateClock();
    setInterval(updateLockScreenWidget, 60000); updateLockScreenWidget();

    // Rebuild Taskbar Apps
    renderInstalledAppsToTaskbar();
    
    document.getElementById('wallpaper-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) { setWallpaper(event.target.result); };
            reader.readAsDataURL(file);
        }
    });

    document.querySelectorAll('.window').forEach(win => {
        makeDraggable(win, win.querySelector('.window-header'));
        win.addEventListener('mousedown', () => bringToFront(win));
    });
};

// --- OOBE SETUP (MODERNIZED) ---
function closeWelcomeModal() {
    document.getElementById('welcome-modal').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'flex';
}

function processSetupStep1() {
    const name = document.getElementById('setup-name-input').value.trim();
    if(name) { systemState.username = name; localStorage.setItem('aura_user', name); }
    document.getElementById('setup-step-1').classList.remove('active');
    document.getElementById('setup-step-2').classList.add('active');
    document.getElementById('dot-1').classList.remove('active');
    document.getElementById('dot-2').classList.add('active');
}

function processSetupStep2(skip) {
    if(!skip) {
        const pass = document.getElementById('setup-pass-input').value;
        if(pass) localStorage.setItem('aura_pass', pass);
    }
    document.getElementById('setup-step-2').classList.remove('active');
    document.getElementById('setup-step-3').classList.add('active');
    document.getElementById('dot-2').classList.remove('active');
    document.getElementById('dot-3').classList.add('active');
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
        showToast("System Unlocked", "Welcome to Aura OS, " + systemState.username);
    } else {
        document.getElementById('lock-error').style.display = 'block';
    }
}

function lockSystem() {
    closeMenu();
    document.getElementById('context-menu').style.display = 'none';
    document.getElementById('lock-screen').style.display = 'flex';
    document.getElementById('lock-error').style.display = 'none';
}

function updateLockScreenWidget() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    hours = hours % 12; hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    document.getElementById('lock-time').innerText = hours + ':' + minutes;
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    document.getElementById('lock-date').innerText = now.toLocaleDateString('en-US', options);
}

// --- SYSTEM UI ---
function updateClock() {
    const now = new Date();
    let hours = now.getHours(); let minutes = now.getMinutes();
    let ampm = hours >= 12 ? ' PM' : ' AM';
    hours = hours % 12; hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    document.getElementById('clock').innerText = hours + ':' + minutes + ampm;
}

function toggleMenu() {
    const menu = document.getElementById('launcher-menu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function closeMenu() { document.getElementById('launcher-menu').style.display = 'none'; }

function filterLauncher() {
    const search = document.getElementById('launcher-search').value.toLowerCase();
    document.querySelectorAll('.launcher-item').forEach(item => {
        const text = item.querySelector('.l-text').innerText.toLowerCase();
        item.style.display = text.includes(search) ? 'flex' : 'none';
    });
}

function setWallpaper(url) {
    document.body.style.backgroundImage = `url('${url}')`;
    localStorage.setItem('aura_wallpaper', url);
}

// --- WINDOW MANAGEMENT (IFRAME FIXES) ---
function openApp(id) {
    const win = document.getElementById(id);
    if (win) {
        win.style.display = 'flex';
        bringToFront(win);
        
        // Critical: Force iframe to load its data-src if it hasn't already.
        const iframe = win.querySelector('iframe');
        if (iframe && iframe.getAttribute('data-src') && !iframe.getAttribute('src')) {
            iframe.setAttribute('src', iframe.getAttribute('data-src'));
        }

        // Highlight taskbar icon
        document.querySelectorAll('.app-icon').forEach(icon => {
            if(icon.getAttribute('onclick') && icon.getAttribute('onclick').includes(id)) icon.classList.add('open');
        });
    }
    closeMenu();
}

function closeApp(id) {
    document.getElementById(id).style.display = 'none';
    document.querySelectorAll('.app-icon').forEach(icon => {
        if(icon.getAttribute('onclick') && icon.getAttribute('onclick').includes(id)) icon.classList.remove('open');
    });
}

function toggleApp(id) {
    const win = document.getElementById(id);
    if (win.style.display === 'none' || win.style.display === '') openApp(id);
    else if (win.style.zIndex < highestZIndex) bringToFront(win);
    else closeApp(id);
}

function minimizeApp(id) { document.getElementById(id).style.display = 'none'; }
function maximizeApp(id) {
    const win = document.getElementById(id);
    if (win.dataset.maximized === 'true') {
        win.style.width = win.dataset.origWidth; win.style.height = win.dataset.origHeight;
        win.style.top = win.dataset.origTop; win.style.left = win.dataset.origLeft;
        win.dataset.maximized = 'false';
    } else {
        win.dataset.origWidth = win.style.width; win.dataset.origHeight = win.style.height;
        win.dataset.origTop = win.style.top; win.dataset.origLeft = win.style.left;
        win.style.width = '100%'; win.style.height = 'calc(100% - 50px)';
        win.style.top = '0'; win.style.left = '0'; win.dataset.maximized = 'true';
    }
}
function bringToFront(el) { highestZIndex++; el.style.zIndex = highestZIndex; }

// --- STORE TO TASKBAR INSTALLATION LOGIC ---
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
    // Check if already installed
    if (systemState.installedApps.some(app => app.id === windowId)) return;

    buttonElement.style.display = 'none';
    const progressContainer = document.getElementById(`progress-container-${windowId}`);
    const progressBar = document.getElementById(`progress-bar-${windowId}`);
    progressContainer.style.display = 'block';
    
    let width = 0;
    const interval = setInterval(() => {
        width += Math.random() * 20;
        if (width >= 100) {
            clearInterval(interval);
            progressBar.style.width = '100%';
            
            setTimeout(() => {
                progressContainer.style.display = 'none';
                buttonElement.style.display = 'block';
                buttonElement.innerText = 'On Taskbar';
                buttonElement.disabled = true;
                buttonElement.style.background = 'transparent';
                buttonElement.style.color = 'var(--play-green)';
                
                // Save to state as an object
                const newApp = { id: windowId, icon: emoji, title: name };
                systemState.installedApps.push(newApp);
                localStorage.setItem('aura_installed_v2', JSON.stringify(systemState.installedApps));
                
                showToast("Installation Complete", `${name} is now pinned to your Taskbar.`);
                
                // Inject directly to taskbar
                appendAppToTaskbar(newApp);

            }, 500);
        } else {
            progressBar.style.width = width + '%';
        }
    }, 200);
}

function renderInstalledAppsToTaskbar() {
    // 1. Update the store buttons so they say "On Taskbar" on reload
    systemState.installedApps.forEach(app => {
        const btn = document.getElementById(`install-btn-${app.id}`);
        if(btn) {
            btn.innerText = 'On Taskbar';
            btn.disabled = true;
            btn.style.background = 'transparent';
            btn.style.color = 'var(--play-green)';
        }
        // 2. Add them to the Taskbar HTML
        appendAppToTaskbar(app);
    });
}

function appendAppToTaskbar(app) {
    const taskbarContainer = document.getElementById('app-icons');
    // Prevent duplicates
    if (document.querySelector(`button[onclick="toggleApp('${app.id}')"]`)) return;

    const btn = document.createElement('button');
    btn.className = 'app-icon';
    btn.setAttribute('onclick', `toggleApp('${app.id}')`);
    btn.setAttribute('title', app.title);
    btn.innerText = app.icon;
    taskbarContainer.appendChild(btn);
}

// --- CONTEXT MENU ---
document.getElementById('desktop').addEventListener('contextmenu', (e) => {
    if(e.target.id === 'desktop' || e.target.id === 'desktop-icons-container') {
        e.preventDefault();
        const cm = document.getElementById('context-menu');
        cm.style.display = 'block'; cm.style.left = e.pageX + 'px'; cm.style.top = e.pageY + 'px';
    }
});
document.addEventListener('click', () => { document.getElementById('context-menu').style.display = 'none'; });

// --- UTILS & DRAGGING ---
function showToast(title, message) {
    const container = document.getElementById('notification-toast-container');
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `<div><strong>${title}</strong><br><span style="font-size:12px; color:var(--sys-text-muted);">${message}</span></div>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideInRight 0.3s ease reverse forwards'; setTimeout(() => toast.remove(), 300); }, 4000);
}

function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = (e) => {
        e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY;
        document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
        document.onmousemove = (e) => {
            e.preventDefault(); pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY;
            element.style.top = Math.max(0, element.offsetTop - pos2) + "px"; element.style.left = (element.offsetLeft - pos1) + "px";
        };
    };
}
