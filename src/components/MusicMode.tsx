import React, {useMemo, useCallback, memo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Animated} from 'react-native';
import {Colors, Spacing} from '../theme/tokens';
import {APP_ICON_MAP} from './AppIcons';
import {AppInfo} from '../native/InstalledApps';
import {tick} from '../native/Haptics';

interface MusicModeProps {
  audioConnected: boolean;
  musicApps: AppInfo[];
  musicAppsOpen: boolean;
  accentColor: string;
  btnOpacity: Animated.Value;
  btnScale: Animated.Value;
  onToggle: () => void;
  onAppPress: (pkg: string) => void;
}

const MusicMode = memo(({audioConnected, musicApps, musicAppsOpen, accentColor, btnOpacity, btnScale, onToggle, onAppPress}: MusicModeProps) => {
  if (!audioConnected || musicApps.length === 0) return null;

  return (
    <Animated.View style={[styles.musicModeWrap, {opacity: btnOpacity, transform: [{scale: btnScale}]}]}>
      <TouchableOpacity
        style={[styles.musicToggleBtn, musicAppsOpen && {borderColor: accentColor}]}
        activeOpacity={0.7}
        onPress={onToggle}>
        <Text style={[styles.musicToggleText, musicAppsOpen && {color: accentColor}]}>
          🎧 {musicAppsOpen ? 'HIDE' : 'LISTENING'}
        </Text>
      </TouchableOpacity>
      {musicAppsOpen && (
        <View style={styles.musicAppsList}>
          {musicApps.map(app => (
            <TouchableOpacity
              key={app.packageName}
              style={styles.musicAppItem}
              activeOpacity={0.6}
              onPress={() => onAppPress(app.packageName)}>
              <View style={styles.musicAppIcon}>
                {APP_ICON_MAP[app.packageName]
                  ? React.createElement(APP_ICON_MAP[app.packageName], {size: 14, color: Colors.textPrimary})
                  : <Text style={styles.musicAppLetter}>{app.name.charAt(0).toUpperCase()}</Text>}
              </View>
              <Text style={styles.musicAppName} numberOfLines={1}>{app.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  musicModeWrap: {
    marginTop: Spacing.base,
  },
  musicToggleBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 0,
  },
  musicToggleText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  musicAppsList: {
    marginTop: Spacing.sm,
    gap: 0,
  },
  musicAppItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface2,
  },
  musicAppIcon: {
    width: 28,
    height: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  musicAppLetter: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: Colors.textPrimary,
  },
  musicAppName: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    flex: 1,
  },
});

export default MusicMode;
