import React, {useEffect, useRef, memo} from 'react';
import {View, Text, StyleSheet, Animated, Dimensions} from 'react-native';
import {Colors} from '../theme/tokens';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const RAIN_CHARS = ['·', ':', '.', '|', '¦'];
const NUM_DROPS = 20;

const RainDrop = memo(({delay, accentColor, active}: {delay: number; accentColor: string; active: boolean}) => {
  const fallAnim = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const x = useRef(Math.random() * SCREEN_WIDTH).current;

  useEffect(() => {
    if (!active) {
      fallAnim.stopAnimation();
      return;
    }
    let cancelled = false;
    const startDrop = () => {
      if (cancelled) return;
      fallAnim.setValue(-20);
      opacity.setValue(0.3 + Math.random() * 0.4);
      Animated.timing(fallAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 2000 + Math.random() * 2000,
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished && !cancelled) startDrop();
      });
    };
    const timeout = setTimeout(startDrop, delay);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      fallAnim.stopAnimation();
    };
  }, [active]);

  const char = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];

  return (
    <Animated.Text
      style={[
        styles.rainDrop,
        {left: x, opacity, transform: [{translateY: fallAnim}], color: accentColor},
      ]}>
      {char}
    </Animated.Text>
  );
});

interface RainEffectProps {
  accentColor: string;
  active: boolean;
}

const RainEffect = memo(({accentColor, active}: RainEffectProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {toValue: 1, duration: 800, useNativeDriver: true}).start();
  }, []);

  return (
    <Animated.View style={[styles.rainContainer, {opacity: fadeAnim}]} pointerEvents="none">
      {Array.from({length: NUM_DROPS}, (_, i) => (
        <RainDrop key={i} delay={i * 200} accentColor={accentColor} active={active} />
      ))}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  rainContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  rainDrop: {
    position: 'absolute',
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
  },
});

export default RainEffect;
