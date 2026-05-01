# Instrument Launcher — Feature Brainstorm

> Everything here fits the design language: monospace, near-black, minimal, terminal-native.  
> Prioritized by impact × effort. Stars ★ = excitement factor.

---

## 🔥 HIGH IMPACT — Worth Building Next

### 1. Notification Center ★★★★★
The native `NotificationService` already reads real notifications — but they're **not surfaced anywhere in the UI**.

**Concept**: Swipe right on Home → monospace notification feed. Each notification is a single line:
```
12:04  WHATSAPP  John: hey are you free tonight?
11:58  GMAIL     New message from GitHub
11:42  SLACK     #general: deploy complete ✓
```
- Tap to open the source app
- Swipe individual notification to dismiss
- Long press → dismiss all from that app
- Shows count badge on the clock widget (`3 UNREAD` in muted text)
- Terminal command: `notif` or `inbox` to list, `notif clear` to dismiss all

**Why**: Every launcher needs this. The notification data is already flowing — just needs UI.

---

### 2. App Usage Tracker / Screen Time ★★★★
Track how often and how long each app is used. Show insights in terminal-style.

**Concept**:
- Track `launchApp()` calls with timestamps
- Terminal command: `usage` → today's top 5 apps by launch count
- `usage week` → weekly breakdown
- Home widget: small `SCREEN · 2h 14m` indicator below weather
- Feed this data into the pet — more screen time = sadder pet (already partially there)

```
TODAY'S USAGE
─────────────
INSTAGRAM     ████████░░  47 min  (12 opens)
WHATSAPP      ██████░░░░  31 min  (28 opens)
CHROME        ████░░░░░░  22 min  (8 opens)
YOUTUBE       ███░░░░░░░  18 min  (3 opens)
TWITTER       ██░░░░░░░░  11 min  (5 opens)
```

**Why**: Fits the "intentional phone use" philosophy. No other launcher does this with a terminal aesthetic.

---

### 3. Focus Mode / App Blocker ★★★★
Temporarily block distracting apps. Terminal command or Settings toggle.

**Concept**:
- `focus 30` → blocks social media for 30 minutes
- `focus off` → disable early (with a "are you sure?" prompt)
- Blocked apps show a monospace overlay: `BLOCKED · 18 min remaining`
- Configurable blocklist in Settings (default: social + media categories)
- Pet gets healthier during focus sessions
- Optional: schedule focus (e.g., `focus daily 9:00-17:00`)

**Why**: Aligns perfectly with the "minimal, intentional" launcher identity.

---

### 4. Double-Tap to Lock Screen ★★★
Double-tap empty area on Home → screen off.

**Concept**:
- Uses `DevicePolicyManager` or accessibility service
- Needs device admin permission (one-time grant in Settings)
- Alternative: use `PowerManager` goToSleep (requires root) or accessibility `GLOBAL_ACTION_LOCK_SCREEN` (API 28+)

**Why**: Essential launcher feature. Stock launchers all have this. Simple to implement on API 28+.

---

### 5. Wallpaper / Background Control ★★★
Not a photo wallpaper — that breaks the aesthetic. Instead:

**Concept**:
- Subtle animated backgrounds: `MATRIX` (falling green chars), `STATIC` (CRT TV noise), `GRID` (faint dot grid that parallaxes), `VOID` (pure black, current)
- Maybe: live noise/grain overlay (very subtle, 5% opacity) for texture
- Terminal command: `bg matrix` / `bg static` / `bg void`
- Settings toggle in AESTHETICS section

**Why**: Adds visual personality without breaking the monospace+black design language.

---

## ⚡ MEDIUM IMPACT — Cool Differentiators

### 6. Widget-Style Home Customization ★★★★
Let users reorder and toggle home screen sections.

**Concept**:
- Long-press Home → enters edit mode
- Drag sections: Clock, Progress, Weather, Quote, Pet, Quick Apps
- Toggle visibility of each section
- Compact vs expanded modes per widget
- Store layout in AsyncStorage as ordered array

**Why**: Power users want control. The current fixed layout works but isn't flexible.

---

### 7. Quick Notes from Home ★★★
Tap the quote area → inline text input. Type a quick thought → saved as terminal note.

