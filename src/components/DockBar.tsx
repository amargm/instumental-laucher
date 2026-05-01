import React, {useState, useRef, memo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import {Colors, Spacing} from '../theme/tokens';
import {useTheme} from '../hooks/useTheme';

interface DockItemProps {
  label: string;
  accentColor: string;
  onPress?: () => void;
}

const DockItem = memo(({label, accentColor, onPress}: DockItemProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scaleAnim, {toValue: 0.9, useNativeDriver: true, friction: 8}).start();
  };
  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scaleAnim, {toValue: 1, useNativeDriver: true, friction: 8}).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`Open ${label}`}
      style={styles.termDockItem}>
      <Animated.View style={[styles.termDockInner, {transform: [{scale: scaleAnim}]}]}>
        <Text style={[styles.termDockLabel, {color: pressed ? accentColor : Colors.textSecondary}]}>{label}</Text>
        <View style={[styles.termDockLine, {backgroundColor: pressed ? accentColor : Colors.border}]} />
      </Animated.View>
    </TouchableOpacity>
  );
});

interface DockBarProps {
  dockApps: string[];
  accentColor: string;
  getAppName: (pkg: string) => string;
  onAppPress: (pkg: string) => void;
  onDrawerPress: () => void;
}

const DockBar = memo(({dockApps, accentColor, getAppName, onAppPress, onDrawerPress}: DockBarProps) => {
  useTheme(); // re-render on theme change
  return (
    <View style={[styles.termDock, {borderTopColor: Colors.border, backgroundColor: Colors.bg}]}>
      {dockApps.map(pkg => {
        const name = getAppName(pkg);
        const label = name.slice(0, 4).toUpperCase();
        return (
          <DockItem
            key={pkg}
            label={label}
            accentColor={accentColor}
            onPress={() => onAppPress(pkg)}
          />
        );
      })}
      <DockItem
        label="···"
        accentColor={accentColor}
        onPress={onDrawerPress}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  termDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  termDockItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  termDockInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  termDockLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  termDockLine: {
    width: 12,
    height: 1,
    marginTop: 4,
    borderRadius: 0,
  },
});

export {DockItem};
export default DockBar;
