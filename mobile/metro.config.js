const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const zustandCommonJs = {
  zustand: 'index.js',
  'zustand/middleware': 'middleware.js',
  'zustand/vanilla': 'vanilla.js',
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const file = zustandCommonJs[moduleName];
  if (file) {
    return {
      filePath: path.join(__dirname, 'node_modules', 'zustand', file),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
