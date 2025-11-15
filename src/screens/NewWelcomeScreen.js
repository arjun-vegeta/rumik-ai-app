import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Feature1SVG from '../../assets/svg/feature1.svg';
import Feature2SVG from '../../assets/svg/feature2.svg';
import Feature3SVG from '../../assets/svg/feature3.svg';

const { width } = Dimensions.get('window');

const features = [
  {
    title: 'Understands Intent',
    description: "Ira doesn't just hear words—she understands what you really mean.",
    SvgComponent: Feature1SVG,
  },
  {
    title: 'Infers Emotions',
    description: 'She picks up on how you feel and responds with genuine empathy.',
    SvgComponent: Feature2SVG,
  },
  {
    title: 'Multilingual',
    description: 'Converses naturally in Hinglish, Bangla, Marathi, and more.',
    SvgComponent: Feature3SVG,
  },
];

export default function WelcomeScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const svgAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

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
  }, []);

  useEffect(() => {
    // Animate the current SVG
    svgAnimations[currentIndex].setValue(0);
    Animated.timing(svgAnimations[currentIndex], {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
      easing: (t) => {
        // Cubic bezier approximation: cubic-bezier(0.47, 0, 0.745, 0.715)
        return t * t * (3 - 2 * t);
      },
    }).start();
  }, [currentIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % features.length;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * (width - 8),
        animated: true,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / (width - 8));
        if (index !== currentIndex) {
          setCurrentIndex(index);
        }
      },
    }
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.headerSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Image 
            source={require('../../assets/meetira.avif')}
            style={styles.meetIraImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View 
          style={[
            styles.carouselSection,
            {
              opacity: fadeAnim,
            }
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
              <Animated.View 
                key={index} 
                style={[
                  styles.featureCard,
                  {
                    opacity: scrollX.interpolate({
                      inputRange: [
                        (index - 1) * (width - 8),
                        index * (width - 8),
                        (index + 1) * (width - 8),
                      ],
                      outputRange: [0.3, 1, 0.3],
                      extrapolate: 'clamp',
                    }),
                    transform: [{
                      scale: scrollX.interpolate({
                        inputRange: [
                          (index - 1) * (width - 8),
                          index * (width - 8),
                          (index + 1) * (width - 8),
                        ],
                        outputRange: [0.9, 1, 0.9],
                        extrapolate: 'clamp',
                      }),
                    }],
                  }
                ]}
              >
                <Animated.View 
                  style={[
                    styles.svgContainer,
                    {
                      opacity: svgAnimations[index],
                      transform: [{ scale: 1.8 }],
                    }
                  ]}
                >
                  <feature.SvgComponent 
                    width={width - 80}
                    height={200}
                  />
                </Animated.View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </Animated.View>
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
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity,
                    },
                  ]}
                />
              );
            })}
          </View>
        </Animated.View>

        <Animated.View 
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('PhoneLogin')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Login with Phone</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Chat', { isGuest: true })}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Continue as Guest</Text>
          </TouchableOpacity>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFAF7',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  headerSection: {
    paddingHorizontal: 4,
    paddingTop: 20,
    alignItems: 'center',
  },
  meetIraImage: {
    width: width - 8,
    height: 80,
  },
  mainTitle: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  carouselSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  carousel: {
    flexGrow: 0,
  },
  carouselContent: {
    paddingHorizontal: 4,
  },
  featureCard: {
    width: width - 8,
    borderRadius: 24,
    padding: 16,
    marginRight: 0,
    minHeight: 200,
    justifyContent: 'center',
  },
  conversationPreview: {
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  previewMessageContainer: {
    marginBottom: 10,
  },
  previewIraContainer: {
    alignItems: 'flex-start',
  },
  previewUserContainer: {
    alignItems: 'flex-end',
  },
  previewMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  previewAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E0CD',
  },
  previewBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  previewIraBubble: {
    backgroundColor: '#000000',
    borderBottomLeftRadius: 4,
  },
  previewUserBubble: {
    backgroundColor: '#f4f0de',
    borderBottomRightRadius: 4,
  },
  previewMessageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewIraText: {
    color: '#E5E0CD',
  },
  previewUserText: {
    color: '#000000',
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
  buttonContainer: {
    gap: 16,
    paddingHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#E5E0CD',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
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
    color: '#999999',
  },
  logo: {
    height: 24,
    width: 96,
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  svgImage: {
    width: width - 80,
    height: 200,
  },
});

