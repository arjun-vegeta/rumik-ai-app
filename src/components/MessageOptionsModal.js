import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MessageOptionsModal({ 
  visible, 
  onClose, 
  onReply,
  onReport,
  onFeedback,
  onDelete,
  isOwnMessage = false,
  messageLayout = null,
  messageText = '',
}) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-20)).current;
  const messageOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(messageOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(messageOpacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleOption = (callback) => {
    onClose();
    setTimeout(() => callback(), 150);
  };

  if (!messageLayout) return null;

  const isRightSide = messageLayout.x > SCREEN_WIDTH / 2;
  const menuTop = messageLayout.y + messageLayout.height + 8;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          {/* Highlighted message copy */}
          <Animated.View
            style={[
              styles.highlightedMessage,
              {
                top: messageLayout.y,
                left: messageLayout.x,
                width: messageLayout.width,
                opacity: messageOpacity,
              },
              isRightSide ? styles.highlightedMessageRight : styles.highlightedMessageLeft,
            ]}
          >
            <Text style={[styles.highlightedText, isRightSide && styles.highlightedTextRight]}>
              {messageText}
            </Text>
          </Animated.View>

          {/* Options menu */}
          <TouchableWithoutFeedback>
            <Animated.View 
              style={[
                styles.menuContainer,
                {
                  top: menuTop,
                  [isRightSide ? 'right' : 'left']: 16,
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              {/* Action buttons row */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={() => handleOption(onReply)}
                >
                  <Ionicons name="arrow-undo-outline" size={20} color="#D17A6F" style={styles.iconThick} />
                  <Text style={styles.actionLabel}>Reply</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={() => handleOption(() => onFeedback('up'))}
                >
                  <Text style={styles.emojiIcon}>👍</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={() => handleOption(() => onFeedback('down'))}
                >
                  <Text style={styles.emojiIcon}>👎</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={() => handleOption(onReport)}
                >
                  <Ionicons name="flag-outline" size={20} color="#666666" style={styles.iconThick} />
                  <Text style={styles.actionLabel}>Report</Text>
                </TouchableOpacity>

                {isOwnMessage && (
                  <TouchableOpacity
                    style={styles.actionIcon}
                    onPress={() => handleOption(onDelete)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF6B6B" style={styles.iconThick} />
                    <Text style={[styles.actionLabel, styles.deleteLabel]}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  highlightedMessage: {
    position: 'absolute',
    backgroundColor: '#FFB4A8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  highlightedMessageLeft: {
    borderBottomLeftRadius: 4,
  },
  highlightedMessageRight: {
    borderBottomRightRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  highlightedText: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 20,
  },
  highlightedTextRight: {
    color: '#000000',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    minWidth: 60,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 56,
  },
  actionLabel: {
    fontSize: 11,
    color: '#666666',
    marginTop: 4,
    fontWeight: '500',
  },
  deleteLabel: {
    color: '#FF6B6B',
  },
  emojiIcon: {
    fontSize: 24,
  },
  iconThick: {
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 0.5,
  },
});
