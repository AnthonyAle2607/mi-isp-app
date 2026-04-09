import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.silverdata.app',
  appName: 'Silverdata',
  webDir: 'dist',
  server: {
    url: 'https://2ca317bc-59db-474e-9e5a-cd991a0f3440.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
