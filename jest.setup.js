/* global jest */
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) =>
      React.createElement(View, { ...props, ref }),
    ),
    Marker: View,
    PROVIDER_GOOGLE: 'google',
  };
});
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
