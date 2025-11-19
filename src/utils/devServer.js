import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const getDevServerURL = () => {
    // Try to get the host IP from Expo config (works for Expo Go on physical devices)
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;

    if (hostUri) {
        const host = hostUri.split(':')[0];
        return `http://${host}:3001`;
    }

    // Fallback for Android Emulator (if hostUri is missing)
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3001';
    }

    // Fallback for iOS Simulator / Web
    return 'http://localhost:3001';
};
