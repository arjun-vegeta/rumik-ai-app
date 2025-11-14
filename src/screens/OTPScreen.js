import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OTPScreen({ navigation, route }) {
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    setTimer(30);
    setCanResend(false);
    Alert.alert('OTP Sent', 'A new OTP has been sent to your phone');
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

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.centerContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Enter OTP</Text>
            <View style={styles.phoneNumberRow}>
              <Text style={styles.subtitle}>
                Code sent to {phoneNumber}
              </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.otpBox}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
              />
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.verifyButton, otp.join('').length !== 6 && styles.verifyButtonDisabled]}
            onPress={handleVerify}
            disabled={otp.join('').length !== 6}
          >
            <Text style={styles.verifyButtonText}>Verify & Continue</Text>
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
        </View>
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
    paddingHorizontal: 24,
    justifyContent: 'center',
    marginTop: -200,
  },
  centerContent: {
    width: '100%',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  phoneNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
  },
  editButton: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  hint: {
    fontSize: 13,
    color: '#999999',
    fontStyle: 'italic',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E0CD',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: '#E5E0CD',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  timerText: {
    fontSize: 15,
    color: '#999999',
  },
});
