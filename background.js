// ╔══════════════════════════════════════════════════════════╗
// ║              YOUR IMGBB API KEY                         ║
// ╚══════════════════════════════════════════════════════════╝
const IMGBB_API_KEY = '2b2b115ea2a06c42a68e4812d3d4027b';

// ── Debug logger ───────────────────────────────────────────────────────────
const DEBUG = true;
const log   = (...a) => DEBUG && console.log('[ImgBB]', ...a);
const warn  = (...a) => DEBUG && console.warn('[ImgBB]', ...a);
const err   = (...a) => DEBUG && console.error('[ImgBB]', ...a);

// ── Rate limit state ───────────────────────────────────────────────────────
// Tracks backoff so we don't hammer ImgBB after a 400
let rateLimitBackoffMs  = 0;       // current wait time before next upload
let rateLimitUntil      = 0;       // timestamp — don't upload before this
let consecutiveFailures = 0;       // counts back-to-back rate limit hits
const BASE_BACKOFF_MS   = 60000;   // start with 60s wait after first failure
const MAX_BACKOFF_MS    = 600000;  // max 10 minutes between retries

// ── Pending capture queue — stores dataUrl if upload fails ────────────────
// Only keeps the LATEST failed capture to avoid memory buildup
let pendingCapture = null;         // { dataUrl, expiry, timestamp }

// ── Last known good window ─────────────────────────────────────────────────
let lastGoodWindowId = null;

// ── MINIMUM safe upload interval — ImgBB free tier ────────────────────────
// Do NOT set interval below 30s — ImgBB will rate-limit you
const MIN_SAFE_INTERVAL_SECS = 30;

// ── Keep service worker alive every 24s ───────────────────────────────────
chrome.alarms.create('keepAlive', { periodInMinutes: 0.4 });

// ── Alarm dispatcher ───────────────────────────────────────────────────────
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive')       return;
  if (alarm.name === 'screenshotAlarm') captureAndUpload();
  if (alarm.name === 'retryAlarm')      retryPending();
});

// ── Message handler from popup ─────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'START') {
    chrome.storage.local.set({ expiry: msg.expiry ?? 604800 });
    startCapture(msg.interval);
  }
  if (msg.action === 'STOP') stopCapture();
});

// ── Auto-resume on browser restart ────────────────────────────────────────
chrome.runtime.onStartup.addListener(restoreState);
chrome.runtime.onInstalled.addListener(restoreState);

async function restoreState() {
  const data = await chrome.storage.local.get(['isEnabled', 'interval']);
  if (data.isEnabled) {
    startCapture(data.interval || 30);
    log('Auto-resumed on browser start');
  }
}

// ─────────────────────────────────────────────────────────────────────────
// START / STOP
// Enforces MIN_SAFE_INTERVAL_SECS to protect against rate limiting
// ─────────────────────────────────────────────────────────────────────────
function startCapture(intervalSeconds) {
  // Enforce minimum safe interval for ImgBB free tier
  const secs = Math.max(MIN_SAFE_INTERVAL_SECS, parseInt(intervalSeconds) || 30);
  const mins = secs / 60;

  if (secs !== parseInt(intervalSeconds)) {
    warn(`Interval raised to ${secs}s (minimum safe for ImgBB free tier)`);
    // Save corrected interval back to storage
    chrome.storage.local.set({ interval: secs });
  }

  chrome.alarms.clear('screenshotAlarm', () => {
    chrome.alarms.create('screenshotAlarm', {
      delayInMinutes:  mins,
      periodInMinutes: mins
    });
    log(`Started — every ${secs}s`);
  });
}

function stopCapture() {
  chrome.alarms.clear('screenshotAlarm');
  chrome.alarms.clear('retryAlarm');
  pendingCapture = null;
  log('Stopped by user');
}

