/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'GymbarLiveActivity',
  displayName: 'Gymbar',
  bundleIdentifier: '.liveactivity',
  deploymentTarget: '16.2',
  colors: {
    $accent: '#C8F031',
    $widgetBackground: '#0B0C0E',
  },
  frameworks: [
    'ActivityKit',
    'AppIntents',
    'SwiftUI',
    'UserNotifications',
    'WidgetKit',
  ],
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
