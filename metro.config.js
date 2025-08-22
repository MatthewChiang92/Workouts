const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration for Node.js polyfills
config.resolver.alias = {
  ...config.resolver.alias,
  // Polyfill Node.js modules for React Native
  crypto: 'expo-crypto',
  stream: 'readable-stream',
  url: 'react-native-url-polyfill',
  https: false, // Disable https module
  http: false,  // Disable http module
  net: false,   // Disable net module
  tls: false,   // Disable tls module
  fs: false,    // Disable fs module
};

// Configure resolver to handle missing Node.js modules
config.resolver.fallback = {
  ...config.resolver.fallback,
  crypto: require.resolve('expo-crypto'),
  stream: require.resolve('readable-stream'),
  https: false,
  http: false,
  net: false,
  tls: false,
  fs: false,
};

module.exports = config; 