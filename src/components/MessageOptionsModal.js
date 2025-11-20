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
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_WIDTH = 200;
const MODAL_GAP = 8; // Gap between message and modal
const SCREEN_MARGIN = 16; // Margin from screen edges
const OPTION_HEIGHT = 52;

export default function MessageOptionsModal({ 
  visible, 
  onClose, 
  onReply,
  onReport,
  onFeedback,
  onDelete,
  isOwnMessage = false,
  messageLayout = null,
}) {
  const blurOpacity = React.useRef(new Animated.Value(0)).current;
  const modalScale = React.useRef(new Animated.Value(0.85)).current;
  const modalOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(blurOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 100,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(blurOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalScale, {
          toValue: 0.85,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleOption = React.useCallback((callback) => {
    onClose();
    setTimeout(() => callback(), 250);
  }, [onClose]);

  if (!messageLayout) return null;

  const isRightSide = messageLayout.x > SCREEN_WIDTH / 2;
  
  // Calculate number of options
  // All messages: Reply, Report, Delete
  // Ira messages also get: Feedback section
  const optionsCount = 3; // Reply, Report, Delete
  const feedbackSectionHeight = !isOwnMessage ? 90 : 0; // Only for Ira messages
  const modalHeight = (optionsCount * OPTION_HEIGHT) + feedbackSectionHeight;
  
  // Account for message scale animation (1.05x)
  const SCALE_FACTOR = 1.05;
  const scaleExpansion = (messageLayout.height * (SCALE_FACTOR - 1)) / 2;
  
  // Calculate if modal should be above or below message
  const spaceBelow = SCREEN_HEIGHT - (messageLayout.y + messageLayout.height);
  const spaceAbove = messageLayout.y;
  const shouldShowAbove = spaceBelow < modalHeight + MODAL_GAP + SCREEN_MARGIN + scaleExpansion;
  
  // Calculate modal vertical position with consistent 8px gap
  // When above: account for the scale expansion at the top of the message
  // When below: account for the scale expansion at the bottom of the message
  const modalTop = shouldShowAbove 
    ? messageLayout.y - modalHeight - MODAL_GAP - scaleExpansion
    : messageLayout.y + messageLayout.height + MODAL_GAP + scaleExpansion;
  
  // Calculate modal horizontal position
  // Align modal to the same side as the message
  let modalLeft;
  if (isRightSide) {
    // User message (right side) - align modal to right edge of message
    modalLeft = Math.max(
      SCREEN_MARGIN, 
      messageLayout.x + messageLayout.width - MODAL_WIDTH
    );
  } else {
    // Ira message (left side) - align modal to left edge of message
    modalLeft = Math.min(
      SCREEN_WIDTH - MODAL_WIDTH - SCREEN_MARGIN,
      messageLayout.x
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalContainer}>
          {/* Options menu */}
          <TouchableWithoutFeedback>
            <Animated.View 
              style={[
                styles.menuContainer,
                {
                  top: modalTop,
                  left: modalLeft,
                  opacity: modalOpacity,
                  transform: [{ scale: modalScale }],
                }
              ]}
            >
              <BlurView
                intensity={Platform.OS === 'ios' ? 100 : 120}
                tint="light"
                style={styles.menuBlur}
              >
                <View style={styles.optionsList}>
                  {/* Reply */}
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => handleOption(onReply)}
                    activeOpacity={0.6}
                  >
                    <View style={styles.optionIcon}>
                      <Ionicons name="arrow-undo-outline" size={20} color="#D17A6F" />
                    </View>
                    <Text style={styles.optionText}>Reply</Text>
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  {/* Report */}
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => handleOption(onReport)}
                    activeOpacity={0.6}
                  >
                    <View style={styles.optionIcon}>
                      <Ionicons name="flag-outline" size={20} color="#D17A6F" />
                    </View>
                    <Text style={styles.optionText}>Report</Text>
                  </TouchableOpacity>

                  {/* Delete */}
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => handleOption(onDelete)}
                    activeOpacity={0.6}
                  >
                    <View style={styles.optionIcon}>
                      <Ionicons name="trash-outline" size={20} color="#f83535ff" />
                    </View>
                    <Text style={[styles.optionText, styles.deleteText]}>Delete</Text>
                  </TouchableOpacity>

                  {/* Feedback Section - Only for Ira messages */}
                  {!isOwnMessage && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.feedbackSection}>
                        <Text style={styles.feedbackQuestion}>Do you like the response?</Text>
                        <View style={styles.feedbackButtons}>
                          <TouchableOpacity
                            style={styles.feedbackButton}
                            onPress={() => handleOption(() => onFeedback('up'))}
                            activeOpacity={0.6}
                          >
                            <View style={styles.feedbackIcon}>
                              <Ionicons name="thumbs-up-outline" size={24} color="#4CAF50" />
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.feedbackButton}
                            onPress={() => handleOption(() => onFeedback('down'))}
                            activeOpacity={0.6}
                          >
                            <View style={styles.feedbackIcon}>
                              <Ionicons name="thumbs-down-outline" size={24} color="#FF6B6B" />
                            </View>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </BlurView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  menuContainer: {
    position: 'absolute',
    width: MODAL_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 24,
  },
  menuBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionsList: {
    paddingVertical: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    height: OPTION_HEIGHT,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
    flex: 1,
  },
  deleteText: {
    color: '#f83535ff',
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginHorizontal: 16,
  },
  emojiIcon: {
    fontSize: 18,
  },
  feedbackSection: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  feedbackQuestion: {
    fontSize: 14,
    color: '#3c3c3cff',
    fontWeight: '500',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  feedbackButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
  },
  feedbackButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
