import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function IncomingCallOverlay({ visible, onAccept, onDecline, callerName = "Ira" }) {
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(-200)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        if (visible) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Parallel animation for slide and scale
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: insets.top + 10, // Position just below status bar/notch
                    useNativeDriver: true,
                    tension: 60,
                    friction: 9,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 70,
                    friction: 8,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -200,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible, insets.top]);

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [
                        { translateY: slideAnim },
                        { scale: scaleAnim }
                    ]
                }
            ]}
        >
            {/* Dynamic Island Style Container */}
            <View style={styles.islandContainer}>
                <View style={styles.content}>
                    <View style={styles.leftSection}>
                        <Image
                            source={require('../../assets/ira-dp.avif')}
                            style={styles.avatar}
                        />
                        <View style={styles.textContainer}>
                            <Text style={styles.name}>{callerName}</Text>
                            <Text style={styles.status}>Incoming...</Text>
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.declineButton]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                onDecline();
                            }}
                        >
                            <Ionicons name="close" size={22} color="#FFFFFF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.acceptButton]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                onAccept();
                            }}
                        >
                            <Ionicons name="call" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 10,
        right: 10,
        zIndex: 2000,
        alignItems: 'center',
    },
    islandContainer: {
        width: '100%',
        backgroundColor: '#FFF', // White background
        borderRadius: 35, // Pill shape
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, // Softer shadow
        shadowRadius: 16,
        elevation: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)', // Subtle border
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: '#FFE8E3', // App theme color
    },
    textContainer: {
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000', // Black text
        letterSpacing: 0.3,
    },
    status: {
        fontSize: 12,
        color: '#666', // Dark gray text
        marginTop: 2,
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    declineButton: {
        backgroundColor: '#FF453A', // iOS Red
    },
    acceptButton: {
        backgroundColor: '#30D158', // iOS Green
    },
});