**Concept**:
- Quote area becomes a mini input field on tap
- Auto-saves to terminal notes
- Shows most recent note if no quote is set
- Swipe between quote and last note

**Why**: Reduces friction. Currently need to open Terminal → type `note text`. This makes it one tap.

---

### 8. Theming / Color Schemes ★★★
Beyond just accent color — full theme presets.

**Concept**:
- `MIDNIGHT` (current — black + white)
- `AMBER` (dark brown + amber text, like old terminals)
- `PHOSPHOR` (black + green, classic hacker)
- `SOLARIZED` (dark base + warm tones)
- `SNOW` (light mode — white bg + dark text, for outdoor readability)
- Each theme defines: bg, surface, textPrimary, textSecondary, textMuted, border
- Terminal command: `theme amber`

**Why**: People love personalization. The monospace aesthetic works in multiple color palettes.

---

### 9. Alarm / Timer in Terminal ★★★
```
> timer 5
TIMER · 5:00 remaining
████████████████████░░░░░░░░  4:12
```

**Concept**:
- `timer <minutes>` → countdown with progress bar
- `alarm 7:30` → sets system alarm via `AlarmManager` intent
- `stopwatch` → running count-up with lap support
- Notification when timer completes
- Vibration pattern on completion

**Why**: Common use case. Fits terminal interaction perfectly.

---

### 10. Weather Forecast (Extended) ★★
Currently only shows current weather. Add forecast.

**Concept**:
- Terminal: `weather forecast` or `wf`
```
TODAY      28°C  ☀ Clear
TOMORROW   26°C  ⛅ Partly Cloudy
SAT        24°C  🌧 Rain
SUN        27°C  ☀ Clear
```
- Tap weather on Home → shows 3-day inline forecast
- Data from `wttr.in?format=j1` (JSON format, already free API)

---

### 11. Contacts Quick Dial ★★
Terminal command to call/text contacts.

**Concept**:
- `call john` → fuzzy match contact → open dialer
- `text john hey what's up` → opens SMS compose
- `contacts` → list favorites
- Requires READ_CONTACTS permission

**Why**: A terminal launcher should let you do everything from the command line.

---

### 12. Clipboard Manager ★★
Track clipboard history. Already have `@react-native-clipboard/clipboard`.

**Concept**:
- Terminal: `clip` → shows last 10 clipboard entries
- `clip 3` → copies entry #3 back to clipboard
- `clip clear` → wipe history
- Auto-capture on copy (poll clipboard every 5s when terminal is open)

---

## 💡 EXPERIMENTAL — Wild Ideas

### 13. AI Command Parser ★★★★★
Natural language → launcher action. No cloud API needed — just smart pattern matching.

**Concept**:
- `open that music app` → launches Spotify
- `how's the battery` → shows battery info
- `set a timer for 10 minutes` → timer command
- `block instagram for an hour` → focus mode
- Fallback to fuzzy app search for unknown intents
- Could use local regex patterns — no need for actual AI

**Why**: Feels magical. Makes the terminal feel like talking to a computer.

---

### 14. Habit Tracker ★★★
Simple streaks tracked through terminal.

**Concept**:
```
> habit water
WATER · ████████░░ 8/10 today · 🔥 12 day streak

> habit add meditation
Added: MEDITATION

> habit log meditation
MEDITATION · ✓ logged today · 🔥 1 day streak
```
- ASCII progress bars
- Streak counter with fire emoji
- Pet gets healthier when habits are maintained

---

### 15. System Monitor Dashboard ★★★
Real-time device stats on the Terminal dashboard.

**Concept**:
```
CPU  ████████░░░░  67%    RAM  ██████░░░░░░  52%
DISK ██████████░░  83%    TEMP 38°C
UPTIME 4d 12h 33m        APPS RUNNING 47
```
- Requires native `ActivityManager`, `Runtime.getRuntime()`
- Updates every 5s when Terminal is visible
- `sysinfo` terminal command for one-shot

---

### 16. App Shortcuts / Deep Links ★★★
Long-press app in drawer → show Android shortcuts (like long-press on stock launcher).

