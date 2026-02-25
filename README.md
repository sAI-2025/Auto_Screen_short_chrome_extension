# 📸 Auto Screenshot to ImgBB — Chrome Extension

> A lightweight Chrome/Brave/Edge extension that **automatically captures screenshots** at configurable intervals and silently uploads them to [ImgBB](https://imgbb.com/) — with auto-expiry, live stats, rate-limit protection, and zero interruptions to your browsing.

![Version](https://img.shields.io/badge/version-4.0-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)
![License](https://img.shields.io/badge/license-MIT-orange)
![Browser](https://img.shields.io/badge/browser-Chrome%20%7C%20Brave%20%7C%20Edge-lightblue)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [ImgBB API Configuration](#-imgbb-api-configuration)
- [Usage](#-usage)
- [How It Works](#-how-it-works)
- [Memory Management](#-memory-management)
- [Rate Limit Handling](#-rate-limit-handling)
- [Technologies Used](#-technologies-used)
- [Known Limitations](#-known-limitations)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

---

## 🔍 Overview

**Auto Screenshot to ImgBB** is a browser extension built on **Chrome Extension Manifest V3** that runs silently in the background, capturing screenshots of your active browser tab at a user-defined interval. Every screenshot is automatically uploaded to your **ImgBB account** via their free REST API — no Google account, no OAuth, no complex authentication required.

This tool is ideal for:

- 🖥️ Personal productivity and work session monitoring
- 📊 Automated time-tracking and activity logging
- 🔍 Research, documentation, and evidence collection workflows
- 🛡️ Self-accountability and focus tracking tools

---

## ✨ Features

- **⏱️ Configurable Interval** — Set capture frequency from 5 seconds up to 1 hour
- **☁️ Auto Upload** — Every screenshot is instantly uploaded to ImgBB right after capture
- **🗑️ Auto-Expiry** — Choose when images self-delete: 5 min / 1 hr / 24 hrs / 7 days / 30 days / Never
- **📊 Live Stats** — Real-time popup showing total uploads, session count, and upload rate per minute
- **⏳ Rate Limit Backoff** — Exponential backoff (60s → 120s → 240s → max 10 min) with auto-retry queue
- **🧠 Memory Efficient** — `dataUrl`, `base64Data`, and `FormData` are explicitly nulled immediately after use
- **🪟 Window-Aware** — Handles minimized windows, VS Code alt-tab, and multi-window scenarios intelligently
- **🚫 Internal Page Skip** — Automatically skips `chrome://`, `edge://`, `brave://`, `about:` pages
- **🔁 Auto-Resume** — Resumes capturing automatically after browser restart if previously enabled
- **🔢 Upload Counter** — Tracks total all-time uploads + per-session count with a one-click reset button
- **🔴 Live Countdown** — Popup shows a ticking `mm:ss` countdown timer during rate limit cooldown
- **🔒 Settings Lock** — Interval and expiry inputs are disabled while capture is active to prevent conflicts

---

## 🔧 Prerequisites

Before you begin, ensure you have the following ready:

| Requirement | Details |
|-------------|---------|
| **Chromium-based browser** | Chrome, Brave, or Microsoft Edge (latest version) |
| **Free ImgBB account** | Sign up at [imgbb.com](https://imgbb.com/) — takes 30 seconds, no credit card |
| **ImgBB API Key** | Retrieved from ImgBB account settings (see [ImgBB API Configuration](#-imgbb-api-configuration)) |
| **Developer Mode** | Must be enabled in your browser's extension settings page |
| **Extension folder** | All project files saved locally in a single folder |

---

## 📁 Project Structure

```
screenshot-imgbb/
│
├── manifest.json        ← Extension config: permissions, service worker, metadata
├── background.js        ← Core engine: alarms, capture, upload, retry, memory cleanup
├── popup.html           ← Extension popup UI: settings panel, stats, toggle button
├── popup.js             ← Popup logic: state sync, live counters, rate limit countdown
├── icon.png             ← Extension toolbar icon (128×128 PNG — any image works)
└── README.md            ← This documentation file
```

### File Responsibilities

| File | Role |
|------|------|
| `manifest.json` | Declares all permissions (`tabs`, `alarms`, `storage`, `windows`), registers `background.js` as the service worker, links popup |
| `background.js` | Runs 100% silently — handles screenshot alarms, ImgBB API upload, exponential backoff, memory nulling, window/tab detection |
| `popup.html` | The visual panel shown when you click the extension icon in the toolbar |
| `popup.js` | Reads and writes `chrome.storage.local`, sends `START`/`STOP` messages to background, renders live stats every 2 seconds |
| `icon.png` | Any 128×128 PNG image — used as the extension toolbar and management page icon |

---

## 🚀 Installation & Setup

### Step 1 — Get the Project Files

Clone the repository or download the ZIP:

```bash
# Option A — Clone via Git
git clone https://github.com/sAI-2025/screenshot-imgbb.git
cd screenshot-imgbb

# Option B — Download ZIP
# Click "Code" → "Download ZIP" on GitHub, then extract the folder
```

---

### Step 2 — Add Your ImgBB API Key

Open `background.js` in any text editor (VS Code, Notepad, etc.) and replace the placeholder on **line 5**:

```javascript
// ╔══════════════════════════════════════════════════════════╗
// ║              YOUR IMGBB API KEY                         ║
// ╚══════════════════════════════════════════════════════════╝
const IMGBB_API_KEY = 'PASTE_YOUR_API_KEY_HERE'; // ← replace this
```

Example with a real key format:

```javascript
const IMGBB_API_KEY = 'a1b2c3d4e5f67890abcdef1234567890';
```

> ⚠️ **Security Warning:** Never commit or share `background.js` publicly with your real API key inside it.

---

### Step 3 — Load the Extension in Your Browser

#### 🟢 Chrome & Brave

```
1. Open:  chrome://extensions   (or brave://extensions)
2. Toggle "Developer Mode" → ON  (switch in top-right corner)
3. Click  "Load unpacked"
4. Navigate to and select your screenshot-imgbb/ folder
5. The extension card appears instantly
6. Pin it: click the 🧩 puzzle icon in toolbar → click 📌 next to the extension
```

#### 🔵 Microsoft Edge

```
1. Open:  edge://extensions
2. Toggle "Developer Mode" → ON  (toggle in left sidebar)
3. Click  "Load unpacked"
4. Navigate to and select your screenshot-imgbb/ folder
5. Pin it from the Extensions (🧩) menu in the toolbar
```

---

### Step 4 — Verify It Loaded Correctly

After loading, confirm everything works:

```
1. Go to chrome://extensions
2. Find "Auto Screenshot to ImgBB"
3. Click "Details" → scroll to "Permissions"
4. You should see: "Read and change all your data on all websites"  ✅
5. Click "Inspect views: service worker"
6. In the Console tab you should see:  [ImgBB] Auto-resumed  ✅
   (or no errors if extension was freshly installed)
```

---

## 🔑 ImgBB API Configuration

### Step 1 — Create a Free ImgBB Account

1. Navigate to **[https://imgbb.com/](https://imgbb.com/)**
2. Click **Sign Up** in the top-right corner
3. Register with your email address
4. Verify your email if a confirmation link is sent

> ✅ Registration is completely **free** — no credit card, no subscription required.

---

### Step 2 — Generate Your API Key

1. Log in to **[imgbb.com](https://imgbb.com/)**
2. Click your **profile avatar** (top-right corner)
3. Select **Settings** from the dropdown
4. Click the **API** tab in the left sidebar
5. Click the **"Get API Key"** button
6. Copy the key shown — it looks like this:

```
a1b2c3d4e5f67890abcdef1234567890
```

---

### Step 3 — Place the Key in the Extension

The API key goes in **one place only** — the top of `background.js`:

```javascript
const IMGBB_API_KEY = 'a1b2c3d4e5f67890abcdef1234567890';
```

No `.env` file, no config file, no environment variables needed — this is a local browser extension.

---

### Step 4 — ImgBB Free Tier Limits

| Metric | Free Tier Value |
|--------|----------------|
| Uploads per hour | ~100 images |
| Max image size | 32 MB per file |
| Storage | Unlimited |
| API access | Free forever |
| Cost | $0 |

> 💡 **Recommended interval:** 30 seconds or more for sessions longer than 30 minutes.  
> Below 30 seconds, you may hit the hourly upload cap. The extension handles this automatically with exponential backoff and auto-retry.

---

### Step 5 — Auto-Expiry Configuration

Set how long uploaded screenshots stay on ImgBB before auto-deletion:

| Popup Dropdown Label | `expiration` value sent to API | Server behaviour |
|----------------------|-------------------------------|-----------------|
| Never | *(field omitted)* | Image kept permanently |
| 5 Minutes | `300` | Auto-deleted after 5 minutes |
| 1 Hour | `3600` | Auto-deleted after 1 hour |
| 24 Hours | `86400` | Auto-deleted after 24 hours |
| **7 Days** *(default)* | `604800` | Auto-deleted after 7 days |
| 30 Days | `2592000` | Auto-deleted after 30 days |

> ImgBB enforces deletion **server-side** — no cleanup code needed in the extension.

---

## 📖 Usage

### Starting Screenshot Capture

```
1. Click the 📸 icon in your browser toolbar
2. Set "Capture Interval" — e.g. 20 (seconds)
3. Set "Auto-Delete After" — e.g. 7 Days
4. Click ▶ Start Capturing
5. Button turns red → status shows 🟢 Active
6. Extension captures and uploads silently every N seconds
```

### Popup Interface Guide

```
┌──────────────────────────────────────┐
│  📸  Screenshot → ImgBB       v4.0  │
├──────────────────────────────────────┤
│  Interval (s)  [  20  ]             │
│  Auto-Delete   [ 7 Days ▾ ]         │
│                                      │
│     [ ⏹  Stop Capturing ]           │
├──────────────────────────────────────┤
│   📷 Total Uploaded  │  This Session │
│         142          │      12       │
│       all time       │   2.0 / min   │
├──────────────────────────────────────┤
│  Status        🟢 Active             │
│  Interval      20s                   │
│  Auto-Delete   7 Days                │
│  Last Capture  10:24:05 PM           │
│  Last Error    None                  │
│  ─────────────────────────────────── │
│  🔗 https://i.ibb.co/xxxx/shot...   │
├──────────────────────────────────────┤
│    🗑  Reset Counter & History       │
└──────────────────────────────────────┘
```

### Stopping Capture

```
1. Click the 📸 icon to open the popup
2. Click ⏹ Stop Capturing
3. Status changes to ⚫ Inactive
4. All pending retries are cancelled
```

### Viewing Your Screenshots

```
Option A — Click the URL link shown at the bottom of the popup
Option B — Log in to imgbb.com → click your avatar → "My Images"
```

### Resetting the Counter

```
Click 🗑 Reset Counter & History in the popup
→ Confirm the dialog
→ Total count resets to 0, session resets, last URL cleared
```

---

## ⚙️ How It Works

### Architecture Flow

```
User clicks ▶ Start
       │
       ▼
popup.js sends chrome.runtime.sendMessage({ action: 'START', interval, expiry })
       │
       ▼
background.js receives message
       │
       ▼
chrome.alarms.create('screenshotAlarm', { periodInMinutes: interval/60 })
       │
       ▼  (every N seconds)
chrome.alarms.onAlarm fires → captureAndUpload()
       │
       ├─► getBestWindowId()   → finds focused / non-minimized / last-known window
       │
       ├─► getBestTabInWindow() → skips chrome:// pages, finds real capturable tab
       │
       ├─► chrome.tabs.captureVisibleTab() → returns base64 PNG dataUrl (~1–3 MB)
       │
       ├─► uploadToImgBB(dataUrl, expiry) → POST multipart to api.imgbb.com/1/upload
       │
       ├─► On success → update chrome.storage (count, URL, time) → null all vars
       │
       └─► On rate limit → handleRateLimit() → exponential backoff → retryAlarm
```

### Window Detection Priority

```
1st → Focused normal window (not minimized)          ← ideal case
2nd → Any non-minimized normal window                ← tab switched away
3rd → lastGoodWindowId (all windows minimized)       ← VS Code / alt-tab scenario
4th → Any normal window (absolute fallback)          ← rare edge case
```

---

## 🧠 Memory Management

The extension is designed to keep memory usage **flat and predictable** across hundreds of capture cycles:

| Variable | Size | When Freed |
|----------|------|-----------|
| `dataUrl` (base64 PNG) | ~1–3 MB | Nulled **immediately** after `uploadToImgBB()` returns |
| `base64Data` (stripped string) | ~1.5 MB | Nulled **immediately** after `formData.append()` |
| `formData` (multipart object) | ~1.5 MB | Nulled **immediately** after `fetch()` starts |
| `response` (fetch Response) | Small | Nulled after `.json()` parsed |
| `stored` (storage object) | Tiny | Nulled in `finally{}` block |

**Peak memory per cycle:** ~2 MB (sequential, never overlapping copies)  
**After cycle completes:** All references nulled → V8 GC reclaims memory

### Verify Memory Health

```
1. Open chrome://extensions → "Inspect views: service worker"
2. Go to Memory tab → Take Heap Snapshot (baseline)
3. Wait for 10 capture cycles to complete
4. Take another Heap Snapshot
5. Compare: heap size should remain FLAT  ✅
   A staircase pattern = memory leak  ❌
```

---

## 🔄 Rate Limit Handling

ImgBB free tier enforces a burst upload limit. The extension handles this automatically:

```
Upload attempt
     │
     ▼
ImgBB returns HTTP 400 "Rate limit reached"
     │
     ▼
handleRateLimit() called
     │
     ├─► consecutiveFailures++
     ├─► backoff = min(60s × 2^(failures-1), 600s)
     ├─► Save dataUrl to pendingCapture queue
     ├─► Schedule chrome.alarms retryAlarm(delayInMinutes = backoff)
     └─► Write rateLimitStatus to chrome.storage → popup shows countdown
     │
     ▼  (after backoff expires)
retryAlarm fires → retryPending()
     │
     ├─► On success → reset consecutiveFailures = 0, clear rateLimitStatus
     └─► On failure → handleRateLimit() again (backoff doubles)
```

### Backoff Schedule

| Consecutive Failures | Wait Time |
|---------------------|-----------|
| 1st failure | 60 seconds |
| 2nd failure | 2 minutes |
| 3rd failure | 4 minutes |
| 4th failure | 8 minutes |
| 5th+ failures | 10 minutes (max cap) |

---

## 🛠️ Technologies Used

| Technology | Purpose |
|------------|---------|
| **Chrome Extensions API — Manifest V3** | Core extension framework and lifecycle |
| **`chrome.tabs.captureVisibleTab`** | Screenshot capture as base64 PNG |
| **`chrome.alarms`** | Persistent background interval timer — survives service worker idle termination |
| **`chrome.storage.local`** | Persistent key-value state across popup open/close and browser restarts |
| **`chrome.windows`** | Multi-window detection, minimized window fallback |
| **`chrome.runtime`** | Message passing between popup and service worker |
| **ImgBB REST API v1** | Free image hosting — `POST /upload` endpoint |
| **Fetch API** | HTTP multipart upload to ImgBB |
| **FormData API** | Multipart form construction for image binary upload |
| **Vanilla JavaScript ES2022** | No frameworks — pure async/await, no dependencies |
| **HTML5 / CSS3** | Popup interface — no external libraries or CDN dependencies |

---

## ⚠️ Known Limitations

| Limitation | Details |
|-----------|---------|
| **Active tab only** | `captureVisibleTab` captures only the currently active/visible tab — not background tabs |
| **Internal pages blocked** | `chrome://`, `edge://`, `brave://`, `about:`, DevTools pages cannot be captured by Chrome policy |
| **ImgBB rate limit** | Free tier allows ~100 uploads/hour — use 30s+ intervals for sessions over 30 minutes |
| **Minimized window** | Captures the last rendered frame — cannot capture the OS-level screen when Chrome is minimized |
| **Single window focus** | Captures from the most recently focused browser window only |
| **API key in source** | The key lives in `background.js` — do not publish this file with a real key on public repositories |
| **No JPEG support** | Only PNG format is used — JPEG would reduce file size but increases compression artifacts |

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!

### How to Contribute

1. **Fork** this repository on GitHub
2. **Create** a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make** your changes and test in Chrome, Brave, and Edge
4. **Commit** with a clear message following conventional commits:
   ```bash
   git commit -m "feat: add JPEG format option alongside PNG"
   git commit -m "fix: handle empty tab URL on new tab page"
   git commit -m "docs: update rate limit table in README"
   ```
5. **Push** your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request** with a clear description of what changed and why

### Development & Debugging Tips

```bash
# View service worker logs
chrome://extensions → "Inspect views: service worker" → Console tab

# Force reload extension after code changes
chrome://extensions → click the 🔄 Reload icon on the extension card

# Hard reset (clears all cached manifests)
chrome://extensions → Remove → Load unpacked again

# Check memory health
DevTools → Memory tab → Heap Snapshots before and after 10 capture cycles

# Trigger rate limit manually (for testing backoff)
Set interval to 5s → watch for 400 error → observe countdown timer in popup
```

---

## 📄 License

```
MIT License

Copyright (c) 2026 Sai Krishna Chowdary Chundru

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

---

## 👤 Author

**Sai Krishna Chowdary Chundru**  
*AI & Data Science Professional — ML · Deep Learning · Computer Vision · NLP · LLMs*

| Platform | Link |
|----------|------|
| 🔗 LinkedIn | [linkedin.com/in/sai-krishna-chowdary-chundru](https://www.linkedin.com/in/sai-krishna-chowdary-chundru) |
| 🐙 GitHub | [github.com/sAI-2025](https://github.com/sAI-2025) |
| ✍️ Medium | [medium.com/@sai2025](https://medium.com/@sai2025) |
| 📧 Email | cchsaikrishnachowdary@gmail.com |

---

<div align="center">

**⭐ If this project helped you, consider giving it a star on GitHub ⭐**

*Built with ❤️ for personal productivity monitoring*

</div>
