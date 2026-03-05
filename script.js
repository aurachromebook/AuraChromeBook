// --- 1. Boot Sequence & OOBE Setup ---
window.onload = function() {
    setTimeout(() => {
        const boot = document.getElementById('boot-screen');
        if(boot) {
            boot.style.opacity = '0';
            setTimeout(() => boot.style.display = 'none', 500);
        }

        const isSetupComplete = localStorage.getItem('os_setup_complete');
        
        if (!isSetupComplete) {
            document.getElementById('setup-screen').style.display = 'flex';
        } else {
            initializeDesktop();
            if (localStorage.getItem('os_password')) {
                document.getElementById('lock-username').innerText = localStorage.getItem('os_username') || 'User';
                document.getElementById('lock-screen').style.display = 'flex';
            }
        }
    }, 2500);
};

// OOBE Setup Functions
let tempUsername = '';
let tempPassword = '';

function processSetupStep1() {
    const nameInput = document.getElementById('setup-name-input').value.trim();
    if (nameInput === '') {
        alert("Please enter a name to continue.");
        return;
    }
    tempUsername = nameInput;
    document.getElementById('setup-step-1').classList.remove('active');
    document.getElementById('setup-step-2').classList.add('active');
}

function processSetupStep2(isSkipped) {
    if (!isSkipped) {
        const passInput = document.getElementById('setup-pass-input').value;
        if (passInput === '') {
            alert("Please enter a password or choose 'Skip'.");
            return;
        }
        tempPassword = passInput;
    }
    document.getElementById('setup-step-2').classList.remove('active');
    document.getElementById('setup-step-3').classList.add('active');
}

function finalizeSetup() {
    localStorage.setItem('os_setup_complete', 'true');
    localStorage.setItem('os_username', tempUsername);
    if (tempPassword !== '') {
        localStorage.setItem('os_password', tempPassword);
    }
    
    document.getElementById('setup-screen').style.display = 'none';
    
    // Set dynamic name on lock screen for the future
    document.getElementById('lock-username').innerText = tempUsername;
    
    initializeDesktop();
}

function initializeDesktop() {
    const savedWallpaper = localStorage.getItem('os_wallpaper');
    if(savedWallpaper) document.getElementById('desktop').style.backgroundImage = `url('${savedWallpaper}')`;

    const savedApps = JSON.parse(localStorage.getItem('os_installed_apps') || '[]');
    savedApps.forEach(app => {
        if(!document.getElementById('taskbar-' + app.id)) restoreAppToTaskbar(app.id, app.icon, app.name);
    });

    document.querySelectorAll('.app-icon').forEach(makeIconDraggable);
    initBattery();
}

// --- Factory Reset ---
function factoryReset() {
    if (confirm("WARNING: This will erase all settings, passwords, and installed apps. The system will reboot. Continue?")) {
        localStorage.clear();
        location.reload();
    }
}

// --- 2. System UI ---
function updateClock() {
    const now = new Date();
    let hours = now.getHours(), minutes = now.getMinutes();
    hours = hours % 12 || 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const clock = document.getElementById('clock');
    if(clock) clock.innerText = hours + ':' + minutes;
}
setInterval(updateClock, 1000); updateClock();

function initBattery() {
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            function updateLevel() {
                const level = Math.round(battery.level * 100) + '%';
                const tbBattery = document.getElementById('taskbar-battery');
                const qsBatText = document.getElementById('qs-battery-text');
                const qsBatIcon = document.getElementById('qs-battery-icon');
                
                if(tbBattery) tbBattery.innerText = battery.charging ? '⚡' : '🔋';
                if(qsBatText) qsBatText.innerText = level;
                if(qsBatIcon) qsBatIcon.innerText = battery.charging ? '⚡' : '🔋';
            }
            updateLevel();
            battery.addEventListener('levelchange', updateLevel);
            battery.addEventListener('chargingchange', updateLevel);
        });
    }
}

document.getElementById('brightness-slider').addEventListener('input', function(e) {
    document.getElementById('desktop').style.filter = `brightness(${e.target.value}%)`;
});

