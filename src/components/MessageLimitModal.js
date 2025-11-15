import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function MessageLimitModal({ navigation }) {
  const handleLogin = () => {
    navigation.navigate('PhoneAuthModal');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="chatbubbles" size={48} color="#E5E0CD" />
          </View>
        </View>

        <Text style={styles.title}>Message Limit Reached</Text>
        <Text style={styles.subtitle}>Login to continue chatting with Ira</Text>

        <View style={styles.benefitsContainer}>
          <BenefitItem icon="infinite" text="Unlimited messages" />
          <BenefitItem icon="bookmark" text="Save chat history" />
          <BenefitItem icon="sparkles" text="Personalized responses" />
        </View>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>Login with Phone</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.closeButtonText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function BenefitItem({ icon, text }) {
  return (
    <View style={styles.benefitItem}>
      <View style={styles.benefitIconContainer}>
        <Ionicons name={icon} size={20} color="#000000" />
      </View>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
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
    paddingVertical: 40,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  benefitsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  loginButton: {
    backgroundColor: '#000000',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#E5E0CD',
    fontSize: 17,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#999999',
    fontSize: 16,
    fontWeight: '500',
  },
});