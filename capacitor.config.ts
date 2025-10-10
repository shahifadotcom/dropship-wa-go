import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f56ea3cdbd454fa5a24347efbd454051',
  appName: 'shahifa',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#ffffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
      splashFullScreen: true,
      splashImmersive: true,
    },
    App: {
      handlePermissions: true
    },
    BackgroundMode: {
      enabled: true,
      title: 'SMS Scanner Running',
      text: 'Monitoring SMS for transaction IDs...',
      silent: false
    }
  },
  server: {
    url: 'https://f56ea3cd-bd45-4fa5-a243-47efbd454051.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    minSdkVersion: 23,
    compileSdkVersion: 34,
    targetSdkVersion: 34,
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      keystorePassword: undefined,
      keystoreAliasPassword: undefined,
      signingType: 'apksigner'
    }
  }
};

export default config;