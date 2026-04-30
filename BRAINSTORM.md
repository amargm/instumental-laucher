# INSTRUMENT Launcher — Brainstorm

## 🎯 Differentiation Ideas

### 1. Focus Mode / Digital Wellbeing
- **App usage timer** — show daily screen time per app (tiny bar under app name)
- **App limits** — set daily time caps, launcher blocks launch after limit
- **Focus sessions** — hide all apps except essentials for X minutes
- **Grayscale mode** — make all icons monochrome to reduce dopamine triggers
- **"Pause before launch"** — 3-second intentional delay for addictive apps (user-configurable list)

### 2. Contextual Home Screen
- **Time-of-day layout** — morning shows calendar/weather, evening shows music/wind-down apps
- **Location-aware quick apps** — show work apps at office, home apps at home (no GPS, just Wi-Fi SSID matching)
- **Auto-rotate quote** — pull from a local list of quotes, new one each day

### 3. Gesture Vocabulary (Expand)
- **Double-tap** → torch/flashlight toggle
- **Two-finger swipe down** → DND toggle
- **Long-press empty area** → quick note capture (saves to AsyncStorage)
- **Swipe left/right on home** → switch between 2-3 home "pages" (e.g., Focus / Default / Info)
- **Draw letter** → launch app starting with that letter

### 4. Information Density (Minimal Style)
- **Upcoming calendar event** — single line: "14:00 · Team Standup"
- **Step counter** — tiny "4,230 steps" below weather
- **Unread count badges** — subtle dot on quick apps with pending notifications
- **Sunrise/sunset** — "☀ 06:12 · ☾ 18:47" as a single line
- **Battery estimate** — "~4h 20m remaining" instead of just percentage

### 5. Customization That Matters
- **Custom dock apps** — let user pick 4-5 dock apps (not hardcoded Phone/Mail/Web/Msg)
- **Widget slots** — 2-3 configurable home slots (clock, weather, quote, calendar, step counter)
- **Icon pack support** — even just monochrome line icons from a bundled set
- **Font choice** — 2-3 monospace options (JetBrains Mono, Fira Code, system mono)
- **Accent color** — single accent color picker (affects progress bar, active states)

### 6. Privacy & Security
- **Hidden apps** — long-press to hide from drawer (accessible via secret gesture)
- **App lock** — fingerprint/PIN to launch specific apps
- **No internet permission** — market as "zero telemetry" launcher
- **Private DNS indicator** — show if DNS is encrypted

### 7. Micro-Interactions & Polish
- **Haptic feedback** — subtle vibration on dock taps and gestures
- **Parallax clock** — very subtle gyroscope tilt on clock text
- **Breathing dot** — tiny pulsing dot when notifications are pending (replaces badge count)
- **Smooth app open animation** — cross-fade or scale-up when launching an app
- **Pull-to-refresh** on home — refreshes weather/notifications

### 8. Productivity
- **Quick capture** — swipe gesture opens a single-line text input, saves to notes list
- **Pinned reminders** — 1-3 sticky notes on home screen (dismissible)
- **Pomodoro timer** — minimal timer in the progress bar area
- **Clipboard history** — last 5 copied items accessible via gesture

### 9. Aesthetic Uniqueness
- **ASCII art mode** — render time in large ASCII block letters
- **Matrix rain** — very subtle falling characters as idle screensaver
- **Morse code clock** — dots and dashes for time (toggle-able)
- **Terminal prompt style** — `$ 14:32 | Thu May 1 | 72°F clear`
- **Scan-line effect** — barely-visible horizontal lines like a CRT monitor
- **Glitch text** — occasional subtle character swap animation on the clock

### 10. Standout Features (Unique to Market)
- **"Offline first" badge** — advertise no network calls except weather
- **Boot time** — show "ready in 180ms" on settings (actual cold start time)
- **Battery saved** — estimate how much battery saved vs stock launcher
- **App frequency learning** — auto-sort drawer by most-used (no categories needed)
- **Minimal app suggestions** — after 7 days, suggest removing unused apps
- **Export/import config** — backup all settings to a JSON file

---

## 📊 Priority Matrix

| Impact | Effort | Feature |
|--------|--------|---------|
| High | Low | Custom dock apps |
| High | Low | Accent color picker |
| High | Medium | Focus mode / app limits |
| High | Medium | Haptic feedback |
| High | Medium | App frequency sort |
| Medium | Low | Auto-rotate quotes |
| Medium | Low | Breathing notification dot |
| Medium | Medium | Hidden apps |
| Medium | Medium | Quick capture notes |
| Medium | High | Calendar event line |
| Low | Low | ASCII clock mode |
| Low | Medium | Parallax/gyroscope |
| Low | High | Gesture letter recognition |

---

## 💡 Positioning Statement

> "The launcher for people who want their phone to be a tool, not a slot machine."

**Key differentiators vs competition (Niagara, Olauncher, Before):**
1. Progress bar showing day completion — unique visual
2. Intentional friction for addictive apps
3. Zero telemetry, no internet except opt-in weather
4. Terminal/instrument aesthetic (not just "minimal")
5. Quote as daily intention-setting

---

## 🚀 Suggested Next Sprint

1. Custom dock apps (Settings → pick 5 dock apps)
2. Accent color picker (single color, affects progress bar + active states)
3. Haptic feedback on all interactions
4. Breathing dot for pending notifications
5. App frequency auto-sort in drawer
