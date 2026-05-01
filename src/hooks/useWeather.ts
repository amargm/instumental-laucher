import {useState, useEffect, useRef} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS, WEATHER_REFRESH_INTERVAL} from '../constants';

interface WeatherData {
  temp: string;
  condition: string;
}

interface UseWeatherResult {
  weather: WeatherData | null;
  isRaining: boolean;
}

function checkIsRaining(condition: string): boolean {
  const lower = condition.toLowerCase();
  return (
    lower.includes('rain') ||
    lower.includes('drizzle') ||
    lower.includes('shower') ||
    lower.includes('thunderstorm')
  );
}

export function useWeather(): UseWeatherResult {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isRaining, setIsRaining] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let controller = new AbortController();

    // Load cached weather immediately
    AsyncStorage.getItem(STORAGE_KEYS.cachedWeather).then(cached => {
      if (cached && mountedRef.current) {
        try {
          const parsed = JSON.parse(cached);
          setWeather(parsed);
          if (parsed.condition) {
            setIsRaining(checkIsRaining(parsed.condition));
          }
        } catch (_) {}
      }
    });

    const fetchWeather = async () => {
      controller.abort();
      controller = new AbortController();
      try {
        const res = await fetch('https://wttr.in/?format=%t|%C', {
          signal: controller.signal,
          headers: {'User-Agent': 'InstrumentLauncher/1.0'},
        });
        const text = await res.text();
        if (!mountedRef.current) return;
        const parts = text.split('|');
        if (parts.length >= 2) {
          const weatherData: WeatherData = {temp: parts[0].trim(), condition: parts[1].trim()};
          setWeather(weatherData);
          setIsRaining(checkIsRaining(weatherData.condition));
          AsyncStorage.setItem(STORAGE_KEYS.cachedWeather, JSON.stringify(weatherData)).catch(() => {});
        }
      } catch (_) {}
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, WEATHER_REFRESH_INTERVAL);

    return () => {
      mountedRef.current = false;
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  return {weather, isRaining};
}
