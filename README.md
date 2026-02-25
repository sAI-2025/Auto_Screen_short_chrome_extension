# \# 📸 Auto Screenshot to ImgBB — Chrome Extension

# 

# > A lightweight Chrome/Brave/Edge extension that \*\*automatically captures screenshots\*\* at configurable intervals and silently uploads them to \[ImgBB](https://imgbb.com/) — with auto-expiry, live stats, and zero interruptions to your browsing.

# 

# !\[Version](https://img.shields.io/badge/version-4.0-blue)

# !\[Manifest](https://img.shields.io/badge/manifest-v3-green)

# !\[License](https://img.shields.io/badge/license-MIT-orange)

# !\[Browser](https://img.shields.io/badge/browser-Chrome%20%7C%20Brave%20%7C%20Edge-lightblue)

# 

# ---

# 

# \## 📋 Table of Contents

# 

# \- \[Overview](#-overview)

# \- \[Features](#-features)

# \- \[Prerequisites](#-prerequisites)

# \- \[Project Structure](#-project-structure)

# \- \[Installation \& Setup](#-installation--setup)

# \- \[ImgBB API Configuration](#-imgbb-api-configuration)

# \- \[Usage](#-usage)

# \- \[Technologies Used](#-technologies-used)

# \- \[Known Limitations](#-known-limitations)

# \- \[Contributing](#-contributing)

# \- \[License](#-license)

# 

# ---

# 

# \## 🔍 Overview

# 

# \*\*Auto Screenshot to ImgBB\*\* is a browser extension built with \*\*Chrome Extension Manifest V3\*\* that runs silently in the background and captures screenshots of your active browser tab at a user-defined interval. Each screenshot is automatically uploaded to your ImgBB account via their free API — no Google account, no OAuth, no complex setup required.

# 

# This tool is ideal for:

# \- 🖥️ Personal productivity monitoring

# \- 📊 Time-tracking and work logs

# \- 🔍 Research and documentation workflows

# \- 🛡️ Self-accountability tools

# 

# ---

# 

# \## ✨ Features

# 

# \- \*\*⏱️ Configurable Interval\*\* — Set capture frequency from 5 seconds to 1 hour

# \- \*\*☁️ Auto Upload\*\* — Every screenshot is instantly uploaded to ImgBB after capture

# \- \*\*🗑️ Auto-Expiry\*\* — Choose when images auto-delete (5 min / 1 hr / 24 hrs / 7 days / 30 days / Never)

# \- \*\*📊 Live Stats\*\* — Real-time popup showing total uploads, session count, and upload rate (per min)

# \- \*\*🔄 Smart Retry\*\* — Exponential backoff system handles ImgBB rate limits gracefully

# \- \*\*🧠 Memory Efficient\*\* — All large variables (`dataUrl`, `base64`, `FormData`) are explicitly nulled after use

# \- \*\*🪟 Window-Aware\*\* — Handles minimized windows, tab switches, and VS Code alt-tab scenarios

# \- \*\*🚫 Internal Page Skip\*\* — Automatically skips `chrome://`, `edge://`, `about:` pages

# \- \*\*🔁 Auto-Resume\*\* — Resumes capturing after browser restart if previously enabled

# \- \*\*🔢 Upload Counter\*\* — Tracks total all-time uploads and per-session count with reset option

# 

# ---

# 

# \## 🔧 Prerequisites

# 

# Before you begin, ensure you have the following:

# 

# \- \*\*A Chromium-based browser\*\* — Chrome, Brave, or Microsoft Edge (latest version)

# \- \*\*A free ImgBB account\*\* — Sign up at \[imgbb.com](https://imgbb.com/) (takes 30 seconds)

# \- \*\*Your ImgBB API Key\*\* — Retrieved from your account settings (see \[ImgBB API Configuration](#-imgbb-api-configuration))

# \- \*\*Developer Mode enabled\*\* in your browser's extension settings

# \- Basic familiarity with loading unpacked Chrome extensions

# 

# ---

# 

# \## 📁 Project Structure

# 

# ```

# screenshot-imgbb/

# │

# ├── manifest.json        # Extension config — permissions, service worker, metadata

# ├── background.js        # Core engine — alarms, capture, upload, retry logic

# ├── popup.html           # Extension popup UI — settings, stats, toggle button

# ├── popup.js             # Popup logic — state management, live counter, countdown

# ├── icon.png             # Extension icon (128×128 PNG)

# └── README.md            # This file

# ```

# 

# \### File Roles

# 

# | File | Responsibility |

# |------|---------------|

# | `manifest.json` | Declares permissions (`tabs`, `alarms`, `storage`, `windows`), registers service worker |

# | `background.js` | Runs silently — handles screenshot alarm, ImgBB upload, rate limit backoff, memory cleanup |

# | `popup.html` | Visual interface shown when clicking the extension icon |

# | `popup.js` | Reads/writes `chrome.storage`, communicates with background via `chrome.runtime.sendMessage` |

# | `icon.png` | Any 128×128 PNG — used as the toolbar icon |

# 

# ---

# 

# \## 🚀 Installation \& Setup

# 

