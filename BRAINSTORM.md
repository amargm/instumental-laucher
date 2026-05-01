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

### v2.0 — "Share it"
1. QR config sharing
2. Ghost mode
3. Data dashboard
4. Screenshot mode (beautiful shareable layout)

---

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
