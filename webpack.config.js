const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  // Necesario para que expo-router encuentre el directorio /app
  process.env.EXPO_ROUTER_APP_ROOT = path.resolve(__dirname, 'app');

  const config = await createExpoWebpackConfigAsync(env, argv);

  // Fix crypto polyfill para módulos de Node que no existen en browser
  config.resolve = config.resolve || {};
  config.resolve.fallback = {
    ...(config.resolve.fallback || {}),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    vm: require.resolve('vm-browserify'),
  };

  return config;
};
