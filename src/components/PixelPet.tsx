import React, {useEffect, useRef, memo} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {Colors, Spacing} from '../theme/tokens';

const PET_FACES = {
  happy: '(• ᴗ •)',
  neutral: '(• _ •)',
  sad: '(• ︵ •)',
};

const PET_BODIES = {
  happy: ' /|  |\\',
  neutral: ' /|  |\\',
  sad: ' /|  |\\',
};

interface PixelPetProps {
  health: number;
  accentColor: string;
  active: boolean;
}

const PixelPet = memo(({health, accentColor, active}: PixelPetProps) => {
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);
  const mood = health > 70 ? 'happy' : health > 30 ? 'neutral' : 'sad';

  useEffect(() => {
    if (active) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, {toValue: 1.03, duration: 1000, useNativeDriver: true}),
          Animated.timing(breatheAnim, {toValue: 1, duration: 1000, useNativeDriver: true}),
        ])
      );
      loopRef.current = loop;
      loop.start();
      return () => loop.stop();
    } else {
      loopRef.current?.stop();
      breatheAnim.setValue(1);
    }
  }, [active]);

  return (
    <View style={styles.petContainer}>
      <Animated.View style={{alignItems: 'center', transform: [{scale: breatheAnim}]}}>
        <Text style={[styles.petFace, {color: accentColor}]}>{PET_FACES[mood]}</Text>
        <Text style={[styles.petBody, {color: accentColor}]}>{PET_BODIES[mood]}</Text>
      </Animated.View>
      <View style={styles.petHealthBar}>
        <View style={[styles.petHealthFill, {width: `${health}%`, backgroundColor: accentColor}]} />
      </View>
      <Text style={styles.petLabel}>PET · {health}%  ·  {mood === 'happy' ? 'feeling good' : mood === 'neutral' ? 'doing okay' : 'needs a break'}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  petContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  petFace: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 16,
    letterSpacing: 1,
    lineHeight: 20,
  },
  petBody: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 14,
    opacity: 0.5,
  },
  petHealthBar: {
    width: 60,
    height: 3,
    backgroundColor: Colors.surface2,
    marginTop: 4,
    borderRadius: 0,
    overflow: 'hidden',
  },
  petHealthFill: {
    height: 3,
    borderRadius: 0,
  },
  petLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 1,
  },
});

export default PixelPet;
