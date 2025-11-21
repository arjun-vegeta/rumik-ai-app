import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const features = [
  {
    title: 'Understands Intent',
    description: "Ira doesn't just hear words—she understands what you really mean.",
    lottie: require('../../assets/lottie/feature1.json'),
  },
  {
    title: 'Infers Emotions',
    description: 'She picks up on how you feel and responds with genuine empathy.',
    lottie: require('../../assets/lottie/feature2.json'),
  },
  {
    title: 'Multilingual',
    description: 'Converses naturally in Hinglish, Bangla, Marathi, and more.',
    lottie: require('../../assets/lottie/feature3.json'),
  },
];

export default function WelcomeScreen({ navigation }) {
  // Keep track of which feature card is currently showing
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const scrollViewRef = useRef(null);
  const intervalRef = useRef(null);
  const lottieRefs = useRef([
    React.createRef(),
    React.createRef(),
    React.createRef(),
  ]).current;

  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Play the animation for whichever feature card is currently visible
  useEffect(() => {
    if (lottieRefs[currentIndex]?.current) {
      lottieRefs.forEach((ref, index) => {
        if (index === currentIndex) {
          ref.current?.play();
        } else {
          ref.current?.reset();
        }
      });
    }
  }, [currentIndex, lottieRefs]);

  // Automatically cycle through the feature cards every couple seconds
  useEffect(() => {
    const startInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % features.length;
          
          scrollViewRef.current?.scrollTo({
            x: nextIndex * (width - 8),
            animated: true,
          });
          
          return nextIndex;
        });
      }, 2000);
    };

    startInterval();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % features.length;
        
        scrollViewRef.current?.scrollTo({
          x: nextIndex * (width - 8),
          animated: true,
        });
        
        return nextIndex;
      });
    }, 2500);
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / (width - 8));
        if (index !== currentIndex && index >= 0 && index < features.length) {
          setCurrentIndex(index);
          resetTimer();
        }
      },
    }
  );

  // Navigate to phone auth when user wants to login
  const handlePhoneLogin = () => {
    navigation.navigate('PhoneAuthModal');
  };

  // Quick Google login flow (placeholder for actual implementation)
  const handleGoogleLogin = async () => {
    try {
      await AsyncStorage.setItem('phoneNumber', 'google_user');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Chat', params: { isGuest: false } }],
      });
    } catch (error) {
      console.error('Error with Google login:', error);
    }
  };

  const handleGuestLogin = () => {
    navigation.navigate('Chat', { isGuest: true });
  };

  return (
    <LinearGradient
      colors={['#FFFDF6', '#FFF4EC', '#FFBFB4']}
      locations={[0, 0.27, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
        {/* Header Section */}
        <Animated.View
          style={[
            styles.headerSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Image
            source={require('../../assets/meetira.avif')}
            style={styles.meetIraImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Carousel Section */}
        <Animated.View
          style={[
            styles.carouselSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Animated.ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.carousel}
            snapToInterval={width - 8}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
          >
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.lottieContainer}>
                  <LottieView
                    ref={lottieRefs[index]}
                    source={feature.lottie}
                    style={styles.lottieAnimation}
                    autoPlay={index === 0}
                    loop={false}
                  />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            ))}
          </Animated.ScrollView>

          <View style={styles.dotsContainer}>
            {features.map((_, index) => {
              const inputRange = [
                (index - 1) * (width - 8),
                index * (width - 8),
                (index + 1) * (width - 8),
              ];
              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 24, 8],
                extrapolate: 'clamp',
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View
                  key={index}
                  style={[styles.dot, { width: dotWidth, opacity }]}
                />
              );
            })}
          </View>
        </Animated.View>

        {/* Bottom Section */}
        <Animated.View
          style={[
            styles.bottomContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.phoneInputContainer}
            onPress={handlePhoneLogin}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={20} color="#000000" style={styles.phoneIcon} />
            <Text style={styles.phoneInputPlaceholder}>Enter your phone number</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={20} color="#E5E0CD" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>

          {/* Footer / Powered By */}
          <View style={styles.poweredByContainer}>
            <Text style={styles.poweredByText}>powered by:</Text>
            <Image
              source={require('../../assets/logo.avif')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
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
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  headerSection: {
    paddingHorizontal: 4,
    paddingTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetIraImage: {
    width: width - 8,
    height: 80,
  },
  carouselSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
    overflow: 'visible',
  },
  carousel: {
    flexGrow: 0,
    overflow: 'visible',
  },
  carouselContent: {
    paddingHorizontal: 4,
    overflow: 'visible',
  },
  featureCard: {
    width: width - 8,
    borderRadius: 24,
    padding: 16,
    minHeight: 200,
    justifyContent: 'center',
    overflow: 'visible',
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  featureDescription: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
  },
  lottieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    paddingHorizontal: 16,
    transform: [{ scale: 2.2}],
    overflow: 'visible',
  },
  lottieAnimation: {
    width: width - 80,
    height: 180,
  },
  bottomContainer: {
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 56,
  },
  phoneIcon: {
    marginRight: 8,
  },
  phoneInputPlaceholder: {
    color: '#393939ff',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 56,
  },
  googleButtonText: {
    color: '#E5E0CD',
    fontSize: 16,
    fontWeight: '600',
  },
  guestButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#393939ff',
    fontSize: 16,
    fontWeight: '500',
  },
  poweredByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 0,
  },
  poweredByText: {
    fontSize: 14,
    color: '#393939ff',
  },
  logo: {
    height: 26,
    width: 98,
  },
});
