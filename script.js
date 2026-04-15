// --- CORS PROXY CONFIGURATION FOR CHROME ---
const CORS_PROXIES = {
    corsproxy: 'https://corsproxy.io/?',
    allorigins: 'https://api.allorigins.win/raw?url=',
    apiallorigins: 'https://api.allorigins.win/get?url=',
    none: ''
};

let currentProxy = localStorage.getItem('chrome_proxy') || 'corsproxy';
let chromeHistory = [], chromeIndex = -1;

function getProxiedUrl(url) {
    if (currentProxy === 'none') return url;
    const proxy = CORS_PROXIES[currentProxy];
    return proxy + encodeURIComponent(url);
}

function toggleProxySettings() {
    const panel = document.getElementById('proxy-settings');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function changeProxy() {
    const selector = document.getElementById('proxy-selector');
    currentProxy = selector.value;
    localStorage.setItem('chrome_proxy', currentProxy);
    
    const status = document.getElementById('proxy-status');
    status.innerText = currentProxy === 'none' ? 'Disabled' : 'Active';
    
    if (chromeIndex >= 0) {
        loadChromeUrl(chromeHistory[chromeIndex], false);
    }
}

function navigateChrome() {
    let url = document.getElementById('chrome-url').value.trim();
    if (!url) return;
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    if (!url.includes('.') || url.includes(' ')) {
        url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
    }
    
    chromeHistory = chromeHistory.slice(0, chromeIndex + 1);
    chromeHistory.push(url);
    chromeIndex++;
    
    loadChromeUrl(url, true);
}

function loadChromeUrl(url, addToHistory) {
    const iframe = document.getElementById('chrome-frame');
    const errorDiv = document.getElementById('chrome-error');
    const urlInput = document.getElementById('chrome-url');
    
    urlInput.value = url;
    errorDiv.style.display = 'none';
    
    const proxiedUrl = getProxiedUrl(url);
    
    if (currentProxy === 'apiallorigins') {
        fetch(proxiedUrl)
            .then(response => response.json())
            .then(data => {
                if (data.contents) {
                    const blob = new Blob([data.contents], { type: 'text/html' });
                    const blobUrl = URL.createObjectURL(blob);
                    iframe.src = blobUrl;
                } else {
                    throw new Error('No content received');
                }
            })
            .catch(err => {
                showChromeError(url, err.message);
            });
    } else {
        iframe.src = proxiedUrl;
        
        iframe.onload = function() {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (doc && doc.body) {
                    errorDiv.style.display = 'none';
                }
            } catch (e) {
                errorDiv.style.display = 'none';
            }
        };
        
        iframe.onerror = function() {
            showChromeError(url, 'Failed to load page');
        };
        
        setTimeout(() => {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (!doc || !doc.body || doc.body.innerHTML === '') {
                    if (iframe.src !== proxiedUrl && iframe.src !== 'about:blank') {
                        showChromeError(url, 'Page blocked or unavailable');
                    }
                }
            } catch (e) {}
        }, 5000);
    }
}

function showChromeError(url, message) {
    const errorDiv = document.getElementById('chrome-error');
    const errorText = document.getElementById('chrome-error-text');
    errorText.innerText = message || `The webpage at ${url} might be temporarily down or it may have moved permanently. Try changing the proxy in settings (⚙️).`;
    errorDiv.style.display = 'flex';
}

function retryChrome() {
    if (chromeIndex >= 0) {
        loadChromeUrl(chromeHistory[chromeIndex], false);
    }
}

function chromeBack() {
    if (chromeIndex > 0) {
        chromeIndex--;
        loadChromeUrl(chromeHistory[chromeIndex], false);
    }
}

function chromeForward() {
    if (chromeIndex < chromeHistory.length - 1) {
        chromeIndex++;
        loadChromeUrl(chromeHistory[chromeIndex], false);
    }
}

function chromeReload() {
    if (chromeIndex >= 0) {
        loadChromeUrl(chromeHistory[chromeIndex], false);
    }
}

