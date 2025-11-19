import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/NewWelcomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import CallScreen from './src/screens/CallScreen';
import MessageLimitModal from './src/components/MessageLimitModal';
import PhoneAuthModal from './src/components/PhoneAuthModal';

const Stack = createStackNavigator();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Welcome');

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const phoneNumber = await AsyncStorage.getItem('phoneNumber');
      setInitialRoute(phoneNumber ? 'Chat' : 'Welcome');
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FCFAF7' }}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#FCFAF7' }
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen
          name="CallScreen"
          component={CallScreen}
          options={{
            presentation: 'fullScreenModal',
            animationEnabled: true,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="PhoneAuthModal"
          component={PhoneAuthModal}
          options={{
            presentation: 'transparentModal',
            cardStyle: { backgroundColor: 'transparent' },
            cardOverlayEnabled: true,
            animationEnabled: true,
          }}
        />
        <Stack.Screen
          name="MessageLimitModal"
          component={MessageLimitModal}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
