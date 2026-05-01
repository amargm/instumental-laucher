# INSTRUMENT Launcher — Brainstorm v4

> Last updated: May 2026 (post v1.3)
> Total features shipped: 40+ | Screens: 5 (4 active, 1 disconnected) | Native modules: 4
> Current version: v1.3 — Terminal + Headphone Mode

---

## 📋 Current Feature Inventory

### ✅ Shipped & Working

**Core Navigation & Screens**
- 4 active screens: Home, AppDrawer, Settings, Terminal (swipe-down)
- NotificationScreen disconnected (replaced by Terminal in v1.3)
- Swipe gestures: down → Terminal, up → AppDrawer (respects gesturesEnabled toggle)
- Back button disabled on home (true launcher behavior)
- Auto-launch on boot (BootReceiver)
- App install/uninstall listener (auto-refreshes app drawer)
- Crash logging (last 10 errors persisted) + error boundaries per screen

**Home Screen**
- Clock: monospace 42px, blinking cursor, parallax gyroscope tilt (toggle-able)
- Multi-mode glitch text (cascade/flicker/single char, 4-10s interval, toggle-able, decoupled from clock tick)
- Day progress bar with "DAY" label + percentage
- Week progress bar with "WK" label (Mon→Sun)
- Weather from wttr.in (auto-refresh 10min, placeholder until loaded)
- Rain effect (20 character drops when weather reports rain, toggle-able, 800ms fade-in)
- User quote with accent-colored left border
- Pixel pet — kaomoji `(• ᴗ •)` with breathing animation, health system, 3 mood states
  - Mood-aware status text: "feeling good" / "doing okay" / "needs a break"
  - Health increases on focus return if >30min gap, decreases on frequent pickups
- Quick access apps (up to 5, horizontal scroll, spring press feedback)
- Terminal dock: 4 apps + `···` drawer button, monospace labels with accent underline
- Staggered mount cascade (clock → weather → quote → pet → apps → dock, 30ms gaps)
- Dock slide-up spring animation on every focus return
- Launch animation: scale 1→1.04 + fade-out (150ms)
- Settings gear icon (top-right) with rotation on press
- First-launch hints overlay (shown once, dismissable)

**Headphone Mode (v1.3 — NEW)**
- 🎧 indicator next to weather showing BT device name (e.g. "🎧 AirPods Pro")
- Music apps toggle button below quick-access row (fades in with spring animation)
- Tap button → shows list of music apps (Spotify, YT Music, podcasts, etc.)
- Tap again → collapses list (toggle behavior)
- When headphones disconnect → button fades out, list auto-collapses
- Polls audio device every 5s + on screen focus
- Native `getConnectedAudioDevice()` returns `{connected, name, type}` (bluetooth/wired/usb)

**Terminal Screen (v1.3 — NEW, replaces Notification Screen)**
- Swipe-down opens hybrid dashboard + command line
- Dashboard (default view): battery bar, connectivity, headphones, date/time
- Dashboard fades when typing — command mode takes over
- Command input with blinking cursor and accent-colored `>` prompt
- Live app suggestions while typing (2+ chars, fuzzy match)
- Built-in commands: battery, weather, time, calc, note, quote, net, settings, bt, dnd, display, gps, help, clear
- Note system: `note <text>` saves, `note` lists recent
- Quote command: updates home screen quote
- Calculator: safe expression evaluation (regex-whitelisted)
- Command history (last 30) with tap-to-reuse
- Fuzzy app search: exact match (100) > startsWith (90) > includes (70) > initials (60)

**App Drawer**
- Category filters: ALL, SOCIAL, MEDIA, WORK, GAMES, TOOLS, SHOP
- Text search with monospace input
- Music apps surfaced first when headphones connected
- Long-press context menu: App Info / Uninstall
- Staggered entrance animation (first 8 items)
- Typewriter empty state (30ms/char)
- Loading dots animation (terminal-style `· · ·`)
- App deduplication by packageName

**Haptics (v1.2)**
- `tick()` — 10ms light vibration (filter chips, toggles, settings)
- `impact()` — 20ms medium (app launch, swipe threshold)
- `heavy()` — 40ms strong (swipe gesture release)
- API-adaptive: Q+ EFFECT_TICK, O+ VibrationEffect, older deprecated vibrate()

**Settings**
- Clock format (12/24h), all aesthetic toggles, gesture toggle
- Accent color picker (10 presets)
- Quick apps picker (max 5), dock apps picker (max 4)
- Device info display (battery, charging, temp)
- Notification access indicator + settings link
- GUIDE section (full feature reference)
- "Show Welcome Hints" reset button

