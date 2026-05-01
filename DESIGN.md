# Instrument Launcher — Design System

> **Sharp. Instrumental. Clear. Modern.**
> Every pixel serves a purpose. No decoration without function.

---

## Core Principles

### 1. SHARP
- **Zero border radius** on functional elements (cards, inputs, buttons)
- Hard edges communicate precision and intentionality
- Only circles for status indicators (dots, badges)
- Angles = 0° or 90° — no soft curves, no gradients

### 2. INSTRUMENTAL
- The launcher is a **tool**, not a decoration
- Every element has a job — if it doesn't inform or enable action, remove it
- Information density over whitespace — but never crowded
- Typography carries the UI — no icons where text works better

### 3. CLEAR
- Maximum contrast between active and inactive states
- Information hierarchy through size, weight, and opacity — never color alone
- Single-line data where possible — no wrapping, no overflow
- Immediate readability at arm's length

### 4. MODERN
- Monospace type as design identity (JetBrains Mono)
- Minimal color — accent used surgically (one per screen max)
- Micro-animations that confirm actions (not entertain)
- Flat with depth through layering (surface levels), not shadows

---

## Typography Scale

| Token | Size | Weight | Spacing | Use |
|-------|------|--------|---------|-----|
| `display` | 48px | 100 | -3 | Clock time only |
| `title` | 14px | 600 | 3 | Screen headers |
| `body` | 13px | 400 | 0.3 | Primary content |
| `label` | 11px | 500 | 1.5 | Secondary info, settings values |
| `caption` | 10px | 400 | 2 | Section headers, group labels |
| `micro` | 9px | 400 | 1 | Metadata, hints, timestamps |

**Font:** `JetBrainsMono-Regular` (body, labels, captions)  
**Font Bold:** `JetBrainsMono-Medium` (titles, emphasis)  
**Fallback:** `monospace`

---

## Spacing System

| Token | Value | Use |
|-------|-------|-----|
| `xxs` | 2px | Tight inline gaps |
| `xs` | 4px | Icon-to-text, stacked micro elements |
| `sm` | 8px | Between related items |
| `md` | 12px | Section internal padding |
| `base` | 16px | Standard gap between sections |
| `lg` | 20px | Screen horizontal padding |
| `xl` | 24px | Section separation |
| `xxl` | 32px | Major section breaks |

---

## Color Architecture

### Surface Layers (light → dark)
```
bg        → deepest background (full screen)
surface   → card/container level 1
surface2  → interactive highlight / level 2
surface3  → hover/pressed state (NEW)
```

### Text Hierarchy
```
textPrimary   → 100% — headlines, values, active text
textSecondary → 70%  — descriptions, secondary data
textMuted     → 40%  — labels, hints, disabled
```

### Functional Colors
```
accent  → confirmation, active state, CTA (theme-defined)
danger  → #FF4444 — errors, destructive actions
success → #00CC66 — confirmations
```

### Border
```
border → subtle separation (1px only, never thicker)
```

---

## Component Patterns

### Cards / Containers
```
backgroundColor: Colors.surface
borderWidth: 1
borderColor: Colors.border
borderRadius: 0          ← SHARP — no radius
paddingVertical: 12
paddingHorizontal: 14
```

### Buttons (Primary)
```
backgroundColor: Colors.textPrimary
paddingVertical: 8
paddingHorizontal: 14
borderRadius: 0
```
Text: `Colors.bg`, `fontSize: 11`, `letterSpacing: 1.5`, `fontWeight: '600'`

### Buttons (Ghost/Secondary)
```
borderWidth: 1
borderColor: Colors.border
backgroundColor: transparent
paddingVertical: 6
paddingHorizontal: 12
borderRadius: 0
```
Text: `Colors.textSecondary`, `fontSize: 11`, `letterSpacing: 1`

