// https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// React Native 0.83+ enables package exports resolution by default.
// Some packages (react-native-svg ≥15.x) export TypeScript type files
// via the "exports" field, which Metro incorrectly tries to bundle at runtime.
// Disabling this restores the classic resolution behaviour.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