function initChromeProxy() {
    const selector = document.getElementById('proxy-selector');
    if (selector) {
        selector.value = currentProxy;
        const status = document.getElementById('proxy-status');
        if (status) status.innerText = currentProxy === 'none' ? 'Disabled' : 'Active';
    }
}

// --- TAB CLOAKING SYSTEM ---
const CLOAK_PRESETS = {
    aura: {
        title: 'Aura OS - Ultimate Edition',
        favicon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    },
    fleckle: {
        title: 'Fleckle - Student Portal',
        favicon: 'https://www.google.com/favicon.ico'
    },
    classroom: {
        title: 'Google Classroom',
        favicon: 'https://ssl.gstatic.com/classroom/favicon.png'
    },
    flocabulary: {
        title: 'Flocabulary - Educational Hip-Hop',
        favicon: 'https://www.flocabulary.com/wp-content/uploads/2018/07/cropped-flobook-32x32.png'
    }
};

function changeTabCloak() {
    const selector = document.getElementById('cloak-selector');
    const preset = CLOAK_PRESETS[selector.value];
    
    if (preset) {
        document.getElementById('page-title').innerText = preset.title;
        document.getElementById('page-favicon').href = preset.favicon;
        localStorage.setItem('tab_cloak', selector.value);
        
        document.getElementById('cloak-status').innerText = 'Current: ' + preset.title;
    }
}

function initTabCloak() {
    const savedCloak = localStorage.getItem('tab_cloak') || 'aura';
    const selector = document.getElementById('cloak-selector');
    if (selector) {
        selector.value = savedCloak;
        changeTabCloak();
    }
}

// --- ABOUT:BLANK CLOAKING SYSTEM ---
let aboutBlankPending = false;

function showAboutBlankModal() {
    const modal = document.getElementById('aboutblank-modal');
    modal.style.display = 'flex';
}

function handleAboutBlank(choice) {
    const modal = document.getElementById('aboutblank-modal');
    modal.style.display = 'none';
    
    switch(choice) {
        case 'always':
            localStorage.setItem('aboutblank_setting', 'always');
            openInAboutBlank();
            break;
        case 'once':
            aboutBlankPending = true;
            openInAboutBlank();
            break;
        case 'no':
            // Just close modal, don't do anything
            break;
        case 'block':
            localStorage.setItem('aboutblank_setting', 'block');
            showBlockMessage();
            break;
    }
}