// ─────────────────────────────────────────────────────────────────────────
// SMART WINDOW FINDER
// Priority: focused → non-minimized → last known → any
// ─────────────────────────────────────────────────────────────────────────
async function getBestWindowId() {
  const allWindows = await chrome.windows.getAll({ populate: true });

  const focused = allWindows.find(
    w => w.focused && w.type === 'normal' && w.state !== 'minimized'
  );
  if (focused) { lastGoodWindowId = focused.id; return focused.id; }

  const normal = allWindows.find(
    w => w.type === 'normal' && w.state !== 'minimized'
  );
  if (normal) { lastGoodWindowId = normal.id; return normal.id; }

  if (lastGoodWindowId) {
    warn('All windows minimized — using last known window');
    return lastGoodWindowId;
  }

  const any = allWindows.find(w => w.type === 'normal');
  return any ? any.id : null;
}

// ─────────────────────────────────────────────────────────────────────────
// SMART TAB FINDER
// Blocks: internal pages + imgbb.com itself (prevents capture feedback loop)
// ─────────────────────────────────────────────────────────────────────────
async function getBestTabInWindow(windowId) {
  const allWindows = await chrome.windows.getAll({ populate: true });
  const win = allWindows.find(w => w.id === windowId);
  if (!win?.tabs) return null;

  // Blocked URL prefixes — cannot or should not be captured
  const BLOCKED = [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'brave://',
    'about:',
    'chrome-devtools://',
    'https://imgbb.com',       // ← prevents capturing ImgBB itself
    'https://api.imgbb.com',   // ← prevents capturing API page
    'https://ibb.co'           // ← ImgBB image viewer
  ];

  const capturableTabs = win.tabs.filter(
    t => t.url && !BLOCKED.some(p => t.url.startsWith(p))
  );

  if (!capturableTabs.length) {
    warn('No capturable tabs — all internal or blocked pages');
    return null;
  }

  return capturableTabs.find(t => t.active) ||
         capturableTabs[capturableTabs.length - 1];
}

