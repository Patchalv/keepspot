import { useCallback, useRef, useState } from 'react';
import { useLocation } from '@/hooks/use-location';
import { searchPlaces, type PlacePrediction } from '@/lib/google-places';
import { PLACES_SEARCH } from '@/lib/constants';

export function usePlaceSearch() {
  const { location } = useLocation();
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    (input: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (!input.trim()) {
        setPredictions([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      timerRef.current = setTimeout(async () => {
        try {
          setError(null);
          const results = await searchPlaces(input, location);
          setPredictions(results);
        } catch {
          setPredictions([]);
          setError('Search failed. Check your connection and try again.');
        } finally {
          setIsSearching(false);
        }
      }, PLACES_SEARCH.debounceMs);
    },
    [location]
  );

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setPredictions([]);
    setIsSearching(false);
    setError(null);
  }, []);

  return { predictions, isSearching, error, search, clear };
}