# \### Step 1 — Download the Project

# 

# Clone or download this repository to your local machine:

# 

# ```bash

# git clone https://github.com/sAI-2025/Auto\_Screen\_short\_chrome\_extension.git

# cd screenshot-imgbb

# ```

# 

# Or simply download the ZIP and extract it to a folder.

# 

# ---

# 

# \### Step 2 — Add Your ImgBB API Key

# 

# Open `background.js` and replace the placeholder with your actual API key:

# 

# ```javascript

# // background.js — Line 5

# const IMGBB\_API\_KEY = 'YOUR\_IMGBB\_API\_KEY\_HERE';

# ```

# 

# > ⚠️ \*\*Never share this file publicly with your real API key inside it.\*\*

# 

# ---

# 

# \### Step 3 — Load the Extension in Your Browser

# 

# \#### Chrome / Brave

# ```

# 1\. Open chrome://extensions   (or brave://extensions)

# 2\. Toggle "Developer Mode" → ON  (top-right corner)

# 3\. Click "Load unpacked"

# 4\. Select the screenshot-imgbb/ folder

# 5\. The extension card appears — pin it via the 🧩 puzzle icon

# ```

# 

# \#### Microsoft Edge

# ```

# 1\. Open edge://extensions

# 2\. Toggle "Developer Mode" → ON  (left sidebar)

# 3\. Click "Load unpacked"

# 4\. Select the screenshot-imgbb/ folder

# 5\. Pin it from the Extensions menu in the toolbar

# ```

# 

# ---

# 

# \### Step 4 — Verify Installation

# 

# After loading, you should see:

# \- The 📸 icon in your browser toolbar

# \- In the service worker console (`chrome://extensions` → Inspect views): `\[ImgBB] Auto-resumed` or no errors

# 

# ---

# 

# \## 🔑 ImgBB API Configuration

# 

# \### 1. Create a Free ImgBB Account

# 

# 1\. Go to \*\*\[https://imgbb.com/](https://imgbb.com/)\*\*

# 2\. Click \*\*Sign Up\*\* in the top-right corner

# 3\. Register with your email address (free — no credit card needed)

# 4\. Verify your email if prompted

# 

# ---

# 

# \### 2. Get Your API Key

# 

# 1\. Log in to your ImgBB account

# 2\. Click your \*\*profile picture\*\* → \*\*Settings\*\*

# 3\. Click the \*\*API\*\* tab in the left sidebar

# 4\. Click \*\*"Get API Key"\*\*

# 5\. Copy the generated key — it looks like:

# 

# ```

# a1b2c3d4e5f67890abcdef1234567890

# ```

# 

# ---

# 

# \### 3. Add the Key to the Extension

# 

# Open `background.js` in any text editor and paste your key:

# 

# ```javascript

# // ╔══════════════════════════════════════════════════════════╗

# // ║              YOUR IMGBB API KEY                         ║

# // ╚══════════════════════════════════════════════════════════╝

# const IMGBB\_API\_KEY = 'a1b2c3d4e5f67890abcdef1234567890'; // ← paste here

# ```

# 

# ---

# 

# \### 4. ImgBB API Rate Limits (Free Tier)

# 

# | Metric | Limit |

# |--------|-------|

# | Uploads per hour | ~100 images |

# | Max file size | 32 MB per image |

# | Storage | Unlimited |

# | Cost | Free |

# 

# > 💡 \*\*Recommended minimum interval:\*\* 30 seconds or more for uninterrupted long sessions.  

# > The extension includes \*\*automatic exponential backoff\*\* — if rate limited, it waits and retries without crashing.

# 

# ---

# 

# \### 5. Auto-Expiry Options

# 

# Control how long your screenshots stay on ImgBB:

# 

# | Popup Selection | API Value | Behaviour |

# |----------------|-----------|-----------|

# | Never | `0` | Images kept permanently |

# | 5 Minutes | `300` | Deleted after 5 min |

# | 1 Hour | `3600` | Deleted after 1 hour |

# | 24 Hours | `86400` | Deleted after 24 hours |

# | 7 Days \*(default)\* | `604800` | Deleted after 7 days |

# | 30 Days | `2592000` | Deleted after 30 days |

# 

# ---

# 

# \## 📖 Usage

# 

# \### Starting the Extension

# 

# 1\. Click the \*\*📸 icon\*\* in your browser toolbar

# 2\. Set your desired \*\*capture interval\*\* (minimum 5 seconds)

# 3\. Choose an \*\*auto-delete\*\* duration from the dropdown

# 4\. Click \*\*▶ Start Capturing\*\*

# 5\. The button turns red — extension is now active

# 

# \### Popup Stats Explained

# 

# ```

# ┌─────────────────────────────────┐

# │ 📸 Screenshot → ImgBB    v4.0  │

# ├─────────────────────────────────┤

# │ Interval: \[  20  ]  Expiry: \[7d]│

# │                                 │

# │  \[ ⏹ Stop Capturing ]          │

# ├─────────────────────────────────┤

# │  📷 Total Uploaded │ This Sess  │

# │       142          │    12      │

# │    all time        │  2.0/min   │

# ├─────────────────────────────────┤

