import { Linking, NativeModules, Platform } from 'react-native';
import { Location } from '../types/domain';

export interface PlacePrediction {
  placeId: string;
  name: string;
  address: string;
}
interface PlaceDetails extends PlacePrediction {
  latitude: number;
  longitude: number;
  attributions?: string[];
}
interface PlacesBridge {
  mapsEnabled: boolean;
  placesEnabled: boolean;
  search(query: string): Promise<PlacePrediction[]>;
  details(placeId: string): Promise<PlaceDetails>;
  endSession(): void;
  showAttributions(html: string): void;
}
const bridge = NativeModules.ManiPoolPlaces as PlacesBridge | undefined;
export const mapsEnabled =
  Platform.OS === 'android' && bridge?.mapsEnabled === true;
export const placesEnabled =
  Platform.OS === 'android' && bridge?.placesEnabled === true;
export const bengaluruRegion = {
  latitude: 13.02,
  longitude: 77.6,
  latitudeDelta: 0.32,
  longitudeDelta: 0.32,
};
export function validCoordinate(
  point: Location['coordinate'],
): point is NonNullable<Location['coordinate']> {
  return (
    !!point &&
    Number.isFinite(point.latitude) &&
    Math.abs(point.latitude) <= 90 &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.longitude) <= 180
  );
}
export const searchPlaces = (query: string) =>
  bridge?.search(query) ??
  Promise.reject(new Error('Google Places is not configured.'));
export const endPlaceSession = () => bridge?.endSession();
export const showPlaceAttributions = (locations: Location[]) =>
  bridge?.showAttributions(
    [
      ...new Set(locations.flatMap(location => location.attributions ?? [])),
    ].join('<br/>'),
  );
export async function selectGooglePlace(placeId: string): Promise<Location> {
  if (!bridge) {
    throw new Error('Google Places is not configured.');
  }
  const place = await bridge.details(placeId);
  const coordinate = { latitude: place.latitude, longitude: place.longitude };
  if (!validCoordinate(coordinate)) {
    throw new Error('This place has invalid coordinates.');
  }
  return {
    id: `google:${place.placeId}`,
    placeId: place.placeId,
    name: place.name,
    area: place.address,
    kind: 'city',
    corridor: 'custom',
    source: 'google',
    coordinate,
    attributions: place.attributions,
  };
}
export function directionsUrl(pickup: Location, destination: Location): string {
  const label = (location: Location) =>
    validCoordinate(location.coordinate)
      ? `${location.coordinate.latitude},${location.coordinate.longitude}`
      : `${location.name}, ${location.area}, India`;
  const values: Record<string, string> = {
    api: '1',
    origin: label(pickup),
    destination: label(destination),
    travelmode: 'driving',
  };
  if (pickup.placeId) {
    values.origin_place_id = pickup.placeId;
  }
  if (destination.placeId) {
    values.destination_place_id = destination.placeId;
  }
  return `https://www.google.com/maps/dir/?${Object.entries(values)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')}`;
}
export const openDirections = (pickup: Location, destination: Location) =>
  Linking.openURL(directionsUrl(pickup, destination));