// --- 3. Context & Menus ---
const desktop = document.getElementById('desktop');
const contextMenu = document.getElementById('context-menu');
const quickSettings = document.getElementById('quick-settings');
const launcherMenu = document.getElementById('launcher-menu');

desktop.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if(e.target === desktop || e.target.id === 'desktop-icons') {
        contextMenu.style.display = 'block';
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';
    }
});

document.addEventListener('click', (e) => {
    if(!contextMenu.contains(e.target)) contextMenu.style.display = 'none';
    if(!quickSettings.contains(e.target) && !document.getElementById('status-area').contains(e.target)) {
        quickSettings.style.display = 'none';
    }
    if(!launcherMenu.contains(e.target) && !document.getElementById('launcher-btn').contains(e.target)) {
        launcherMenu.style.display = 'none';
    }
});

function toggleQuickSettings() {
    quickSettings.style.display = quickSettings.style.display === 'none' ? 'block' : 'none';
    launcherMenu.style.display = 'none';
}

function toggleMenu() {
    launcherMenu.style.display = launcherMenu.style.display === 'none' ? 'flex' : 'none';
    quickSettings.style.display = 'none';
    if (launcherMenu.style.display === 'flex') {
        document.getElementById('launcher-search').focus();
    }
}

function filterLauncher() {
    const query = document.getElementById('launcher-search').value.toLowerCase();
    const items = document.querySelectorAll('.launcher-item');
    items.forEach(item => {
        const text = item.querySelector('.l-text').innerText.toLowerCase();
        item.style.display = text.includes(query) ? 'flex' : 'none';
    });
}

function lockSystem() {
    if (localStorage.getItem('os_password')) {
        document.getElementById('lock-username').innerText = localStorage.getItem('os_username') || 'User';
        document.getElementById('lock-screen').style.display = 'flex';
    } else {
        alert("Please set a password in Settings first!");
    }
    quickSettings.style.display = 'none'; 
    contextMenu.style.display = 'none';
}

// --- 4. Security ---
function unlockOS() {
    const input = document.getElementById('lock-password').value;
    if (input === localStorage.getItem('os_password') || input === localStorage.getItem('os_answer')) {
        document.getElementById('lock-screen').style.display = 'none';
        document.getElementById('lock-password').value = '';
        document.getElementById('lock-error').style.display = 'none';
    } else document.getElementById('lock-error').style.display = 'block';
}

function showSecurityQuestion() {
    const hintDiv = document.getElementById('security-hint');
    const qText = document.getElementById('lock-question-text');
    const savedQ = localStorage.getItem('os_question');
    qText.innerText = savedQ ? "Hint: " + savedQ : "No security question set.";
    hintDiv.style.display = 'block';
}

function saveSecuritySettings() {
    const pass = document.getElementById('set-password').value;
    const q = document.getElementById('set-question').value;
    const a = document.getElementById('set-answer').value;
    if(pass) localStorage.setItem('os_password', pass);
    if(q) localStorage.setItem('os_question', q);
    if(a) localStorage.setItem('os_answer', a);
    const msg = document.getElementById('security-save-msg');
    msg.style.display = 'block'; setTimeout(() => msg.style.display = 'none', 3000);
}

// --- 5. Window Memory Management (IFRAME FIX) ---
let highestZ = 10;
function openApp(appId) {
    const appWindow = document.getElementById(appId);
    if(appWindow) {
        // --- MEMORY FIX: Force iframe to load exactly when opened ---
        const iframe = appWindow.querySelector('iframe');
        if (iframe) {
            const currentSrc = iframe.src || "";
            if (currentSrc === "" || currentSrc.includes("about:blank") || currentSrc.includes(window.location.href)) {
                iframe.src = iframe.getAttribute('data-src');
            }
        }

        appWindow.style.display = 'flex'; 
        appWindow.classList.remove('minimized');
        bringToFront(appWindow); 
        updateTaskbarIndicator(appId, true);
    }
    launcherMenu.style.display = 'none';
}

function minimizeApp(appId) { 
    document.getElementById(appId).classList.add('minimized'); 
    updateTaskbarIndicator(appId, false); 
}

