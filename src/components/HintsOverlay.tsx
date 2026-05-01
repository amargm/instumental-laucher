import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {Colors, Spacing} from '../theme/tokens';

interface HintsOverlayProps {
  visible: boolean;
  accentColor: string;
  onDismiss: () => void;
}

const HintsOverlay: React.FC<HintsOverlayProps> = ({visible, accentColor, onDismiss}) => {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity
        style={styles.hintsOverlay}
        activeOpacity={1}
        onPress={onDismiss}>
        <View style={styles.hintsCard}>
          <Text style={styles.hintsTitle}>INSTRUMENT LAUNCHER</Text>
          <Text style={styles.hintsDivider}>────────────────────</Text>

          <Text style={styles.hintsSection}>GESTURES</Text>
          <Text style={styles.hintsItem}>↓  swipe down → terminal</Text>
          <Text style={styles.hintsItem}>↑  swipe up   → app drawer</Text>

          <Text style={styles.hintsSection}>HOME SCREEN</Text>
          <Text style={styles.hintsItem}>▬  top bar    → day progress (0-100%)</Text>
          <Text style={styles.hintsItem}>▬  thin bar   → week progress (Mon→Sun)</Text>
          <Text style={styles.hintsItem}>◉  pixel pet  → tap to feed</Text>
          <Text style={styles.hintsItem}>   pet health → ↑ less pickups  ↓ frequent</Text>

          <Text style={styles.hintsSection}>DOCK</Text>
          <Text style={styles.hintsItem}>▮  tap label  → launches app</Text>
          <Text style={styles.hintsItem}>▮  ···        → opens app drawer</Text>

          <Text style={styles.hintsSection}>EFFECTS (toggle in ⚙ settings)</Text>
          <Text style={styles.hintsItem}>▓  glitch     → random char flicker on clock</Text>
          <Text style={styles.hintsItem}>◇  parallax   → tilt phone to shift clock</Text>
          <Text style={styles.hintsItem}>☔ rain        → particles when weather is rain</Text>

          <Text style={styles.hintsDivider}>────────────────────</Text>
          <Text style={[styles.hintsDismiss, {color: accentColor}]}>TAP ANYWHERE TO DISMISS</Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  hintsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,10,10,0.97)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  hintsCard: {
    width: '100%',
    paddingVertical: Spacing.xl,
  },
  hintsTitle: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 14,
    color: Colors.textPrimary,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 4,
  },
  hintsDivider: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginVertical: Spacing.md,
    opacity: 0.3,
  },
  hintsSection: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2.5,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  hintsItem: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  hintsDismiss: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    letterSpacing: 2,
    textAlign: 'center',
  },
});

export default HintsOverlay;
