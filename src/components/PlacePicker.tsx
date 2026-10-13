import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, TextInput, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Location } from '../types/domain';
import {
  bengaluruRegion,
  endPlaceSession,
  mapsEnabled,
  PlacePrediction,
  placesEnabled,
  searchPlaces,
  selectGooglePlace,
} from '../services/maps';
import { Button, Copy, ErrorText, Heading, Input, Row } from './ui';
import { colors } from '../theme';

export function PlacePicker({
  onSelect,
}: {
  onSelect: (location: Location) => void;
}) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [pin, setPin] = useState<Location['coordinate']>();
  const [pinName, setPinName] = useState('');
  const revision = useRef(0);
  const mounted = useRef(true);
  const selecting = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      endPlaceSession();
    };
  }, []);
  useEffect(() => {
    const version = ++revision.current;
    setPredictions([]);
    setError(undefined);
    setSearching(false);
    if (!placesEnabled || query.trim().length < 2 || selecting.current) {
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      setSearching(true);
      searchPlaces(query)
        .then(items => {
          if (active && version === revision.current) {
            setPredictions(items);
          }
        })
        .catch(() => {
          if (active && version === revision.current) {
            setError(
              'Place search failed. Check internet and Google key setup, or use a sample landmark.',
            );
          }
        })
        .finally(() => {
          if (active) {
            setSearching(false);
          }
        });
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);
  const choose = async (placeId: string) => {
    if (selecting.current) {
      return;
    }
    selecting.current = true;
    ++revision.current;
    setPredictions([]);
    setBusy(true);
    setError(undefined);
    try {
      const place = await selectGooglePlace(placeId);
      if (mounted.current) {
        onSelect(place);
      }
    } catch {
      if (mounted.current) {
        setError('Could not select this place. Please try again.');
      }
    } finally {
      selecting.current = false;
      if (mounted.current) {
        setBusy(false);
      }
    }
  };
  return (
    <View style={styles.container}>
      <Heading>Search Google places</Heading>
      {placesEnabled ? (
        <>
          <TextInput
            accessibilityLabel="Search Google places"
            placeholder="Search a place or address in India"
            value={query}
            onChangeText={setQuery}
            editable={!busy}
            style={styles.input}
            placeholderTextColor={colors.secondary}
          />
          {(searching || busy) && (
            <Copy muted>
              {busy ? 'Loading selected place…' : 'Searching Google…'}
            </Copy>
          )}
          {predictions.map(prediction => (
            <Button
              key={prediction.placeId}
              secondary
              disabled={busy}
              label={`${prediction.name} · ${prediction.address}`}
              onPress={() => choose(prediction.placeId)}
            />
          ))}
          {!searching &&
            !busy &&
            query.trim().length >= 2 &&
            !predictions.length &&
            !error && (
              <Copy small muted>
                No suggestions yet. Try a fuller place name or a sample landmark
                below.
              </Copy>
            )}
          <Image
            source={require('../assets/google-maps-attribution.png')}
            style={styles.attribution}
            resizeMode="contain"
            accessibilityLabel="Google Maps"
          />
          <Copy small muted>
            Your search is sent to Google. Suggestions are limited to India;
            selection is not a verified safe pickup.
          </Copy>
        </>
      ) : (
        <Copy muted>
          Google search needs a configured Places key and an Android rebuild.
          Sample landmarks remain available below.
        </Copy>
      )}
      <ErrorText message={error} />
      <Heading>Choose a point on the map</Heading>
      {mapsEnabled ? (
        <>
          <Copy small muted>
            Press and hold on the map to place a pin, then give it a
            meeting-point name and confirm.
          </Copy>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={bengaluruRegion}
            accessibilityLabel="Choose a custom pickup or destination point"
            onLongPress={event => setPin(event.nativeEvent.coordinate)}
          >
            {pin && (
              <Marker
                coordinate={pin}
                draggable
                onDragEnd={event => setPin(event.nativeEvent.coordinate)}
                title="Selected point"
              />
            )}
          </MapView>
          {pin && (
            <>
              <Copy small>
                Selected: {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
              </Copy>
              <Input
                label="Meeting-point name"
                value={pinName}
                onChangeText={setPinName}
                placeholder="For example, entrance beside the bus stop"
              />
              <Row>
                <Button
                  label="Use selected map point"
                  disabled={!pinName.trim() || busy}
                  onPress={() => {
                    endPlaceSession();
                    onSelect({
                      id: `pin:${pin.latitude.toFixed(
                        6,
                      )},${pin.longitude.toFixed(6)}`,
                      name: pinName.trim(),
                      area: `${pin.latitude.toFixed(
                        5,
                      )}, ${pin.longitude.toFixed(5)} · user-selected point`,
                      kind: 'city',
                      corridor: 'custom',
                      source: 'pin',
                      coordinate: pin,
                    });
                  }}
                />
              </Row>
            </>
          )}
        </>
      ) : (
        <Copy small muted>
          Custom pins need the Android Google Maps key. No GPS permission is
          requested.
        </Copy>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 12 },
  map: { height: 280, borderRadius: 16 },
  input: {
    minHeight: 54,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
  },
  attribution: {
    width: 98,
    height: 18,
    marginLeft: 10,
    marginTop: 10,
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
});
