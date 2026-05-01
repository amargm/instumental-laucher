# Instrument Launcher — Feature Roadmap

> Monospace · near-black · minimal · terminal-native.  
> Only features that fit the design language. Stars ★ = excitement factor.

---

## ✅ ALREADY SHIPPED

- Habit Tracker (goals, streaks, week view, read-only on Home)
- Background Effects (void / matrix / static / grid)
- Theme Presets (midnight / amber / phosphor / solarized / snow)
- Pixel Pet (health, mood, breathing animation)
- Music Mode (headphone detection + quick-launch audio apps)
- Rain Effect (particle animation when weather is rainy)
- Clock Widget (parallax, glitch, day/week progress bars)
- Terminal (battery, weather, calc, note, quote, theme, bg, habit commands)
- App Drawer (categories, search, long-press uninstall)
- Swipe Gestures (↓ terminal, ↑ app drawer)
- Quick Access + Dock (configurable app shortcuts)
- Settings Store (all config linked via central store + event emitter)

---

## 🔥 HIGH PRIORITY — Next Up

### 1. Notification Center ★★★★★
`NotificationService` already reads notifications — no UI surfaces them.

**Concept**: Swipe right on Home → monospace notification feed.
```
12:04  WHATSAPP  John: hey are you free tonight?
11:58  GMAIL     New message from GitHub
11:42  SLACK     #general: deploy complete ✓
```
- Tap → open source app
- Swipe to dismiss, long-press → dismiss all from that app
- Badge on clock: `3 UNREAD`
- Terminal: `notif` / `notif clear`

**Effort**: Medium — data flows, needs FlatList + swipe gestures

---

### 2. Now Playing ★★★★
Show current track on Home when music is active.

**Concept**:
- Extract from media notifications (already have notification access)
- Line below weather: `♫ Bohemian Rhapsody — Queen`
- Tap → open the music app
- Terminal: `now` or `playing`
- Pairs with existing music mode

**Effort**: Low — parse existing notification data for `android.media.session`

---

### 3. Focus Mode / App Blocker ★★★★
Block distracting apps temporarily.

**Concept**:
- `focus 30` → blocks social apps for 30 min
- `focus off` → disable (with confirm)
- Blocked apps show overlay: `BLOCKED · 18 min remaining`
- Configurable blocklist in Settings
- Pet gets healthier during focus sessions
- Optional scheduling: `focus daily 9:00-17:00`

**Effort**: Medium — needs app intercept overlay + timer service

---

### 4. App Usage Tracker ★★★★
Track launch count + duration per app. Terminal-style insights.

**Concept**:
```
TODAY'S USAGE
─────────────
INSTAGRAM     ████████░░  47 min  (12 opens)
WHATSAPP      ██████░░░░  31 min  (28 opens)
CHROME        ████░░░░░░  22 min  (8 opens)
```
- Track `launchApp()` calls with timestamps
- Terminal: `usage` / `usage week`
- Home widget: `SCREEN · 2h 14m`
- Feeds pet mood (more usage = sadder pet)

**Effort**: Medium — native `UsageStatsManager` for duration, JS for launch count

---

### 5. Double-Tap to Lock ★★★
Double-tap empty area → screen off.

**Concept**:
- `GLOBAL_ACTION_LOCK_SCREEN` via accessibility service (API 28+)
- One-time permission grant in Settings
- Fast, no root needed

**Effort**: Low — ~50 lines of native code + permission flow

---

## ⚡ MEDIUM PRIORITY — Differentiators

### 6. Calendar Peek ★★★
Next event shown on Home screen.

**Concept**:
- Below weather: `NEXT · 14:30 Team standup (Google Meet)`
- Terminal: `cal` → today's events, `cal tomorrow`
- Tap → open calendar app
- Requires READ_CALENDAR permission

**Effort**: Medium — ContentResolver query + permission

---

### 7. Timer / Alarm in Terminal ★★★
```
> timer 5
TIMER · 5:00 ████████████████░░░░  4:12
```
- `timer <min>` → countdown with live progress bar
- `alarm 7:30` → sets system alarm intent
- `stopwatch` → count-up with lap
- Notification + vibration on completion

**Effort**: Medium — foreground service for reliable timer

---

### 8. Quick Notes from Home ★★★
Tap quote area → inline text input → saved as terminal note.

**Concept**:
- Quote area transforms to input on tap
- Auto-saves to notes store
- Shows latest note if no quote set
- One-tap capture vs current `note <text>` in terminal

**Effort**: Low — UI change only, storage exists

---

### 9. Weather Forecast ★★
Extend current weather to show 3-day outlook.

**Concept**:
```
TODAY      28°C  ☀ Clear
TOMORROW   26°C  ⛅ Partly Cloudy
SAT        24°C  🌧 Rain
```
- Tap weather on Home → inline 3-day view
- Terminal: `weather forecast` or `wf`
- Data from `wttr.in?format=j1` (free, no key)

**Effort**: Low — one additional API field

---

### 10. Clipboard Manager ★★
Track clipboard history in terminal.

**Concept**:
- `clip` → last 10 entries
- `clip 3` → re-copy entry #3
- `clip clear` → wipe
- Already have `@react-native-clipboard/clipboard`

**Effort**: Low — poll + store array

---

## 💡 EXPERIMENTAL — Wild Ideas

### 11. Smart Command Parser ★★★★★
Natural language → launcher action via local pattern matching.

**Concept**:
- `open that music app` → launches Spotify
- `how's the battery` → battery command
- `block instagram for an hour` → focus mode
- `set timer 10 minutes` → timer
- Regex/fuzzy matching — no cloud AI needed
- Fallback: fuzzy app search

