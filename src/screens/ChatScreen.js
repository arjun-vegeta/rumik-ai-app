import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen({ navigation, route }) {
  const isGuest = route.params?.isGuest ?? false;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef(null);
  const scrollButtonAnim = useRef(new Animated.Value(0)).current;
  const messageAnimations = useRef({}).current;
  const typingDot1 = useRef(new Animated.Value(0)).current;
  const typingDot2 = useRef(new Animated.Value(0)).current;
  const typingDot3 = useRef(new Animated.Value(0)).current;

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
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    setMessageCount(newCount);

    try {
      const response = await axios.post('https://rumik-ai.vercel.app/api/chat-ira', {
        message: userMessage.text,
      });

      const iraMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.reply,
        sender: 'ira',
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, iraMessage];
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

  const renderMessage = ({ item, index }) => {
    const isIra = item.sender === 'ira';
    
    if (!messageAnimations[item.id]) {
      messageAnimations[item.id] = new Animated.Value(0);
      Animated.timing(messageAnimations[item.id], {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    
    return (
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
        <View style={[styles.messageBubble, isIra ? styles.iraBubble : styles.userBubble]}>
          <Text style={[styles.messageText, isIra ? styles.iraText : styles.userText]}>
            {item.text}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.gradient}>
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
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="search-outline" size={22} color="#FF9B8A" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="call-outline" size={22} color="#FF9B8A" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => setShowMenu(!showMenu)}
              >
                <Ionicons name="ellipsis-vertical" size={22} color="#FF9B8A" />
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
                  <Ionicons name="trash-outline" size={20} color="#000000" />
                  <Text style={styles.menuItemText}>Clear Chat</Text>
                </TouchableOpacity>
                {!isGuest && (
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={handleLogout}
                  >
                    <Ionicons name="log-out-outline" size={20} color="#000000" />
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
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message"
              placeholderTextColor="#999999"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="attach-outline" size={24} color="#FF9B8A" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons name="send" size={22} color="#FF9B8A" />
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
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
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FF9B8A',
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iraBubble: {
    backgroundColor: '#FFB4A8',
    borderRadius: 30,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderTopRightRadius: 4,

  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  iraText: {
    color: '#000000',
  },
  userText: {
    color: '#000000',
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    position: 'relative',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 20,
    minHeight: 56,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    maxHeight: 100,
    paddingVertical: 12,
  },
  attachButton: {
    padding: 2,
    marginLeft: 8,
  },
  sendButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.4,
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
    top: 60,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FF9B8A',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 200,
    minWidth: 160,
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
});
