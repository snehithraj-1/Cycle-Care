import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cyclecare.app',
  appName: 'CycleCare',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#6F3347',
      sound: 'beep.wav'
    }
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