**Architecture**
- Shared `STORAGE_KEYS` in `src/constants.ts`
- Theme tokens: Colors, Spacing, Radius in `src/theme/tokens.ts`
- Custom SVG icons: 14+ app icons in `src/components/AppIcons.tsx`
- Native modules: DeviceInfoModule, HapticsModule, InstalledAppsModule, NotificationService
- Screen transitions: fade home (120ms), slide settings (150ms), slide drawer (100ms), slide terminal (100ms from bottom)

### ⚠️ Known Issues
- **Pet health race condition** — can briefly go negative due to `petHealthRef.current` vs state propagation lag
- **Weather error handling incomplete** — malformed wttr.in response can crash parser silently
- **Headphone polling (not event-driven)** — polls every 5s instead of native AudioDeviceCallback listener

### 🗑️ Dead Code (should clean up)
- `NotificationScreen.tsx` — still in repo but disconnected from navigation (replaced by Terminal)
- `expandNotificationPanel()` in InstalledApps.ts — deprecated, rejects immediately
- `openSoundSettings()` — exported, never called by any screen
- `getBatteryLevel()` — superseded by `getBatteryInfo()`, never called
- `Typography` export in tokens.ts — never imported anywhere

### 🔧 Remaining Technical Debt
- Settings loading duplicated in HomeScreen (mount + focus) — should be a `useSettings()` hook
- App deduplication logic copy-pasted in AppDrawerScreen and SettingsScreen
- `NavItem` component duplicated in AppDrawerScreen and SettingsScreen
- Launch animation (scale+opacity) duplicated in HomeScreen and AppDrawerScreen
- All AsyncStorage errors silently swallowed with `catch(() => {})` — no logging
- No accessibility labels on HomeScreen swipe area, pet, or quick apps
- Module-level `cachedApps` in AppDrawerScreen not reactive to background changes

---

## 🔴 What Was REMOVED (v1.2)

These were removed in v1.2 sprint and no longer exist in the codebase:

1. **Piano Dock** — Removed entirely. Terminal dock is the only dock style. ~100 lines cleaned.
2. **ASCII Clock Mode** — Removed. Standard clock with glitch + parallax + cursor is sufficient.
3. **Reaction Time Game** — Removed. Pet no longer has long-press interaction (game was a gimmick).
4. **Dock Style Selector** — Removed from Settings (only terminal dock exists).
5. **Pet long-press pulse** — Removed stale onPressIn/onPressOut animation (was dead code after game removal).
6. **"hold to play" hint** — Replaced with mood-aware status text.

### Still Present But Disconnected
- `NotificationScreen.tsx` — File exists but not wired to navigation. Replaced by TerminalScreen.

---

## 🟢 New Features — Status Update

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | ⚡ Haptic Feedback | ✅ **SHIPPED v1.2** | Native HapticsModule with tick/impact/heavy. Integrated everywhere. |
| 2 | 🔍 App Search on Home | ✅ **SHIPPED v1.3** | Via Terminal screen — type 2+ chars to fuzzy-launch any app |
| 3 | 📊 Screen Time Tracker | ❌ Not started | Needs UsageStatsManager native module |
| 4 | 🌅 Sunrise/Sunset Line | ❌ Not started | Pure JS math, no API needed |
| 5 | 📝 Morning Intention | ❌ Not started | — |
| 6 | 🔢 Screen Pickup Counter | ❌ Not started | AppState transitions, trivial |
| 7 | 🎨 Color of the Day | ❌ Not started | — |
| 8 | 📲 Long-Press App Menu | ✅ **SHIPPED v1.2** | App Info + Uninstall in AppDrawer |
| 9 | ⌨️ Terminal Mode | ✅ **SHIPPED v1.3** | Full hybrid dashboard + command terminal |
| 10 | 🔕 Focus Mode | ❌ Not started | High priority for v1.4 |

---

## 🟡 Medium Impact Features — Status Update

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 11 | App Usage Frequency Sort | ❌ Not started | — |
| 12 | Compact Home Layout | ❌ Not started | — |
| 13 | Custom Dock Labels | ❌ Not started | — |
| 14 | Notification Badge Dot | ❌ Not started | Native APIs exist |
| 15 | Weekly Stats Card | ❌ Not started | Needs screen time first |
| 16 | Double-Tap Clock for Alarm | ❌ Not started | — |
| 17 | Swipe Left/Right on Quick Apps | ❌ Not started | — |

---

## 🔵 New Features — BOLD / EXPERIMENTAL

### 18. Ghost Mode
**What:** Triple-tap the background → all widgets disappear except a tiny dot. Tap the dot → everything returns with a fade. Home screen becomes pure black.
**Why:** Ultimate minimalism. Shareable "look how clean my phone is" moment. Also useful in meetings/dark rooms.
**Effort:** Low (animate opacity of all elements to 0, show single dot).