**Effort**: High — pattern library + intent mapping

---

### 12. Widget Reorder / Layout Editor ★★★
Let users rearrange Home screen sections.

**Concept**:
- Long-press Home → edit mode with drag handles
- Toggle visibility per section (Clock, Weather, Quote, Pet, Habits, Quick Apps)
- Compact vs expanded modes
- Store as ordered array in settings

**Effort**: High — drag-and-drop + dynamic render order

---

### 13. App Shortcuts / Deep Links ★★★
Long-press in drawer → Android app shortcuts.

**Concept**:
- Chrome: New Tab, Incognito
- WhatsApp: Recent chats
- Camera: Selfie, Video
- Uses `ShortcutManager` API (Android 7.1+)
- Show in existing long-press context menu

**Effort**: Medium-High — native ShortcutManager bridge

---

### 14. System Monitor ★★★
Real-time device stats in terminal.

**Concept**:
```
CPU  ████████░░░░  67%    RAM  ██████░░░░░░  52%
DISK ██████████░░  83%    TEMP 38°C
UPTIME 4d 12h 33m        APPS RUNNING 47
```
- Terminal: `sysinfo`
- Native: `ActivityManager` + `Runtime.getRuntime()`

**Effort**: Medium — native module for stats

---

### 15. Gesture Customization ★★
Map swipe directions to custom actions.

**Concept**:
- Swipe left → configurable (default: notifications)
- Swipe right → configurable (default: quick note)
- Double-tap → configurable (default: lock)
- Settings UI to map gesture → action (screen, app, toggle, command)

**Effort**: Medium — gesture config UI + dynamic action dispatch

---

### 16. ASCII Boot Splash ★★
Brief typewriter animation on cold start.

```
╔══════════════════════════╗
║    I N S T R U M E N T   ║
║    ─────────────────     ║
║    loading...            ║
║    ████████░░░░  67%     ║
╚══════════════════════════╝
```
- 1-2s max, only on cold start
- Progress bar syncs with actual component mount
- Typewriter text reveal

**Effort**: Low — splash screen component + timeout

---

### 17. Contacts Quick Dial ★★
Terminal commands for calling/texting.

**Concept**:
- `call john` → fuzzy match → open dialer
- `text john hey` → SMS compose
- `contacts` → list favorites
- Requires READ_CONTACTS

**Effort**: Medium — permission + content resolver

---

### 18. Daily Briefing ★★★★
Morning summary shown on first unlock of the day.

**Concept**:
```
GOOD MORNING · MAY 2
─────────────────────
☀ 24°C Clear · High 28°
📅 3 events today · next: 9:30 Standup
✓ HABITS: 2/4 completed yesterday
🔥 WATER streak: 13 days
📱 Yesterday: 3h 12m screen time
```
- Appears once per day on first app-active
- Dismisses on tap or after 10s
- Aggregates weather + calendar + habits + usage
- Terminal: `brief` to re-show

**Effort**: Medium — compositor of existing data sources

---

### 19. Pomodoro Mode ★★★
Structured work/break cycles via terminal.

**Concept**:
- `pomo` or `pomodoro` → starts 25 min work session
- Home shows: `FOCUS · 18:32 remaining`
- After 25 min: notification + vibrate → 5 min break
- `pomo long` → 50 min work + 10 min break
- Count completed pomodoros per day
- Pet thrives during pomodoro sessions

**Effort**: Medium — timer service + home widget state

---

### 20. Bedtime Mode ★★★
Wind-down automation at night.

**Concept**:
- `sleep` or `bedtime` → activates: grayscale overlay, blocks social apps, dims to minimum
- Auto-schedule: Settings → BEDTIME → 23:00-07:00
- Shows: `ZZZ · bedtime active` on home
- Disable: `wake` or tap the indicator
- Next morning alarm info shown

**Effort**: Medium — overlay + scheduling + DND intent

---

## 📊 Priority Matrix

| Feature | Impact | Effort | When |
|---------|--------|--------|------|
| Notification Center | 🔴 Critical | Medium | **Sprint 1** |
| Now Playing | 🔴 High | Low | **Sprint 1** |
| Focus Mode | 🔴 High | Medium | **Sprint 1** |
| Double-Tap Lock | 🟠 High | Low | **Sprint 1** |
| App Usage Tracker | 🟠 High | Medium | **Sprint 2** |
| Calendar Peek | 🟡 Medium | Medium | **Sprint 2** |
| Timer/Alarm | 🟡 Medium | Medium | **Sprint 2** |
| Quick Notes | 🟡 Medium | Low | **Sprint 2** |
| Daily Briefing | 🟡 Medium | Medium | **Sprint 2** |
| Weather Forecast | 🟢 Medium | Low | **Sprint 3** |
| Pomodoro | 🟢 Medium | Medium | **Sprint 3** |
| Clipboard Manager | 🟢 Low | Low | **Sprint 3** |
| Bedtime Mode | 🟢 Medium | Medium | **Sprint 3** |
| Smart Commands | 🟢 Low | High | Later |
| Widget Reorder | 🟢 Low | High | Later |
| App Shortcuts | 🟢 Low | High | Later |
| System Monitor | 🟢 Low | Medium | Later |
| Gesture Custom | 🟢 Low | Medium | Later |
| Boot Splash | 🟢 Low | Low | Polish |
| Contacts Dial | 🟢 Low | Medium | Later |

---

*"A launcher should disappear. You shouldn't notice it — you should notice what it helps you do."*
