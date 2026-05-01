import React, {useRef, useCallback, useEffect, memo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import {Colors, Spacing} from '../theme/tokens';
import {useTheme} from '../hooks/useTheme';
import {APP_ICON_MAP} from './AppIcons';
import {AppInfo} from '../native/InstalledApps';

interface QuickAppsBarProps {
  quickApps: string[];
  installedApps: AppInfo[];
  onAppPress: (pkg: string) => void;
}

const QuickAppsBar = memo(({quickApps, installedApps, onAppPress}: QuickAppsBarProps) => {
  useTheme(); // re-render on theme change
  if (quickApps.length === 0) return null;

  const getAppName = useCallback((packageName: string): string => {
    const app = installedApps.find(a => a.packageName === packageName);
    if (app) return app.name;
    const parts = packageName.split('.');
    return parts[parts.length - 1];
  }, [installedApps]);

  const renderIcon = useCallback((packageName: string) => {
    const IconComp = APP_ICON_MAP[packageName];
    if (IconComp) return <IconComp size={16} color={Colors.textPrimary} />;
    const name = getAppName(packageName);
    return <Text style={styles.quickAppLetter}>{name.charAt(0).toUpperCase()}</Text>;
  }, [getAppName]);

  // Quick app press feedback scales
  const quickAppScales = useRef<Record<string, Animated.Value>>({}).current;
  useEffect(() => {
    const validPkgs = new Set(quickApps);
    Object.keys(quickAppScales).forEach(k => {
      if (!validPkgs.has(k)) delete quickAppScales[k];
    });
  }, [quickApps]);

  const getScale = useCallback((pkg: string) => {
    if (!quickAppScales[pkg]) quickAppScales[pkg] = new Animated.Value(1);
    return quickAppScales[pkg];
  }, [quickAppScales]);

  return (
    <View style={styles.quickAppsSection}>
      <View style={styles.quickAppsRow}>
        {quickApps.map((pkg) => {
          const scale = getScale(pkg);
          return (
            <TouchableOpacity
              key={pkg}
              activeOpacity={1}
              onPressIn={() => Animated.spring(scale, {toValue: 0.88, useNativeDriver: true, friction: 6}).start()}
              onPressOut={() => Animated.spring(scale, {toValue: 1, useNativeDriver: true, friction: 6}).start()}
              onPress={() => onAppPress(pkg)}>
              <Animated.View style={[styles.quickAppItem, {transform: [{scale}]}]}>
                <View style={[styles.quickAppIcon, {backgroundColor: Colors.surface, borderColor: Colors.border}]}>
                  {renderIcon(pkg)}
                </View>
                <Text style={[styles.quickAppName, {color: Colors.textMuted}]} numberOfLines={1}>
                  {getAppName(pkg).slice(0, 6)}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  quickAppsSection: {
    marginTop: Spacing.xl,
  },
  quickAppsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  quickAppItem: {
    alignItems: 'center',
    width: 50,
  },
  quickAppIcon: {
    width: 40,
    height: 40,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAppLetter: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  quickAppName: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

export default QuickAppsBar;
