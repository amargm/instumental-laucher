# Play Store Submission Guide — INSTRUMENT Launcher

## App Category
**Tools → Launcher**

## Short Description (80 chars max)
Minimal, instrumental Android launcher. Sharp design. No distractions.

## Full Description
INSTRUMENT is a minimal, instrumental-design Android launcher focused on clarity and precision.

Features:
• Clean monospace clock widget with real-time battery & notification count
• App drawer with custom line-art icons and fast search
• Real notification access (requires user permission)
• Quick settings shortcuts to system panels (WiFi, Bluetooth, GPS, NFC, etc.)
• Swipe gestures: down for notifications, up for app drawer
• Dark-only UI — no white flash, no visual noise
• Zero ads, zero tracking, zero data collection

This launcher does NOT:
- Collect personal data
- Track usage analytics
- Display advertisements
- Share data with third parties

---

## Required Permission Declarations

### QUERY_ALL_PACKAGES
**Justification:** This is a Home Screen Launcher app. Its core functionality requires listing all installed applications to display them in the app drawer. Without QUERY_ALL_PACKAGES, the launcher cannot fulfill its primary purpose of allowing users to find and launch their apps.

**Declaration Form Category:** Device search / Launcher

### NotificationListenerService
**Justification:** The launcher's Control Center displays real device notifications inline, allowing users to read and dismiss notifications without leaving the launcher interface. This is a core launcher feature. Notification access is requested through standard Android system settings — never granted automatically.

**User Flow:** Settings → NOTIFICATION ACCESS → system permission dialog → user explicitly enables

---

## Data Safety Form

| Question | Answer |
|----------|--------|
| Does your app collect or share any user data? | No |
| Does your app collect user location? | No |
| Does your app collect personal info? | No |
| Is data encrypted in transit? | N/A (no network requests beyond system) |
| Can users request data deletion? | N/A (no data stored) |
| Does your app share data with third parties? | No |

**Data types accessed locally (never transmitted):**
- Installed app list (displayed in app drawer)
- Notification content (displayed in control center)
- Battery level (displayed on home screen)
- WiFi connection status (displayed as indicator)

All data stays on-device. No analytics, no crash reporting, no network calls.

---

## Privacy Policy

Host this at a public URL (e.g., GitHub Pages) and link it in Play Console.

**Content:**

> **Privacy Policy — INSTRUMENT Launcher**
>
> Last updated: [DATE]
>
> INSTRUMENT Launcher does not collect, store, or transmit any personal data. 
>
> The app accesses the following device information solely for on-screen display:
> - List of installed applications (to populate the app drawer)
> - Notification content (to display in the control center, if permission granted)
> - Battery level and connectivity status (to show on the home screen)
>
> No data leaves your device. No analytics. No tracking. No ads.
>
> The app requires the following permissions:
> - QUERY_ALL_PACKAGES: Required to list installed apps (core launcher functionality)
> - NotificationListenerService: Optional — displays notifications in-app (user must explicitly enable)
> - RECEIVE_BOOT_COMPLETED: Allows the launcher to restart after device reboot
> - INTERNET: Required by React Native framework (no user data transmitted)
>
> Contact: mugaliamar@gmail.com

---

## Target API Requirements (2024+)
- targetSdk: 34 ✓
- compileSdk: 34 ✓
- 64-bit support: Hermes ✓
- Android App Bundle: Recommended (use ./gradlew bundleRelease)

---

## Pre-submission Checklist
- [ ] Privacy policy hosted at public URL
- [ ] Screenshots (phone, 16:9 aspect) — at least 4
- [ ] Feature graphic (1024x500)
- [ ] App icon (512x512 PNG)
- [ ] QUERY_ALL_PACKAGES declaration form submitted
- [ ] Notification listener permission declared
- [ ] Data safety form completed
- [ ] Content rating questionnaire completed
- [ ] App tested on Android 13+ and 11+
- [ ] Release APK/AAB signed with upload key
