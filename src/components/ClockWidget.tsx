import React, {useState, useEffect, useRef, memo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import ReanimatedAnimated, {
  useAnimatedSensor,
  SensorType,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {Colors, Spacing} from '../theme/tokens';
import {useTheme} from '../hooks/useTheme';

// ─── Glitch characters — terminal/instrument-style digital artifacts ───
const GLITCH_CHARS = '0123456789▐░▒▓─│┤├';

// Parallax wrapper: only mounts the sensor when parallaxEnabled=true
const ParallaxWrapper = memo(({enabled, children}: {enabled: boolean; children: React.ReactNode}) => {
  if (!enabled) return <>{children}</>;
  return <ParallaxInner>{children}</ParallaxInner>;
});

const ParallaxInner = memo(({children}: {children: React.ReactNode}) => {
  const sensor = useAnimatedSensor(SensorType.ROTATION, {interval: 60});
  const parallaxStyle = useAnimatedStyle(() => {
    const {pitch, roll} = sensor.sensor.value;
    return {
      transform: [
        {translateX: withSpring(roll * 8, {damping: 20, stiffness: 90})},
        {translateY: withSpring(pitch * 5, {damping: 20, stiffness: 90})},
      ],
    };
  });
  return <ReanimatedAnimated.View style={parallaxStyle}>{children}</ReanimatedAnimated.View>;
});

interface ClockWidgetProps {
  clockFormat: '12' | '24';
  accentColor: string;
  glitchEnabled: boolean;
  parallaxEnabled: boolean;
}

const ClockWidget = memo(({clockFormat, accentColor, glitchEnabled, parallaxEnabled}: ClockWidgetProps) => {
  useTheme(); // re-render on theme change
  const [time, setTime] = useState('');
  const [displayTime, setDisplayTime] = useState('');
  const timeRef = useRef('');
  const [date, setDate] = useState('');
  const [dayProgress, setDayProgress] = useState(0);
  const [weekProgress, setWeekProgress] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let h: number | string = now.getHours();
      const m = now.getMinutes().toString().padStart(2, '0');

      const totalMinutes = now.getHours() * 60 + now.getMinutes();
      setDayProgress(totalMinutes / 1440);

      const day = now.getDay();
      const mondayBased = day === 0 ? 6 : day - 1;
      const dayFraction = totalMinutes / 1440;
      setWeekProgress((mondayBased + dayFraction) / 7);

      let timeStr: string;
      if (clockFormat === '12') {
        const period = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        timeStr = `${h}:${m} ${period}`;
      } else {
        timeStr = `${h.toString().padStart(2, '0')}:${m}`;
      }
      setTime(timeStr);
      timeRef.current = timeStr;
      setDisplayTime(timeStr);

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setDate(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [clockFormat]);

  // Typing cursor blink
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 500);
    return () => clearInterval(interval);
  }, []);

  // Glitch text effect
  useEffect(() => {
    if (!glitchEnabled) return;
    let active = true;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const addTimeout = (fn: () => void, ms: number) => {
      timeouts.push(setTimeout(fn, ms));
    };
    const randomChar = () => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
    const scramble = (str: string) =>
      str.split('').map(c => (c === ' ' || c === ':' ? c : randomChar())).join('');

    const scheduleGlitch = () => {
      if (!active) return;
      const delay = 4000 + Math.random() * 6000;
      addTimeout(() => {
        if (!active) return;
        const t = timeRef.current;
        if (!t) { scheduleGlitch(); return; }
        const mode = Math.random();

        if (mode < 0.45) {
          const chars = t.split('');
          const glitched = scramble(t).split('');
          setDisplayTime(glitched.join(''));
          chars.forEach((orig, i) => {
            addTimeout(() => {
              if (!active) return;
              glitched[i] = orig;
              setDisplayTime(glitched.join(''));
              if (i === chars.length - 1) scheduleGlitch();
            }, 60 + i * 30);
          });
        } else if (mode < 0.75) {
          const glitched = scramble(t);
          [0, 40, 80, 120, 160, 200].forEach((ms, i) => {
            addTimeout(() => {
              if (!active) return;
              setDisplayTime(i % 2 === 0 ? glitched : timeRef.current);
              if (i === 5) {
                setDisplayTime(timeRef.current);
                scheduleGlitch();
              }
            }, ms);
          });
        } else {
          const idx = Math.floor(Math.random() * t.length);
          if (t[idx] === ' ' || t[idx] === ':') { scheduleGlitch(); return; }
          [0, 50, 100].forEach((ms, i) => {
            addTimeout(() => {
              if (!active) return;
              const cur = timeRef.current;
              const arr = cur.split('');
              arr[idx] = i < 2 ? randomChar() : cur[idx];
              setDisplayTime(arr.join(''));
              if (i === 2) scheduleGlitch();
            }, ms);
          });
        }
      }, delay);
    };

    scheduleGlitch();

    return () => {
      active = false;
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [glitchEnabled]);

  return (
    <View style={styles.widget}>
      <ParallaxWrapper enabled={parallaxEnabled}>
        <Text style={[styles.time, {color: Colors.textPrimary}]}>{displayTime}<Text style={[styles.cursor, {color: Colors.textMuted, opacity: cursorVisible ? 1 : 0}]}>_</Text></Text>
      </ParallaxWrapper>
      <View style={styles.progressRow}>
        <Text style={[styles.progressLabel, {color: Colors.textMuted}]}>DAY</Text>
        <View style={[styles.progressWrap, {flex: 1, backgroundColor: Colors.surface2}]}>
          <View style={[styles.progressBar, {width: `${dayProgress * 100}%`, backgroundColor: accentColor}]} />
        </View>
        <Text style={[styles.progressPct, {color: Colors.textMuted}]}>{Math.round(dayProgress * 100)}%</Text>
      </View>
      <View style={[styles.progressRow, {marginTop: 3}]}>
        <Text style={[styles.progressLabel, {color: Colors.textMuted}]}>WK</Text>
        <View style={[styles.weekProgressWrap, {flex: 1, backgroundColor: Colors.surface2}]}>
          <View style={[styles.weekProgressBar, {width: `${weekProgress * 100}%`, backgroundColor: accentColor, opacity: 0.4}]} />
        </View>
      </View>
      <Text style={[styles.date, {color: Colors.textSecondary}]}>{date}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  widget: {
    marginTop: Spacing.xxxl,
  },
  time: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 48,
    fontWeight: '100',
    color: Colors.textPrimary,
    letterSpacing: -3,
    lineHeight: 52,
  },
  cursor: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 48,
    fontWeight: '100',
    color: Colors.textMuted,
  },
  progressWrap: {
    height: 3,
    backgroundColor: Colors.surface2,
    marginTop: Spacing.md,
    borderRadius: 0,
    overflow: 'hidden',
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.textSecondary,
    borderRadius: 0,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: 6,
  },
  progressLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1,
    width: 22,
  },
  progressPct: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    width: 28,
    textAlign: 'right',
  },
  weekProgressWrap: {
    height: 2,
    backgroundColor: Colors.surface2,
    marginTop: 0,
    borderRadius: 0,
    overflow: 'hidden',
  },
  weekProgressBar: {
    height: 2,
    borderRadius: 0,
  },
  date: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: Spacing.sm,
  },
});

export default ClockWidget;
