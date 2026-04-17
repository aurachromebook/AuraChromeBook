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

    // Special case: ChromeReworked.html loads directly without proxy
    if (url === 'Apps/ChromeReworked.html' || url.includes('ChromeReworked')) {
        const iframe = document.getElementById('chrome-frame');
        const errorDiv = document.getElementById('chrome-error');
        if (iframe) {
            iframe.src = 'Apps/ChromeReworked.html';
        }
        if (errorDiv) errorDiv.style.display = 'none';
        return;
    }

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

// --- INSTANT ABOUT:BLANK CLOAKING - EXECUTE IMMEDIATELY ---
(function checkInstantAboutBlank() {
    const setting = localStorage.getItem('aboutblank_setting');
    if (setting === 'always') {
        // Prevent multiple about:blank tabs - check if we're already in an iframe
        if (window.self !== window.top) {
            // Already inside an iframe (about:blank), do nothing
            return;
        }

        // Check if we've already opened about:blank in this session
        if (sessionStorage.getItem('aboutblank_opened')) {
            return;
        }
        sessionStorage.setItem('aboutblank_opened', 'true');

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

            // Close the original tab
            window.close();
        }
    }
})();

// --- ABOUT:BLANK CLOAKING SYSTEM ---
let aboutBlankPending = false;

function showAboutBlankModal() {
    const modal = document.getElementById('aboutblank-modal');
    if (modal) modal.style.display = 'flex';
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
    // Prevent multiple about:blank tabs
    if (window.self !== window.top) {
        return;
    }

    if (sessionStorage.getItem('aboutblank_opened')) {
        return;
    }
    sessionStorage.setItem('aboutblank_opened', 'true');

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

        // Close the original tab
        window.close();
    }
}

function showBlockMessage() {
    notificationMgr.showNotification({
        title: "About:Blank Blocked",
        message: "You have blocked about:blank prompts. You can re-enable auto about:blank in Settings.",
        icon: "shield-alert"
    });
}

function checkAboutBlankSetting() {
    const setting = localStorage.getItem('aboutblank_setting');

    if (setting === 'block') {
        return; // Don't show anything
    } else if (setting === 'always') {
        // Already handled by instant check above, but double-check here
        // This is for cases where the page loads without the IIFE firing
        setTimeout(() => {
            const currentUrl = window.location.href;
            // Check if we're in the original window (not the about:blank iframe)
            if (window.self === window.top && !window.location.href.includes('about:blank')) {
                // Already handled by IIFE, do nothing
            }
        }, 100);
    } else {
        // Show modal (ask mode or not set)
        setTimeout(() => {
            showAboutBlankModal();
        }, 3000);
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
        if (saved === 'block' && blockedMsg) {
            blockedMsg.style.display = 'block';
        }
    }
}

// --- 1. Notification System ---
const notificationMgr = {
    showNotification: function({title, message, icon}) {
        const iconEmoji = icon === 'shield-alert' ? '🛡️' : icon === 'sparkles' ? '✨' : '🔔';

        const container = document.getElementById('notification-toast-container');
        if (!container) return;

        const notif = document.createElement('div');
        notif.className = 'notification';
        notif.innerHTML = `<div class="notif-icon">${iconEmoji}</div><div class="notif-content"><strong>${title}</strong><p>${message}</p></div>`;
        container.appendChild(notif);

        setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => notif.remove(), 300);
        }, 7000);

        const qsList = document.getElementById('qs-notif-list');
        if (qsList) {
            const noNotifs = qsList.querySelector('.qs-no-notifs');
            if (noNotifs) noNotifs.remove();

            const qsItem = document.createElement('div');
            qsItem.className = 'qs-notif-item';
            qsItem.innerHTML = `<div class="notif-icon">${iconEmoji}</div><div class="notif-content"><strong>${title}</strong><p>${message}</p></div><button class="qs-notif-close" onclick="this.parentElement.remove(); checkEmptyNotifs();">✕</button>`;
            qsList.prepend(qsItem);
        }
    }
};

