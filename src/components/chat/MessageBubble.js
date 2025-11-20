import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MessageBubble({
  message,
  isIra,
  time,
  onPress,
  onLongPress,
  onReplyPress,
  isSelected = false,
  searchText = '',
}) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const shadowAnim = React.useRef(new Animated.Value(1)).current;
  const bubbleRef = React.useRef(null);

  React.useEffect(() => {
    if (isSelected) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.05,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(shadowAnim, {
          toValue: 24,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(shadowAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isSelected]);
  const highlightText = (text, highlight) => {
    if (!highlight || !highlight.trim()) {
      return <Text>{text}</Text>;
    }

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    
    return (
      <Text>
        {parts.map((part, index) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <Text key={index} style={styles.highlightedText}>
              {part}
            </Text>
          ) : (
            <Text key={index}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  const renderStatusIcon = () => {
    if (isIra || !message.status) return null;
    
    const iconColor = message.status === 'read' ? '#4CAF50' : '#999999';
    const iconName = message.status === 'read' ? 'checkmark-done' : 'checkmark';
    
    return (
      <Ionicons 
        name={iconName} 
        size={16} 
        color={iconColor} 
        style={{ marginLeft: 4 }} 
      />
    );
  };

  const handlePress = () => {
    if (bubbleRef.current) {
      bubbleRef.current.measure((x, y, width, height, pageX, pageY) => {
        onPress({ x: pageX, y: pageY, width, height });
      });
    }
  };

  const handleLongPress = () => {
    if (bubbleRef.current) {
      bubbleRef.current.measure((x, y, width, height, pageX, pageY) => {
        onLongPress({ x: pageX, y: pageY, width, height });
      });
    }
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        ref={bubbleRef}
        style={[
          styles.messageBubble, 
          isIra ? styles.iraBubble : styles.userBubble,
          message.replyTo && styles.messageBubbleWithReply,
          isSelected && styles.selectedBubble,
        ]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.9}
        delayLongPress={300}
      >
      {/* Reply preview */}
      {message.replyTo && (
        <TouchableOpacity 
          style={styles.replyPreview}
          onPress={onReplyPress}
          activeOpacity={0.7}
        >
          <View style={[styles.replyBorder, isIra ? styles.replyBorderIra : styles.replyBorderUser]} />
          <View style={styles.replyContent}>
            <Text style={styles.replyName}>
              {message.replyTo.sender === 'ira' ? 'Ira' : 'You'}
            </Text>
            <Text style={styles.replyText} numberOfLines={1}>
              {message.replyTo.text}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      
      <View style={styles.messageContent}>
        <Text style={[styles.messageText, isIra ? styles.iraText : styles.userText]}>
          {highlightText(message.text, searchText)}
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
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
  selectedBubble: {
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
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
  highlightedText: {
    backgroundColor: '#FFEB3B',
    color: '#000000',
  },
});
