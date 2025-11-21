import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function IncomingCallOverlay({ visible, onAccept, onDecline, onPress, callerName = "Ira" }) {
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(-150)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const [shouldRender, setShouldRender] = React.useState(false);

    // Slide the call notification down from the top when it appears
    useEffect(() => {
        if (visible) {
            setShouldRender(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
            {/* Dynamic Island Style Container */}
            <TouchableOpacity 
                style={styles.islandContainer}
                activeOpacity={0.8}
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
                            <Text style={styles.name}>{callerName}</Text>
                            <Text style={styles.status}>Incoming...</Text>
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.declineButton]}
                            onPress={(e) => {
                                e.stopPropagation();
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                onDecline();
                            }}
                        >
                            <Ionicons name="close" size={22} color="#FFFFFF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.acceptButton]}
                            onPress={(e) => {
                                e.stopPropagation();
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                onAccept();
                            }}
                        >
                            <Ionicons name="call" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
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
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        paddingVertical: 8,
        paddingHorizontal: 12,
        minHeight: 66,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
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
        marginLeft: 0,
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
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
        letterSpacing: 0.3,
    },
    status: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    button: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    declineButton: {
        backgroundColor: '#FF453A',
    },
    acceptButton: {
        backgroundColor: '#30D158',
    },
});
