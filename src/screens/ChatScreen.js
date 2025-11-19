import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Alert,
  Animated,
  Keyboard,
  Image,
  AppState
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { getDevServerURL } from '../utils/devServer';
import IncomingCallOverlay from '../components/IncomingCallOverlay';
import CallKeepService from '../utils/callKeep';
import SwipeableMessage from '../components/SwipeableMessage';

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
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [incomingCall, setIncomingCall] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const appState = useRef(AppState.currentState);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const scrollButtonAnim = useRef(new Animated.Value(0)).current;
  const messageAnimations = useRef({}).current;
  const typingDot1 = useRef(new Animated.Value(0)).current;
  const typingDot2 = useRef(new Animated.Value(0)).current;
  const typingDot3 = useRef(new Animated.Value(0)).current;
  const inputWidthAnim = useRef(new Animated.Value(1)).current;
  const rightPillWidthAnim = useRef(new Animated.Value(1)).current;
  const actionsOpacityAnim = useRef(new Animated.Value(1)).current;
  const sendButtonScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const getPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please enable notifications to receive calls.');
      }
    };
    getPermissions();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Initialize CallKeep
    CallKeepService.setup();

    // Handle native call answer - store navigation reference
    CallKeepService.setNavigationHandler((mode, initialStatus) => {
      navigation.navigate('CallScreen', { mode, initialStatus });
    });

    return () => {
      // Cleanup navigation handler
      CallKeepService.setNavigationHandler(null);
    };
  }, [navigation]);

  useEffect(() => {
    const configureNotifications = async () => {
      await Notifications.setNotificationCategoryAsync('incoming_call', [
        {
          identifier: 'accept',
          buttonTitle: 'Accept',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'decline',
          buttonTitle: 'Decline',
          options: {
            opensAppToForeground: false,
            isDestructive: true,
          },
        },
      ]);
    };
    configureNotifications();
  }, []);

  useEffect(() => {
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const actionId = response.actionIdentifier;

      // Navigate to CallScreen if tapped or accepted
      if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER || actionId === 'accept') {
        navigation.navigate('CallScreen', { mode: 'incoming' });
      }
      // Decline action is handled automatically by isDestructive/opensAppToForeground: false
    });

    return () => {
      responseListener.remove();
    };
  }, []);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);




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

  useEffect(() => {
    loadChatHistory();
  }, []);

  // Animate input box when text is typed
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

  // Development-only: Poll for call commands from dev-call-tester.js
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
            // Trigger Native Call UI
            CallKeepService.displayIncomingCall('Ira');
          }
        }
      } catch (error) {
        // Log error occasionally to avoid spamming, or just once
        // console.log('Dev server polling failed:', error.message);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [navigation]);

  const loadChatHistory = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem('chatHistory');
      const savedCount = await AsyncStorage.getItem('messageCount');

      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        // Initial greeting from Ira
        const greeting = {
          id: Date.now().toString(),
          text: "Hi! I'm Ira. How can I help you today?",
          sender: 'ira',
          timestamp: new Date().toISOString(),
        };
        setMessages([greeting]);
      }

      if (savedCount) {
        setMessageCount(parseInt(savedCount, 10));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const saveChatHistory = async (newMessages, newCount) => {
    try {
      await AsyncStorage.setItem('chatHistory', JSON.stringify(newMessages));
      await AsyncStorage.setItem('messageCount', newCount.toString());
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // Check message limit for guests (check if next message would exceed limit)
    const newCount = messageCount + 1;
    if (isGuest && newCount > 3) {
      navigation.navigate('MessageLimitModal');
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
      status: 'sending', // sending, delivered, read
      replyTo: replyingTo ? {
        id: replyingTo.id,
        text: replyingTo.text,
        sender: replyingTo.sender,
      } : null,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setReplyingTo(null);
    setIsLoading(true);

    setMessageCount(newCount);

    try {
      const response = await axios.post('https://rumik-ai.vercel.app/api/chat-ira', {
        message: userMessage.text,
      });

      // Mark as read (green checkmark) when message is successfully posted to AI
      const messagesWithRead = updatedMessages.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'read' } : msg
      );

      const iraMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.reply,
        sender: 'ira',
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...messagesWithRead, iraMessage];
      setMessages(finalMessages);
      await saveChatHistory(finalMessages, newCount);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');

      // Remove user message on error
      setMessages(messages);
      setMessageCount(messageCount);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
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
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleClearChat = async () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('chatHistory');
              await AsyncStorage.removeItem('messageCount');
              const greeting = {
                id: Date.now().toString(),
                text: "Hi! I'm Ira. How can I help you today?",
                sender: 'ira',
                timestamp: new Date().toISOString(),
              };
              setMessages([greeting]);
              setMessageCount(0);
              setShowMenu(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear chat');
            }
          },
        },
      ]
    );
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

  const handleReply = (message) => {
    setReplyingTo(message);
    // Auto-focus input after a short delay for smooth animation
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const scrollToMessage = (messageId) => {
    const index = messages.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5, // Center the message on screen
      });
      
      // Add a highlight animation
      if (messageAnimations[messageId]) {
        Animated.sequence([
          Animated.timing(messageAnimations[messageId], {
            toValue: 0.7,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(messageAnimations[messageId], {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(messageAnimations[messageId], {
            toValue: 0.7,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(messageAnimations[messageId], {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  };

  const renderMessage = ({ item }) => {
    const isIra = item.sender === 'ira';
    const time = formatTime(item.timestamp);

    if (!messageAnimations[item.id]) {
      messageAnimations[item.id] = new Animated.Value(0);
      Animated.timing(messageAnimations[item.id], {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    // Render status icon for user messages
    const renderStatusIcon = () => {
      if (isIra || !item.status) return null;
      
      const iconColor = item.status === 'read' ? '#4CAF50' : '#999999';
      const iconName = item.status === 'read' ? 'checkmark-done' : 'checkmark';
      
      return (
        <Ionicons 
          name={iconName} 
          size={16} 
          color={iconColor} 
          style={{ marginLeft: 4 }} 
        />
      );
    };

    return (
      <SwipeableMessage
        isIra={isIra}
        onReply={() => handleReply(item)}
      >
        <Animated.View
          style={[
            styles.messageContainer,
            isIra ? styles.iraMessageContainer : styles.userMessageContainer,
            {
              opacity: messageAnimations[item.id],
              transform: [{
                translateY: messageAnimations[item.id].interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            }
          ]}
        >
          <View style={[
            styles.messageBubble, 
            isIra ? styles.iraBubble : styles.userBubble,
            item.replyTo && styles.messageBubbleWithReply
          ]}>
            {/* Reply preview */}
            {item.replyTo && (
              <TouchableOpacity 
                style={styles.replyPreview}
                onPress={() => scrollToMessage(item.replyTo.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.replyBorder, isIra ? styles.replyBorderIra : styles.replyBorderUser]} />
                <View style={styles.replyContent}>
                  <Text style={styles.replyName}>
                    {item.replyTo.sender === 'ira' ? 'Ira' : 'You'}
                  </Text>
                  <Text style={styles.replyText} numberOfLines={1}>
                    {item.replyTo.text}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            
            <View style={styles.messageContent}>
              <Text style={[styles.messageText, isIra ? styles.iraText : styles.userText]}>
                {item.text}
                {/* Invisible timestamp for spacing - WhatsApp trick */}
                <Text style={styles.timestampSpacer}>
                  {'    '}{time}{!isIra && '    '}
                </Text>
              </Text>
              {/* Actual visible timestamp positioned absolutely */}
              <View style={styles.timestampContainer}>
                <Text style={[styles.timestamp, isIra ? styles.iraTimestamp : styles.userTimestamp]}>
                  {time}
                </Text>
                {renderStatusIcon()}
              </View>
            </View>
          </View>
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
        onDecline={() => {
          setIncomingCall(false);
        }}
      />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerWrapper}>
          <View style={styles.header}>
            <Image
              source={require('../../assets/ira-dp.avif')}
              style={styles.avatarImage}
            />
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>Ira</Text>
              <View style={styles.onlineContainer}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerIconButton}>
                <Ionicons name="search-outline" size={24} color="#D17A6F" style={styles.iconThick} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => navigation.navigate('CallScreen', { mode: 'outgoing' })}
              >
                <Ionicons name="call-outline" size={24} color="#D17A6F" style={styles.iconThick} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => setShowMenu(!showMenu)}
              >
                <Ionicons name="ellipsis-vertical" size={24} color="#D17A6F" style={styles.iconThick} />
              </TouchableOpacity>
            </View>
          </View>

          {showMenu && (
            <>
              <TouchableOpacity
                style={styles.menuOverlay}
                activeOpacity={1}
                onPress={() => setShowMenu(false)}
              />
              <View style={styles.menuDropdown}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleClearChat}
                >
                  <Ionicons name="trash-outline" size={20} color="#000000" style={styles.iconThick} />
                  <Text style={styles.menuItemText}>Clear Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    Alert.alert('Incoming Call', 'Ira is calling you in 3 seconds...', [{ text: 'OK' }]);
                    setTimeout(() => {
                      setIncomingCall(true);
                    }, 3000);
                  }}
                >
                  <Ionicons name="call-outline" size={20} color="#000000" style={styles.iconThick} />
                  <Text style={styles.menuItemText}>Simulate Incoming Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={async () => {
                    setShowMenu(false);
                    Alert.alert(
                      'Background Test',
                      'Exit the app now! Native Call will arrive in 5 seconds.',
                      [{ text: 'OK' }]
                    );

                    setTimeout(() => {
                      CallKeepService.displayIncomingCall('Ira');
                    }, 5000);
                  }}
                >
                  <Ionicons name="notifications-outline" size={20} color="#000000" style={styles.iconThick} />
                  <Text style={styles.menuItemText}>Test Background Call</Text>
                </TouchableOpacity>
                {!isGuest && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleLogout}
                  >
                    <Ionicons name="log-out-outline" size={20} color="#000000" style={styles.iconThick} />
                    <Text style={styles.menuItemText}>Logout</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>

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
            keyboardDismissMode="none"
            removeClippedSubviews={false}
            onScrollToIndexFailed={(info) => {
              // Fallback: scroll to offset if index fails
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

          <View style={[styles.inputContainer, Platform.OS === 'ios' && { marginBottom: keyboardHeight }]}>
            {showScrollButton && (
              <Animated.View
                style={[
                  styles.scrollToBottomButton,
                  {
                    opacity: scrollButtonAnim,
                    transform: [{
                      scale: scrollButtonAnim,
                    }],
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.scrollButtonInner}
                  onPress={scrollToBottom}
                >
                  <Ionicons name="arrow-down" size={24} color="#FF9B8A" />
                </TouchableOpacity>
              </Animated.View>
            )}
            
            {/* Reply bar */}
            {replyingTo && (
              <View style={styles.replyBar}>
                <View style={styles.replyBarContent}>
                  <View style={styles.replyBarBorder} />
                  <View style={styles.replyBarText}>
                    <Text style={styles.replyBarName}>
                      {replyingTo.sender === 'ira' ? 'Ira' : 'You'}
                    </Text>
                    <Text style={styles.replyBarMessage} numberOfLines={1}>
                      {replyingTo.text}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={cancelReply} style={styles.replyBarClose}>
                  <Ionicons name="close" size={22} color="#666666" />
                </TouchableOpacity>
              </View>
            )}

            <Animated.View 
              style={[
                styles.inputWrapper,
                {
                  flex: inputWidthAnim,
                }
              ]}
            >
              <TouchableOpacity style={styles.iconButtonInput}>
                <Ionicons name="happy-outline" size={24} color="#D17A6F" style={styles.iconThick} />
              </TouchableOpacity>
              
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Message"
                placeholderTextColor="#999999"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
            </Animated.View>

            <Animated.View 
              style={[
                styles.rightPill,
                {
                  width: rightPillWidthAnim.interpolate({
                    inputRange: [0.7, 1],
                    outputRange: [56, 120],
                  }),
                }
              ]}
            >
              {/* Action buttons (clip, camera, mic) - visible when no text */}
              <Animated.View 
                style={[
                  styles.actionsContainer,
                  {
                    opacity: actionsOpacityAnim,
                    transform: [{
                      scale: actionsOpacityAnim,
                    }],
                  }
                ]}
                pointerEvents={inputText.trim() ? 'none' : 'auto'}
              >
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="attach-outline" size={24} color="#D17A6F" style={styles.iconThick} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="camera-outline" size={24} color="#D17A6F" style={styles.iconThick} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="mic-outline" size={24} color="#D17A6F" style={styles.iconThick} />
                </TouchableOpacity>
              </Animated.View>

              {/* Send button - visible when text is typed */}
              <Animated.View 
                style={[
                  styles.sendButtonContainer,
                  {
                    opacity: sendButtonScaleAnim,
                    transform: [{
                      scale: sendButtonScaleAnim,
                    }],
                  }
                ]}
                pointerEvents={!inputText.trim() ? 'none' : 'auto'}
              >
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={sendMessage}
                  disabled={!inputText.trim() || isLoading}
                >
                  <Ionicons name="send" size={22} color="#D17A6F" />
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
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
  headerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 0,
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  onlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  onlineText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 2,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
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
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageBubbleWithReply: {
    minWidth: 200,
  },
  iraBubble: {
    backgroundColor: '#FFB4A8',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  messageContent: {
    position: 'relative',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  iraText: {
    color: '#000000',
  },
  userText: {
    color: '#000000',
  },
  timestampSpacer: {
    fontSize: 11,
    lineHeight: 20,
    color: 'transparent',
    letterSpacing: 0.5,
  },
  timestampContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    backgroundColor: 'transparent',
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '400',
  },
  iraTimestamp: {
    color: 'rgba(0, 0, 0, 0.45)',
  },
  userTimestamp: {
    color: '#999999',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    position: 'relative',
    gap: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 48,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  iconButtonInput: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 48,
    paddingHorizontal: 4,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  actionsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    zIndex: 10,
  },
  scrollButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: '#FF9B8A',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 150,
  },
  menuDropdown: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 200,
    minWidth: 200,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#000000',
  },
  replyBar: {
    position: 'absolute',
    bottom: 72,
    left: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  replyBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyBarBorder: {
    width: 3,
    height: '100%',
    backgroundColor: '#FF9B8A',
    borderRadius: 2,
    marginRight: 8,
  },
  replyBarText: {
    flex: 1,
  },
  replyBarName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9B8A',
    marginBottom: 2,
  },
  replyBarMessage: {
    fontSize: 14,
    color: '#666666',
  },
  replyBarClose: {
    padding: 4,
    marginLeft: 8,
  },
  replyPreview: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    minHeight: 44,
  },
  replyBorder: {
    width: 3,
    borderRadius: 2,
    marginRight: 8,
  },
  replyBorderIra: {
    backgroundColor: '#FFFFFF',
  },
  replyBorderUser: {
    backgroundColor: '#FF9B8A',
  },
  replyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  replyName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    color: '#FF9B8A',
  },
  replyText: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  iconThick: {
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0.3, height: 0.3 },
    textShadowRadius: 0.2,
  },
});
