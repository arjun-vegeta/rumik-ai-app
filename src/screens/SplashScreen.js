import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const rotateAnim = useRef(new Animated.Value(270)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Step 1: Rotate and scale up the logo
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Step 2: Wait 200ms then fade out
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onFinish();
        });
      }, 200);
    });
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 270],
    outputRange: ['0deg', '270deg'],
  });

  return (
    <LinearGradient
      colors={['#FFFDF6', '#FFF4EC', '#FFBFB4']}
      locations={[0, 0.27, 1]}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              { rotate: rotation },
              { scale: scaleAnim },
            ],
          }}
        >
          <Image
            source={require('../../assets/3d-logo.avif')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});
