export const STORAGE_KEYS = {
  gesturesEnabled: '@settings_gestures',
  clockFormat: '@settings_clock_format',
  quote: '@settings_quote',
  quickApps: '@settings_quick_apps',
  dockApps: '@settings_dock_apps',
  accentColor: '@settings_accent_color',
  glitchEnabled: '@settings_glitch_enabled',
  parallaxEnabled: '@settings_parallax_enabled',
  rainEnabled: '@settings_rain_enabled',
  petEnabled: '@settings_pet_enabled',
  petHealth: '@pet_health',
  petLastFed: '@pet_last_fed',
  hintsDismissed: '@hints_dismissed',
  cachedWeather: '@cached_weather',
};

export const MUSIC_KEYWORDS = [
  'music', 'spotify', 'player', 'podcast', 'audio', 'sound',
  'radio', 'gaana', 'wynk', 'jiosaavn', 'youtube music',
];

// Timing constants (ms)
export const AUDIO_POLL_INTERVAL = 30000;       // 30s
export const WEATHER_REFRESH_INTERVAL = 600000; // 10min
export const DASHBOARD_REFRESH_INTERVAL = 30000;// 30s
export const PET_FEED_GAP = 30 * 60 * 1000;    // 30min
export const PET_SPAM_THRESHOLD = 5 * 60 * 1000;// 5min
export const APP_CACHE_TTL = 60000;             // 60s
