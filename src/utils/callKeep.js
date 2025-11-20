import { Platform, NativeModules } from 'react-native';
import uuid from 'react-native-uuid';
import { setAudioModeAsync, AndroidAudioEncoder, AndroidOutputFormat, IOSAudioQuality, IOSOutputFormat } from 'expo-audio';

let RNCallKeep;

// Safe import: Only require the library if the native module exists
// This prevents the "Invariant Violation" crash in Expo Go
if (NativeModules.RNCallKeep) {
    try {
        RNCallKeep = require('react-native-callkeep').default;
    } catch (e) {
        console.warn('Failed to load react-native-callkeep:', e);
        RNCallKeep = null;
    }
}

// Mock RNCallKeep if not available (Expo Go)
if (!RNCallKeep) {
    console.warn('⚠️ Native Calling is disabled (Running in Expo Go). Build the app to use this feature.');
    RNCallKeep = {
        setup: () => Promise.resolve(),
        setAvailable: () => { },
        registerPhoneAccount: () => { },
        registerAndroidEvents: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        displayIncomingCall: () => { },
        endCall: () => { },
        backToForeground: () => { },
    };
}

const options = {
    ios: {
        appName: 'Ira',
        includesCallsInRecents: false, // Sometimes helps with immediate ending
        supportsVideo: false,
        ringtoneSound: 'ringtone.mp3', // iOS will use default if not found
    },
    android: {
        alertTitle: 'Permissions required',
        alertDescription: 'This application needs to access your phone accounts',
        cancelButton: 'Cancel',
        okButton: 'ok',
        imageName: 'phone_account_icon',
        additionalPermissions: [],
        // Required to get audio in background when using Android 11
        foregroundService: {
            channelId: 'com.talktoira.app',
            channelName: 'Foreground service for my app',
            notificationTitle: 'My app is running on background',
            notificationIcon: 'Path to the resource icon of the notification',
        },
    },
};

class CallKeepService {
    constructor() {
        this.currentCallId = null;
        this.navigationHandler = null;
    }

    setNavigationHandler = (handler) => {
        this.navigationHandler = handler;
    };

    setup = async () => {
        try {
            if (!RNCallKeep) {
                console.warn('RNCallKeep is not available. Are you running in Expo Go? Native calling features will not work.');
                return;
            }

            // Configure audio session for VoIP
            if (Platform.OS === 'ios') {
                await setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });
            }

            await RNCallKeep.setup(options);
            RNCallKeep.setAvailable(true);

            if (Platform.OS === 'android') {
                RNCallKeep.registerPhoneAccount();
                RNCallKeep.registerAndroidEvents();
            }

            // Listeners
            RNCallKeep.addEventListener('answerCall', this.onAnswerCall);
            RNCallKeep.addEventListener('endCall', this.onEndCall);
            RNCallKeep.addEventListener('didLoadWithEvents', this.onDidLoadWithEvents);
        } catch (err) {
            console.error('CallKeep setup error:', err);
        }
    };

    displayIncomingCall = async (handle = 'Ira') => {
        const callUUID = uuid.v4();
        this.currentCallId = callUUID;

        RNCallKeep.displayIncomingCall(
            callUUID,
            handle,
            handle,
            'generic',
            false // hasVideo - set to false to match supportsVideo config
        );

        return callUUID;
    };

    endCall = () => {
        if (this.currentCallId) {
            RNCallKeep.endCall(this.currentCallId);
            this.currentCallId = null;
        }
    };

    onAnswerCall = ({ callUUID }) => {
        console.log('Call answered:', callUUID);
        // Navigate to call screen if handler is set
        if (this.navigationHandler) {
            this.navigationHandler('incoming', 'connected');
        }
    };

    onEndCall = ({ callUUID }) => {
        console.log('Call ended:', callUUID);
        this.currentCallId = null;
    };

    onDidLoadWithEvents = (events) => {
        console.log('CallKeep loaded with events:', events);
    };
}

export default new CallKeepService();