### 19. Daily Color Shift
**What:** Accent color slowly shifts hue over 24 hours. Morning: warm (orange/yellow). Afternoon: cool (blue/teal). Night: purple/white.
**Why:** The home screen literally tells you the time of day through color. Ambient temporal awareness.
**Effort:** Low (HSL interpolation based on hour).

### 20. Data Dashboard Mode
**What:** Long-press the progress bar → expands into a full-screen dashboard: screen time graph (7 days), pickup count graph, app usage pie chart, pet health timeline.
**Why:** Power user feature. Turns the launcher into a personal analytics tool.
**Effort:** High (charts, data persistence, UI).

### 21. Shared Config via QR
**What:** Settings → "Share Config" generates a QR code encoding all settings (accent color, dock apps, layout, toggles). Another user scans it to apply.
**Why:** Viral mechanic. "Scan my launcher setup." Reddit/Discord communities would share configs.
**Effort:** Medium (QR generation library + config serialization).

### 22. Weather Mood
**What:** Instead of "23°C · Partly Cloudy", show a single emoji-style line: `◐ 23° light`. Or even just: `23° ░░░`. The weather affects the background texture subtly (grain increases when cloudy).
**Why:** Current weather display is generic. This makes it feel native to the aesthetic.
**Effort:** Low.

---

## 🏗️ Architecture Improvements — Status Update

| # | Improvement | Status | Notes |
|---|------------|--------|-------|
| 1 | Shared Constants Module | ✅ **DONE v1.2** | `src/constants.ts` with STORAGE_KEYS |
| 2 | Custom Hooks (useSettings, useLaunchAnimation, useAppList) | ❌ Not started | Still duplicated |
| 3 | Shared Components (NavItem, AppRow) | ❌ Not started | Still duplicated |
| 4 | Fix Gesture Toggle | ✅ **DONE v1.2** | PanResponder now checks `gesturesRef.current` |
| 5 | Weather Error Handling | ⚠️ Partial | Basic try/catch, but no fallback to cached data |
| 6 | Decouple Glitch from Clock Tick | ✅ **DONE v1.2** | Uses `timeRef.current` independently |

---

## 📊 Revised Priority Matrix (post v1.3)

| Priority | Feature | Impact | Effort | Status |
|----------|---------|--------|--------|--------|
| 🔴 P0 | Haptic feedback | Huge | Low | ✅ SHIPPED |
| 🔴 P0 | Fix gesture toggle bug | High | Trivial | ✅ FIXED |
| 🔴 P0 | Remove dead code | Medium | Trivial | ✅ DONE |
| 🟠 P1 | Terminal mode (type to launch) | Huge | Medium | ✅ SHIPPED |
| 🟠 P1 | Long-press app menu | High | Low | ✅ SHIPPED |
| 🟠 P1 | Headphone mode on home | High | Medium | ✅ SHIPPED |
| 🟠 P1 | Focus mode (pause before launch) | Huge | Medium | ❌ NEXT |
| 🟠 P1 | Screen time tracker | High | Medium | ❌ NEXT |
| 🟡 P2 | Morning intention prompt | Medium | Low | ❌ |
| 🟡 P2 | Screen pickup counter | Medium | Trivial | ❌ |
| 🟡 P2 | Sunrise/sunset line | Medium | Low | ❌ |
| 🟡 P2 | App usage frequency sort | Medium | Low | ❌ |
| 🟡 P2 | Notification badge dot | Medium | Low | ❌ |
| 🟡 P2 | Progressive hints | Medium | Medium | ❌ |
| 🟢 P3 | Color of the day | Low | Trivial | ❌ |
| 🟢 P3 | Custom dock labels | Low | Trivial | ❌ |
| 🟢 P3 | Double-tap clock for alarm | Low | Trivial | ❌ |
| 🟢 P3 | Compact home layout | Low | Low | ❌ |
| 🟢 P3 | Weekly stats card | Low | Medium | ❌ |
| 🔵 P4 | Ghost mode | Low | Low | ❌ |
| 🔵 P4 | Daily color shift | Low | Low | ❌ |
| 🔵 P4 | Data dashboard | Low | High | ❌ |
| 🔵 P4 | QR config sharing | Low | Medium | ❌ |

---

## 🗺️ Roadmap — Updated

### v1.2 — "Make it real" ✅ COMPLETE
- ✅ Haptic feedback (native module)
- ✅ Fix gesture toggle
- ✅ Remove dead code + piano dock + ASCII clock + reaction game
- ✅ Shared constants module
- ✅ Cap quick apps at 5
- ✅ Decouple glitch from clock tick

