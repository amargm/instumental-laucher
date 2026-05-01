# INSTRUMENT Launcher — Brainstorm v3

> Last updated: May 2026
> Total features shipped: 32 | Screens: 4 | Native modules: 3

---

## 📋 Current Feature Inventory

### ✅ Shipped & Working
- Two dock styles: **Terminal** (monospace labels + underline, default) and **Piano** (alternating black/white keys)
- Dock style selector in Settings (persisted)
- Accent color picker (10 presets, affects progress bars, quote border, pet, dock highlights)
- Smooth app open animation (scale 1→1.04 + fade-out, 150ms)
- Parallax clock (gyroscope tilt via react-native-reanimated, toggle-able)
- Multi-mode glitch text (cascade/flicker/single char, 4-10s interval, toggle-able)
- ASCII art clock mode (box-drawing digits, toggle-able)
- Day progress bar with "DAY" label + percentage
- Week progress bar with "WK" label (Mon→Sun)
- User quote with accent-colored left border
- Quick access apps (up to 10, horizontal scroll, spring press feedback)
- Swipe gestures (down→notifications panel, up→app drawer)
- Category filters in app drawer (6 keyword categories: SOCIAL, MEDIA, WORK, GAMES, TOOLS, SHOP)
- Headphone context shortcuts (music apps surface first when BT/wired connected)
- Weather from wttr.in (auto-refresh 10min, placeholder "-- °C · ---" until loaded)
- Rain effect (20 character drops when weather reports rain, toggle-able, 800ms fade-in)
- Pixel pet — kaomoji face `(• ᴗ •)` with body, breathing animation, health system, 3 mood states
- Reaction time game (long-press pet 600ms to trigger, shows best time)
- Notification panel with quick-action tiles (WiFi, BT, NFC, GPS, Cast, DND, Display) + real notification list with dismiss
- Crash logging (last 10 errors persisted) + error boundaries per screen
- Settings: clock format (12/24h), all aesthetic toggles, gesture toggle, dock style, app/dock pickers
- Staggered home screen mount cascade (clock→weather→quote→pet→apps→dock, 30ms gaps)
- Touch feedback everywhere: gear rotation, quick app spring, pet long-press pulse, filter chip scale, dock item spring
- Dock slide-up animation on every home focus return
- Screen transitions: fade home (120ms), slide settings (150ms), slide drawer (100ms)
- First-launch hints overlay (shown once, dismissable)
- Settings GUIDE section (full feature reference)
- "Show Welcome Hints" reset button
- Pet hint text ("hold to play · health ↑ less screen time")
- Typing cursor blink (500ms `_` after time)
- Loading dots animation (terminal-style `· · ·`)
- Typewriter empty state (30ms/char)
- Auto-launch on boot (BootReceiver)
- Back button disabled on home (true launcher behavior)
- App install/uninstall listener (auto-refreshes app drawer)

### ⚠️ Shipped But Broken / Incomplete
- **Gesture toggle does nothing** — `gesturesEnabled` is saved in Settings but HomeScreen's PanResponder never checks it. Swipe always works regardless.
- **`expandNotificationPanel()` deprecated** — native side rejects immediately. Notification panel works via navigation, but the old native method is dead code.
- **Weather has no error handling for malformed responses** — if wttr.in returns unexpected format, the parser crashes silently.
- **Pet health can briefly go negative** — race condition between `petHealthRef.current` and state propagation.

### 🗑️ Dead Code (should remove)
- `expandNotificationPanel()` in InstalledApps.ts — deprecated, unused
- `openSoundSettings()` — exported, never called by any screen
- `getConnectivityInfo()` — implemented natively, never called
- `getBatteryLevel()` — superseded by `getBatteryInfo()`, never called
- `openAppSettings(pkg)` and `uninstallApp(pkg)` — implemented but no UI triggers them (no long-press menu on apps)
- `Typography` export in tokens.ts — never imported anywhere

