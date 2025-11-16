import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window');

export default function PhoneAuthModal({ navigation, route }) {
  const autoFocus = route?.params?.autoFocus ?? true;
  
  // State
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Refs
  const phoneInputRef = useRef(null);
  const otpInputRefs = useRef([]);
  
  // Animations
  const slideAnim = useRef(new Animated.Value(height)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  // Mount animation - faster for immediate keyboard
  useEffect(() => {
    // Focus input immediately, even before animation completes
    if (autoFocus) {
      setTimeout(() => phoneInputRef.current?.focus(), 50);
    }
    
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  // OTP Timer
  useEffect(() => {
    if (step === 'otp' && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, step]);

  const handleClose = () => {
    Keyboard.dismiss();
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
  };

  const handleContinue = () => {
    if (phoneNumber.length !== 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
      return;
    }

    // Animate transition to OTP
    Animated.parallel([
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep('otp');
      setTimer(30);
      setCanResend(false);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    });
  };

  const handleEditNumber = () => {
    Animated.parallel([
      Animated.timing(titleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep('phone');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => phoneInputRef.current?.focus(), 100);
    });
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP');
      return;
    }

    try {
      await AsyncStorage.setItem('phoneNumber', phoneNumber);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Chat', params: { isGuest: false } }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save login information');
    }
  };

  const handleResend = () => {
    setTimer(30);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    otpInputRefs.current[0]?.focus();
    Alert.alert('OTP Sent', 'A new OTP has been sent to your phone');
  };

  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const isPhoneValid = phoneNumber.length === 10;
  const isOtpValid = otp.join('').length === 6;

  // Animated values for title transition
  const phoneTitleOpacity = titleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const phoneTitleTranslate = titleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const otpTitleOpacity = titleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const otpTitleTranslate = titleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  // Content transition
  const phoneContentOpacity = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const otpContentOpacity = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={handleClose}
      />
      
      <Animated.View 
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#FFFDF6', '#FFF4EC', '#FFBFB4']}
          locations={[0, 0.27, 1]}
          style={styles.gradient}
        >
          {/* Handle Bar */}
          <View style={styles.handleBar} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? -50 : 0}
        >
          {/* Header with animated title */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              {/* Phone Title */}
              <Animated.View
                style={[
                  styles.titleWrapper,
                  {
                    opacity: phoneTitleOpacity,
                    transform: [{ translateY: phoneTitleTranslate }],
                  },
                ]}
                pointerEvents={step === 'phone' ? 'auto' : 'none'}
              >
                <Text style={styles.title}>Enter your phone number</Text>
                <Text style={styles.subtitle}>We'll send you a verification code</Text>
              </Animated.View>

              {/* OTP Title */}
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  styles.titleWrapper,
                  {
                    opacity: otpTitleOpacity,
                    transform: [{ translateY: otpTitleTranslate }],
                  },
                ]}
                pointerEvents={step === 'otp' ? 'auto' : 'none'}
              >
                <Text style={styles.title}>Enter OTP</Text>
                <View style={styles.phoneNumberRow}>
                  <Text style={styles.subtitle}>Code sent to {phoneNumber}</Text>
                  <TouchableOpacity onPress={handleEditNumber}>
                    <Text style={styles.editButton}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </View>

          {/* Content Area */}
          <View style={styles.content}>
            {/* Phone Input */}
            <Animated.View
              style={[
                styles.inputSection,
                {
                  opacity: phoneContentOpacity,
                },
              ]}
              pointerEvents={step === 'phone' ? 'auto' : 'none'}
            >
              <View style={styles.phoneInputContainer}>
                <View style={styles.phoneIconWrapper}>
                  <Ionicons name="call" size={20} color="#000000" />
                </View>
                <TextInput
                  ref={phoneInputRef}
                  style={styles.phoneInput}
                  placeholder="10-digit phone number"
                  placeholderTextColor="#999999"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
                />
                <View style={styles.phoneIconWrapper} />
              </View>

              <TouchableOpacity
                style={[
                  styles.continueButton,
                  !isPhoneValid && styles.buttonDisabled,
                ]}
                onPress={handleContinue}
                disabled={!isPhoneValid}
              >
                <Text style={[
                  styles.continueButtonText,
                  !isPhoneValid && styles.buttonDisabledText,
                ]}>
                  Continue
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* OTP Input */}
            <Animated.View
              style={[
                styles.inputSection,
                styles.otpSection,
                {
                  opacity: otpContentOpacity,
                },
              ]}
              pointerEvents={step === 'otp' ? 'auto' : 'none'}
            >
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (otpInputRefs.current[index] = ref)}
                    style={styles.otpBox}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.continueButton,
                  !isOtpValid && styles.buttonDisabled,
                ]}
                onPress={handleVerify}
                disabled={!isOtpValid}
              >
                <Text style={[
                  styles.continueButtonText,
                  !isOtpValid && styles.buttonDisabledText,
                ]}>
                  Verify & Continue
                </Text>
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                {canResend ? (
                  <TouchableOpacity onPress={handleResend}>
                    <Text style={styles.resendText}>Resend OTP</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
                )}
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.9,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  gradient: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E0CD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  titleContainer: {
    minHeight: 80,
    position: 'relative',
  },
  titleWrapper: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#393939ff',
    textAlign: 'center',
  },
  phoneNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  editButton: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    position: 'relative',
    minHeight: 200,
  },
  inputSection: {
    gap: 16,
    paddingBottom: 20,
  },
  otpSection: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 16,
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
  phoneIconWrapper: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    color: '#000000',
    paddingVertical: 12,
    letterSpacing: 3,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  continueButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  continueButtonText: {
    color: '#E5E0CD',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabledText: {
    color: '#999999',
  },
  resendContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resendText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  timerText: {
    fontSize: 15,
    color: '#393939ff',
  },
});
