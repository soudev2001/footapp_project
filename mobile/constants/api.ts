import { Platform } from 'react-native';

// API base URL configuration
// Android emulator uses 10.0.2.2 to reach host machine's localhost
// iOS simulator uses localhost directly
const ANDROID_EMULATOR_API = 'http://10.0.2.2:5000/api';
const IOS_SIMULATOR_API = 'http://localhost:5000/api';
const LAN_API_URL = 'http://192.168.1.2:5000/api';
const PREPROD_API_URL = 'https://preprod.takurte.fr/api';
const PROD_API_URL = 'https://takurte.fr/api';

function getApiUrl(): string {
  if (__DEV__) {
    return Platform.OS === 'android' ? ANDROID_EMULATOR_API : IOS_SIMULATOR_API;
  }
  return PROD_API_URL;
}

export const API_URL = getApiUrl();
export const API_TIMEOUT = 15000;
