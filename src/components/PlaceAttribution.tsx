import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Location } from '../types/domain';
import { showPlaceAttributions } from '../services/maps';
import { Button } from './ui';
export function PlaceAttribution({ locations }: { locations: Location[] }) {
  if (!locations.some(location => location.source === 'google')) {
    return null;
  }
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/google-maps-attribution.png')}
        accessibilityLabel="Google Maps"
        resizeMode="contain"
        style={styles.logo}
      />
      {locations.some(location => location.attributions?.length) && (
        <Button
          secondary
          label="View place data providers"
          onPress={() => showPlaceAttributions(locations)}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 8 },
  logo: {
    width: 98,
    height: 18,
    marginLeft: 10,
    marginTop: 10,
    marginBottom: 5,
  },
});
