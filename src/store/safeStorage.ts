import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Reliable storage utilities — retry on failure, last-known-good fallback.
 */

const MAX_RETRIES = 2;
const RETRY_DELAY = 100; // ms

/** Read with retry — returns null on persistent failure. */
export async function safeGet(key: string): Promise<string | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)));
      }
    }
  }
  return null;
}

/** Write with retry — fails silently after retries. */
export async function safeSet(key: string, value: string): Promise<boolean> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)));
      }
    }
  }
  console.warn(`[safeSet] Failed after ${MAX_RETRIES + 1} attempts: ${key}`);
  return false;
}

/** Multi-get with retry. */
export async function safeMultiGet(keys: string[]): Promise<Map<string, string | null>> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const entries = await AsyncStorage.multiGet(keys);
      return new Map(entries);
    } catch (e) {
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)));
      }
    }
  }
  return new Map();
}

/** Multi-set with retry. */
export async function safeMultiSet(pairs: [string, string][]): Promise<boolean> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await AsyncStorage.multiSet(pairs);
      return true;
    } catch (e) {
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)));
      }
    }
  }
  console.warn(`[safeMultiSet] Failed after ${MAX_RETRIES + 1} attempts`);
  return false;
}

/** Parse JSON safely — returns fallback on failure. */
export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}
