import { Linking, Platform } from 'react-native';

export async function openDirections(
  latitude: number,
  longitude: number,
  name?: string
) {
  const encodedName = name ? encodeURIComponent(name) : '';

  if (Platform.OS === 'ios') {
    const appleMapsUrl = `maps://app?daddr=${latitude},${longitude}&q=${encodedName}`;
    const canOpen = await Linking.canOpenURL(appleMapsUrl);
    if (canOpen) {
      await Linking.openURL(appleMapsUrl);
      return;
    }
  }

  if (Platform.OS === 'android') {
    const geoUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedName})`;
    const canOpen = await Linking.canOpenURL(geoUrl);
    if (canOpen) {
      await Linking.openURL(geoUrl);
      return;
    }
  }

  // Fallback: Google Maps web URL
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  await Linking.openURL(webUrl);
}
