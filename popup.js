// const toggleBtn      = document.getElementById('toggleBtn');
// const intervalInput  = document.getElementById('intervalInput');
// const statusText     = document.getElementById('statusText');
// const intervalDisplay = document.getElementById('intervalDisplay');
// const countText      = document.getElementById('countText');
// const lastUrlDiv     = document.getElementById('lastUrl');

// // ── Load saved state when popup opens ─────────────────────────────────────
// chrome.storage.local.get(
//   ['isEnabled', 'interval', 'uploadCount', 'lastUploadUrl'],
//   (data) => {
//     const enabled      = data.isEnabled   || false;
//     const savedInterval = data.interval   || 20;
//     const count        = data.uploadCount || 0;

//     intervalInput.value = savedInterval;
//     updateUI(enabled, savedInterval, count, data.lastUploadUrl || null);
//   }
// );

// // ── Toggle button click ────────────────────────────────────────────────────
// toggleBtn.addEventListener('click', () => {
//   chrome.storage.local.get(['isEnabled'], (data) => {
//     const newState   = !data.isEnabled;
//     const intervalSec = parseInt(intervalInput.value) || 20;

//     // Save new state
//     chrome.storage.local.set({
//       isEnabled: newState,
//       interval: intervalSec
//     });

//     // Send message to background service worker
//     chrome.runtime.sendMessage({
//       action:   newState ? 'START' : 'STOP',
//       interval: intervalSec
//     });

//     // Refresh UI immediately
//     chrome.storage.local.get(
//       ['uploadCount', 'lastUploadUrl'],
//       (d) => updateUI(newState, intervalSec, d.uploadCount || 0, d.lastUploadUrl || null)
//     );
//   });
// });

// // ── Auto-refresh stats every 3 seconds while popup is open ────────────────
// setInterval(() => {
//   chrome.storage.local.get(
//     ['isEnabled', 'interval', 'uploadCount', 'lastUploadUrl'],
//     (data) => {
//       updateUI(
//         data.isEnabled || false,
//         data.interval  || 20,
//         data.uploadCount || 0,
//         data.lastUploadUrl || null
//       );
//     }
//   );
// }, 3000);

// // ── UI updater ─────────────────────────────────────────────────────────────
// function updateUI(enabled, interval, count, lastUrl) {
//   if (enabled) {
//     toggleBtn.textContent  = '⏹ Stop Capturing';
//     toggleBtn.className    = 'active';
//     statusText.textContent = '🟢 Active';
//     statusText.className   = 'value-text value-green';
//     intervalInput.disabled = true;
//   } else {
//     toggleBtn.textContent  = '▶ Start Capturing';
//     toggleBtn.className    = 'inactive';
//     statusText.textContent = '⚫ Inactive';
//     statusText.className   = 'value-text value-red';
//     intervalInput.disabled = false;
//   }

//   intervalDisplay.textContent = `${interval}s`;
//   countText.textContent       = `${count} screenshot${count !== 1 ? 's' : ''}`;

//   if (lastUrl) {
//     lastUrlDiv.innerHTML = `Last: <a href="${lastUrl}" target="_blank"
//       style="color:#7eb8f7">${lastUrl.slice(0, 45)}...</a>`;
//   }
// }
// ── Element references ─────────────────────────────────────────────────────
const toggleBtn     = document.getElementById('toggleBtn');
const intervalInput = document.getElementById('intervalInput');
const expirySelect  = document.getElementById('expirySelect');
const statusText    = document.getElementById('statusText');
const intervalDisp  = document.getElementById('intervalDisp');
const expiryDisp    = document.getElementById('expiryDisp');
const lastTimeDisp  = document.getElementById('lastTimeDisp');
const lastErrorDisp = document.getElementById('lastErrorDisp');
const lastUrlDiv    = document.getElementById('lastUrl');
const totalCount    = document.getElementById('totalCount');
const sessionCount  = document.getElementById('sessionCount');
const sessionRate   = document.getElementById('sessionRate');
const resetBtn      = document.getElementById('resetBtn');