# │ Status      🟢 Active           │

# │ Interval    20s                 │

# │ Auto-Delete 7 Days              │

# │ Last Capture  11:24:05 AM       │

# │ Last Error    None              │

# │                                 │

# │ 🔗 https://i.ibb.co/xxx/...    │

# ├─────────────────────────────────┤

# │  🗑 Reset Counter \& History     │

# └─────────────────────────────────┘

# ```

# 

# \### Stopping the Extension

# 

# \- Click \*\*⏹ Stop Capturing\*\* in the popup at any time

# \- The extension \*\*automatically stops\*\* if Chrome is fully closed

# \- It \*\*automatically resumes\*\* when Chrome restarts (if it was active before)

# 

# \### Viewing Uploaded Screenshots

# 

# \- Click any link shown in the popup

# \- Or log in to \*\*\[imgbb.com](https://imgbb.com/)\*\* → \*\*My Images\*\* to see all uploads

# 

# ---

# 

# \## 🛠️ Technologies Used

# 

# | Technology | Version | Purpose |

# |------------|---------|---------|

# | \*\*Chrome Extensions API\*\* | Manifest V3 | Core extension framework |

# | `chrome.tabs.captureVisibleTab` | MV3 | Screenshot capture |

# | `chrome.alarms` | MV3 | Background interval timer (persists service worker) |

# | `chrome.storage.local` | MV3 | Persistent state across popup open/close |

# | `chrome.windows` | MV3 | Multi-window and minimized window handling |

# | \*\*ImgBB API v1\*\* | REST | Free image hosting and upload endpoint |

# | \*\*Fetch API\*\* | Native | HTTP multipart upload to ImgBB |

# | \*\*FormData API\*\* | Native | Multipart form construction for image upload |

# | \*\*JavaScript ES2022\*\* | Vanilla | No frameworks — pure JS with async/await |

# | \*\*HTML5 / CSS3\*\* | Vanilla | Popup interface — no external dependencies |

# 

# ---

# 

# \## ⚠️ Known Limitations

# 

# | Limitation | Details |

# |-----------|---------|

# | \*\*Visible tab only\*\* | `captureVisibleTab` captures the active tab — cannot capture background tabs |

# | \*\*Internal pages skipped\*\* | `chrome://`, `edge://`, `about:` pages cannot be captured by design |

# | \*\*ImgBB rate limit\*\* | Free tier allows ~100 uploads/hour — use 30s+ interval for long sessions |

# | \*\*Minimized window\*\* | Captures last rendered frame when window is minimized (OS-level screen not captured) |

# | \*\*Single window focus\*\* | Captures from the most recently focused browser window only |

# | \*\*API key in source\*\* | Key is stored in `background.js` — do not publish publicly with real key |

# 

# ---

# 

# \## 🤝 Contributing

# 

# Contributions are welcome! To contribute:

# 

# 1\. \*\*Fork\*\* the repository

# 2\. Create a feature branch:

# &nbsp;  ```bash

# &nbsp;  git checkout -b feature/your-feature-name

# &nbsp;  ```

# 3\. Make your changes and test thoroughly in Chrome/Brave/Edge

# 4\. Commit with a clear message:

# &nbsp;  ```bash

# &nbsp;  git commit -m "feat: add support for JPEG capture format"

# &nbsp;  ```

# 5\. Push to your fork:

# &nbsp;  ```bash

# &nbsp;  git push origin feature/your-feature-name

# &nbsp;  ```

# 6\. Open a \*\*Pull Request\*\* with a description of your changes

# 

# \### Development Tips

# 

# \- Open service worker DevTools: `chrome://extensions` → \*\*Inspect views: service worker\*\*

# \- Monitor memory: DevTools → \*\*Memory\*\* tab → Take Heap Snapshots before/after cycles

# \- Test rate limit handling by temporarily setting a 5s interval

# 

# ---

# 

# \## 📄 License

# 

# ```

# MIT License

# 

# Copyright (c) 2026 Sai Krishna Chowdary Chundru

# 

# Permission is hereby granted, free of charge, to any person obtaining a copy

# of this software and associated documentation files (the "Software"), to deal

# in the Software without restriction, including without limitation the rights

# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell

# copies of the Software, and to permit persons to whom the Software is

# furnished to do so, subject to the following conditions:

# 

# The above copyright notice and this permission notice shall be included in

# all copies or substantial portions of the Software.

# 

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR

# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,

# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

# ```

# 

# ---

# 

# \## 👤 Author

# 

# \*\*Sai Krishna Chowdary Chundru\*\*  

# AI \& Data Science Professional | ML · DL · CV · NLP · LLMs

# 

# \[!\[LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://www.linkedin.com/in/sai-krishna-chowdary-chundru)

# \[!\[GitHub](https://img.shields.io/badge/GitHub-Follow-black)](https://github.com/sAI-2025)

# \[!\[Medium](https://img.shields.io/badge/Medium-Read-green)](https://medium.com/@sai2025)

# 

# ---

# 

# <div align="center">

# &nbsp; <sub>Built with ❤️ for personal productivity monitoring</sub>

# </div>



