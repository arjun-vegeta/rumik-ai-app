import React from 'react';
import { View, TextInput, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChatInput({
  inputRef,
  inputText,
  onChangeText,
  onSend,
  isLoading,
  inputWidthAnim,
  rightPillWidthAnim,
  actionsOpacityAnim,
  sendButtonScaleAnim,
  keyboardVisible,
}) {
  return (
    <View style={[styles.inputContainer, !keyboardVisible && styles.inputContainerWithMargin]}>
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
          onChangeText={onChangeText}
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
            onPress={onSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons name="send-outline" size={22} color="#D17A6F" style={styles.iconThick} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  inputContainerWithMargin: {
    marginBottom: 12,
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
  iconThick: {
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 0.5,
  },
});
