const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('cjs', 'mp4');

module.exports = withNativeWind(config, { input: './global.css' });
