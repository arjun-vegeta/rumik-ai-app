import React, { useRef } from 'react';
import {
  View,
  Animated,
  PanResponder,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SWIPE_THRESHOLD = 70;
const MAX_SWIPE = 100;

export default function SwipeableMessage({ 
  children, 
  onReply, 
  isIra,
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const replyIconOpacity = useRef(new Animated.Value(0)).current;
  const replyIconScale = useRef(new Animated.Value(0.5)).current;

  // Handle the swipe gesture to trigger a reply
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to right swipes
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        const isRightSwipe = gestureState.dx > 5;
        return isHorizontalSwipe && isRightSwipe;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
        const isRightSwipe = gestureState.dx > 10;
        return isHorizontalSwipe && isRightSwipe;
      },
      onPanResponderGrant: () => {
        translateX.flattenOffset();
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const dx = gestureState.dx;
        
        // Only allow swiping to the right, with some resistance when you go too far
        if (dx > 0) {
          let limitedDx;
          if (dx <= SWIPE_THRESHOLD) {
            limitedDx = dx;
          } else {
            const excess = dx - SWIPE_THRESHOLD;
            limitedDx = SWIPE_THRESHOLD + (excess * 0.2);
          }
          
          limitedDx = Math.min(limitedDx, MAX_SWIPE);
          translateX.setValue(limitedDx);
          
          const progress = Math.min(limitedDx / SWIPE_THRESHOLD, 1);
          replyIconOpacity.setValue(progress);
          replyIconScale.setValue(0.5 + progress * 0.5);
        } else {
          translateX.setValue(0);
          replyIconOpacity.setValue(0);
          replyIconScale.setValue(0.5);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const dx = gestureState.dx;
        const velocity = gestureState.vx;
        
        // If they swiped far enough or fast enough, trigger the reply
        if (dx > SWIPE_THRESHOLD || (dx > 40 && velocity > 0.5)) {
          onReply();
          
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 80,
              friction: 10,
              velocity: -velocity,
            }),
            Animated.timing(replyIconOpacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(replyIconScale, {
              toValue: 0.5,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 80,
              friction: 10,
            }),
            Animated.timing(replyIconOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(replyIconScale, {
              toValue: 0.5,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }),
          Animated.timing(replyIconOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(replyIconScale, {
            toValue: 0.5,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* Reply icon - always on the left for right swipe */}
      <Animated.View
        style={[
          styles.replyIconContainer,
          {
            opacity: replyIconOpacity,
            transform: [{ scale: replyIconScale }],
          },
        ]}
      >
        <Ionicons name="arrow-undo" size={22} color="#FF9B8A" />
      </Animated.View>

      {/* Swipeable message */}
      <Animated.View
        style={[
          styles.messageWrapper,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  messageWrapper: {
    width: '100%',
  },
  replyIconContainer: {
    position: 'absolute',
    left: 20,
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
});
