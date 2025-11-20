import React from 'react';
import { View, TextInput, TouchableOpacity, Animated, StyleSheet, Text } from 'react-native';
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
  isSearchMode,
  searchText,
  onSearchChange,
  onSearchClose,
  currentSearchIndex,
  totalSearchResults,
  onSearchNext,
  onSearchPrevious,
}) {
  
  if (isSearchMode) {
    return (
      <View style={[styles.inputContainer, !keyboardVisible && styles.inputContainerWithMargin]}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color="#999999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages..."
              placeholderTextColor="#999999"
              value={searchText}
              onChangeText={onSearchChange}
              autoFocus
            />
            {searchText.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => onSearchChange('')}
              >
                <Ionicons name="close-circle" size={20} color="#999999" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.searchActions}>
            {totalSearchResults > 0 && (
              <View style={styles.searchCounter}>
                <Text style={styles.searchCounterText}>
                  {currentSearchIndex + 1}/{totalSearchResults}
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={[styles.searchNavButton, totalSearchResults === 0 && styles.searchNavButtonDisabled]}
              onPress={onSearchPrevious}
              disabled={totalSearchResults === 0}
            >
              <Ionicons name="chevron-up" size={22} color={totalSearchResults === 0 ? '#CCCCCC' : '#D17A6F'} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.searchNavButton, totalSearchResults === 0 && styles.searchNavButtonDisabled]}
              onPress={onSearchNext}
              disabled={totalSearchResults === 0}
            >
              <Ionicons name="chevron-down" size={22} color={totalSearchResults === 0 ? '#CCCCCC' : '#D17A6F'} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.searchCloseButton}
              onPress={onSearchClose}
            >
              <Ionicons name="close" size={24} color="#D17A6F" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

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
            <Ionicons name="send" size={22} color="#D17A6F" style={styles.iconThick} />
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
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  searchCounter: {
    paddingHorizontal: 8,
  },
  searchCounterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  searchNavButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchNavButtonDisabled: {
    opacity: 0.4,
  },
  searchCloseButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});