function openInAboutBlank() {
    const currentUrl = window.location.href;
    const newWindow = window.open('about:blank', '_blank');
    
    if (newWindow) {
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Aura OS</title>
                <style>
                    body { margin: 0; overflow: hidden; }
                    iframe { width: 100vw; height: 100vh; border: none; }
                </style>
            </head>
            <body>
                <iframe src="${currentUrl}" allowfullscreen></iframe>
            </body>
            </html>
        `);
        newWindow.document.close();
        
        // Close original window if opened successfully
        if (aboutBlankPending) {
            aboutBlankPending = false;
        }
    }
}

function showBlockMessage() {
    notificationMgr.showNotification({
        title: "About:Blank Blocked",
        message: "You have blocked about:blank prompts. You can re-enable auto about:blank in Settings.",
        icon: "shield-alert"
    });
}

function showUpdateModal() {
    // Show on every login (once per session), regardless of previous visits
    if (!sessionStorage.getItem('update_v14_shown')) {
        document.getElementById('update-modal').style.display = 'flex';
        sessionStorage.setItem('update_v14_shown', 'true');
    }
}

function checkAboutBlankSetting() {
    const setting = localStorage.getItem('aboutblank_setting');

    if (setting === 'block') {
        return; // Don't show anything
    } else if (setting === 'always') {
        // INSTANT about:blank - no delay
        openInAboutBlank();
    } else {
        // Show modal (ask mode or not set) - small delay to let page render
        setTimeout(() => {
            showAboutBlankModal();
        }, 500);
    }
}

function saveAboutBlankSetting() {
    const selector = document.getElementById('aboutblank-setting');
    localStorage.setItem('aboutblank_setting', selector.value);
    
    const blockedMsg = document.getElementById('aboutblank-blocked-msg');
    if (selector.value === 'block') {
        blockedMsg.style.display = 'block';
    } else {
        blockedMsg.style.display = 'none';
    }
}

function initAboutBlankSettings() {
    const selector = document.getElementById('aboutblank-setting');
    if (selector) {
        const saved = localStorage.getItem('aboutblank_setting') || 'ask';
        selector.value = saved;
        
        const blockedMsg = document.getElementById('aboutblank-blocked-msg');
        if (saved === 'block') {
            blockedMsg.style.display = 'block';
        }
    }
}

// --- 1. Notification System ---
const notificationMgr = {
    showNotification: function({title, message, icon}) {
        const iconEmoji = icon === 'shield-alert' ? '🛡️' : icon === 'sparkles' ? '✨' : '🔔';
        
        const container = document.getElementById('notification-toast-container');
        const notif = document.createElement('div');
        notif.className = 'notification';
        notif.innerHTML = `<div class="notif-icon">${iconEmoji}</div><div class="notif-content"><strong>${title}</strong><p>${message}</p></div>`;
        container.appendChild(notif);
        
        setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => notif.remove(), 300);
        }, 7000);

        const qsList = document.getElementById('qs-notif-list');
        const noNotifs = qsList.querySelector('.qs-no-notifs');
        if (noNotifs) noNotifs.remove();

        const qsItem = document.createElement('div');
        qsItem.className = 'qs-notif-item';
        qsItem.innerHTML = `<div class="notif-icon">${iconEmoji}</div><div class="notif-content"><strong>${title}</strong><p>${message}</p></div><button class="qs-notif-close" onclick="this.parentElement.remove(); checkEmptyNotifs();">✕</button>`;
        qsList.prepend(qsItem);
    }
};

window.notificationMgr = notificationMgr;

function checkEmptyNotifs() {
    const qsList = document.getElementById('qs-notif-list');
    if (qsList.children.length === 0) {
        qsList.innerHTML = '<div class="qs-no-notifs">No new notifications</div>';
    }
}

function triggerInitialNotifications() {
    if (sessionStorage.getItem('notifs_shown')) return;
    sessionStorage.setItem('notifs_shown', 'true');
    
    setTimeout(() => {
        notificationMgr.showNotification({
            title: "System Announcement",
            message: `Safety is coming to Aura OS. You will be flagged if you use swear words or nasty usernames. Coming on March 10th 2026.`,
            icon: "shield-alert"
        });
        
        // Show about:blank modal after safety notification
        setTimeout(() => {
            checkAboutBlankSetting();
        }, 2500);
    }, 2500);
}

// --- Calendar System ---
let currentCalendarDate = new Date();

function updateCalendarWidget() {
    const now = new Date();
    const dayEl = document.getElementById('calendar-day');
    const dateEl = document.getElementById('calendar-date');
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (dayEl) dayEl.innerText = now.getDate();
    if (dateEl) dateEl.innerText = months[now.getMonth()];
}

function toggleCalendar() {
    const modal = document.getElementById('calendar-modal');
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'flex';
        renderCalendar();
    }
}

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    document.getElementById('calendar-month-year').innerText = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const daysContainer = document.getElementById('calendar-days');
    daysContainer.innerHTML = '';
    
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.innerText = daysInPrevMonth - i;
        daysContainer.appendChild(day);
    }
    
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            day.classList.add('today');
        }
        day.innerText = i;
        daysContainer.appendChild(day);
    }
    
    const remainingCells = 42 - (firstDay + daysInMonth);
    for (let i = 1; i <= remainingCells; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.innerText = i;
        daysContainer.appendChild(day);
    }
}

function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar();
}

// --- Boot Sequence & OOBE Setup ---
window.onload = function() {
    if(localStorage.getItem('os_theme') === 'light') {
        document.body.setAttribute('data-theme', 'light');
        document.getElementById('theme-text').innerText = "Light Theme";
    }

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
            } else {
                triggerInitialNotifications();
            }
        }
    }, 2500);
};

let tempUsername = '';
let tempPassword = '';

function processSetupStep1() {
    const nameInput = document.getElementById('setup-name-input').value.trim();
    if (nameInput === '') { alert("Please enter a name to continue."); return; }
    tempUsername = nameInput;
    document.getElementById('setup-step-1').classList.remove('active');
    document.getElementById('setup-step-2').classList.add('active');
}

function processSetupStep2(isSkipped) {
    if (!isSkipped) {
        const passInput = document.getElementById('setup-pass-input').value;
        if (passInput === '') { alert("Please enter a password or choose 'Skip'."); return; }
        tempPassword = passInput;
    }
    document.getElementById('setup-step-2').classList.remove('active');
    document.getElementById('setup-step-3').classList.add('active');
}

function finalizeSetup() {
    localStorage.setItem('os_setup_complete', 'true');
    localStorage.setItem('os_username', tempUsername);
    if (tempPassword !== '') localStorage.setItem('os_password', tempPassword);
    
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('lock-username').innerText = tempUsername;
    
    initializeDesktop();
    document.getElementById('welcome-modal').style.display = 'flex';
}

function closeWelcomeModal() {
    document.getElementById('welcome-modal').style.display = 'none';
    triggerInitialNotifications();
}

function initializeDesktop() {
    // Show update modal instantly on login (once per session)
    showUpdateModal();
    updateCalendarWidget();
    initChromeProxy();
    initTabCloak();
    initAboutBlankSettings();
    
    const savedWallpaper = localStorage.getItem('os_wallpaper');
    if(savedWallpaper) document.getElementById('desktop').style.backgroundImage = `url('${savedWallpaper}')`;

    const savedApps = JSON.parse(localStorage.getItem('os_installed_apps') || '[]');
    savedApps.forEach(app => {
        restoreAppToLauncher(app.id, app.icon, app.name);
        if (app.pinned) {
            restoreAppToTaskbar(app.id, app.icon, app.name);
        }
    });

    document.querySelectorAll('.app-icon').forEach(makeIconDraggable);
    document.querySelectorAll('.desktop-icon').forEach(dragDesktopIcon);
    initLauncherContextMenu();
    initBattery();
    renderFiles();
}

function factoryReset() {
    if (confirm("WARNING: This will erase all settings, passwords, files, and apps. Continue?")) {
        localStorage.clear();
        location.reload();
    }
}

// --- System UI & Dark Mode ---
function toggleTheme() {
    const body = document.body;
    const textSpan = document.getElementById('theme-text');
    if (body.getAttribute('data-theme') === 'dark') {
        body.setAttribute('data-theme', 'light');
        localStorage.setItem('os_theme', 'light');
        textSpan.innerText = "Light Theme";
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('os_theme', 'dark');
        textSpan.innerText = "Dark Theme";
    }
}

function updateClock() {
    const now = new Date();
    let hours = now.getHours(), minutes = now.getMinutes();
    hours = hours % 12 || 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const clock = document.getElementById('clock');
    if(clock) clock.innerText = hours + ':' + minutes;
}
setInterval(updateClock, 1000); updateClock();
setInterval(updateCalendarWidget, 60000);

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

// --- Context Menus & Uninstall Logic ---
const desktop = document.getElementById('desktop');
const contextMenu = document.getElementById('context-menu');
const launcherContextMenu = document.getElementById('launcher-context-menu');
const quickSettings = document.getElementById('quick-settings');
const launcherMenu = document.getElementById('launcher-menu');
const uninstallBtn = document.getElementById('context-uninstall');

let selectedAppIdToUninstall = null;
let selectedLauncherItem = null;

desktop.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const appIcon = e.target.closest('.app-icon');
    if(appIcon) {
        selectedAppIdToUninstall = appIcon.id.replace('taskbar-', '');
        uninstallBtn.style.display = 'block';
        contextMenu.style.display = 'block';
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = (e.clientY - 100) + 'px'; 
    } else if(e.target === desktop || e.target.closest('#desktop-icons-container')) {
        selectedAppIdToUninstall = null;
        uninstallBtn.style.display = 'none';
        contextMenu.style.display = 'block';
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';
    }
});

uninstallBtn.addEventListener('click', () => {
    if(selectedAppIdToUninstall) {
        const tbIcon = document.getElementById('taskbar-' + selectedAppIdToUninstall);
        if(tbIcon) tbIcon.remove();
        
        document.querySelectorAll('.launcher-item').forEach(item => {
            if(item.getAttribute('onclick') === `openApp('${selectedAppIdToUninstall}')`) item.remove();
        });
        
        const storeBtn = document.getElementById('install-btn-' + selectedAppIdToUninstall);
        if(storeBtn) { storeBtn.innerText = 'Install'; storeBtn.disabled = false; }
        
        let savedApps = JSON.parse(localStorage.getItem('os_installed_apps') || '[]');
        savedApps = savedApps.filter(app => app.id !== selectedAppIdToUninstall);
        localStorage.setItem('os_installed_apps', JSON.stringify(savedApps));
        
        notificationMgr.showNotification({ title: "App Uninstalled", message: "Application removed successfully.", icon: "sparkles" });
    }
    contextMenu.style.display = 'none';
});

function initLauncherContextMenu() {
    const launcherList = document.getElementById('launcher-list');
    
    launcherList.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const item = e.target.closest('.launcher-item');
        if (!item) return;
        
        selectedLauncherItem = item;
        launcherContextMenu.style.display = 'block';
        launcherContextMenu.style.left = e.clientX + 'px';
        launcherContextMenu.style.top = e.clientY + 'px';
    });
}

function launcherContextAction(action) {
    if (!selectedLauncherItem) return;
    
    const appId = selectedLauncherItem.getAttribute('data-app-id');
    const icon = selectedLauncherItem.getAttribute('data-icon');
    const name = selectedLauncherItem.getAttribute('data-name');
    
    switch(action) {
        case 'open':
            openApp(appId);
            break;
        case 'addToShelf':
            if (!document.getElementById('taskbar-' + appId)) {
                restoreAppToTaskbar(appId, icon, name);
                let savedApps = JSON.parse(localStorage.getItem('os_installed_apps') || '[]');
                const app = savedApps.find(a => a.id === appId);
                if (app) {
                    app.pinned = true;
                    localStorage.setItem('os_installed_apps', JSON.stringify(savedApps));
                }
                notificationMgr.showNotification({ 
                    title: "Added to Shelf", 
                    message: `${name} has been pinned to your shelf.`, 
                    icon: "sparkles" 
                });
            }
            break;
        case 'uninstall':
            const tbIcon = document.getElementById('taskbar-' + appId);
            if (tbIcon) tbIcon.remove();
            selectedLauncherItem.remove();
            const storeBtn = document.getElementById('install-btn-' + appId);
            if(storeBtn) { 
                storeBtn.innerText = 'Install'; 
                storeBtn.disabled = false; 
            }
            let savedApps = JSON.parse(localStorage.getItem('os_installed_apps') || '[]');
            savedApps = savedApps.filter(app => app.id !== appId);
            localStorage.setItem('os_installed_apps', JSON.stringify(savedApps));
            notificationMgr.showNotification({ 
                title: "App Uninstalled", 
                message: `${name} has been removed.`, 
                icon: "sparkles" 
            });
            break;
    }
    
    launcherContextMenu.style.display = 'none';
    selectedLauncherItem = null;
}

document.addEventListener('click', (e) => {
    if(!contextMenu.contains(e.target)) contextMenu.style.display = 'none';
    if(!launcherContextMenu.contains(e.target)) launcherContextMenu.style.display = 'none';
    if(!quickSettings.contains(e.target) && !document.getElementById('status-area').contains(e.target)) quickSettings.style.display = 'none';
    if(!launcherMenu.contains(e.target) && !document.getElementById('launcher-btn').contains(e.target)) {
        launcherMenu.style.display = 'none';
    }
    if (e.target.id === 'calendar-modal') {
        document.getElementById('calendar-modal').style.display = 'none';
    }
});

function toggleQuickSettings() { 
    quickSettings.style.display = quickSettings.style.display === 'none' ? 'block' : 'none'; 
    launcherMenu.style.display = 'none'; 
}

function toggleMenu() { 
    launcherMenu.style.display = launcherMenu.style.display === 'none' ? 'flex' : 'none'; 
    quickSettings.style.display = 'none'; 
    if (launcherMenu.style.display === 'flex') document.getElementById('launcher-search').focus(); 
}

function filterLauncher() { 
    const query = document.getElementById('launcher-search').value.toLowerCase(); 
    document.querySelectorAll('.launcher-item').forEach(item => { 
        const text = item.querySelector('.l-text').innerText.toLowerCase(); 
        item.style.display = text.includes(query) ? 'flex' : 'none'; 
    }); 
}

function lockSystem() {
    if (localStorage.getItem('os_password')) {
        document.getElementById('lock-username').innerText = localStorage.getItem('os_username') || 'User';
        document.getElementById('lock-screen').style.display = 'flex';
    } else { alert("Please set a password in Settings first!"); }
    quickSettings.style.display = 'none'; 
    contextMenu.style.display = 'none';
}

function unlockOS() {
    const input = document.getElementById('lock-password').value;
    if (input === localStorage.getItem('os_password') || input === localStorage.getItem('os_answer')) {
        document.getElementById('lock-screen').style.display = 'none';
        document.getElementById('lock-password').value = '';
        document.getElementById('lock-error').style.display = 'none';
        triggerInitialNotifications(); 
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

// --- Window Memory Management ---
let highestZ = 10;
function openApp(appId) {
    const appWindow = document.getElementById(appId);
    if(appWindow) {
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

function maximizeApp(appId) { 
    document.getElementById(appId).classList.toggle('fullscreen'); 
}

function closeApp(appId) {
    const appWindow = document.getElementById(appId);
    appWindow.style.display = 'none'; 
    appWindow.classList.remove('minimized');
    appWindow.classList.remove('fullscreen');
    updateTaskbarIndicator(appId, false);
    
    const iframe = appWindow.querySelector('iframe');
    if(iframe) iframe.src = 'about:blank'; 
}

function toggleApp(appId) {
    const appWindow = document.getElementById(appId);
    if (appWindow.style.display === 'flex' && !appWindow.classList.contains('minimized')) {
        if (appWindow.style.zIndex == highestZ) minimizeApp(appId); 
        else bringToFront(appWindow);
    } else openApp(appId);
}

function bringToFront(elmnt) { 
    highestZ++; 
    elmnt.style.zIndex = highestZ; 
    const iframe = elmnt.querySelector('iframe');
    if(iframe && iframe.contentWindow) {
        iframe.focus();
    }
}

function updateTaskbarIndicator(appId, isActive) {
    const icon = document.querySelector(`button[onclick*="'${appId}'"]`);
    if(icon) isActive ? icon.classList.add('active') : icon.classList.remove('active');
}

// Window Dragging 
const snapPreview = document.getElementById('snap-preview');
let currentSnap = null;
document.querySelectorAll('.window').forEach(win => {
    dragElement(win); 
    win.addEventListener('mousedown', () => bringToFront(win));
});

function dragElement(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = document.getElementById(elmnt.id + "-header");
    if (header) header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if(e.target.tagName === 'BUTTON') return;
        if(elmnt.classList.contains('fullscreen')) return; 
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
    function showPreview(l, t, w, h) { 
        snapPreview.style.display = 'block'; 
        snapPreview.style.left = l; 
        snapPreview.style.top = t; 
        snapPreview.style.width = w; 
        snapPreview.style.height = h; 
    }
    function closeDragElement() {
        document.onmouseup = null; 
        document.onmousemove = null; 
        elmnt.classList.remove('dragging'); 
        snapPreview.style.display = 'none';
        if (currentSnap === 'left') { 
            elmnt.style.left = '0'; 
            elmnt.style.top = '0'; 
            elmnt.style.width = '50vw'; 
            elmnt.style.height = '100vh'; 
        } else if (currentSnap === 'right') { 
            elmnt.style.left = '50vw'; 
            elmnt.style.top = '0'; 
            elmnt.style.width = '50vw'; 
            elmnt.style.height = '100vh'; 
        } else if (currentSnap === 'top') { 
            elmnt.classList.add('fullscreen'); 
            elmnt.style.width=''; 
            elmnt.style.height=''; 
            elmnt.style.top=''; 
            elmnt.style.left=''; 
        }
        currentSnap = null;
    }
}

function dragDesktopIcon(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY;
        document.onmouseup = closeDragElement; document.onmousemove = elementDrag;
    }
    function elementDrag(e) {
        e.preventDefault(); pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px"; elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }
    function closeDragElement() { document.onmouseup = null; document.onmousemove = null; }
}

// --- Local File Explorer & Notepad ---
let currentNotepadFile = null;

function notepadSaveAs() {
    let name = prompt("Enter file name (e.g. MyNotes):");
    if(!name) return;
    if(!name.endsWith('.txt')) name += '.txt';
    currentNotepadFile = name;
    notepadSave();
}

function notepadSave() {
    if(!currentNotepadFile) { notepadSaveAs(); return; }
    let content = document.getElementById('wordpad-editor').innerHTML;
    let files = JSON.parse(localStorage.getItem('aura_files') || '{}');
    files[currentNotepadFile] = content;
    localStorage.setItem('aura_files', JSON.stringify(files));
    notificationMgr.showNotification({ title: "File Saved", message: `${currentNotepadFile} was saved successfully!`, icon: "sparkles" });
    renderFiles();
}

function notepadOpen() {
    let name = prompt("Enter the exact file name to open:");
    if(!name) return;
    if(!name.endsWith('.txt')) name += '.txt';
    
    let files = JSON.parse(localStorage.getItem('aura_files') || '{}');
    if(files[name]) {
        document.getElementById('wordpad-editor').innerHTML = files[name];
        currentNotepadFile = name;
    } else { alert("File not found!"); }
}

function renderFiles() {
    const grid = document.getElementById('file-explorer-grid');
    if(!grid) return;
    let files = JSON.parse(localStorage.getItem('aura_files') || '{}');
    grid.innerHTML = '';
    for(let name in files) {
        grid.innerHTML += `<div class="file-item" ondblclick="window.openFileFromExplorer('${name}')"><div class="f-icon">📄</div><span>${name}</span></div>`;
    }
}

window.openFileFromExplorer = function(name) {
    let files = JSON.parse(localStorage.getItem('aura_files') || '{}');
    document.getElementById('wordpad-editor').innerHTML = files[name];
    currentNotepadFile = name;
    openApp('wordpad-window'); 
};

// --- Applications Logic ---
let calcInput = "";
function calcPress(val) { calcInput += val; document.getElementById('calc-display').value = calcInput; }
function calcClear() { calcInput = ""; document.getElementById('calc-display').value = "0"; }
function calcEval() { 
    try { 
        calcInput = eval(calcInput).toString(); 
        document.getElementById('calc-display').value = calcInput; 
    } catch(e) { 
        document.getElementById('calc-display').value = "Error"; 
        calcInput = ""; 
    } 
}

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
            try { 
                localStorage.setItem('os_wallpaper', ev.target.result); 
            } catch(err) { 
                alert("Image applied for this session."); 
            }
        }; 
        reader.readAsDataURL(file);
    }
});

// --- Taskbar & Play Store Logic ---
function switchStoreTab(tabId) {
    document.querySelectorAll('.play-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.store-tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector(`[onclick="switchStoreTab('${tabId}')"]`).classList.add('active');
    document.getElementById(`store-${tabId}-tab`).classList.add('active');
}

const taskbarIconsContainer = document.getElementById('app-icons');
let draggedIcon = null;

function makeIconDraggable(icon) {
    icon.addEventListener('dragstart', function() { 
        draggedIcon = this; 
        setTimeout(() => this.classList.add('dragging-icon'), 0); 
    });
    icon.addEventListener('dragend', function() { 
        setTimeout(() => { 
            this.classList.remove('dragging-icon'); 
            draggedIcon = null; 
        }, 0); 
    });
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
    const launcherList = document.getElementById('launcher-list');
    const existingItem = launcherList.querySelector(`[data-app-id="${appId}"]`);
    if (existingItem) {
        notificationMgr.showNotification({ 
            title: "Already Installed", 
            message: `${appName} is already in your launcher.`, 
            icon: "sparkles" 
        });
        return;
    }
    
    const pCont = document.getElementById('progress-container-' + appId);
    const pBar = document.getElementById('progress-bar-' + appId);
    
    buttonElement.innerText = 'Installing...'; 
    buttonElement.disabled = true; 
    if(pCont) pCont.style.display = 'block';
    
    let progress = 0;
    const dlInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 20) + 10; 
        if (progress >= 100) {
            progress = 100; 
            clearInterval(dlInterval);
            if(pBar) pBar.style.width = '100%';
            buttonElement.innerText = 'Installed'; 
            if(pCont) setTimeout(() => pCont.style.display = 'none', 500);
            
            restoreAppToLauncher(appId, iconSymbol, appName); 
            saveAppToStorage(appId, iconSymbol, appName);
            
            notificationMgr.showNotification({ 
                title: "Installation Complete", 
                message: `${appName} has been added to your launcher. Right-click to add to shelf.`, 
                icon: "sparkles" 
            });
        } else if(pBar) {
            pBar.style.width = progress + '%';
        }
    }, 300); 
}

function restoreAppToLauncher(appId, iconSymbol, appName) {
    const launcherList = document.getElementById('launcher-list');
    if (launcherList.querySelector(`[data-app-id="${appId}"]`)) return;
    
    const item = document.createElement('div');
    item.className = 'launcher-item';
    item.setAttribute('data-app-id', appId);
    item.setAttribute('data-icon', iconSymbol);
    item.setAttribute('data-name', appName);
    item.onclick = () => openApp(appId);
    item.innerHTML = `<div class="l-icon">${iconSymbol}</div><span class="l-text">${appName}</span>`;
    launcherList.appendChild(item);
}

function restoreAppToTaskbar(appId, iconSymbol, appName) {
    if (document.getElementById('taskbar-' + appId)) return;
    
    const btn = document.createElement('button'); 
    btn.className = 'app-icon'; 
    btn.id = 'taskbar-' + appId; 
    btn.title = appName; 
    btn.innerHTML = iconSymbol; 
    btn.draggable = true; 
    btn.onclick = () => toggleApp(appId);
    
    taskbarIconsContainer.appendChild(btn); 
    makeIconDraggable(btn);
}

function saveAppToStorage(appId, iconSymbol, appName) {
    let savedApps = JSON.parse(localStorage.getItem('os_installed_apps') || '[]');
    if (!savedApps.find(app => app.id === appId)) {
        savedApps.push({ 
            id: appId, 
            icon: iconSymbol, 
            name: appName,
            pinned: false
        }); 
        localStorage.setItem('os_installed_apps', JSON.stringify(savedApps));
    }
}