### 🔧 Technical Debt
- `STORAGE_KEYS` duplicated identically in HomeScreen.tsx and SettingsScreen.tsx → should be shared module
- Settings loading duplicated 3x in HomeScreen (mount, focus, separate function) → single reusable function
- App deduplication logic copy-pasted in AppDrawerScreen and SettingsScreen
- `NavItem` component duplicated in AppDrawerScreen and SettingsScreen
- Launch animation (scale+opacity) duplicated in HomeScreen and AppDrawerScreen
- All AsyncStorage errors silently swallowed with `catch(() => {})` → no logging
- Glitch effect timeouts recreated every second (every time `time` state changes) → should be independent of time string
- No accessibility labels on HomeScreen swipe area, pet, or quick apps
- Module-level `cachedApps` in AppDrawerScreen isn't reactive to background changes

---

## 🔴 What to REMOVE or REPLACE

### 1. Remove: Reaction Time Game
**Why:** It's a gimmick hidden behind a long-press. Nobody discovers it. It doesn't fit the "tool, not a toy" philosophy. The pet is already borderline — the game pushes it into toy territory.
**Replace with:** Make the long-press on pet show pet stats instead (health history, streak of low screen time days, mood log). Data > games.

### 2. Remove: ASCII Clock Mode
**Why:** It looks cool in screenshots but is unreadable in daily use. The 5-line-tall block letters consume massive vertical space, pushing weather/quote/pet off screen. Nobody actually uses it as their daily clock.
**Replace with:** Nothing. The standard clock with glitch + parallax + cursor is distinctive enough. Or if we want variety: a **compact** mode (smaller font, single-line time+date).

### 3. Remove: Rain Effect (or drastically simplify)
**Why:** 20 animated Text elements continuously running Animated.timing loops is expensive. On low-end Android devices, this tanks frame rate. The effect is also not that visible on a dark background.
**Replace with:** A single subtle line of text below weather: `▒▒▒ rain ▒▒▒` that pulses. Zero performance cost, still communicates weather.

### 4. Simplify: Quick Access Apps Row
**Why:** 10 apps in a horizontal scroll is essentially a second app drawer. It defeats the purpose of a minimal launcher. Users who configure 10 quick apps have essentially recreated a normal grid launcher.
**Replace with:** Max 5 apps (not 10). No scroll — they must all fit on screen. Forces intentional curation. The dock already has 4 apps + app drawer access.

### 5. Remove: Piano Dock
**Why:** You already don't like it. It's clever but doesn't serve function better than the terminal dock. The alternating black/white heights create visual noise. The single-character display is cryptic.
**Keep:** Terminal dock only. Remove `dockStyle` setting, PianoKey component, and all piano styles. Simplifies code by ~100 lines.

### 6. Rethink: First-Launch Hints Overlay
**Why:** A wall of text on first launch is overwhelming. Nobody reads it. They dismiss immediately.
**Replace with:** Progressive disclosure — show ONE hint at a time, contextually. E.g., after 3 seconds on home screen with no interaction: "swipe up for apps ↑". After first settings visit: "try changing the accent color". Drip-feed over first 3 days.

---

## 🟢 New Features — HIGH IMPACT

### 1. ⚡ Haptic Feedback (Priority: CRITICAL)
**What:** Short vibration on every meaningful interaction.
**Why:** This is the #1 thing that makes a launcher feel "premium" vs "student project". Every competitor has it. Without haptics, taps feel hollow.
**How:** New native module `HapticsModule` with 3 patterns:
- `tick()` — 10ms vibration on any tap (dock, quick app, filter chip)
- `impact()` — 25ms on app launch, gesture threshold cross
- `pattern([10, 50, 10])` — double pulse on long-press recognition
**Effort:** Low. One Kotlin file, one JS bridge. 2 hours max.

### 2. 🔍 App Search on Home (Priority: HIGH)
**What:** Tap the clock or pull down slightly → search field appears. Type to filter and launch any app instantly.
**Why:** The #1 action on any launcher is "find and launch an app". Currently requires a full swipe up → wait for drawer → scroll/search. Too many steps.
**How:** Reuse AppDrawer's search logic. Overlay a search bar + filtered result list (max 5 results) on top of home screen. Dismiss with back or empty query.
**This is what Niagara does right.** It's the killer feature of minimal launchers.

