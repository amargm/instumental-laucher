import React, {memo, useEffect, useRef, useState, useCallback} from 'react';
import {View, Text, StyleSheet, Dimensions, Animated} from 'react-native';
import {Colors} from '../theme/tokens';
import type {BgEffect} from '../constants';

const {width: W, height: H} = Dimensions.get('window');

// ─── MATRIX — falling green monospace chars ──────────────

const MATRIX_CHARS = '01アイウエオカキクケコサシスセソ';
const MATRIX_COLS = 14; // number of falling columns
const COL_WIDTH = W / MATRIX_COLS;

const MatrixColumn = memo(({index, active}: {index: number; active: boolean}) => {
  const fall = useRef(new Animated.Value(-100)).current;
  const charRef = useRef(MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]);
  const [char, setChar] = useState(charRef.current);
  const speed = useRef(3000 + Math.random() * 4000).current;
  const x = useRef(index * COL_WIDTH + Math.random() * (COL_WIDTH * 0.5)).current;

  useEffect(() => {
    if (!active) {
      fall.stopAnimation();
      return;
    }
    let cancelled = false;
    const drop = () => {
      if (cancelled) return;
      charRef.current = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
      setChar(charRef.current);
      fall.setValue(-40 - Math.random() * 60);
      Animated.timing(fall, {
        toValue: H + 40,
        duration: speed + Math.random() * 2000,
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished && !cancelled) drop();
      });
    };
    const delay = setTimeout(drop, index * 300 + Math.random() * 2000);
    return () => {
      cancelled = true;
      clearTimeout(delay);
      fall.stopAnimation();
    };
  }, [active]);

  return (
    <Animated.Text
      style={[
        matrixStyles.char,
        {left: x, transform: [{translateY: fall}]},
      ]}>
      {char}
    </Animated.Text>
  );
});

const MatrixBg = memo(({active}: {active: boolean}) => (
  <View style={matrixStyles.container} pointerEvents="none">
    {Array.from({length: MATRIX_COLS}, (_, i) => (
      <MatrixColumn key={i} index={i} active={active} />
    ))}
  </View>
));

const matrixStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  char: {
    position: 'absolute',
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#00FF41',
    opacity: 0.07,
  },
});

// ─── STATIC — CRT TV noise (grain overlay) ──────────────

const STATIC_ROWS = 20;
const STATIC_COLS = 30;

const StaticBg = memo(({active}: {active: boolean}) => {
  const [grid, setGrid] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generateNoise = useCallback(() => {
    const rows: string[] = [];
    for (let r = 0; r < STATIC_ROWS; r++) {
      let row = '';
      for (let c = 0; c < STATIC_COLS; c++) {
        const v = Math.random();
        row += v < 0.3 ? '░' : v < 0.6 ? '▒' : v < 0.85 ? '▓' : ' ';
      }
      rows.push(row);
    }
    return rows;
  }, []);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    setGrid(generateNoise());
    intervalRef.current = setInterval(() => {
      setGrid(generateNoise());
    }, 150);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, generateNoise]);

  if (grid.length === 0) return null;

  return (
    <View style={staticStyles.container} pointerEvents="none">
      {grid.map((row, i) => (
        <Text key={i} style={staticStyles.row}>{row}</Text>
      ))}
    </View>
  );
});

const staticStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-evenly',
    overflow: 'hidden',
  },
  row: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.textPrimary,
    opacity: 0.03,
    letterSpacing: 1,
    lineHeight: 14,
  },
});

// ─── GRID — faint dot grid ──────────────────────────────

const GRID_SPACING = 32;
const GRID_COLS_N = Math.ceil(W / GRID_SPACING) + 1;
const GRID_ROWS_N = Math.ceil(H / GRID_SPACING) + 1;

const GridBg = memo(({active}: {active: boolean}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.timing(fadeAnim, {toValue: 1, duration: 600, useNativeDriver: true}).start();
    }
  }, [active]);

  const dots: {x: number; y: number}[] = [];
  for (let r = 0; r < GRID_ROWS_N; r++) {
    for (let c = 0; c < GRID_COLS_N; c++) {
      dots.push({x: c * GRID_SPACING, y: r * GRID_SPACING});
    }
  }

  return (
    <Animated.View style={[gridStyles.container, {opacity: fadeAnim}]} pointerEvents="none">
      {dots.map((d, i) => (
        <View key={i} style={[gridStyles.dot, {left: d.x, top: d.y}]} />
      ))}
    </Animated.View>
  );
});

const gridStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    width: 1.5,
    height: 1.5,
    borderRadius: 0.75,
    backgroundColor: Colors.textPrimary,
    opacity: 0.06,
  },
});

// ─── Root selector ───────────────────────────────────────

interface Props {
  effect: BgEffect;
  active: boolean;
}

const BackgroundEffect = memo(({effect, active}: Props) => {
  if (effect === 'void') return null;
  if (effect === 'matrix') return <MatrixBg active={active} />;
  if (effect === 'static') return <StaticBg active={active} />;
  if (effect === 'grid') return <GridBg active={active} />;
  return null;
});

export default BackgroundEffect;