### Inputs
```
backgroundColor: Colors.surface
borderWidth: 1
borderColor: Colors.border
borderRadius: 0
paddingVertical: 8
paddingHorizontal: 12
fontSize: 13
fontFamily: monospace
```
Focus state: `borderColor: Colors.textPrimary`

### Dividers
```
height: 1 (not hairlineWidth — too thin on high-DPI)
backgroundColor: Colors.border
opacity: 0.4
```

### Status Dots
```
width: 6, height: 6
borderRadius: 3         ← only circular element allowed
```
- Active: `backgroundColor: accent`
- Partial: `backgroundColor: Colors.textMuted`  
- Empty: `backgroundColor: Colors.surface2`

### Progress Bars
```
Track:  height: 3, backgroundColor: Colors.surface2, borderRadius: 0
Fill:   height: 3, backgroundColor: accent/textPrimary, borderRadius: 0
```

### Section Headers
```
fontSize: 10
letterSpacing: 2.5
fontWeight: '600'
color: Colors.textMuted
textTransform: uppercase
marginBottom: 8
```

---

## Layout Rules

1. **Screen padding:** `20px` horizontal (Spacing.lg)
2. **Section gap:** `24px` vertical between major sections
3. **Item gap:** `12px` between list items
4. **Inline gap:** `8px` between icon and text
5. **No orphan content:** Every section has a clear label/boundary
6. **Bottom safe zone:** 56px for dock/navigation bar

---

## Animation Guidelines

| Action | Animation | Duration |
|--------|-----------|----------|
| Mount/appear | Fade + translateY(6→0) | 150ms |
| Press feedback | scale(0.96) | spring, friction: 8 |
| Toggle/switch | Width/opacity crossfade | 120ms |
| Screen transition | Fade crossfade | 120ms |
| Delete/remove | Fade out + translateX(-10) | 100ms |
| Expand/collapse | Height + opacity | 200ms, easing |

**Rules:**
- Never animate more than 2 properties simultaneously
- Never exceed 200ms for feedback animations
- Use `useNativeDriver: true` always (except height)
- No bounce/overshoot on functional elements

---

## Widget Design Pattern

Every home screen widget follows this structure:

```
┌─────────────────────────────────────────┐
│ SECTION LABEL                     VALUE │  ← caption size, muted
│─────────────────────────────────────────│  ← 1px divider (optional)
│                                         │
│  Primary content                        │  ← body size, primary
│  Secondary content                      │  ← label size, secondary
│                                         │
└─────────────────────────────────────────┘
```

- No visible container background in compact mode (blends with screen bg)
- Expanded mode: `surface` background + `border` outline
- Tap target minimum: 44px height
- All interactive text gets `activeOpacity: 0.6`

---

## Icon Philosophy

- **Prefer text/symbols over icons** — monospace chars as visual markers
- When icons are needed: single-weight, geometric, 14–16px
- Status indicators: `●` `○` `◐` `▸` `▾` `✓` `✕`
- Section markers: `─` borders, not decorative glyphs
- No emoji in structural UI (allowed in user content like habits)

---

## Dark-First, Theme-Aware

All styles must:
1. Reference `Colors.xxx` — never hardcode color values
2. Work across all 5 theme presets (test SNOW light mode especially)
3. Use opacity for hierarchy, not different grey values
4. Maintain WCAG AA contrast (4.5:1 minimum for body text)

---

## Anti-Patterns (DO NOT)

- ❌ Border radius > 0 on rectangles
- ❌ Drop shadows or elevation
- ❌ Gradients
- ❌ Multiple accent colors on one screen
- ❌ Font sizes between the defined scale (no 14.5px)
- ❌ Decorative animations (wobble, shake, pulse without purpose)
- ❌ Placeholder/skeleton loading (show nothing → show content)
- ❌ Rounded buttons or pill shapes (use only for tiny dots)
- ❌ More than 3 font weight variants on one screen

---

*"The best interface is one you don't notice — until you need it."*
