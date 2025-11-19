import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChatMenu({ 
  visible, 
  onClose, 
  onClearChat, 
  onSimulateCall,
  onTestBackgroundCall,
  onLogout,
  isGuest 
}) {
  if (!visible) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.menuDropdown}>
        <TouchableOpacity style={styles.menuItem} onPress={onClearChat}>
          <Ionicons name="trash-outline" size={20} color="#000000" style={styles.iconThick} />
          <Text style={styles.menuItemText}>Clear Chat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={onSimulateCall}>
          <Ionicons name="call-outline" size={20} color="#000000" style={styles.iconThick} />
          <Text style={styles.menuItemText}>Simulate Incoming Call</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={onTestBackgroundCall}>
          <Ionicons name="notifications-outline" size={20} color="#000000" style={styles.iconThick} />
          <Text style={styles.menuItemText}>Test Background Call</Text>
        </TouchableOpacity>
        
        {!isGuest && (
          <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color="#000000" style={styles.iconThick} />
            <Text style={styles.menuItemText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
    top: 130,
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
  iconThick: {
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 0.5,
  },
});