window.notificationMgr = notificationMgr;

function checkEmptyNotifs() {
    const qsList = document.getElementById('qs-notif-list');
    if (qsList && qsList.children.length === 0) {
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
    }, 2500);
}

// --- Update V1.4 Modal Functions ---
function showUpdateModal() {
    const modal = document.getElementById('update-modal');
    if (!modal) return;

    modal.style.display = 'flex';

    // Open Link Center in new tab
    window.open('https://docs.google.com/document/d/1H8FWbv4odBnSN-J5874YiJeUGFDxNxdNGPguCjpgh70/edit?usp=sharing', '_blank');

    // Check if user has seen this modal before
    const hasSeenModal = localStorage.getItem('update_v16_seen');
    const continueBtn = document.getElementById('update-continue-btn');

    if (hasSeenModal) {
        // User has seen it - button is immediately clickable (blue)
        continueBtn.disabled = false;
        continueBtn.classList.add('active');
        continueBtn.innerText = 'Continue';
    } else {
        // First time - countdown from 5
        continueBtn.disabled = true;
        continueBtn.classList.remove('active');

        let countdown = 5;
        continueBtn.innerText = `Continue (${countdown})`;

        const timer = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                continueBtn.innerText = `Continue (${countdown})`;
            } else {
                clearInterval(timer);
                continueBtn.innerText = 'Continue';
                continueBtn.disabled = false;
                continueBtn.classList.add('active');
                localStorage.setItem('update_v16_seen', 'true');
            }
        }, 1000);
    }
}

function closeUpdateModal() {
    const modal = document.getElementById('update-modal');
    if (modal) {
        modal.style.display = 'none';
    }
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

    const headerEl = document.getElementById('calendar-month-year');
    if (headerEl) headerEl.innerText = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const daysContainer = document.getElementById('calendar-days');
    if (!daysContainer) return;

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

// --- DESK UI FUNCTIONS ---
let currentDesk = 1;
let deskCount = 1;
const maxDesks = 8;
let deskWindows = {}; // Store which windows are on which desk

function toggleDeskSwitcher() {
    const switcher = document.getElementById('desk-switcher');
    const quickSettings = document.getElementById('quick-settings');
    const launcherMenu = document.getElementById('launcher-menu');

    if (switcher.style.display === 'none') {
        switcher.style.display = 'block';
        if (quickSettings) quickSettings.style.display = 'none';
        if (launcherMenu) launcherMenu.style.display = 'none';
        updateDeskPreviews();
    } else {
        switcher.style.display = 'none';
    }
}

function addNewDesk() {
    if (deskCount >= maxDesks) {
        notificationMgr.showNotification({
            title: "Maximum Desks Reached",
            message: "You can only have up to 8 desks.",
            icon: "shield-alert"
        });
        return;
    }

    deskCount++;
    const deskList = document.getElementById('desk-list');
    const newDeskItem = document.createElement('div');
    newDeskItem.className = 'desk-item';
    newDeskItem.setAttribute('data-desk', deskCount);
    newDeskItem.onclick = () => switchToDesk(deskCount);
    newDeskItem.innerHTML = `
        <div class="desk-preview" id="desk-preview-${deskCount}"></div>
        <span class="desk-name">Desk ${deskCount}</span>
        <button class="desk-close" onclick="event.stopPropagation(); closeDesk(${deskCount})">×</button>
    `;
    deskList.appendChild(newDeskItem);

    // Initialize empty window list for new desk
    deskWindows[deskCount] = [];

    notificationMgr.showNotification({
        title: "New Desk Created",
        message: `Desk ${deskCount} has been created.`,
        icon: "sparkles"
    });

    // Switch to the new desk
    switchToDesk(deskCount);
}

function switchToDesk(deskNum) {
    if (deskNum === currentDesk) {
        document.getElementById('desk-switcher').style.display = 'none';
        return;
    }

    // Save current windows to current desk
    const currentWindows = [];
    document.querySelectorAll('.window').forEach(win => {
        if (win.style.display === 'flex' && !win.classList.contains('minimized')) {
            currentWindows.push(win.id);
        }
    });
    deskWindows[currentDesk] = currentWindows;

    // Hide all windows from current desk
    document.querySelectorAll('.window').forEach(win => {
        win.classList.add('desk-hidden');
        win.style.display = 'none';
    });

    // Show windows from target desk
    const targetWindows = deskWindows[deskNum] || [];
    targetWindows.forEach(winId => {
        const win = document.getElementById(winId);
        if (win) {
            win.classList.remove('desk-hidden');
            win.style.display = 'flex';
        }
    });

    // Update UI
    currentDesk = deskNum;
    document.getElementById('current-desk-name').innerText = `Desk ${deskNum}`;

    // Update active state in switcher
    document.querySelectorAll('.desk-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.getAttribute('data-desk')) === deskNum) {
            item.classList.add('active');
        }
    });

    document.getElementById('desk-switcher').style.display = 'none';

    notificationMgr.showNotification({
        title: `Switched to Desk ${deskNum}`,
        message: "Use keyboard shortcuts to switch desks quickly.",
        icon: "sparkles"
    });
}