### v1.3 — "The killer features" ✅ COMPLETE
- ✅ Terminal screen (hybrid dashboard + command line)
- ✅ Command parser with 15+ commands
- ✅ Long-press app menu in drawer
- ✅ Headphone mode on home (BT device name + music toggle)
- ✅ Pet cleanup (remove stale interactions, mood-aware status)

### v1.4 — "Know yourself" (NEXT)
1. Focus mode for addictive apps
2. Screen time tracker
3. Screen pickup counter
4. Morning intention prompt
5. App usage frequency sort

### v1.5 — "Ambient intelligence"
1. Sunrise/sunset line
2. Notification badge dots
3. Color of the day / daily color shift
4. Progressive onboarding hints
5. Context-aware features (battery bar, connectivity, combined modes)

### v2.0 — "Share it"
1. QR config sharing
2. Ghost mode
3. Data dashboard
4. Screenshot mode

---

## 🔄 Rethinking the Swipe-Down Screen

### The Problem

The current "CONTROL CENTER" screen (swipe down from home) is a clone of Android's built-in notification shade + quick settings. **Every Android phone already has this** — swipe down from the status bar, anywhere, in any app. Our version is:
- Worse (quick tiles just open system settings instead of toggling directly)
- Slower (navigation transition vs native shade)
- Redundant (zero unique value)
- Wasted gesture (swipe-down is the most natural, most frequent gesture on a launcher)

**Decision: Kill it.** Replace with something that doesn't exist anywhere else.

### What Should Swipe-Down Be?

The swipe-down gesture on a launcher home screen is the single most accessible interaction. It should open something the user wants **many times per day** that **no other app provides**.

---

### 💡 OPTION A: Command Terminal (RECOMMENDED — fits identity perfectly)

**What:** Swipe down → a blinking cursor appears with a single-line input field. Type to do anything:
- App name → instant launch (fuzzy match, 2-3 chars enough)
- `t` or `time` → shows full date/time info
- `b` or `bat` → shows battery %, charging status, temperature
- `w` or `weather` → shows detailed weather
- `q set [text]` → changes home quote
- `calc 15*23` → inline calculator result
- `timer 5m` → starts a 5-minute timer
- `note [text]` → quick note saved to a running log
- `focus on` / `focus off` → toggle focus mode
- `apps [query]` → search + show matching apps
- `dial [number]` → opens dialer with number pre-filled
- `help` → shows available commands
- Recent commands shown as muted history below input

