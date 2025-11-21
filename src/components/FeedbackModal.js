import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FEEDBACK_TYPES = [
  { id: 'bug', label: 'Bug Report', icon: 'bug-outline' },
  { id: 'feature', label: 'Feature Request', icon: 'bulb-outline' },
  { id: 'improvement', label: 'Improvement', icon: 'trending-up-outline' },
  { id: 'other', label: 'Other', icon: 'chatbubble-outline' },
];

export default function FeedbackModal({ visible, onClose, isGuest }) {
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [sendDiagnostics, setSendDiagnostics] = useState(true);

  // Make sure they've filled in all the important stuff before sending
  const handleSubmit = () => {
    if (!selectedType) {
      Alert.alert('Required', 'Please select a feedback type');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Please describe your feedback');
      return;
    }
    if (isGuest && !email.trim()) {
      Alert.alert('Required', 'Please provide your email so we can follow up');
      return;
    }

    // Send the feedback to the backend - would normally POST to an API endpoint
    console.log('Feedback submitted:', {
      type: selectedType,
      description,
      email: isGuest ? email : undefined,
      sendDiagnostics: selectedType === 'bug' ? sendDiagnostics : undefined,
      timestamp: new Date().toISOString(),
    });

    Alert.alert(
      'Thank You!',
      'Your feedback has been submitted successfully. We appreciate your input!',
      [{ text: 'OK', onPress: handleClose }]
    );
  };

  const handleClose = () => {
    setSelectedType(null);
    setDescription('');
    setEmail('');
    setSendDiagnostics(true);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Send Feedback</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.sectionLabel}>Feedback Type</Text>
            <View style={styles.typeGrid}>
              {FEEDBACK_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    selectedType === type.id && styles.typeCardSelected,
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Ionicons
                    name={type.icon}
                    size={20}
                    color={selectedType === type.id ? '#D17A6F' : '#999999'}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      selectedType === type.id && styles.typeLabelSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Please provide details about your report, feedback, or issues..."
              placeholderTextColor="#999999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={8}
              maxLength={1000}
              textAlignVertical="top"
            />

            {selectedType === 'bug' && (
              <View style={styles.diagnosticsSection}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setSendDiagnostics(!sendDiagnostics)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, sendDiagnostics && styles.checkboxChecked]}>
                    {sendDiagnostics && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Send diagnostics</Text>
                </TouchableOpacity>
                <Text style={styles.diagnosticsDescription}>
                  Includes device info, app version, and error logs to help us fix the issue faster
                </Text>
              </View>
            )}

            {isGuest && (
              <>
                <Text style={styles.sectionLabel}>
                  Email
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor="#999999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  maxLength={100}
                />
                <Text style={styles.helperText}>
                  We'll use this to follow up on your feedback
                </Text>
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '75%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexGrow: 0,
    flexShrink: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginTop: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    backgroundColor: '#FFF5F3',
    borderColor: '#D17A6F',
  },
  typeLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    flex: 1,
  },
  typeLabelSelected: {
    color: '#D17A6F',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  textArea: {
    height: 140,
    paddingTop: 12,
    marginBottom: 12,
  },
  diagnosticsSection: {
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D17A6F',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#D17A6F',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  diagnosticsDescription: {
    fontSize: 12,
    color: '#999999',
    lineHeight: 16,
    marginLeft: 32,
  },
  helperText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#D17A6F',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
