import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Figure out the local dev server URL based on how we're running the app
export const getDevServerURL = () => {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;

    if (hostUri) {
        const host = hostUri.split(':')[0];
        return `http://${host}:3001`;
    }

    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3001';
    }

    return 'http://localhost:3001';
};