// ─────────────────────────────────────────────────────────────────────────
// RETRY PENDING CAPTURE
// Called by retryAlarm after backoff period expires
// ─────────────────────────────────────────────────────────────────────────
async function retryPending() {
  if (!pendingCapture) return;
  if (Date.now() < rateLimitUntil) {
    const secsLeft = Math.ceil((rateLimitUntil - Date.now()) / 1000);
    warn(`Still in backoff — ${secsLeft}s remaining`);
    return;
  }

  log(`Retrying pending upload...`);
  const { dataUrl, expiry } = pendingCapture;
  pendingCapture = null; // clear before attempt

  try {
    const imageUrl = await uploadToImgBB(dataUrl, expiry);
    const stored   = await chrome.storage.local.get(['uploadCount']);
    const newCount = (stored.uploadCount || 0) + 1;
    await chrome.storage.local.set({
      uploadCount:     newCount,
      lastUploadUrl:   imageUrl,
      lastCaptureTime: new Date().toLocaleTimeString(),
      lastError:       null,
      rateLimitStatus: null
    });
    consecutiveFailures = 0;
    rateLimitBackoffMs  = 0;
    log(`✅ Retry successful #${newCount}: ${imageUrl}`);
  } catch (e) {
    handleRateLimit(dataUrl, expiry, e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// RATE LIMIT HANDLER
// Exponential backoff: 60s → 120s → 240s → ... → max 10min
// ─────────────────────────────────────────────────────────────────────────
function handleRateLimit(dataUrl, expiry, errorMsg) {
  consecutiveFailures++;

  // Calculate backoff with exponential increase
  rateLimitBackoffMs = Math.min(
    BASE_BACKOFF_MS * Math.pow(2, consecutiveFailures - 1),
    MAX_BACKOFF_MS
  );
  rateLimitUntil = Date.now() + rateLimitBackoffMs;

  const secsToWait = Math.ceil(rateLimitBackoffMs / 1000);
  warn(`Rate limited (attempt ${consecutiveFailures}) — waiting ${secsToWait}s before retry`);

  // Save the latest failed capture for retry (replace any older pending)
  pendingCapture = { dataUrl, expiry, timestamp: Date.now() };

  // Schedule a retry alarm
  chrome.alarms.clear('retryAlarm', () => {
    chrome.alarms.create('retryAlarm', {
      delayInMinutes: rateLimitBackoffMs / 60000
    });
  });

  // Update popup with rate limit status
  chrome.storage.local.set({
    lastError: `Rate limited — retry in ${secsToWait}s (attempt ${consecutiveFailures})`,
    rateLimitStatus: {
      until:    rateLimitUntil,
      attempts: consecutiveFailures,
      waitSecs: secsToWait
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────
// CORE CAPTURE FLOW — Memory optimized with rate limit awareness
// ─────────────────────────────────────────────────────────────────────────
async function captureAndUpload() {
  let dataUrl  = null;
  let imageUrl = null;

  try {
    // ── Check if we are still in rate limit cooldown ───────────────────
    if (Date.now() < rateLimitUntil) {
      const secsLeft = Math.ceil((rateLimitUntil - Date.now()) / 1000);
      warn(`Skipping — rate limit cooldown active (${secsLeft}s left)`);
      await chrome.storage.local.set({
        lastError: `ImgBB rate limit — ${secsLeft}s cooldown remaining`
      });
      return;
    }

    // ── 1. Find best window ────────────────────────────────────────────
    const windowId = await getBestWindowId();
    if (!windowId) { warn('No window available — skipping'); return; }

    // ── 2. Find real capturable tab ────────────────────────────────────
    const tab = await getBestTabInWindow(windowId);
    if (!tab) { warn('No capturable tabs — skipping'); return; }

    log(`Capturing: ${tab.url.slice(0, 60)}`);

    // ── 3. Screenshot → base64 PNG ─────────────────────────────────────
    dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
      format:  'png',
      quality: 80
    });

    // ── 4. Read settings ───────────────────────────────────────────────
    const stored = await chrome.storage.local.get(['uploadCount', 'expiry']);
    const expiry = stored.expiry !== undefined ? stored.expiry : 604800;

    // ── 5. Upload to ImgBB ─────────────────────────────────────────────
    imageUrl = await uploadToImgBB(dataUrl, expiry);

    // ── 6. Free memory immediately ─────────────────────────────────────
    dataUrl = null;

    // ── 7. Reset backoff state on success ─────────────────────────────
    consecutiveFailures = 0;
    rateLimitBackoffMs  = 0;
    pendingCapture      = null;

    // ── 8. Single storage write ────────────────────────────────────────
    const newCount = (stored.uploadCount || 0) + 1;
    await chrome.storage.local.set({
      uploadCount:     newCount,
      lastUploadUrl:   imageUrl,
      lastCaptureTime: new Date().toLocaleTimeString(),
      lastError:       null,
      rateLimitStatus: null
    });

    log(`✅ Uploaded #${newCount}: ${imageUrl}`);

  } catch (e) {
    err('❌', e.message);

    // Check if this is a rate limit error
    if (e.message.includes('Rate limit') || e.message.includes('400')) {
      handleRateLimit(dataUrl, stored?.expiry ?? 604800, e.message);
      dataUrl = null; // handleRateLimit keeps its own ref
    } else {
      await chrome.storage.local.set({ lastError: e.message });
      dataUrl = null;
    }

  } finally {
    // Guaranteed cleanup
    dataUrl  = null;
    imageUrl = null;
    if (typeof globalThis.gc === 'function') globalThis.gc();
  }
}

// ─────────────────────────────────────────────────────────────────────────
// IMGBB UPLOAD — Memory optimized
// ─────────────────────────────────────────────────────────────────────────
async function uploadToImgBB(dataUrl, expirySecs = 604800) {
  let base64Data = dataUrl.split(',')[1];

  const timestamp = new Date()
    .toISOString()
    .replace(/T/, '_')
    .replace(/[:.]/g, '-')
    .slice(0, 19);

  let formData = new FormData();
  formData.append('key',   IMGBB_API_KEY);
  formData.append('image', base64Data);
  formData.append('name',  `screenshot_${timestamp}`);
  if (expirySecs > 0) formData.append('expiration', String(expirySecs));

  base64Data = null; // free second copy of base64 immediately

  let response;
  try {
    response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body:   formData
    });
  } finally {
    formData   = null;
    base64Data = null;
  }

  if (!response.ok) {
    const errText = await response.text();
    response = null;
    throw new Error(`ImgBB HTTP ${response?.status || 400}: ${errText}`);
  }

  const result = await response.json();
  response = null;

  if (!result.success) {
    throw new Error(`ImgBB API: ${JSON.stringify(result.error)}`);
  }

  const url = result.data.url;
  return url;
}