// ── Expiry label map ───────────────────────────────────────────────────────
const EXPIRY_MAP = {
  '0':       'Never',
  '300':     '5 Minutes',
  '3600':    '1 Hour',
  '86400':   '24 Hours',
  '604800':  '7 Days',
  '2592000': '30 Days'
};

// ── Session tracking (resets each time popup opens) ───────────────────────
let sessionStart       = Date.now();
let sessionStartCount  = 0;
let sessionInitialized = false;

// ── Rate limit countdown timer handle ─────────────────────────────────────
let countdownTimer = null;

// ─────────────────────────────────────────────────────────────────────────
// LOAD STATE — reads chrome.storage and renders UI
// ─────────────────────────────────────────────────────────────────────────
function loadState() {
  chrome.storage.local.get([
    'isEnabled', 'interval', 'expiry',
    'uploadCount', 'lastUploadUrl',
    'lastCaptureTime', 'lastError',
    'rateLimitStatus'
  ], (data) => {
    const enabled  = data.isEnabled  || false;
    const interval = data.interval   || 30;
    const expiry   = data.expiry     !== undefined ? data.expiry : 604800;
    const count    = data.uploadCount || 0;

    // Initialize session baseline once per popup open
    if (!sessionInitialized) {
      sessionStartCount  = count;
      sessionStart       = Date.now();
      sessionInitialized = true;
    }

    // Sync inputs only when extension is inactive (avoid overwriting live settings)
    if (!enabled) {
      intervalInput.value = interval;
      expirySelect.value  = String(expiry);
    }

    renderUI(
      enabled, interval, expiry, count,
      data.lastUploadUrl    || null,
      data.lastCaptureTime  || null,
      data.lastError        || null,
      data.rateLimitStatus  || null
    );
  });
}

// Initial load
loadState();

// Auto-refresh every 2s while popup is open
const refreshTimer = setInterval(loadState, 2000);

// Cleanup timer when popup is closed
window.addEventListener('unload', () => {
  clearInterval(refreshTimer);
  if (countdownTimer) clearInterval(countdownTimer);
});

