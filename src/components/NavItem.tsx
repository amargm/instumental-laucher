import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import {Colors, Spacing} from '../theme/tokens';

interface NavItemProps {
  label: string;
  active: boolean;
  onPress?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({label, active, onPress}) => (
  <TouchableOpacity
    style={styles.navItem}
    activeOpacity={0.7}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}>
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  navItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  navLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  navLabelActive: {
    color: Colors.textPrimary,
  },
});
