import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ReplyBar({ replyingTo, onCancel }) {
  if (!replyingTo) return null;

  return (
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
      <TouchableOpacity onPress={onCancel} style={styles.replyBarClose}>
        <Ionicons name="close" size={22} color="#666666" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