function closeDesk(deskNum) {
    if (deskCount <= 1) {
        notificationMgr.showNotification({
            title: "Cannot Close Desk",
            message: "You must have at least one desk.",
            icon: "shield-alert"
        });
        return;
    }

    // Close all windows on this desk
    const windowsToClose = deskWindows[deskNum] || [];
    windowsToClose.forEach(winId => {
        const win = document.getElementById(winId);
        if (win) {
            win.style.display = 'none';
            win.classList.remove('desk-hidden');
        }
    });

    // Remove desk item
    const deskItem = document.querySelector(`.desk-item[data-desk="${deskNum}"]`);
    if (deskItem) deskItem.remove();

    // Update desk count
    deskCount--;

    // Renumber remaining desks
    const deskItems = document.querySelectorAll('.desk-item');
    deskItems.forEach((item, index) => {
        const newNum = index + 1;
        item.setAttribute('data-desk', newNum);
        item.querySelector('.desk-name').innerText = `Desk ${newNum}`;
        item.querySelector('.desk-close').setAttribute('onclick', `event.stopPropagation(); closeDesk(${newNum})`);
        item.onclick = () => switchToDesk(newNum);
    });

    // Switch to desk 1 if we closed the current desk
    if (currentDesk === deskNum) {
        switchToDesk(1);
    } else if (currentDesk > deskNum) {
        currentDesk--;
        document.getElementById('current-desk-name').innerText = `Desk ${currentDesk}`;
    }

    notificationMgr.showNotification({
        title: "Desk Closed",
        message: `Desk ${deskNum} has been closed.`,
        icon: "sparkles"
    });
}

function updateDeskPreviews() {
    // Update preview thumbnails for each desk
    document.querySelectorAll('.desk-item').forEach(item => {
        const deskNum = parseInt(item.getAttribute('data-desk'));
        const preview = item.querySelector('.desk-preview');
        const windows = deskWindows[deskNum] || [];

        // Show window count indicator
        if (windows.length > 0) {
            preview.innerHTML = `<span style="position: absolute; bottom: 2px; right: 2px; background: var(--sys-primary); color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px;">${windows.length}</span>`;
        } else {
            preview.innerHTML = '';
        }
    });
}

// Keyboard shortcuts for desk switching
document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + Shift + Arrow Up/Down to switch desks
    if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevDesk = currentDesk > 1 ? currentDesk - 1 : deskCount;
            switchToDesk(prevDesk);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextDesk = currentDesk < deskCount ? currentDesk + 1 : 1;
            switchToDesk(nextDesk);
        }
    }
});

