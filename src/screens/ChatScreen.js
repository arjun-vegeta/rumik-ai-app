import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Platform,
  Alert,
  Animated,
  Keyboard,
  AppState,
  TouchableOpacity,
  Text
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { getDevServerURL } from '../utils/devServer';
import CallKeepService from '../utils/callKeep';

// Components
import ChatHeader from '../components/chat/ChatHeader';
import ChatMenu from '../components/chat/ChatMenu';
import ChatInput from '../components/chat/ChatInput';
import ReplyBar from '../components/chat/ReplyBar';
import MessageBubble from '../components/chat/MessageBubble';
import SwipeableMessage from '../components/SwipeableMessage';
import IncomingCallOverlay from '../components/IncomingCallOverlay';
import MessageOptionsModal from '../components/MessageOptionsModal';

// Hooks
import useChatLogic from '../hooks/useChatLogic';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function ChatScreen({ navigation, route }) {
  const isGuest = route.params?.isGuest ?? false;
  
  // Chat logic hook
  const {
    messages,
    inputText,
    setInputText,
    isLoading,
    replyingTo,
    sendMessage,
    handleReply,
    cancelReply,
    handleClearChat,
    handleMessageDelete,
    getMessageAnimation,
  } = useChatLogic(isGuest, navigation);

  // UI state
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [incomingCall, setIncomingCall] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [messageLayout, setMessageLayout] = useState(null);

  // Refs
  const appState = useRef(AppState.currentState);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const lastTap = useRef(null);
  const scrollButtonAnim = useRef(new Animated.Value(0)).current;
  const typingDot1 = useRef(new Animated.Value(0)).current;
  const typingDot2 = useRef(new Animated.Value(0)).current;
  const typingDot3 = useRef(new Animated.Value(0)).current;
  const inputWidthAnim = useRef(new Animated.Value(1)).current;
  const rightPillWidthAnim = useRef(new Animated.Value(1)).current;
  const actionsOpacityAnim = useRef(new Animated.Value(1)).current;
  const sendButtonScaleAnim = useRef(new Animated.Value(0)).current;

  // Permissions
  useEffect(() => {
    const getPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please enable notifications to receive calls.');
      }
    };
    getPermissions();
  }, []);

  // App state
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  // CallKeep setup
  useEffect(() => {
    CallKeepService.setup();
    CallKeepService.setNavigationHandler((mode, initialStatus) => {
      navigation.navigate('CallScreen', { mode, initialStatus });
    });
    return () => CallKeepService.setNavigationHandler(null);
  }, [navigation]);

  // Notifications
  useEffect(() => {
    const configureNotifications = async () => {
      await Notifications.setNotificationCategoryAsync('incoming_call', [
        {
          identifier: 'accept',
          buttonTitle: 'Accept',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'decline',
          buttonTitle: 'Decline',
          options: { opensAppToForeground: false, isDestructive: true },
        },
      ]);
    };
    configureNotifications();

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const actionId = response.actionIdentifier;
      if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER || actionId === 'accept') {
        navigation.navigate('CallScreen', { mode: 'incoming' });
      }
    });

    return () => responseListener.remove();
  }, []);

  // Keyboard handling
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Typing animation
  useEffect(() => {
    if (isLoading) {
      const animateDot = (dot, delay) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: -8,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animation1 = animateDot(typingDot1, 0);
      const animation2 = animateDot(typingDot2, 150);
      const animation3 = animateDot(typingDot3, 300);

      animation1.start();
      animation2.start();
      animation3.start();

      return () => {
        animation1.stop();
        animation2.stop();
        animation3.stop();
        typingDot1.setValue(0);
        typingDot2.setValue(0);
        typingDot3.setValue(0);
      };
    }
  }, [isLoading]);

  // Input animation
  useEffect(() => {
    const hasText = inputText.trim().length > 0;
    
    Animated.parallel([
      Animated.spring(inputWidthAnim, {
        toValue: hasText ? 1.15 : 1,
        useNativeDriver: false,
        tension: 80,
        friction: 10,
      }),
      Animated.spring(rightPillWidthAnim, {
        toValue: hasText ? 0.7 : 1,
        useNativeDriver: false,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(actionsOpacityAnim, {
        toValue: hasText ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(sendButtonScaleAnim, {
        toValue: hasText ? 1 : 0,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
    ]).start();
  }, [inputText]);

  // Dev call polling
  useEffect(() => {
    if (!__DEV__) return;

    const pollInterval = setInterval(async () => {
      try {
        const url = `${getDevServerURL()}/command`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.command === 'call') {
          console.log('📞 Received CALL command from CLI');
          await fetch(`${getDevServerURL()}/clear`, { method: 'POST' });

          if (appState.current === 'active') {
            setIncomingCall(true);
          } else {
            CallKeepService.displayIncomingCall('Ira');
          }
        }
      } catch (error) {
        // Ignore polling errors
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [navigation]);

  // Handlers
  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement, velocity } = event.nativeEvent;
    const isAtBottom = contentOffset.y >= contentSize.height - layoutMeasurement.height - 250;
    const shouldShow = !isAtBottom;

    if (shouldShow !== showScrollButton) {
      setShowScrollButton(shouldShow);
      Animated.spring(scrollButtonAnim, {
        toValue: shouldShow ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }

    // Close keyboard on scroll down
    if (velocity && velocity.y < -0.5) {
      Keyboard.dismiss();
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const scrollToMessage = (messageId) => {
    const index = messages.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
      
      const animation = getMessageAnimation(messageId);
      Animated.sequence([
        Animated.timing(animation, { toValue: 0.7, duration: 150, useNativeDriver: true }),
        Animated.timing(animation, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(animation, { toValue: 0.7, duration: 150, useNativeDriver: true }),
        Animated.timing(animation, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleMessageLongPress = (message, layout) => {
    setMessageLayout(layout);
    setSelectedMessage(message);
    setShowMessageOptions(true);
  };

  const handleMessagePress = (message, layout) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
      lastTap.current = null;
      handleMessageLongPress(message, layout);
    } else {
      lastTap.current = now;
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('phoneNumber');
              await AsyncStorage.removeItem('chatHistory');
              await AsyncStorage.removeItem('messageCount');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const renderMessage = ({ item }) => {
    const isIra = item.sender === 'ira';
    const time = formatTime(item.timestamp);
    const animation = getMessageAnimation(item.id);
    const isSelected = selectedMessage?.id === item.id;

    return (
      <SwipeableMessage
        isIra={isIra}
        onReply={() => {
          handleReply(item);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
      >
        <Animated.View
          style={[
            styles.messageContainer,
            isIra ? styles.iraMessageContainer : styles.userMessageContainer,
            {
              opacity: animation,
              transform: [{
                translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
              zIndex: isSelected ? 1000 : 1,
              elevation: isSelected ? 1000 : 1,
            }
          ]}
        >
          <MessageBubble
            message={item}
            isIra={isIra}
            time={time}
            onPress={(layout) => handleMessagePress(item, layout)}
            onLongPress={(layout) => handleMessageLongPress(item, layout)}
            onReplyPress={() => item.replyTo && scrollToMessage(item.replyTo.id)}
            isSelected={isSelected}
          />
        </Animated.View>
      </SwipeableMessage>
    );
  };

  return (
    <View style={styles.gradient}>
      <IncomingCallOverlay
        visible={incomingCall}
        onAccept={() => {
          setIncomingCall(false);
          navigation.navigate('CallScreen', { mode: 'incoming', initialStatus: 'connected' });
        }}
        onDecline={() => setIncomingCall(false)}
      />
      
      <SafeAreaView style={styles.container} edges={['top']}>
        <ChatHeader
          onCallPress={() => navigation.navigate('CallScreen', { mode: 'outgoing' })}
          onMenuPress={() => setShowMenu(!showMenu)}
        />

        <ChatMenu
          visible={showMenu}
          onClose={() => setShowMenu(false)}
          onClearChat={() => {
            setShowMenu(false);
            handleClearChat();
          }}
          onSimulateCall={() => {
            setShowMenu(false);
            Alert.alert('Incoming Call', 'Ira is calling you in 3 seconds...', [{ text: 'OK' }]);
            setTimeout(() => setIncomingCall(true), 3000);
          }}
          onTestBackgroundCall={() => {
            setShowMenu(false);
            Alert.alert(
              'Background Test',
              'Exit the app now! Native Call will arrive in 5 seconds.',
              [{ text: 'OK' }]
            );
            setTimeout(() => CallKeepService.displayIncomingCall('Ira'), 5000);
          }}
          onLogout={() => {
            setShowMenu(false);
            handleLogout();
          }}
          isGuest={isGuest}
        />

        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            removeClippedSubviews={false}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise(resolve => setTimeout(resolve, 100));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0.5,
                });
              });
            }}
          />

          {isLoading && (
            <View style={styles.loadingContainer}>
              <View style={styles.typingIndicator}>
                <Animated.View style={[styles.typingDot, { transform: [{ translateY: typingDot1 }] }]} />
                <Animated.View style={[styles.typingDot, { transform: [{ translateY: typingDot2 }] }]} />
                <Animated.View style={[styles.typingDot, { transform: [{ translateY: typingDot3 }] }]} />
              </View>
              <Text style={styles.loadingText}>Ira is typing...</Text>
            </View>
          )}

          <View style={[styles.inputWrapper, Platform.OS === 'ios' && { marginBottom: keyboardHeight }]}>
            {showScrollButton && (
              <Animated.View
                style={[
                  styles.scrollToBottomButton,
                  {
                    opacity: scrollButtonAnim,
                    transform: [{ scale: scrollButtonAnim }],
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.scrollButtonInner}
                  onPress={scrollToBottom}
                >
                  <Ionicons name="arrow-down" size={20} color="#D17A6F" style={styles.iconThick} />
                </TouchableOpacity>
              </Animated.View>
            )}
            
            <ReplyBar replyingTo={replyingTo} onCancel={cancelReply} />

            <ChatInput
              inputRef={inputRef}
              inputText={inputText}
              onChangeText={setInputText}
              onSend={sendMessage}
              isLoading={isLoading}
              inputWidthAnim={inputWidthAnim}
              rightPillWidthAnim={rightPillWidthAnim}
              actionsOpacityAnim={actionsOpacityAnim}
              sendButtonScaleAnim={sendButtonScaleAnim}
            />
          </View>
        </View>
      </SafeAreaView>

      <MessageOptionsModal
        visible={showMessageOptions}
        onClose={() => {
          setShowMessageOptions(false);
          setSelectedMessage(null);
          setMessageLayout(null);
        }}
        onReply={() => {
          if (selectedMessage) {
            handleReply(selectedMessage);
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
        onReport={() => Alert.alert('Report Message', 'This message has been reported.')}
        onFeedback={(type) => {
          const emoji = type === 'up' ? '👍' : '👎';
          Alert.alert('Feedback Sent', `You reacted with ${emoji}`);
        }}
        onDelete={() => selectedMessage && handleMessageDelete(selectedMessage.id)}
        isOwnMessage={selectedMessage?.sender === 'user'}
        messageLayout={messageLayout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: '#FFE8E3',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  iraMessageContainer: {
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF9B8A',
  },
  inputWrapper: {
    position: 'relative',
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    zIndex: 10,
  },
  scrollButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  iconThick: {
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 0.5,
  },
});
