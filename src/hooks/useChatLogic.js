import { useState, useEffect, useRef } from 'react';
import { Alert, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function useChatLogic(isGuest, navigation) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);

  const messageAnimations = useRef({}).current;

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
      status: 'sending',
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
      setMessages(messages);
      setMessageCount(messageCount);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
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
            } catch (error) {
              Alert.alert('Error', 'Failed to clear chat');
            }
          },
        },
      ]
    );
  };

  const handleMessageDelete = async (messageId) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedMessages = messages.filter(msg => msg.id !== messageId);
            setMessages(updatedMessages);
            await saveChatHistory(updatedMessages, messageCount);
          },
        },
      ]
    );
  };

  const getMessageAnimation = (messageId) => {
    if (!messageAnimations[messageId]) {
      messageAnimations[messageId] = new Animated.Value(0);
      Animated.timing(messageAnimations[messageId], {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    return messageAnimations[messageId];
  };

  return {
    messages,
    inputText,
    setInputText,
    isLoading,
    messageCount,
    replyingTo,
    sendMessage,
    handleReply,
    cancelReply,
    handleClearChat,
    handleMessageDelete,
    getMessageAnimation,
    saveChatHistory,
  };
}
