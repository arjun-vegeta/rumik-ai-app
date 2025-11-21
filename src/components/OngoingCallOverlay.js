import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OngoingCallOverlay({ visible, onPress, callDuration, callerName = "Ira" }) {
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(-150)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (visible) {
            setShouldRender(true);

            slideAnim.setValue(-150);
            opacityAnim.setValue(0);
            
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 10,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
        } else if (shouldRender) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -150,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start(() => {
                setShouldRender(false);
            });
        }
    }, [visible, slideAnim, opacityAnim]);

    // Format call duration into minutes:seconds
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (!shouldRender) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    top: insets.top,
                    opacity: opacityAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <TouchableOpacity 
                style={styles.islandContainer}
                activeOpacity={0.9}
                onPress={() => {
                    if (onPress) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onPress();
                    }
                }}
            >
                <View style={styles.content}>
                    <View style={styles.leftSection}>
                        <Image
                            source={require('../../assets/ira-dp.avif')}
                            style={styles.avatar}
                        />
                        <View style={styles.textContainer}>
                            <View style={styles.nameRow}>
                                <Ionicons name="call" size={14} color="#FFFFFF" style={styles.callIcon} />
                                <Text style={styles.name}>{callerName}</Text>
                            </View>
                            <Text style={styles.status}>{formatTime(callDuration)}</Text>
                        </View>
                    </View>

                    <View style={styles.rightSection}>
                        <Text style={styles.tapText}>Tap to return</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 2000,
        paddingTop: 0,
        paddingBottom: 8,
    },
    islandContainer: {
        width: '100%',
        backgroundColor: '#30D158',
        borderRadius: 30,
        paddingVertical: 8,
        paddingHorizontal: 12,
        minHeight: 66,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
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
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 0,
    },
    textContainer: {
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    callIcon: {
        marginTop: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    status: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 2,
        fontWeight: '500',
    },
    rightSection: {
        paddingLeft: 8,
    },
    tapText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.85)',
        fontWeight: '500',
    },
});
