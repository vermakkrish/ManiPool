import { locations } from '../src/data/fixtures';
import { Location } from '../src/types/domain';
import { appReducer, initialState } from '../src/state/reducer';
import { validateDraft } from '../src/services/journey';
import { directionsUrl, validCoordinate } from '../src/services/maps';
const place: Location = {
  id: 'google:real-id',
  placeId: 'real-id',
  name: 'Selected entrance',
  area: 'Selected address',
  source: 'google',
  coordinate: { latitude: 13.04, longitude: 77.62 },
  kind: 'city',
  corridor: 'custom',
};
const now = '2030-01-01T12:00:00Z';
const select = (
  location: Location,
  field: 'pickupId' | 'destinationId' = 'pickupId',
) => ({ type: 'SELECT_PLACE', location, field } as const);
test('custom Google places can be saved and become request snapshots', () => {
  let state = appReducer(initialState(), select(place));
  state = appReducer(state, { type: 'SAVE', locationId: place.id });
  state = appReducer(state, {
    type: 'DRAFT',
    patch: { date: '2030-01-02', time: '18:45' },
  });
  state = appReducer(state, { type: 'SEARCH', id: 'mapped-ride', now });
  expect(state.error).toBeUndefined();
  expect(state.savedPlaces).toContain(place.id);
  expect(state.rides[0].pickup).toEqual(place);
  state = appReducer(state, select({ ...place, name: 'Updated label' }));
  expect(state.customPlaces).toHaveLength(1);
  expect(state.rides[0].pickup.name).toBe('Selected entrance');
});
test('rejects invalid coordinates and attempts to overwrite built-in landmarks', () => {
  for (const invalid of [
    { ...place, coordinate: { latitude: 91, longitude: 0 } },
    { ...place, coordinate: { latitude: 0, longitude: NaN } },
    { ...place, id: 'campus' },
    { ...place, name: ' ' },
  ]) {
    const state = appReducer(initialState(), select(invalid));
    expect(state.error).toBeDefined();
    expect(state.customPlaces).toHaveLength(0);
    expect(state.draft.pickupId).toBe('campus');
  }
});
test('rejects identical custom coordinates even when IDs differ', () => {
  let state = appReducer(initialState(), select(place));
  state = appReducer(
    state,
    select({ ...place, id: 'pin:same', source: 'pin' }, 'destinationId'),
  );
  state = appReducer(state, { type: 'DRAFT', patch: { date: '2030-01-02' } });
  expect(validateDraft(state.draft, Date.parse(now), state.customPlaces)).toBe(
    'Pickup and destination must be different.',
  );
});
test('reset clears custom places with associated saved IDs', () => {
  let state = appReducer(initialState(), select(place));
  state = appReducer(state, { type: 'SAVE', locationId: place.id });
  state = appReducer(state, { type: 'RESET' });
  expect(state.customPlaces).toHaveLength(0);
  expect(state.savedPlaces).not.toContain(place.id);
});
test('directions preserve Google place IDs and safely encode named landmarks', () => {
  const url = new URL(directionsUrl(place, locations[3]));
  expect(url.searchParams.get('origin')).toBe('13.04,77.62');
  expect(url.searchParams.get('origin_place_id')).toBe('real-id');
  expect(url.searchParams.get('destination')).toContain('Kempegowda Airport');
  expect(url.searchParams.get('travelmode')).toBe('driving');
  expect(
    new URL(
      directionsUrl(
        { ...place, name: 'A & B?', coordinate: undefined, placeId: undefined },
        locations[3],
      ),
    ).searchParams.get('origin'),
  ).toContain('A & B?');
});
test('coordinates include valid zero and reject non-finite or out-of-range points', () => {
  expect(validCoordinate({ latitude: 0, longitude: 0 })).toBe(true);
  expect(validCoordinate({ latitude: Infinity, longitude: 0 })).toBe(false);
  expect(validCoordinate({ latitude: 0, longitude: 181 })).toBe(false);
  expect(validCoordinate(undefined)).toBe(false);
});
