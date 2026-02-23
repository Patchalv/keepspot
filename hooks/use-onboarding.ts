import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MapPlaceWithDetails } from '@/types';

const SPOTLIGHT_DISMISSED_KEY = 'onboarding:filter-spotlight-dismissed';

interface OnboardingParams {
  placesData: MapPlaceWithDetails[] | undefined;
  activeFilterCount: number;
}

interface OnboardingState {
  showEmptyState: boolean;
  showFilterSpotlight: boolean;
  dismissSpotlight: () => void;
}

export function useOnboarding({
  placesData,
  activeFilterCount,
}: OnboardingParams): OnboardingState {
  // Default to true to prevent flash — spotlight won't show until we confirm it's not dismissed
  const [spotlightDismissed, setSpotlightDismissed] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SPOTLIGHT_DISMISSED_KEY).then((value) => {
      setSpotlightDismissed(value === 'true');
    });
  }, []);

  // undefined = query hasn't resolved yet (disabled or loading)
  // [] = resolved with no places
  // [...] = resolved with places
  const isDataLoaded = placesData !== undefined;
  const totalPlaceCount = placesData?.length ?? 0;

  const showEmptyState =
    isDataLoaded && totalPlaceCount === 0 && activeFilterCount === 0;

  const showFilterSpotlight =
    isDataLoaded && totalPlaceCount > 0 && !spotlightDismissed;

  const dismissSpotlight = () => {
    setSpotlightDismissed(true);
    AsyncStorage.setItem(SPOTLIGHT_DISMISSED_KEY, 'true');
  };

  return { showEmptyState, showFilterSpotlight, dismissSpotlight };
}
