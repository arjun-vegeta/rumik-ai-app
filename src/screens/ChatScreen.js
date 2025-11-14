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
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

    // Check message limit for guests
    if (isGuest && messageCount >= 3) {
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

    const newCount = messageCount + 1;
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
    const isAtBottom = contentOffset.y >= contentSize.height - layoutMeasurement.height - 50;
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarSmallText}>I</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>Ira</Text>
          <View style={styles.onlineContainer}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowMenu(!showMenu)}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#000000" />
        </TouchableOpacity>
        
        {showMenu && (
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
        )}
      </View>

      {showMenu && (
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        />
      )}

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
            <ActivityIndicator size="small" color="#000000" />
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
                <Ionicons name="arrow-down" size={24} color="#000000" />
              </TouchableOpacity>
            </Animated.View>
          )}
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#999999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons name="send" size={20} color="#E5E0CD" />
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E0CD',
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSmallText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E5E0CD',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  onlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  onlineText: {
    fontSize: 12,
    color: '#666666',
  },
  messageCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  chatContainer: {
    flex: 1,
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
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  iraBubble: {
    backgroundColor: '#000000',
  },
  userBubble: {
    backgroundColor: '#f4f0de',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  iraText: {
    color: '#E5E0CD',
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
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E0CD',
    backgroundColor: '#FCFAF7',
    position: 'relative',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E0CD',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000000',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 20,
    color: '#E5E0CD',
    fontWeight: '600',
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    zIndex: 10,
  },
  scrollButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E0CD',
  },
  menuButton: {
    padding: 8,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  menuDropdown: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E0CD',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
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