function closeApp(appId) {
    const appWindow = document.getElementById(appId);
    appWindow.style.display = 'none'; 
    appWindow.classList.remove('minimized');
    updateTaskbarIndicator(appId, false);
    
    // --- MEMORY FIX: Completely wipe iframe to free RAM ---
    const iframe = appWindow.querySelector('iframe');
    if(iframe) { 
        iframe.src = 'about:blank'; 
    }
}

function toggleApp(appId) {
    const appWindow = document.getElementById(appId);
    if (appWindow.style.display === 'flex' && !appWindow.classList.contains('minimized')) {
        if (appWindow.style.zIndex == highestZ) minimizeApp(appId); else bringToFront(appWindow);
    } else openApp(appId);
}

function bringToFront(elmnt) { highestZ++; elmnt.style.zIndex = highestZ; }
function updateTaskbarIndicator(appId, isActive) {
    const icon = document.querySelector(`button[onclick*="'${appId}'"]`);
    if(icon) isActive ? icon.classList.add('active') : icon.classList.remove('active');
}

// Dragging & Snapping
const snapPreview = document.getElementById('snap-preview');
let currentSnap = null;
document.querySelectorAll('.window').forEach(win => {
    dragElement(win); win.addEventListener('mousedown', () => bringToFront(win));
});

function dragElement(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = document.getElementById(elmnt.id + "-header");
    if (header) header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if(e.target.tagName === 'BUTTON') return;
        e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY;
        document.onmouseup = closeDragElement; document.onmousemove = elementDrag;
        elmnt.classList.add('dragging');
    }
    function elementDrag(e) {
        e.preventDefault(); pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px"; elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        const th = 20; 
        if (e.clientX < th) { showPreview(0, 0, '50%', '100%'); currentSnap = 'left'; } 
        else if (e.clientX > window.innerWidth - th) { showPreview('50%', 0, '50%', '100%'); currentSnap = 'right'; } 
        else if (e.clientY < th) { showPreview(0, 0, '100%', '100%'); currentSnap = 'top'; } 
        else { snapPreview.style.display = 'none'; currentSnap = null; }
    }
    function showPreview(l, t, w, h) { snapPreview.style.display = 'block'; snapPreview.style.left = l; snapPreview.style.top = t; snapPreview.style.width = w; snapPreview.style.height = h; }
    function closeDragElement() {
        document.onmouseup = null; document.onmousemove = null; elmnt.classList.remove('dragging'); snapPreview.style.display = 'none';
        if (currentSnap === 'left') { elmnt.style.left = '0'; elmnt.style.top = '0'; elmnt.style.width = '50vw'; elmnt.style.height = '100vh'; } 
        else if (currentSnap === 'right') { elmnt.style.left = '50vw'; elmnt.style.top = '0'; elmnt.style.width = '50vw'; elmnt.style.height = '100vh'; } 
        else if (currentSnap === 'top') { elmnt.style.left = '0'; elmnt.style.top = '0'; elmnt.style.width = '100vw'; elmnt.style.height = '100vh'; }
        currentSnap = null;
    }
}

// --- 6. Applications Logic ---
let calcInput = "";
function calcPress(val) { calcInput += val; document.getElementById('calc-display').value = calcInput; }
function calcClear() { calcInput = ""; document.getElementById('calc-display').value = "0"; }
function calcEval() { try { calcInput = eval(calcInput).toString(); document.getElementById('calc-display').value = calcInput; } catch(e) { document.getElementById('calc-display').value = "Error"; calcInput = ""; } }

let chromeHistory = ["https://www.bing.com"], chromeIndex = 0;
function navigateChrome() {
    let url = document.getElementById('chrome-url').value;
    url = url.startsWith('http') ? url : 'https://' + url;
    chromeHistory = chromeHistory.slice(0, chromeIndex + 1); chromeHistory.push(url); chromeIndex++;
    document.getElementById('chrome-frame').src = url; document.getElementById('chrome-url').value = url;
}
function chromeBack() { if (chromeIndex > 0) { chromeIndex--; document.getElementById('chrome-frame').src = chromeHistory[chromeIndex]; document.getElementById('chrome-url').value = chromeHistory[chromeIndex]; } }
function chromeForward() { if (chromeIndex < chromeHistory.length - 1) { chromeIndex++; document.getElementById('chrome-frame').src = chromeHistory[chromeIndex]; document.getElementById('chrome-url').value = chromeHistory[chromeIndex]; } }
function chromeReload() { const iframe = document.getElementById('chrome-frame'); iframe.src = iframe.src; }

