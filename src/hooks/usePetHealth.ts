import {useState, useEffect, useRef} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS, PET_FEED_GAP, PET_SPAM_THRESHOLD} from '../constants';

export function usePetHealth(navigation: any): number {
  const [petHealth, setPetHealth] = useState(50);
  const petHealthRef = useRef(50);
  petHealthRef.current = petHealth;

  // Load initial pet health
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.petHealth).then(h => {
      if (h !== null) {
        const val = Math.min(100, Math.max(0, parseInt(h, 10)));
        setPetHealth(val);
      }
    }).catch(() => {});
  }, []);

  // Feed pet on focus (reward low screen time)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        const lastFed = await AsyncStorage.getItem(STORAGE_KEYS.petLastFed);
        const now = Date.now();
        const gap = lastFed ? now - parseInt(lastFed, 10) : 0;

        if (!lastFed || gap > PET_FEED_GAP) {
          const newHealth = Math.min(100, petHealthRef.current + 5);
          setPetHealth(newHealth);
          await AsyncStorage.setItem(STORAGE_KEYS.petHealth, String(newHealth));
          await AsyncStorage.setItem(STORAGE_KEYS.petLastFed, String(now));
        } else if (gap < PET_SPAM_THRESHOLD) {
          const newHealth = Math.max(0, petHealthRef.current - 1);
          setPetHealth(newHealth);
          await AsyncStorage.setItem(STORAGE_KEYS.petHealth, String(newHealth));
        }
      } catch (_) {}
    });
    return unsubscribe;
  }, [navigation]);

  return petHealth;
}