### 3. 📊 Screen Time Tracker (Priority: HIGH)
**What:** Track daily screen time per app. Show a single number on home: "2h 14m today". Tap to see breakdown.
**Why:** Fits the "your phone is a tool" philosophy perfectly. No other minimal launcher does this natively. Android's built-in Digital Wellbeing is buried in settings.
**How:** Native module using `UsageStatsManager` (requires `PACKAGE_USAGE_STATS` permission). Store daily totals in AsyncStorage. Show on home screen below progress bars.
**Effort:** Medium. Native module + UI + permission flow.

### 4. 🌅 Sunrise/Sunset Line (Priority: MEDIUM)
**What:** Single line below weather: `☀ 06:12 · ☾ 18:47`
**Why:** Glanceable, useful, unique. Calculated offline from lat/long (no API needed). Adds temporal richness without clutter.
**How:** Solar calculation algorithm (it's just math — no API). Get rough location from timezone offset or request coarse location once.
**Effort:** Low. Pure JS calculation + one Text element.

### 5. 📝 Morning Intention (Priority: MEDIUM-HIGH)
**What:** On first unlock each day: small input field "Today I will..." that persists as a single line on home screen.
**Why:** This is the feature that makes people post screenshots. It turns the launcher into a daily ritual. Unique differentiator.
**How:** Detect first unlock via AppState `active` event + date comparison. Store in AsyncStorage with date key. Display below quote.
**Effort:** Low.

### 6. 🔢 Screen Pickup Counter (Priority: MEDIUM)
**What:** Small text on home: "↑ 14 pickups"
**Why:** Awareness nudge. Simple, powerful, fits instrument-panel aesthetic. Pairs with screen time tracker.
**How:** Count `AppState` transitions from `background` → `active`. Reset daily.
**Effort:** Trivial.

### 7. 🎨 Color of the Day (Priority: LOW-MEDIUM)
**What:** Accent color auto-cycles through 7 colors, one per day of the week.
**Why:** Free "freshness" — the home screen looks slightly different every day without user effort. Makes people check which color today is.
**How:** `new Date().getDay()` → index into a 7-color array. Override manual accent when enabled.
**Effort:** Trivial.

### 8. 📲 Long-Press App Menu (Priority: MEDIUM)
**What:** Long-press any app in drawer → options: App Info, Uninstall, Add to Quick Access, Add to Dock.
**Why:** The native methods `openAppSettings` and `uninstallApp` already exist but have no UI. This unlocks them. Every launcher has this.
**How:** Simple modal/bottom sheet on long-press. The native bridge already exists.
**Effort:** Low.

### 9. ⌨️ Terminal Mode (Priority: HIGH — VIRAL)
**What:** Tap the typing cursor `_` on the clock → terminal input appears. Type app name → instant launch. Type commands like `time`, `battery`, `weather` for quick info.
**Why:** THIS is the feature that gets shared on Reddit/Twitter. "My launcher has a command line." It perfectly embodies the instrument aesthetic. No other launcher does this.
**How:** TextInput overlay on home screen. Fuzzy match against app names (first 3 chars). Built-in commands: `help`, `time`, `battery`, `weather`, `quote [text]`, `accent [color]`.
**Effort:** Medium.

### 10. 🔕 Focus Mode (Priority: HIGH)
**What:** Before launching certain apps (user-configured "focus list"), show a 3-second pause screen: "Opening Instagram. Intentional?" with a breathing dot. User can cancel or proceed.
**Why:** This is the anti-addiction feature. It's the core of the "tool, not a slot machine" philosophy. Before Launcher does something similar and people love it.
**How:** Intercept `launchApp()` calls. Check against a "focus apps" list in AsyncStorage. Show a modal with a countdown. Store daily "paused and cancelled" count.
**Effort:** Medium.

---

## 🟡 New Features — MEDIUM IMPACT

### 11. App Usage Frequency Sort
**What:** App drawer auto-reorders by how often you launch each app. Most-used at top.
**How:** Increment a counter in AsyncStorage on each `launchApp()`. Sort the drawer by count (descending). Add a "Recent" filter alongside SOCIAL/MEDIA/etc.
**Effort:** Low.

### 12. Compact Home Layout
**What:** Settings option for "Minimal" layout that shows ONLY: clock + one progress bar + dock. No weather, no quote, no pet, no quick apps.
**Why:** Some users want absolute minimalism. Currently you can disable pet, but weather/quote/quick-apps are always there.
**Effort:** Low (conditional rendering based on a layout enum).

### 13. Custom Dock Labels
**What:** Let users rename dock labels (e.g., "Chrome" → "WEB", "Gmail" → "MAIL").
**Why:** Fits the instrument aesthetic. Short, intentional labels. Users already see auto-truncated labels but can't control them.
**Effort:** Trivial.

### 14. Notification Badge Dot
**What:** Tiny pulsing dot on dock items that have pending notifications.
**How:** Cross-reference `getNotifications()` package names with dock app packages. Show a 4px accent-colored dot above the label.
**Effort:** Low.

### 15. Weekly Stats Card
**What:** Every Sunday: "This week: 23h screen time · 142 pickups · Most used: Chrome". Shown as a card that dismisses.
**Why:** Weekly reflection. Data personality feature.
**Effort:** Medium (requires screen time tracking from #3).

### 16. Double-Tap Clock for Alarm
**What:** Double-tap the clock → opens the default alarm/clock app.
**Why:** Natural gesture. Clock → alarm is the most obvious affordance.
**Effort:** Trivial (detect double-tap, launch `com.google.android.deskclock` or equivalent).

### 17. Swipe Left/Right on Quick Apps
**What:** Horizontal swipe on a quick app to remove it (like iOS notification dismiss). Confirms with a brief "Removed" toast.
**Why:** Currently the only way to manage quick apps is through Settings → App Picker. This is faster.
**Effort:** Low.

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

## 🏗️ Architecture Improvements

### 1. Shared Constants Module
Extract `STORAGE_KEYS`, `DEFAULT_DOCK`, `ACCENT_COLORS`, `DEFAULT_ACCENT` into `src/constants.ts`. Both screens import from one source.

### 2. Custom Hooks
- `useSettings()` — single hook that loads/saves all settings, returns state + setters. Eliminates the 3x duplication in HomeScreen.
- `useLaunchAnimation()` — shared launch animation logic (currently duplicated in Home + AppDrawer).
- `useAppList()` — shared app loading + deduplication + caching.

### 3. Shared Components
- `NavItem` — used in AppDrawer and Settings, currently duplicated.
- `AppRow` — app list item, currently different in drawer vs settings picker.

### 4. Fix the Gesture Toggle
HomeScreen's PanResponder should check `gesturesEnabled` state. Currently the setting exists but does nothing.

### 5. Weather Error Handling
Wrap the wttr.in response parser in try/catch with fallback to cached data.

### 6. Decouple Glitch from Clock Tick
The glitch `useEffect` depends on `[time]`, causing recreation every second. Refactor to use a ref for the current time string and make the glitch schedule independent.

---

## 📊 Revised Priority Matrix

| Priority | Feature | Impact | Effort | Category |
|----------|---------|--------|--------|----------|
| 🔴 P0 | Haptic feedback | Huge | Low | Polish |
| 🔴 P0 | Fix gesture toggle bug | High | Trivial | Bugfix |
| 🔴 P0 | Remove dead code | Medium | Trivial | Cleanup |
| 🟠 P1 | Home screen app search | Huge | Medium | Core UX |
| 🟠 P1 | Focus mode (pause before launch) | Huge | Medium | Differentiation |
| 🟠 P1 | Terminal mode (type to launch) | Huge | Medium | Viral/Identity |
| 🟠 P1 | Long-press app menu | High | Low | Basic UX |
| 🟠 P1 | Screen time tracker | High | Medium | Differentiation |
| 🟡 P2 | Morning intention prompt | Medium | Low | Ritual |
| 🟡 P2 | Screen pickup counter | Medium | Trivial | Awareness |
| 🟡 P2 | Sunrise/sunset line | Medium | Low | Temporal |
| 🟡 P2 | App usage frequency sort | Medium | Low | Intelligence |
| 🟡 P2 | Notification badge dot | Medium | Low | Utility |
| 🟡 P2 | Progressive hints (replace wall-of-text) | Medium | Medium | Onboarding |
| 🟢 P3 | Color of the day | Low | Trivial | Delight |
| 🟢 P3 | Custom dock labels | Low | Trivial | Customization |
| 🟢 P3 | Double-tap clock for alarm | Low | Trivial | Utility |
| 🟢 P3 | Compact home layout | Low | Low | Customization |
| 🟢 P3 | Weekly stats card | Low | Medium | Data personality |
| 🔵 P4 | Ghost mode | Low | Low | Experimental |
| 🔵 P4 | Daily color shift | Low | Low | Experimental |
| 🔵 P4 | Data dashboard | Low | High | Power user |
| 🔵 P4 | QR config sharing | Low | Medium | Viral |

---

## 🗺️ Suggested Roadmap

### v1.2 — "Make it real" (Polish + Bugs)
1. Haptic feedback (native module)
2. Fix gesture toggle
3. Remove dead code
4. Shared constants + hooks refactor
5. Remove piano dock (terminal only)
6. Cap quick apps at 5
7. Fix weather error handling

### v1.3 — "The killer features"
1. Home screen search (tap clock or pull down)
2. Terminal mode (tap cursor `_`)
3. Long-press app menu
4. Focus mode for addictive apps

### v1.4 — "Know yourself"
1. Screen time tracker
2. Screen pickup counter
3. App usage frequency sort
4. Weekly stats card
5. Morning intention prompt

### v1.5 — "Ambient intelligence"
1. Sunrise/sunset line
2. Notification badge dots
3. Color of the day
4. Daily color shift
5. Progressive onboarding hints
6. Context-aware features (see section below)

### v2.0 — "Share it"
1. QR config sharing
2. Ghost mode
3. Data dashboard
4. Screenshot mode (beautiful shareable layout)

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
| 🎧 Headphones | **Active** | Sorts music apps to top of drawer |
| 🌧️ Weather condition | **Active** | Triggers rain particle effect |
| 📐 Gyroscope | **Active** | Parallax tilt on clock |
| 📱 Screen frequency | **Active** | Pet health ↑ if >30min gap, ↓ if <5min |
| 🔌 Boot | **Active** | Auto-launches as home screen |
| 🔋 Battery | **Display only** | Shown in Settings, no behavior |
| 📶 Connectivity | **Dead code** | Native API exists, never called |
| 🔔 Notification count | **Dead code** | `getNotificationCount()` exported, unused |

---

### 🎧 HEADPHONE CONTEXT — Expand What We Have

**Current:** Music apps sort to top when headphones detected.
**Problem:** One-time check on mount. Doesn't react to live plug/unplug.

**Improvements:**
1. **Live headphone listener** — Use `AudioManager.registerAudioDeviceCallback()` in Kotlin to emit events on connect/disconnect. React-side listens via `DeviceInfoEvents`.
2. **Headphone mode on home screen** — When headphones connect, show a subtle `🎧` indicator next to weather. Below the Quick-access row , a new button fades in slowly with cool animation (like the filter in the app list) which when clicked shows the list of music apps in the home screen itself) music apps (Spotify, YT Music, podcast app, phone/contacts) and one more tap on the same button collapse the list of music apps..like a toggle button. When unplugged, button filters fades out with same cool animation slowly.
3. **Bluetooth device name** — Show `🎧 AirPods Pro` or `🎧 WH-1000XM5` instead of generic icon. The AudioDevice API gives device names.
4. **Audio route quick-switch** — If multiple audio outputs detected (speaker + BT), show a tiny toggle.

**Effort:** Medium (native callback + event bridge + conditional UI)

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

### 📶 CONNECTIVITY CONTEXT — Unlock Dead Code

**Current:** `getConnectivityInfo()` returns `{isConnected, isWifi, isCellular, wifiName}` — fully implemented, never used.

**New behaviors:**
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
