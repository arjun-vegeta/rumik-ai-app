import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Animated,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getDevServerURL } from '../utils/devServer';
import CallKeepService from '../utils/callKeep';

const { width } = Dimensions.get('window');

export default function CallScreen({ navigation, route }) {
    const mode = route.params?.mode || 'incoming';
    const initialStatus = route.params?.initialStatus;
    const resumeCall = route.params?.resumeCall || false;
    const initialDuration = route.params?.callDuration || 0;

    const [callStatus, setCallStatus] = useState(
        initialStatus || (mode === 'outgoing' ? 'calling' : 'incoming')
    );
    const [callDuration, setCallDuration] = useState(initialDuration);
    const [dotCount, setDotCount] = useState(0);
    
    // Visual toggles for the UI buttons (visual only to match design)
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);

    // Never show pink border
    const shouldShowPinkBorder = false;

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const controlsAnim = useRef(new Animated.Value(100)).current;

    // Auto-connect for outgoing calls
    useEffect(() => {
        let timeout;
        if (callStatus === 'calling') {
            timeout = setTimeout(() => {
                setCallStatus('connected');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }, 3000);
        }
        return () => clearTimeout(timeout);
    }, [callStatus]);

    // Pulse animation disabled
    useEffect(() => {
        pulseAnim.setValue(1);
    }, [pulseAnim]);

    // Animate dots for "Calling..." text
    useEffect(() => {
        if (callStatus === 'calling') {
            const interval = setInterval(() => {
                setDotCount(prev => (prev + 1) % 4);
            }, 500);
            return () => clearInterval(interval);
        }
    }, [callStatus]);

    // Slide up controls
    useEffect(() => {
        Animated.spring(controlsAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 30,
            friction: 8,
        }).start();
    }, []);

    // Call timer
    useEffect(() => {
        let timer;
        if (callStatus === 'connected') {
            timer = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [callStatus]);

    // Poll for hangup command
    useEffect(() => {
        if (!__DEV__) return;

        const pollInterval = setInterval(async () => {
            try {
                const url = `${getDevServerURL()}/command`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.command === 'hangup') {
                    console.log('📞 Received HANGUP command from CLI');
                    await fetch(`${getDevServerURL()}/clear`, { method: 'POST' });
                    handleDecline();
                }
            } catch (error) {
                // Silent fail
            }
        }, 2000);

        return () => clearInterval(pollInterval);
    }, [navigation]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleAccept = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setCallStatus('connected');
    };

    const handleDecline = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        CallKeepService.endCall();
        // Immediately navigate back to prevent UI flash
        navigation.goBack();
    };

    const getStatusText = () => {
        if (callStatus === 'incoming') return 'Incoming Call...';
        if (callStatus === 'calling') return `Calling${'.'.repeat(dotCount)}`;
        if (callStatus === 'connected') return formatTime(callDuration);
        return 'Call Ended';
    };

    return (
        <LinearGradient
            // Updated colors to match the warm peach/pink gradient in the image
            colors={['#FFFDF9', '#FFF0E6', '#FFCDBF']}
            locations={[0, 0.4, 1]}
            style={styles.gradient}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>

                    {/* 1. Top Header Name */}
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerName}>Ira</Text>
                    </View>

                    {/* 2. Avatar & Timer Section */}
                    <View style={styles.avatarSection}>
                        <View style={[
                            styles.avatarWrapper,
                            !shouldShowPinkBorder && styles.avatarWrapperNoBorder
                        ]}>
                            <Animated.View
                                style={[
                                    styles.avatarPulseContainer,
                                    !shouldShowPinkBorder && styles.avatarPulseContainerNoBorder,
                                    shouldShowPinkBorder && {
                                        transform: [{ scale: pulseAnim }],
                                    },
                                ]}
                            >
                                <Image
                                    source={require('../../assets/callimage.avif')}
                                    style={styles.avatar}
                                />
                            </Animated.View>
                        </View>
                        
                        {/* Timer / Status Text */}
                        <Text style={styles.timerText}>
                            {getStatusText()}
                        </Text>
                    </View>

                    {/* 3. Controls Section */}
                    <Animated.View
                        style={[
                            styles.controlsSection,
                            { transform: [{ translateY: controlsAnim }] }
                        ]}
                    >
                        {callStatus === 'connected' ? (
                            <>
                                {/* Row of 3 Secondary Actions */}
                                <View style={styles.secondaryControlsRow}>
                                    <TouchableOpacity 
                                        style={[
                                            styles.iconButton,
                                            isMuted && styles.iconButtonActive
                                        ]} 
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setIsMuted(!isMuted);
                                        }}
                                    >
                                        <Ionicons 
                                            name={isMuted ? "mic-off" : "mic-outline"} 
                                            size={28} 
                                            color={isMuted ? "#FFFFFF" : "#1A1A1A"} 
                                        />
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={styles.iconButton}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            // Navigate back to chat with ongoing call overlay
                                            navigation.navigate('Chat', {
                                                showOngoingCall: true,
                                                callDuration: callDuration
                                            });
                                        }}
                                    >
                                        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#1A1A1A" />
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={[
                                            styles.iconButton,
                                            isSpeaker && styles.iconButtonActive
                                        ]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setIsSpeaker(!isSpeaker);
                                        }}
                                    >
                                        <Ionicons 
                                            name={isSpeaker ? "volume-high" : "volume-high-outline"} 
                                            size={28} 
                                            color={isSpeaker ? "#FFFFFF" : "#1A1A1A"} 
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* Main Hangup Button */}
                                <TouchableOpacity
                                    style={styles.endCallButton}
                                    onPress={handleDecline}
                                >
                                    <Ionicons name="call" size={32} color="#FFFFFF" style={styles.endIconRotation} />
                                </TouchableOpacity>
                            </>
                        ) : callStatus === 'calling' ? (
                            /* Outgoing Call UI - Only Hangup */
                            <View style={styles.outgoingControlsRow}>
                                <TouchableOpacity
                                    style={styles.endCallButton}
                                    onPress={handleDecline}
                                >
                                    <Ionicons name="call" size={32} color="#FFFFFF" style={styles.endIconRotation} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            /* Incoming Call UI State */
                            <View style={styles.incomingControlsRow}>
                                <View style={styles.incomingAction}>
                                    <TouchableOpacity
                                        style={[styles.incomingButton, { backgroundColor: '#FF453A' }]}
                                        onPress={handleDecline}
                                    >
                                        <Ionicons name="close" size={32} color="#FFF" />
                                    </TouchableOpacity>
                                    <Text style={styles.incomingLabel}>Decline</Text>
                                </View>

                                <View style={styles.incomingAction}>
                                    <TouchableOpacity
                                        style={[styles.incomingButton, { backgroundColor: '#34C759' }]}
                                        onPress={handleAccept}
                                    >
                                        <Ionicons name="call" size={32} color="#FFF" />
                                    </TouchableOpacity>
                                    <Text style={styles.incomingLabel}>Accept</Text>
                                </View>
                            </View>
                        )}
                    </Animated.View>

                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        paddingBottom: 40,
    },
    // 1. Header Styles
    headerContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    headerName: {
        fontSize: 60,
        fontWeight: '500', // Adjusted to look cleaner like the image
        color: '#000',
        marginTop: 10,
        letterSpacing: 3,
    },
    
    // 2. Avatar Styles
    avatarSection: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -60, // Pulling it up slightly to match layout
    },
    avatarWrapper: {
        marginBottom: 20,
        borderRadius: 100,
        padding: 4,
        backgroundColor: 'rgba(255, 100, 100, 0.15)', // Subtle pink glow
    },
    avatarWrapperNoBorder: {
        backgroundColor: 'transparent',
        padding: 0,
    },
    avatarPulseContainer: {
        width: 230,
        height: 260,
        borderRadius: 90,
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: '#FF8C8C', // The visible pink border
    },
    avatarPulseContainerNoBorder: {
        borderWidth: 0,
        borderColor: 'transparent',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    timerText: {
        fontSize: 20,
        fontWeight: '400',
        color: '#333',
        letterSpacing: 1,
    },

    // 3. Controls Styles
    controlsSection: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 30,
        marginBottom: 20,
    },
    
    // Connected State Styles
    secondaryControlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 50, // Space between small buttons and big red button
        paddingHorizontal: 10,
    },
    iconButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.6)', // Semi-transparent light bg
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconButtonActive: {
        backgroundColor: '#1A1A1A', // Dark background when active
    },
    endCallButton: {
        width: 80,
        height: 80,
        borderRadius: 42,
        backgroundColor: '#FF453A', // Standard iOS Red
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF453A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    endIconRotation: {
        transform: [{ rotate: '135deg' }] // Rotates the phone icon to look like "hang up"
    },

    // Outgoing State Styles
    outgoingControlsRow: {
        alignItems: 'center',
        width: '100%',
    },

    // Incoming State Styles (Preserved functionality)
    incomingControlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 30,
    },
    incomingAction: {
        alignItems: 'center',
        gap: 8,
    },
    incomingButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    incomingLabel: {
        fontSize: 14,
        color: '#555',
        fontWeight: '500',
        marginTop: 8,
    },
});