**Concept**:
- Chrome: New Tab, Incognito, Recent Tabs
- WhatsApp: Recent chats
- Camera: Take Selfie, Record Video
- Uses `ShortcutManager` API (Android 7.1+)
- Show in context menu on long-press

---

### 17. Gesture Customization ★★
Let users map gestures to custom actions.

**Concept**:
- Swipe left → configurable (default: Settings)
- Swipe right → configurable (default: Notifications)
- Double-tap → configurable (default: Lock)
- Two-finger swipe → configurable (default: Quick Note)
- Settings UI to map each gesture to: screen, app launch, toggle, or terminal command

---

### 18. ASCII Art Boot Animation ★★
When the launcher starts (especially after reboot), show a brief ASCII splash:

```
╔══════════════════════════╗
║                          ║
║    I N S T R U M E N T   ║
║    ─────────────────     ║
║    loading systems...    ║
║    ████████░░░░  67%     ║
║                          ║
╚══════════════════════════╝
```
- 1-2 second duration max
- Typewriter text reveal
- Progress bar fills as components mount
- Only on cold start, not on navigation

---

### 19. Calendar Peek ★★
Show today's next event on Home screen.

**Concept**:
- Small line below weather: `NEXT · 14:30 Team standup (Google Meet)`
- Terminal: `cal` → today's events
- `cal tomorrow` → tomorrow's events
- Requires READ_CALENDAR permission
- Tap to open calendar app

---

### 20. Music Now Playing ★★★★
When music is playing, show current track on Home.

**Concept**:
- Detect via `MediaSession` / notification with `android.media.session`
- Show below weather: `♫ Bohemian Rhapsody — Queen`
- Tap to open the music app
- Terminal: `now` or `playing` → current track info
- Already have notification access — can extract media notifications

**Why**: Headphone detection already surfaces music apps. This completes the experience.

---

## 📊 Priority Matrix

| Feature | Impact | Effort | Do When |
|---------|--------|--------|---------|
| Notification Center | 🔴 Critical | Medium | **Next sprint** |
| App Usage Tracker | 🔴 High | Medium | **Next sprint** |
| Double-Tap Lock | 🟠 High | Low | **Quick win** |
| Focus Mode | 🟠 High | Medium | **Next sprint** |
| Now Playing | 🟠 High | Low | **Quick win** |
| Theming | 🟡 Medium | Medium | After core |
| Quick Notes | 🟡 Medium | Low | **Quick win** |
| Timer/Alarm | 🟡 Medium | Medium | After core |
| Weather Forecast | 🟡 Medium | Low | **Quick win** |
| Widget Reorder | 🟡 Medium | High | Later |
| Wallpaper Effects | 🟢 Low | Medium | Polish phase |
| AI Command Parser | 🟢 Low | High | Experiment |
| Habit Tracker | 🟢 Low | Medium | Experiment |
| Boot Animation | 🟢 Low | Low | Polish phase |
| Calendar Peek | 🟡 Medium | Medium | After core |
| Clipboard Manager | 🟢 Low | Low | Quick win |
| App Shortcuts | 🟢 Low | High | Later |
| Gesture Custom | 🟢 Low | Medium | Later |
| System Monitor | 🟢 Low | Medium | Experiment |
| Contacts Dial | 🟢 Low | Medium | Later |

---

## 🎯 Suggested Build Order

### Sprint 1 — Quick Wins (1-2 days each)
1. ~~Double-Tap Lock~~ (API 28+ accessibility action)
2. ~~Now Playing~~ (extract from media notifications — data already flows)
3. ~~Quick Notes~~ (tap quote → inline input)
4. ~~Weather Forecast~~ (extend wttr.in call)

### Sprint 2 — Core Differentiators (3-5 days each)
5. ~~Notification Center~~ (swipe right, monospace feed)
6. ~~App Usage Tracker~~ (track launches, terminal command)
7. ~~Focus Mode~~ (block apps, timer, pet integration)

### Sprint 3 — Personality (2-3 days each)
8. ~~Theming~~ (amber, phosphor, solarized presets)
9. ~~Timer/Alarm~~ (terminal command, notification)
10. ~~Calendar Peek~~ (next event on Home)

---

*"A launcher should disappear. You shouldn't notice it — you should notice what it helps you do."*