**Why this is THE answer:**
- No other launcher has a command line. This IS the identity of "Instrument Launcher"
- Replaces the redundant notification screen with something unique
- Faster than any UI for power users — type 2 chars to launch any app
- Infinitely extensible — new commands = new features without new screens
- The monospace terminal aesthetic is already the design language
- This gets posted on Reddit, X, YouTube. Viral by nature
- Already brainstormed as "Terminal Mode" (feature #9) but making it the swipe-down primary screen elevates it from gimmick to core experience

**UI vision:**
```
> _
  
  recent:
  spotify                          2m ago
  calc 150/3                       → 50
  note buy milk                    1h ago
  weather                          → 24°C · Clear
```

Background is pure `#0A0A0A`. Green or accent-colored cursor. Monospace everything. Results appear inline. No modals, no navigation. Type → result → done.

**Architecture:**
- CommandParser module: regex-based command matching
- AppFuzzySearch: reuse existing app list, match on first 2-3 chars
- CommandHistory: last 20 commands in AsyncStorage
- Built-in commands ship with the app, but the system is extensible

**Effort:** Medium-High (but replaces an entire screen, so net effort is similar)

---

### 💡 OPTION B: Daily Dashboard / Personal Instrument Panel

**What:** Swipe down → a single scrollable screen showing all your personal data at a glance:

```
─── TODAY ────────────────────
  THU MAY 1, 2026
  ☀ 06:12 ──────────── ☾ 18:47
  
─── VITALS ───────────────────
  ▮▮▮▮▮▮▮▯▯▯  67%  ⚡ charging
  ◦ Home_WiFi_5G  ·  LTE ✓
  🎧 AirPods Pro connected
  
─── USAGE ────────────────────
  ↑ 14 pickups  ·  2h 07m screen
  ▁▂▃▅▇▅▃▂▁▁▁▁▁▂▅▇█▅▃▂▁▁▁
  FOCUS: 73/100
  
─── INTENTION ────────────────
  "finish the launcher v1.3"
  
─── LOG ──────────────────────
  09:12  opened Slack (3rd time)
  09:08  note: buy milk
  08:45  focus blocked Instagram
  08:30  morning routine started
```

**Why:**
- Turns the launcher into a personal flight recorder
- Every piece of data is contextual and live — you're not reading old info
- The "instrument panel" name finally makes complete literal sense
- Nobody has this. Digital Wellbeing is buried. This is your data, front and center, one gesture away
- Pairs perfectly with screen time tracking, pickup counter, focus mode, and all the context-aware features

**Effort:** High (needs screen time, pickup tracking, note system, connectivity display). But this is where all the context features come together.

---

### 💡 OPTION C: Quick Capture / Scratchpad

**What:** Swipe down → instant text input that saves to a running log. Like a micro-journal.

```
> buy groceries after work_

───────────────────────
  today
  11:30  look into that API bug
  09:15  call mom at 3pm
  08:00  morning: feel good, slept well

  yesterday  
  22:10  great day, shipped v1.2
  14:30  meeting notes: Q3 roadmap...
```

**Why:**
- The fastest "write something down" UX possible on a phone. Swipe + type + done
- No app to open, no note app to find, no title to give
- Running log format = personal micro-journal
- Timestamped automatically
- Searchable (type `/search [query]` to filter)
- Exportable (long-press to share as text)
- Pairs with morning intention: the first entry each day is your intention

**Effort:** Low-Medium. TextInput + AsyncStorage log. Simple but powerful.

---

### 💡 OPTION D: Context Mode Switcher

**What:** Swipe down → shows detected current context + lets you manually override:

```
─── CURRENT MODE ─────────────
  ◉ HOME  ·  detected via WiFi
  
  ▸ HOME        ☀ ◠ connected
  ▹ WORK        switch dock + focus
  ▹ COMMUTE     music + maps dock
  ▹ SLEEP       dim + alarm only
  ▹ FOCUS       block all + timer
  
─── ACTIVE ───────────────────
  ☔ Rain effect ON (weather)
  🎧 Music mode OFF (no headphones)
  ⚡ Charging: full in ~45m
```

**Why:**
- Manual override for the automatic context system
- Shows you what the launcher "thinks" — transparent AI
- Quick way to enter focus/sleep/work mode
- Shows all active context features and their current state

**Effort:** Medium. Needs the context system built first.

---

### 💡 OPTION E: Hybrid — Terminal + Dashboard

**What:** The best of A and B. Swipe down opens a terminal-style screen where the default view (before typing) shows live dashboard data. Once you start typing, dashboard fades and command mode takes over.

```
> _

  ▮▮▮▮▮▮▮▯▯▯ 67% ⚡  ·  ☀ 06:12-18:47
  ↑ 14 pickups  ·  2h 07m  ·  FOCUS 73
  ◦ Home_WiFi  ·  🎧 AirPods
  
  recent:
  spotify                          2m ago
  note buy milk                    1h ago
```

When you type: dashboard lines fade out, full screen becomes command input + results.

**Why:**
- Dashboard gives value even if you never type a command
- Terminal gives power when you need it
- One screen, two purposes, zero wasted space
- Default state = glanceable data. Active state = command line
- This is the ultimate "instrument panel" — gauges + command input

**Effort:** Medium-High. But it's the most complete vision.

---

### 🏆 RECOMMENDATION

**Option E (Hybrid Terminal + Dashboard)** is the north star. But ship it incrementally:

1. **v1.3:** Ship Option A (Terminal) as the swipe-down screen. App search + basic commands (`weather`, `battery`, `timer`, `note`, `calc`). This alone is a viral feature.
2. **v1.4:** Add dashboard data above the cursor (battery, connectivity, pickups, focus score). The terminal becomes the hybrid.
3. **v1.5:** Add `note` command history as a persistent log. Add context mode display.

This replaces the notification screen entirely. Users who want notifications swipe down from the Android status bar — the way God intended.

### What Happens to Existing Notification Code

| Component | Action |
|-----------|--------|
| `NotificationScreen.tsx` | **Delete entirely** → replace with `TerminalScreen.tsx` |
| `NotificationService.kt` | **Keep** — notification count can power dock badge dots |
| `getNotifications()` / `dismissNotification()` | **Keep** — could be terminal commands: `notif` lists, `dismiss all` clears |
| Quick settings tile functions | **Keep** — become terminal commands: `wifi`, `bt`, `dnd`, `display` |
| Swipe-down gesture in HomeScreen | **Keep** — just change navigation target from `'Notifications'` to `'Terminal'` |
| `DeviceInfoEvents` listeners | **Move** — notification count badge on home screen dock instead |

---

## 🧠 Context-Aware Features — Deep Dive

> The core idea: your launcher should **know** what's happening and surface the right thing at the right time. Not by asking — by sensing.

### Current Context Signals (audit)

| Signal | Status | What It Does Now |
|--------|--------|-----------------|
| 🎧 Headphones | **Active (v1.3)** | BT device name on home, music toggle button, music apps surfaced in drawer |
| 🌧️ Weather condition | **Active** | Triggers rain particle effect |
| 📐 Gyroscope | **Active** | Parallax tilt on clock |
| 📱 Screen frequency | **Active** | Pet health ↑ if >30min gap, ↓ if <5min |
| 🔌 Boot | **Active** | Auto-launches as home screen |
| 🔋 Battery | **Active (Terminal)** | Shown in terminal dashboard + `battery` command. Display only in Settings |
| 📶 Connectivity | **Active (Terminal)** | Shown in terminal dashboard + `net` command |
| 🔔 Notification count | **Dead code** | `getNotificationCount()` exported, unused on home screen |

---

### 🎧 HEADPHONE CONTEXT — Current Implementation + Next Steps

**Shipped in v1.3:**
- `getConnectedAudioDevice()` native API returns `{connected, name, type}` (bluetooth/wired/usb)
- BT device name shown next to weather: `🎧 AirPods Pro`
- Music apps toggle button below quick-access row with spring fade-in/out animation
- Collapsible music apps list (Spotify, YT Music, podcasts, etc.)
- Polls every 5s + on screen focus
- Music apps surfaced first in app drawer when headphones connected

**Still TODO:**
1. **Live headphone listener** — Replace 5s polling with `AudioManager.registerAudioDeviceCallback()` native event. Emit via `DeviceInfoEvents` for instant react.
2. **Audio route quick-switch** — If multiple audio outputs detected (speaker + BT), show a tiny toggle.

---

### 🔋 BATTERY CONTEXT — Make It Useful

**Current:** Displayed in Settings. Does nothing.

**New behaviors:**
1. **Low battery dock swap** — When battery <15%, dock auto-surfaces essential apps (Phone, Maps, Messages) regardless of user config. Reverts when charging. Rationale: when battery is dying, you want survival tools, not Instagram.
2. **Battery in the instrument panel** — Show `▮▮▮▮▯ 67%` as a thin bar on home screen (like the day/week progress bars). When charging, animate with a pulse. This is pure instrument-panel data.
3. **Charging mode** — When plugged in, accent color subtly shifts to green. Or show a small `⚡` next to battery. The home screen should acknowledge "you're charging" without being asked.
4. **Power-saver suggestions** — At <20%, if rain effect or parallax is on, show a one-time suggestion: `"low battery — disable effects?"` with a single tap to turn off all animated features.

**Effort:** Low — battery data already flows to JS. Just conditional logic + UI.

---

### 📶 CONNECTIVITY CONTEXT — Partially Unlocked

**Current:** `getConnectivityInfo()` is now used in Terminal dashboard + `net` command. Shows WiFi SSID / LTE / offline + headphone status.

**Still TODO:**
1. **Wi-Fi SSID as location proxy** — This is the big one. No GPS needed. If connected to `"Home_WiFi_5G"` → user is home. If `"Office-Corp"` → user is at work. If cellular only → in transit. User maps SSIDs to locations in Settings (one-time setup: "Name this network: HOME / WORK / OTHER").
2. **Location-based dock** — HOME dock: entertainment apps. WORK dock: Slack, Calendar, Drive. TRANSIT dock: Maps, Music, Transit. The dock **automatically swaps** based on Wi-Fi. This is the #1 most useful context feature a launcher can have.
3. **No-internet indicator** — When `isConnected` is false, show `✕ offline` below weather (instead of stale cached weather). Subtle but honest.
4. **Wi-Fi name on home** — Tiny muted text: `◦ Home_5G` or `◦ LTE`. Instrument panels show connection status.

**Effort:** Medium — the native bridge exists. Need SSID→location mapping UI + dock swap logic.

---

### ⏰ TIME-OF-DAY CONTEXT — The Missing Layer

**Current:** Clock + progress bars. No behavior changes with time.

**New behaviors:**
1. **Time-of-day greeting** — Replace static quote with contextual one-liner at certain hours:
   - 5-8 AM: `"good morning"` (or user's morning intention if set)
   - 12-1 PM: `"midday · 47% through"`
   - 10 PM+: `"wind down · tomorrow starts in {h}h"`
   - This replaces quote only if user hasn't set a custom one.
2. **Night mode accent** — After sunset (from sunrise/sunset calculation or 9 PM fallback), accent color auto-dims to a muted version. Text dims slightly. Reduces visual stimulation at night. No system-level night mode needed — this is launcher-only.
3. **App suggestions by time** — Morning (6-9): news, weather, calendar. Lunch (12-1): food delivery, messages. Evening (6-9): streaming, social. Night (10+): alarm, meditation. Show as a subtle `"suggested: Alarm"` text near quick apps.
4. **Weekend vs weekday** — Different quick-app row on weekends vs weekdays. User configures once: "weekend apps" vs "weekday apps". Automatic swap at midnight Fri→Sat and Sun→Mon.
5. **Sleep timer** — After 11 PM, if user opens the phone, show a brief `"it's late — need this?"` overlay (3 seconds, dismissable). Not blocking, just a gentle nudge. Pairs with focus mode.

**Effort:** Low to Medium — pure JS logic, no native changes.

---

### 🔔 NOTIFICATION CONTEXT — Surface Without Noise

**Current:** Full notification screen exists. No notification awareness on home screen.

**New behaviors:**
1. **Notification count badge** — Tiny number or dot on the dock's `···` button: `···²` if 2 unread notifications. Or a pulsing accent dot. Tells you "something's waiting" without pulling you in.
2. **Per-app dock badges** — If a dock app (e.g. Messages) has notifications, show a 4px accent dot above its label. Just a dot, not a count. Minimal but informative.
3. **Notification urgency** — If notification count > 10 and growing, subtly change the border color of the home screen or pulse the notification indicator. "Your phone is noisy right now."
4. **Quiet home** — If zero notifications, show `✓ clear` in muted text somewhere. Positive reinforcement for a quiet phone.
5. **Notification source on home** — Show the latest notification as a single line below weather: `"3m ago · John: Hey are you free?"`. Tap to open notification screen. One line max, truncated. Like a ticker.

**Effort:** Low — `getNotificationCount()` already exists. Need to call it on focus + wire to UI.

---

### 🔌 CHARGING CONTEXT

**Current:** Battery shows "Charging" in Settings.

**New behaviors:**
1. **Charging ambient mode** — When plugged in + screen on, home screen becomes a minimal desk clock: large time, battery %, very dim. No quick apps or dock. Perfect for nightstand. Detect charging via `BatteryManager.isCharging` (already available).
2. **Charge estimate** — Show `"⚡ full in ~1h 20m"` based on charge rate (sample battery % over time). Instrument panels show ETAs.
3. **Charging history** — Track how often and how long user charges. Show in weekly stats. "You charged 2x today."

**Effort:** Low for ambient mode (conditional rendering). Medium for charge estimate (rate tracking).

---

### 🌍 ENVIRONMENTAL CONTEXT — No Extra Permissions

**Current:** Weather from wttr.in.

**New behaviors (no GPS/location permission needed):**
1. **Sunrise/sunset** — Calculate from timezone offset + date (approximate latitude). Show `☀ 06:12 · ☾ 18:47`. Already in brainstorm, still a great idea.
2. **UV index / air quality** — wttr.in supports `%u` (UV index). Add to weather display when high: `"28°C · Sunny · UV 8 ⚠"`. Genuinely useful health data.
3. **Moon phase** — Calculable from date alone. Show as a single character: `◐`, `●`, `◑`, `○`. Subtle, beautiful, data-rich.
4. **Season-aware theme** — Slightly shift the default color palette by season. Winter: cooler tones. Summer: warmer. Autumn: muted amber. Just shifts the accent color preset defaults.
5. **Daylight remaining** — `"4h 22m of light left"`. Useful for outdoor planning. Pairs with sunset calculation.

**Effort:** Low — pure math + one extra API parameter.

---

### 🏃 BEHAVIORAL CONTEXT — Learn From Usage

**Current:** Pet health tracks screen frequency. No other behavioral awareness.

**New behaviors:**
1. **App launch frequency tracking** — Count launches per app per day. After 1 week, the launcher **knows your routine**:
   - "You always open Slack at 9 AM" → surface it automatically
   - "You open Instagram 47 times/day" → candidate for focus mode auto-suggestion
   - "You never open this dock app" → suggest replacing it
2. **Routine detection** — If user opens the same 3 apps in the same order every morning (e.g., Clock → Gmail → Slack), offer a "Morning routine" one-tap that launches all three sequentially.
3. **App divorce** — If an app hasn't been opened in 30 days, dim it in the drawer. After 60 days, suggest uninstall. "You haven't opened TikTok in 43 days. Remove?"
4. **Daily rhythm visualization** — Tiny sparkline on home screen showing phone usage intensity over the last 24h. Like a heartbeat monitor. Pure instrument-panel data. `▁▂▃▅▇▅▃▂▁▁▁▁▁▂▅▇█▅▃▂▁▁▁`
5. **Focus score** — Combine pickup count + screen time + focus-mode cancels into a single 0-100 score. Show on home: `"FOCUS: 73"`. Gamifies intentional phone use. Updates hourly.

**Effort:** Medium — needs persistent counters + analysis logic.

---

### 🎯 COMBINED CONTEXT — The Multiplier

The real power is **combining** signals:

| Combo | Behavior |
|-------|----------|
| 🎧 Headphones + 🚶 Cellular (no WiFi) | → Commuting. Surface transit + podcast apps. Show "commute mode" |
| 🔋 Low battery + 📶 No WiFi | → Survival mode. Disable all effects, essential dock only |
| ⏰ Night + 🔌 Charging | → Nightstand clock mode. Dim everything, show only time + alarm |
| ⏰ Morning + 📶 Home WiFi | → Morning routine. Show intention prompt, surface morning apps |
| ⏰ Work hours + 📶 Work WiFi | → Focus dock. Suppress social apps from suggestions |
| 🔔 Many notifications + ⏰ Late night | → "You have 12 notifications. Deal with them tomorrow?" |
| 🎧 Unplugged + ⏰ Night | → Auto-lower suggestion: "Set alarm?" |
| 🔋 Charging + ⏰ Work WiFi | → At desk. Surface desktop-companion apps (Slack, Calendar) |

This table is the north star. Each row is a **mode** the launcher enters automatically.

---

### 📊 Context Feature Priority

| # | Feature | Signals Used | Impact | Effort | Priority |
|---|---------|-------------|--------|--------|----------|
| C1 | Battery bar on home | Battery | High | Trivial | **P0** |
| C2 | Notification badge dots on dock | Notifications | High | Low | **P0** |
| C3 | Live headphone listener | Audio | Medium | Low | **P1** |
| C4 | Low-battery essential dock | Battery | High | Low | **P1** |
| C5 | Time-of-day greeting | Time | Medium | Low | **P1** |
| C6 | No-internet indicator | Connectivity | Medium | Trivial | **P1** |
| C7 | Charging ambient/nightstand mode | Charging + Time | High | Medium | **P1** |
| C8 | Wi-Fi SSID location-based dock | WiFi | **Huge** | Medium | **P1** |
| C9 | Notification ticker on home | Notifications | Medium | Low | **P2** |
| C10 | Night accent dimming | Time + Sunset | Medium | Low | **P2** |
| C11 | App launch frequency tracking | Behavior | High | Medium | **P2** |
| C12 | Moon phase display | Date | Low | Trivial | **P2** |
| C13 | UV/air quality in weather | Weather API | Medium | Trivial | **P2** |
| C14 | Weekend/weekday app swap | Time + Day | Medium | Low | **P2** |
| C15 | Routine detection | Behavior + Time | High | High | **P3** |
| C16 | Focus score | Behavior | Medium | Medium | **P3** |
| C17 | Daily rhythm sparkline | Behavior | Medium | Medium | **P3** |
| C18 | App divorce suggestions | Behavior | Low | Low | **P3** |
| C19 | Combined context modes | All | **Huge** | High | **P3** |
| C20 | Charging time estimate | Battery | Low | Medium | **P3** |

## 💡 Revised Positioning

> "The launcher that treats your phone like an instrument panel — every pixel shows data, every interaction is intentional, every distraction has a speed bump."

**What makes INSTRUMENT different from every other minimal launcher:**

| Feature | Niagara | Olauncher | Before | **INSTRUMENT** |
|---------|---------|-----------|--------|----------------|
| App search | ✅ Alphabet sidebar | ❌ | ❌ | ✅ Terminal mode |
| Anti-addiction | ❌ | ❌ | ✅ Basic | ✅ Focus mode + screen time |
| Data display | ❌ | ❌ | ❌ | ✅ Progress bars + pickups + time |
| Weather | ❌ | ❌ | ❌ | ✅ Integrated |
| Customization | Low | None | Low | ✅ High (colors, docks, layouts) |
| Aesthetic identity | Clean | Bare | Soft | **Terminal/instrument** |
| Haptics | ❌ | ❌ | ❌ | ✅ Everywhere |
| Ritual features | ❌ | ❌ | ❌ | ✅ Intention + reflection |

---

## 🎬 Updated Animation Audit Status

All P0-P2 animations are shipped. Only remaining:
- P3: Progress bar midnight reset (low priority, rare edge case)

New animations needed for new features:
- Search overlay: slide down from clock position, 100ms
- Terminal mode: typewriter input, results fade in 30ms stagger
- Focus mode pause: breathing dot scale 1→1.1, 2s loop
- Screen time number: count-up animation on mount
- Notification dot: slow pulse opacity 0.4→1→0.4, 3s cycle