// Track window openings for desk management
const originalOpenApp = openApp;
openApp = function(appId) {
    const win = document.getElementById(appId);
    if (win) {
        win.classList.remove('desk-hidden');

        // Add to current desk's window list
        if (!deskWindows[currentDesk]) deskWindows[currentDesk] = [];
        if (!deskWindows[currentDesk].includes(appId)) {
            deskWindows[currentDesk].push(appId);
        }
    }
    return originalOpenApp(appId);
};

// --- Boot Sequence & OOBE Setup ---
window.onload = function() {
    if(localStorage.getItem('os_theme') === 'light') {
        document.body.setAttribute('data-theme', 'light');
        const themeText = document.getElementById('theme-text');
        if (themeText) themeText.innerText = "Light Theme";
    }

    setTimeout(() => {
        const boot = document.getElementById('boot-screen');
        if(boot) {
            boot.style.opacity = '0';
            setTimeout(() => boot.style.display = 'none', 500);
        }

        const isSetupComplete = localStorage.getItem('os_setup_complete');

        if (!isSetupComplete) {
            const setupScreen = document.getElementById('setup-screen');
            if (setupScreen) setupScreen.style.display = 'flex';
        } else {
            initializeDesktop();
            if (localStorage.getItem('os_password')) {
                const lockUsername = document.getElementById('lock-username');
                if (lockUsername) lockUsername.innerText = localStorage.getItem('os_username') || 'User';
                const lockScreen = document.getElementById('lock-screen');
                if (lockScreen) lockScreen.style.display = 'flex';
            } else {
                // No password set - show update modal immediately and trigger notifications
                showUpdateModal();
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
    const lockUsername = document.getElementById('lock-username');
    if (lockUsername) lockUsername.innerText = tempUsername;

    initializeDesktop();
    const welcomeModal = document.getElementById('welcome-modal');
    if (welcomeModal) welcomeModal.style.display = 'flex';
}

function closeWelcomeModal() {
    const welcomeModal = document.getElementById('welcome-modal');
    if (welcomeModal) welcomeModal.style.display = 'none';
    // Show update modal after welcome modal is closed
    showUpdateModal();
    triggerInitialNotifications();
}

function initializeDesktop() {
    updateCalendarWidget();
    initChromeProxy();
    initTabCloak();
    initAboutBlankSettings();

    const desktop = document.getElementById('desktop');
    const savedWallpaper = localStorage.getItem('os_wallpaper');
    if(savedWallpaper && desktop) desktop.style.backgroundImage = `url('${savedWallpaper}')`;

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
        if (textSpan) textSpan.innerText = "Light Theme";
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('os_theme', 'dark');
        if (textSpan) textSpan.innerText = "Dark Theme";
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

// Brightness slider
document.addEventListener('DOMContentLoaded', function() {
    const brightnessSlider = document.getElementById('brightness-slider');
    if (brightnessSlider) {
        brightnessSlider.addEventListener('input', function(e) {
            const desktop = document.getElementById('desktop');
            if (desktop) desktop.style.filter = `brightness(${e.target.value}%)`;
        });
    }
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

if (desktop) {
    desktop.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const appIcon = e.target.closest('.app-icon');
        if(appIcon) {
            selectedAppIdToUninstall = appIcon.id.replace('taskbar-', '');
            if(uninstallBtn) uninstallBtn.style.display = 'block';
            if(contextMenu) {
                contextMenu.style.display = 'block';
                contextMenu.style.left = e.clientX + 'px';
                contextMenu.style.top = (e.clientY - 100) + 'px'; 
            }
        } else if(e.target === desktop || e.target.closest('#desktop-icons-container')) {
            selectedAppIdToUninstall = null;
            if(uninstallBtn) uninstallBtn.style.display = 'none';
            if(contextMenu) {
                contextMenu.style.display = 'block';
                contextMenu.style.left = e.clientX + 'px';
                contextMenu.style.top = e.clientY + 'px';
            }
        }
    });
}

if (uninstallBtn) {
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
        if(contextMenu) contextMenu.style.display = 'none';
    });
}

function initLauncherContextMenu() {
    const launcherList = document.getElementById('launcher-list');
    if (!launcherList) return;

    launcherList.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const item = e.target.closest('.launcher-item');
        if (!item) return;

        selectedLauncherItem = item;
        if(launcherContextMenu) {
            launcherContextMenu.style.display = 'block';
            launcherContextMenu.style.left = e.clientX + 'px';
            launcherContextMenu.style.top = e.clientY + 'px';
        }
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

    if(launcherContextMenu) launcherContextMenu.style.display = 'none';
    selectedLauncherItem = null;
}

document.addEventListener('click', (e) => {
    if(contextMenu && !contextMenu.contains(e.target)) contextMenu.style.display = 'none';
    if(launcherContextMenu && !launcherContextMenu.contains(e.target)) launcherContextMenu.style.display = 'none';
    if(quickSettings && !quickSettings.contains(e.target) && !document.getElementById('status-area').contains(e.target)) quickSettings.style.display = 'none';
    if(launcherMenu && !launcherMenu.contains(e.target) && !document.getElementById('launcher-btn').contains(e.target)) {
        launcherMenu.style.display = 'none';
    }
    if (e.target.id === 'calendar-modal') {
        const calendarModal = document.getElementById('calendar-modal');
        if (calendarModal) calendarModal.style.display = 'none';
    }
});

function toggleQuickSettings() { 
    if (!quickSettings) return;
    quickSettings.style.display = quickSettings.style.display === 'none' ? 'block' : 'none'; 
    if (launcherMenu) launcherMenu.style.display = 'none'; 
}

function toggleMenu() { 
    if (!launcherMenu) return;
    launcherMenu.style.display = launcherMenu.style.display === 'none' ? 'flex' : 'none'; 
    if (quickSettings) quickSettings.style.display = 'none'; 
    if (launcherMenu.style.display === 'flex') {
        const searchInput = document.getElementById('launcher-search');
        if (searchInput) searchInput.focus();
    }
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
        const lockUsername = document.getElementById('lock-username');
        if (lockUsername) lockUsername.innerText = localStorage.getItem('os_username') || 'User';
        const lockScreen = document.getElementById('lock-screen');
        if (lockScreen) lockScreen.style.display = 'flex';
    } else { 
        alert("Please set a password in Settings first!"); 
    }
    if (quickSettings) quickSettings.style.display = 'none'; 
    if (contextMenu) contextMenu.style.display = 'none';
}

function unlockOS() {
    const input = document.getElementById('lock-password').value;
    const lockError = document.getElementById('lock-error');
    const lockScreen = document.getElementById('lock-screen');

    if (input === localStorage.getItem('os_password') || input === localStorage.getItem('os_answer')) {
        if (lockScreen) lockScreen.style.display = 'none';
        document.getElementById('lock-password').value = '';
        if (lockError) lockError.style.display = 'none';
        // Show update modal immediately after unlocking
        showUpdateModal();
        triggerInitialNotifications(); 
    } else {
        if (lockError) lockError.style.display = 'block';
    }
}

function showSecurityQuestion() {
    const hintDiv = document.getElementById('security-hint');
    const qText = document.getElementById('lock-question-text');
    const savedQ = localStorage.getItem('os_question');
    if (qText) qText.innerText = savedQ ? "Hint: " + savedQ : "No security question set.";
    if (hintDiv) hintDiv.style.display = 'block';
}

function saveSecuritySettings() {
    const pass = document.getElementById('set-password').value;
    const q = document.getElementById('set-question').value;
    const a = document.getElementById('set-answer').value;
    if(pass) localStorage.setItem('os_password', pass);
    if(q) localStorage.setItem('os_question', q);
    if(a) localStorage.setItem('os_answer', a);
    const msg = document.getElementById('security-save-msg');
    if (msg) {
        msg.style.display = 'block'; 
        setTimeout(() => msg.style.display = 'none', 3000);
    }
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
    if (launcherMenu) launcherMenu.style.display = 'none';
}

function minimizeApp(appId) { 
    const appWindow = document.getElementById(appId);
    if (appWindow) appWindow.classList.add('minimized'); 
    updateTaskbarIndicator(appId, false); 
}

function maximizeApp(appId) { 
    const appWindow = document.getElementById(appId);
    if (appWindow) appWindow.classList.toggle('fullscreen'); 
}

function closeApp(appId) {
    const appWindow = document.getElementById(appId);
    if (!appWindow) return;

    appWindow.style.display = 'none'; 
    appWindow.classList.remove('minimized');
    appWindow.classList.remove('fullscreen');
    updateTaskbarIndicator(appId, false);

    const iframe = appWindow.querySelector('iframe');
    if(iframe) iframe.src = 'about:blank'; 
}

function toggleApp(appId) {
    const appWindow = document.getElementById(appId);
    if (!appWindow) return;

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
    if(icon) {
        if (isActive) icon.classList.add('active');
        else icon.classList.remove('active');
    }
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
        else { 
            if (snapPreview) snapPreview.style.display = 'none'; 
            currentSnap = null; 
        }
    }
    function showPreview(l, t, w, h) { 
        if (!snapPreview) return;
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
        if (snapPreview) snapPreview.style.display = 'none';
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
function calcPress(val) { 
    calcInput += val; 
    const display = document.getElementById('calc-display');
    if (display) display.value = calcInput; 
}
function calcClear() { 
    calcInput = ""; 
    const display = document.getElementById('calc-display');
    if (display) display.value = "0"; 
}
function calcEval() { 
    try { 
        calcInput = eval(calcInput).toString(); 
        const display = document.getElementById('calc-display');
        if (display) display.value = calcInput; 
    } catch(e) { 
        const display = document.getElementById('calc-display');
        if (display) display.value = "Error"; 
        calcInput = ""; 
    } 
}

function setWallpaper(url) {
    let highResUrl = url.replace("w=400", "w=2000");
    const desktop = document.getElementById('desktop');
    if (desktop) desktop.style.backgroundImage = `url('${highResUrl}')`;
    localStorage.setItem('os_wallpaper', highResUrl);
}

// Wallpaper upload
document.addEventListener('DOMContentLoaded', function() {
    const wallpaperUpload = document.getElementById('wallpaper-upload');
    if (wallpaperUpload) {
        wallpaperUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    const desktop = document.getElementById('desktop');
                    if (desktop) desktop.style.backgroundImage = `url('${ev.target.result}')`;
                    try { 
                        localStorage.setItem('os_wallpaper', ev.target.result); 
                    } catch(err) { 
                        alert("Image applied for this session."); 
                    }
                }; 
                reader.readAsDataURL(file);
            }
        });
    }
});

// --- Taskbar & Play Store Logic ---
function switchStoreTab(tabId) {
    document.querySelectorAll('.play-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.store-tab-content').forEach(content => content.classList.remove('active'));
    const tabBtn = document.querySelector(`[onclick="switchStoreTab('${tabId}')"]`);
    if (tabBtn) tabBtn.classList.add('active');
    const tabContent = document.getElementById(`store-${tabId}-tab`);
    if (tabContent) tabContent.classList.add('active');
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
        if (draggedIcon !== this && taskbarIconsContainer) {
            let allIcons = [...taskbarIconsContainer.children];
            allIcons.indexOf(draggedIcon) < allIcons.indexOf(this) ? this.after(draggedIcon) : this.before(draggedIcon);
        }
    });
}

function installApp(appId, iconSymbol, appName, buttonElement) {
    const launcherList = document.getElementById('launcher-list');
    const existingItem = launcherList ? launcherList.querySelector(`[data-app-id="${appId}"]`) : null;
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
    if (!launcherList || launcherList.querySelector(`[data-app-id="${appId}"]`)) return;

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

    if (taskbarIconsContainer) taskbarIconsContainer.appendChild(btn); 
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