// Wallpaper Handling
function setWallpaper(url) {
    let highResUrl = url.replace("w=400", "w=2000");
    document.getElementById('desktop').style.backgroundImage = `url('${highResUrl}')`;
    localStorage.setItem('os_wallpaper', highResUrl);
}

document.getElementById('wallpaper-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            document.getElementById('desktop').style.backgroundImage = `url('${ev.target.result}')`;
            try { localStorage.setItem('os_wallpaper', ev.target.result); } catch(err) { alert("Image applied for this session."); }
        }; reader.readAsDataURL(file);
    }
});

// --- 7. Taskbar & Play Store Logic ---
function switchStoreTab(tabId) {
    document.querySelectorAll('.play-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.store-tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[onclick="switchStoreTab('${tabId}')"]`).classList.add('active');
    document.getElementById(`store-${tabId}-tab`).classList.add('active');
}

const taskbarIconsContainer = document.getElementById('app-icons');
let draggedIcon = null;
function makeIconDraggable(icon) {
    icon.addEventListener('dragstart', function() { draggedIcon = this; setTimeout(() => this.classList.add('dragging-icon'), 0); });
    icon.addEventListener('dragend', function() { setTimeout(() => { this.classList.remove('dragging-icon'); draggedIcon = null; }, 0); });
    icon.addEventListener('dragover', (e) => e.preventDefault());
    icon.addEventListener('drop', function(e) {
        e.preventDefault();
        if (draggedIcon !== this) {
            let allIcons = [...taskbarIconsContainer.children];
            allIcons.indexOf(draggedIcon) < allIcons.indexOf(this) ? this.after(draggedIcon) : this.before(draggedIcon);
        }
    });
}

function installApp(appId, iconSymbol, appName, buttonElement) {
    if (document.getElementById('taskbar-' + appId)) return; 
    const pCont = document.getElementById('progress-container-' + appId), pBar = document.getElementById('progress-bar-' + appId);
    buttonElement.innerText = 'Installing...'; buttonElement.disabled = true; if(pCont) pCont.style.display = 'block';
    
    let progress = 0;
    const dlInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 20) + 10; 
        if (progress >= 100) {
            progress = 100; clearInterval(dlInterval);
            if(pBar) pBar.style.width = '100%';
            buttonElement.innerText = 'Installed'; if(pCont) setTimeout(() => pCont.style.display = 'none', 500);
            
            restoreAppToTaskbar(appId, iconSymbol, appName); 
            saveAppToStorage(appId, iconSymbol, appName);
            
            const launcherList = document.getElementById('launcher-list');
            const item = document.createElement('div');
            item.className = 'launcher-item';
            item.onclick = () => openApp(appId);
            item.innerHTML = `<div class="l-icon">${iconSymbol}</div><span class="l-text">${appName}</span>`;
            launcherList.appendChild(item);
        } else if(pBar) pBar.style.width = progress + '%';
    }, 300); 
}

function restoreAppToTaskbar(appId, iconSymbol, appName) {
    const btn = document.createElement('button'); btn.className = 'app-icon'; btn.id = 'taskbar-' + appId; btn.title = appName; btn.innerHTML = iconSymbol; btn.draggable = true; btn.onclick = () => toggleApp(appId);
    taskbarIconsContainer.appendChild(btn); makeIconDraggable(btn);
}

function saveAppToStorage(appId, iconSymbol, appName) {
    let savedApps = JSON.parse(localStorage.getItem('os_installed_apps') || '[]');
    savedApps.push({ id: appId, icon: iconSymbol, name: appName }); localStorage.setItem('os_installed_apps', JSON.stringify(savedApps));
}
