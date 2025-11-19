import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getDevServerURL } from '../utils/devServer';
import CallKeepService from '../utils/callKeep';

export default function CallScreen({ navigation, route }) {
    const mode = route.params?.mode || 'incoming';
    const initialStatus = route.params?.initialStatus;

    // If initialStatus is provided (e.g. 'connected' from accept button), use it.
    // Otherwise default based on mode.
    const [callStatus, setCallStatus] = useState(
        initialStatus || (mode === 'outgoing' ? 'calling' : 'incoming')
    );
    const [callDuration, setCallDuration] = useState(0);

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

    // Pulse animation
    useEffect(() => {
        if (callStatus === 'incoming' || callStatus === 'calling') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
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
        setCallStatus('ended');
        setTimeout(() => {
            navigation.goBack();
        }, 500);
    };

    return (
        <LinearGradient
            colors={['#FFFDF6', '#FFF4EC', '#FFBFB4']}
            locations={[0, 0.27, 1]}
            style={styles.gradient}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>

                    {/* Top Info */}
                    <View style={styles.header}>
                        <View style={styles.statusPill}>
                            <Text style={styles.statusText}>
                                {callStatus === 'incoming' ? 'Incoming Call...' :
                                    callStatus === 'calling' ? 'Calling...' :
                                        callStatus === 'connected' ? formatTime(callDuration) : 'Call Ended'}
                            </Text>
                        </View>
                    </View>

                    {/* Main Avatar Area */}
                    <View style={styles.centerContent}>
                        <Animated.View
                            style={[
                                styles.avatarContainer,
                                (callStatus === 'incoming' || callStatus === 'calling') && {
                                    transform: [{ scale: pulseAnim }],
                                },
                            ]}
                        >
                            <Image
                                source={require('../../assets/ira-dp.avif')}
                                style={styles.avatar}
                            />
                        </Animated.View>
                        <Text style={styles.nameText}>Ira</Text>
                        <Text style={styles.subText}>AI Companion</Text>
                    </View>

                    {/* Bottom Controls */}
                    <Animated.View
                        style={[
                            styles.controlsContainer,
                            { transform: [{ translateY: controlsAnim }] }
                        ]}
                    >
                        {callStatus === 'incoming' ? (
                            <View style={styles.incomingControls}>
                                <View style={styles.actionButtonContainer}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.declineButton]}
                                        onPress={handleDecline}
                                    >
                                        <Ionicons name="close" size={32} color="#E5E0CD" />
                                    </TouchableOpacity>
                                    <Text style={styles.actionLabel}>Decline</Text>
                                </View>

                                <View style={styles.actionButtonContainer}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.acceptButton]}
                                        onPress={handleAccept}
                                    >
                                        <Ionicons name="call" size={32} color="#E5E0CD" />
                                    </TouchableOpacity>
                                    <Text style={styles.actionLabel}>Accept</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.connectedControls}>
                                <View style={styles.secondaryRow}>
                                    <TouchableOpacity style={styles.secondaryButton}>
                                        <Ionicons name="mic-off-outline" size={24} color="#000000" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.secondaryButton}>
                                        <Ionicons name="volume-high-outline" size={24} color="#000000" />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.endButton]}
                                    onPress={handleDecline}
                                >
                                    <Ionicons name="call" size={32} color="#E5E0CD" />
                                </TouchableOpacity>
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
    container: {
        flex: 1,
        backgroundColor: '#F2F2F2',
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
    },
    statusPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 20,
        overflow: 'hidden',
    },
    statusText: {
        fontSize: 15,
        color: '#555',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    centerContent: {
        alignItems: 'center',
        marginTop: -40,
    },
    avatarContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        backgroundColor: '#FFF',
        padding: 4,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 80,
    },
    nameText: {
        fontSize: 36,
        fontWeight: '300',
        color: '#000',
        marginBottom: 8,
        letterSpacing: 1,
    },
    subText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    controlsContainer: {
        width: '100%',
        paddingHorizontal: 40,
        paddingBottom: 40,
    },
    incomingControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    actionButtonContainer: {
        alignItems: 'center',
        gap: 12,
    },
    actionButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    declineButton: {
        backgroundColor: '#FF453A',
    },
    acceptButton: {
        backgroundColor: '#34C759',
    },
    endButton: {
        backgroundColor: '#FF453A',
        width: 80,
        height: 80,
        borderRadius: 40,
        marginTop: 40,
    },
    actionLabel: {
        fontSize: 14,
        color: '#555',
        fontWeight: '500',
    },
    connectedControls: {
        alignItems: 'center',
        width: '100%',
    },
    secondaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
    },
    secondaryButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
