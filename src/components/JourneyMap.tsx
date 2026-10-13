import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Location } from '../types/domain';
import {
  bengaluruRegion,
  mapsEnabled,
  openDirections,
  validCoordinate,
} from '../services/maps';
import { Button, Copy } from './ui';
import { RouteMap } from './RouteMap';
import { PlaceAttribution } from './PlaceAttribution';
import { colors } from '../theme';

export function JourneyMap({
  pickup,
  destination,
  compact = false,
}: {
  pickup: Location;
  destination: Location;
  compact?: boolean;
}) {
  const map = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const [showMap, setShowMap] = useState(mapsEnabled);
  useEffect(() => {
    if (!ready) {
      return;
    }
    const points = [pickup.coordinate, destination.coordinate].filter(
      validCoordinate,
    );
    if (points.length === 2) {
      map.current?.fitToCoordinates(points, {
        edgePadding: { top: 55, right: 45, bottom: 55, left: 45 },
        animated: true,
      });
    } else if (points.length === 1) {
      map.current?.animateToRegion({
        ...points[0],
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }, [ready, pickup.coordinate, destination.coordinate]);
  return (
    <View style={styles.container}>
      {showMap ? (
        <>
          <MapView
            ref={map}
            provider={PROVIDER_GOOGLE}
            style={compact ? styles.compact : styles.map}
            initialRegion={bengaluruRegion}
            onMapReady={() => setReady(true)}
            accessibilityLabel={`Map of ${pickup.name} and ${destination.name}`}
          >
            {[
              { location: pickup, title: 'Pickup' },
              { location: destination, title: 'Destination' },
            ]
              .filter(({ location }) => validCoordinate(location.coordinate))
              .map(({ location, title }) => (
                <Marker
                  key={`${title}:${location.id}`}
                  coordinate={location.coordinate!}
                  title={title}
                  description={location.name}
                  pinColor={title === 'Pickup' ? colors.primary : colors.accent}
                />
              ))}
          </MapView>
          <Copy small muted>
            Google map · only selected search results or custom pins have
            markers. Sample landmarks have no verified coordinates.
          </Copy>
          <Button
            secondary
            label="Map not loading? Use illustration"
            onPress={() => setShowMap(false)}
          />
        </>
      ) : (
        <>
          <RouteMap
            start={pickup.name}
            end={destination.name}
            compact={compact}
          />
          <Copy small muted>
            {mapsEnabled
              ? 'Illustration selected.'
              : 'Embedded maps need Android Google Maps setup. Directions can still open externally.'}
          </Copy>
        </>
      )}
      <PlaceAttribution locations={[pickup, destination]} />
      <Button
        secondary
        label="Open directions in Google Maps"
        onPress={() => {
          openDirections(pickup, destination).catch(() =>
            Alert.alert(
              'Directions unavailable',
              'Could not open Google Maps. Check your internet connection or browser.',
            ),
          );
        }}
      />
      <Copy small muted>
        Driving directions open in Google Maps. No live tracking, road route,
        distance or ETA is calculated inside this demo.
      </Copy>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 10 },
  map: { height: 280, borderRadius: 16 },
  compact: { height: 190, borderRadius: 16 },
});
