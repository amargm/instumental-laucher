import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Instrument',
  slug: 'instrument-launcher',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  android: {
    package: 'com.instrument.launcher',
    versionCode: 1,
  },
  extra: {
    eas: {
      projectId: '',
    },
  },
};

export default config;