// ─────────────────────────────────────────────────────────────────────────
// TOGGLE BUTTON
// ─────────────────────────────────────────────────────────────────────────
toggleBtn.addEventListener('click', () => {
  chrome.storage.local.get(['isEnabled'], (data) => {
    const newState    = !data.isEnabled;
    const intervalSec = Math.max(30, parseInt(intervalInput.value) || 30);
    const expirySec   = parseInt(expirySelect.value) || 0;

    // Correct interval if user typed below minimum
    if (parseInt(intervalInput.value) < 30) {
      intervalInput.value = 30;
    }

    chrome.storage.local.set({
      isEnabled: newState,
      interval:  intervalSec,
      expiry:    expirySec,
      lastError: null,
      rateLimitStatus: null
    });

    chrome.runtime.sendMessage({
      action:   newState ? 'START' : 'STOP',
      interval: intervalSec,
      expiry:   expirySec
    });

    // Reset session counters on fresh start
    if (newState) {
      sessionStart = Date.now();
      chrome.storage.local.get(['uploadCount'], (d) => {
        sessionStartCount = d.uploadCount || 0;
      });
      // Clear any rate limit countdown display
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// RESET BUTTON
// ─────────────────────────────────────────────────────────────────────────
resetBtn.addEventListener('click', () => {
  if (!confirm('Reset all upload history and counter to zero?')) return;

  chrome.storage.local.set({
    uploadCount:     0,
    lastUploadUrl:   null,
    lastCaptureTime: null,
    lastError:       null,
    rateLimitStatus: null
  });

  // Reset session state
  sessionStartCount  = 0;
  sessionStart       = Date.now();
  sessionInitialized = false;

  // Clear countdown if running
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  loadState();
});

// ─────────────────────────────────────────────────────────────────────────
// RATE LIMIT COUNTDOWN
// Shows a live ticking countdown in the error field when rate limited
// ─────────────────────────────────────────────────────────────────────────
function startCountdown(untilTimestamp, attempts) {
  // Clear any existing countdown
  if (countdownTimer) clearInterval(countdownTimer);

  function tick() {
    const secsLeft = Math.ceil((untilTimestamp - Date.now()) / 1000);

    if (secsLeft <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      lastErrorDisp.textContent = '✅ Cooldown done — next capture will upload';
      lastErrorDisp.className   = 'stat-value green';
      return;
    }

    // Format as mm:ss
    const mins = Math.floor(secsLeft / 60);
    const secs = secsLeft % 60;
    const formatted = mins > 0
      ? `${mins}m ${secs}s`
      : `${secs}s`;

    lastErrorDisp.textContent =
      `⏳ Rate limited — retry in ${formatted} (attempt ${attempts})`;
    lastErrorDisp.className = 'stat-value yellow';
  }

  tick(); // run immediately
  countdownTimer = setInterval(tick, 1000);
}

// ─────────────────────────────────────────────────────────────────────────
// RENDER UI — updates every element based on current state
// ─────────────────────────────────────────────────────────────────────────
function renderUI(
  enabled, interval, expiry, count,
  lastUrl, lastTime, lastErr, rateLimitStatus
) {

  // ── Toggle button + input states ────────────────────────────────────────
  if (enabled) {
    toggleBtn.textContent  = '⏹ Stop Capturing';
    toggleBtn.className    = 'active';
    statusText.textContent = '🟢 Active';
    statusText.className   = 'stat-value green';
    intervalInput.disabled = true;
    expirySelect.disabled  = true;
  } else {
    toggleBtn.textContent  = '▶ Start Capturing';
    toggleBtn.className    = 'inactive';
    statusText.textContent = '⚫ Inactive';
    statusText.className   = 'stat-value red';
    intervalInput.disabled = false;
    expirySelect.disabled  = false;
  }

  // ── Settings display ─────────────────────────────────────────────────────
  intervalDisp.textContent = `${interval}s`;
  expiryDisp.textContent   = EXPIRY_MAP[String(expiry)] || `${expiry}s`;
  lastTimeDisp.textContent = lastTime || '—';

  // ── Error / Rate limit display ───────────────────────────────────────────
  if (rateLimitStatus && Date.now() < rateLimitStatus.until) {
    // Active rate limit — show live countdown
    if (!countdownTimer) {
      startCountdown(rateLimitStatus.until, rateLimitStatus.attempts);
    }
  } else if (lastErr && !lastErr.includes('Rate limit')) {
    // Regular error (non rate-limit)
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    lastErrorDisp.textContent = lastErr.slice(0, 55);
    lastErrorDisp.className   = 'stat-value red';
  } else if (!rateLimitStatus || Date.now() >= rateLimitStatus.until) {
    // All clear
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    lastErrorDisp.textContent = 'None';
    lastErrorDisp.className   = 'stat-value';
  }

  // ── Photo counter — Total ────────────────────────────────────────────────
  totalCount.textContent = count;

  // ── Photo counter — This session ────────────────────────────────────────
  const thisSession = Math.max(0, count - sessionStartCount);
  sessionCount.textContent = thisSession;

  // ── Upload rate (photos per minute this session) ─────────────────────────
  const elapsedMins = (Date.now() - sessionStart) / 60000;
  if (elapsedMins > 0.2 && thisSession > 0) {
    const rate = (thisSession / elapsedMins).toFixed(1);
    sessionRate.textContent = `${rate} / min`;
  } else {
    sessionRate.textContent = '— / min';
  }

  // ── Last uploaded URL ────────────────────────────────────────────────────
  if (lastUrl) {
    lastUrlDiv.innerHTML =
      `🔗 <a href="${lastUrl}" target="_blank">${lastUrl.slice(0, 50)}...</a>`;
  } else {
    lastUrlDiv.textContent = 'No uploads yet';
  }
}
