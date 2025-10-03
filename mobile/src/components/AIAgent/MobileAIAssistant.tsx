/**
 * @fileoverview Mobile AI Assistant Component
 * @module MobileAIAssistant
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-14
 * 
 * @description React Native component for AI assistant with voice support and mobile optimization
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Vibration,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Voice from '@react-native-voice/voice';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MobileMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  confidence?: number;
  isVoice?: boolean;
  actionItems?: any[];
  escalated?: boolean;
}

interface MobileAIAssistantProps {
  tenantId?: string;
  userId?: string;
  userToken?: string;
  residentId?: string;
  careContext?: any;
  onEscalation?: (data: any) => void;
}

export const MobileAIAssistant: React.FC<MobileAIAssistantProps> = ({
  tenantId,
  userId,
  userToken,
  residentId,
  careContext,
  onEscalation
}) => {
  const [messages, setMessages] = useState<MobileMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [urgencyLevel, setUrgencyLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');
  const scrollViewRef = useRef<ScrollView>(null);

  const isAuthenticated = !!(tenantId && userId && userToken);
  const agentType = isAuthenticated ? 'TENANT' : 'PUBLIC';

  useEffect(() => {
    initializeAIAssistant();
    setupVoiceRecognition();
    loadCachedMessages();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeAIAssistant = async () => {
    try {
      const welcomeMessage: MobileMessage = {
        id: 'welcome',
        type: 'agent',
        content: isAuthenticated 
          ? `Hello! I'm your AI care assistant. I can help with care planning, documentation, compliance, and clinical support. All conversations are securely encrypted. How can I assist you today?`
          : `Hello! I'm here to help you learn about WriteCareNotes. I can answer questions about our features, pricing, compliance support, and schedule demos. What would you like to know?`,
        timestamp: new Date(),
        confidence: 1.0
      };

      setMessages([welcomeMessage]);

    } catch (error) {
      console.error('Failed to initialize AI assistant:', error);
    }
  };

  const setupVoiceRecognition = async () => {
    try {
      Voice.onSpeechStart = () => {
        setIsListening(true);
      };

      Voice.onSpeechEnd = () => {
        setIsListening(false);
      };

      Voice.onSpeechResults = (event) => {
        if (event.value && event.value[0]) {
          setInputText(event.value[0]);
        }
      };

      Voice.onSpeechError = (error) => {
        console.error('Voice recognition error:', error);
        setIsListening(false);
        Alert.alert('Voice Error', 'Failed to recognize speech. Please try again.');
      };

    } catch (error) {
      console.error('Voice setup failed:', error);
    }
  };

  const loadCachedMessages = async () => {
    try {
      const cacheKey = `ai_messages_${agentType}_${tenantId || 'public'}`;
      const cachedMessages = await AsyncStorage.getItem(cacheKey);
      
      if (cachedMessages) {
        const parsed = JSON.parse(cachedMessages);
        // Only load recent messages (last 24 hours)
        const recentMessages = parsed.filter((msg: MobileMessage) => 
          Date.now() - new Date(msg.timestamp).getTime() < 24 * 60 * 60 * 1000
        );
        
        if (recentMessages.length > 0) {
          setMessages(prev => [...prev, ...recentMessages]);
        }
      }
    } catch (error) {
      console.error('Failed to load cached messages:', error);
    }
  };

  const cacheMessages = async () => {
    try {
      const cacheKey = `ai_messages_${agentType}_${tenantId || 'public'}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(messages.slice(-20))); // Keep last 20 messages
    } catch (error) {
      console.error('Failed to cache messages:', error);
    }
  };

  const sendMessage = async (message: string, inquiryType: string = 'GENERAL') => {
    if (!message.trim() || isLoading) return;

    const userMessage: MobileMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: message.trim(),
      timestamp: new Date(),
      isVoice: isListening
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const endpoint = isAuthenticated 
        ? '/api/v1/ai-agents/tenant/care-inquiry'
        : '/api/v1/ai-agents/public/inquiry';

      const requestBody = isAuthenticated
        ? {
            message: message.trim(),
            inquiryType,
            residentId,
            careContext,
            urgencyLevel,
            confidentialityLevel: residentId ? 'SENSITIVE' : 'STANDARD',
            sessionId
          }
        : {
            message: message.trim(),
            inquiryType,
            sessionId
          };

      const headers: any = {
        'Content-Type': 'application/json'
      };

      if (isAuthenticated) {
        headers['Authorization'] = `Bearer ${userToken}`;
        headers['X-Tenant-ID'] = tenantId;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const agentMessage: MobileMessage = {
          id: data.data.responseId,
          type: 'agent',
          content: data.data.message,
          timestamp: new Date(),
          confidence: data.data.confidence,
          actionItems: data.data.actionItems || data.data.careRecommendations,
          escalated: data.data.escalationRequired
        };

        setMessages(prev => [...prev, agentMessage]);
        setSessionId(data.sessionId);

        // Handle escalation
        if (data.data.escalationRequired) {
          Vibration.vibrate([0, 500, 200, 500]); // Alert vibration pattern
          
          if (onEscalation) {
            onEscalation({
              sessionId: data.sessionId,
              inquiryType,
              urgencyLevel,
              residentId
            });
          }

          const escalationMessage: MobileMessage = {
            id: `escalation_${Date.now()}`,
            type: 'system',
            content: isAuthenticated
              ? "This inquiry has been escalated to your care team. You should receive follow-up within 30 minutes."
              : "I've escalated your inquiry to our specialist team. You can expect a follow-up within 2 hours.",
            timestamp: new Date(),
            escalated: true
          };
          
          setMessages(prev => [...prev, escalationMessage]);
        }

        // Cache updated messages
        await cacheMessages();

      } else {
        throw new Error(data.message || 'Failed to get response');
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: MobileMessage = {
        id: `error_${Date.now()}`,
        type: 'system',
        content: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Voice input requires microphone permission.');
        return;
      }

      await Voice.start('en-GB'); // UK English
      setIsRecording(true);
      Vibration.vibrate(100); // Start recording vibration

    } catch (error) {
      console.error('Voice recording failed:', error);
      Alert.alert('Voice Error', 'Failed to start voice recording.');
    }
  };

  const stopVoiceRecording = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
      setIsListening(false);
      Vibration.vibrate(100); // Stop recording vibration

    } catch (error) {
      console.error('Failed to stop voice recording:', error);
    }
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergency Protocol',
      'This will immediately escalate to your care team. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Emergency',
          style: 'destructive',
          onPress: () => {
            setUrgencyLevel('CRITICAL');
            sendMessage(`EMERGENCY: ${inputText}`, 'EMERGENCY');
            setInputText('');
          }
        }
      ]
    );
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const cleanup = async () => {
    try {
      await Voice.destroy();
      await cacheMessages();
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  };

  const { width } = Dimensions.get('window');
  const isTablet = width >= 768;

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <View style={{
        padding: 16,
        backgroundColor: isAuthenticated ? '#10b981' : '#3b82f6',
        paddingTop: 50
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons 
              name={isAuthenticated ? "medical" : "help-circle"} 
              size={24} 
              color="white" 
            />
            <View style={{ marginLeft: 12 }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
                {isAuthenticated ? 'Care Assistant' : 'Customer Support'}
              </Text>
              <Text style={{ color: 'white', opacity: 0.8, fontSize: 12 }}>
                {isAuthenticated ? 'Secure • Encrypted' : 'Product Information'}
              </Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="shield-checkmark" size={16} color="white" />
            <Text style={{ color: 'white', fontSize: 10, marginLeft: 4 }}>
              {isAuthenticated ? 'Tenant Isolated' : 'Secure'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={{
              flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
              marginBottom: 16,
              alignItems: 'flex-end'
            }}
          >
            {/* Avatar */}
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: message.type === 'user' 
                ? '#3b82f6' 
                : message.type === 'system' 
                ? '#f59e0b' 
                : '#10b981',
              justifyContent: 'center',
              alignItems: 'center',
              marginHorizontal: 8
            }}>
              <Ionicons
                name={
                  message.type === 'user' ? "person" :
                  message.type === 'system' ? "warning" : "medical"
                }
                size={16}
                color="white"
              />
            </View>

            {/* Message Bubble */}
            <View style={{
              maxWidth: width * 0.75,
              padding: 12,
              borderRadius: 16,
              backgroundColor: message.type === 'user' 
                ? '#3b82f6' 
                : message.type === 'system'
                ? '#fef3c7'
                : '#f3f4f6',
              borderWidth: message.escalated ? 2 : 0,
              borderColor: message.escalated ? '#ef4444' : 'transparent'
            }}>
              <Text style={{
                color: message.type === 'user' ? 'white' : '#374151',
                fontSize: 14,
                lineHeight: 20
              }}>
                {message.content}
              </Text>

              {/* Voice indicator */}
              {message.isVoice && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="mic" size={12} color={message.type === 'user' ? 'white' : '#6b7280'} />
                  <Text style={{
                    fontSize: 10,
                    color: message.type === 'user' ? 'white' : '#6b7280',
                    marginLeft: 4
                  }}>
                    Voice message
                  </Text>
                </View>
              )}

              {/* Confidence indicator */}
              {message.type === 'agent' && message.confidence !== undefined && (
                <Text style={{
                  fontSize: 10,
                  color: message.confidence >= 0.8 ? '#10b981' : 
                         message.confidence >= 0.6 ? '#f59e0b' : '#ef4444',
                  marginTop: 4
                }}>
                  Confidence: {Math.round(message.confidence * 100)}%
                </Text>
              )}

              {/* Action Items */}
              {message.actionItems && message.actionItems.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                    Action Items:
                  </Text>
                  {message.actionItems.slice(0, 3).map((item, index) => (
                    <View key={index} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 2,
                      padding: 6,
                      backgroundColor: item.priority === 'URGENT' || item.priority === 'HIGH' 
                        ? '#fef2f2' 
                        : '#f0f9ff',
                      borderRadius: 6
                    }}>
                      <Ionicons 
                        name={
                          item.priority === 'URGENT' ? "alert-circle" :
                          item.priority === 'HIGH' ? "warning" : "checkmark-circle"
                        } 
                        size={12} 
                        color={
                          item.priority === 'URGENT' ? '#ef4444' :
                          item.priority === 'HIGH' ? '#f59e0b' : '#10b981'
                        } 
                      />
                      <Text style={{ fontSize: 11, color: '#374151', marginLeft: 4, flex: 1 }}>
                        {item.description || item.recommendation}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Timestamp */}
              <Text style={{
                fontSize: 10,
                color: message.type === 'user' ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                marginTop: 4,
                textAlign: message.type === 'user' ? 'right' : 'left'
              }}>
                {message.timestamp.toLocaleTimeString()}
              </Text>
            </View>
          </View>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#10b981',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 8
            }}>
              <Ionicons name="medical" size={16} color="white" />
            </View>
            <View style={{
              padding: 12,
              backgroundColor: '#f3f4f6',
              borderRadius: 16
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#6b7280', fontSize: 14 }}>Thinking</Text>
                <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                  <Text style={{ color: '#6b7280', opacity: 0.5 }}>•</Text>
                  <Text style={{ color: '#6b7280', opacity: 0.7 }}>•</Text>
                  <Text style={{ color: '#6b7280', opacity: 0.9 }}>•</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={{
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb'
      }}>
        {/* Urgency Level (for tenant users) */}
        {isAuthenticated && (
          <View style={{ flexDirection: 'row', marginBottom: 12, justifyContent: 'space-around' }}>
            {(['LOW', 'MEDIUM', 'HIGH'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setUrgencyLevel(level)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: urgencyLevel === level 
                    ? (level === 'HIGH' ? '#ef4444' : level === 'MEDIUM' ? '#f59e0b' : '#10b981')
                    : '#f3f4f6'
                }}
              >
                <Text style={{
                  color: urgencyLevel === level ? 'white' : '#6b7280',
                  fontSize: 12,
                  fontWeight: '500'
                }}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input Row */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          {/* Text Input */}
          <View style={{ flex: 1, marginRight: 8 }}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={isAuthenticated 
                ? "Ask about care, compliance, or documentation..."
                : "Ask about WriteCareNotes features, pricing, etc..."
              }
              multiline
              maxLength={isAuthenticated ? 1000 : 500}
              style={{
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: 'white',
                maxHeight: 100,
                fontSize: 14
              }}
              editable={!isLoading}
            />
          </View>

          {/* Voice Button */}
          <TouchableOpacity
            onPressIn={startVoiceRecording}
            onPressOut={stopVoiceRecording}
            disabled={isLoading}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: isRecording ? '#ef4444' : '#6b7280',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 8
            }}
          >
            <Ionicons 
              name={isRecording ? "stop" : "mic"} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>

          {/* Send Button */}
          <TouchableOpacity
            onPress={() => sendMessage(inputText)}
            disabled={isLoading || !inputText.trim()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: (!inputText.trim() || isLoading) ? '#d1d5db' : '#3b82f6',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>

          {/* Emergency Button (for tenant users) */}
          {isAuthenticated && (
            <TouchableOpacity
              onPress={handleEmergency}
              disabled={isLoading || !inputText.trim()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#ef4444',
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: 8
              }}
            >
              <Ionicons name="warning" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 12 }}
          contentContainerStyle={{ paddingHorizontal: 4 }}
        >
          {isAuthenticated ? (
            <>
              <TouchableOpacity
                onPress={() => sendMessage("Help me improve this care note", "DOCUMENTATION")}
                disabled={isLoading}
                style={{ marginRight: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f3f4f6', borderRadius: 16 }}
              >
                <Text style={{ fontSize: 12, color: '#374151' }}>Improve Documentation</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => sendMessage("Check compliance status", "COMPLIANCE")}
                disabled={isLoading}
                style={{ marginRight: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f3f4f6', borderRadius: 16 }}
              >
                <Text style={{ fontSize: 12, color: '#374151' }}>Compliance Check</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => sendMessage("Suggest care interventions", "CARE_PLAN")}
                disabled={isLoading}
                style={{ marginRight: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f3f4f6', borderRadius: 16 }}
              >
                <Text style={{ fontSize: 12, color: '#374151' }}>Care Suggestions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => sendMessage("Assess current risks", "RISK_ASSESSMENT")}
                disabled={isLoading}
                style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f3f4f6', borderRadius: 16 }}
              >
                <Text style={{ fontSize: 12, color: '#374151' }}>Risk Assessment</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => sendMessage("Tell me about pricing", "PRICING")}
                disabled={isLoading}
                style={{ marginRight: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f3f4f6', borderRadius: 16 }}
              >
                <Text style={{ fontSize: 12, color: '#374151' }}>Pricing</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => sendMessage("What features do you offer?", "FEATURE")}
                disabled={isLoading}
                style={{ marginRight: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f3f4f6', borderRadius: 16 }}
              >
                <Text style={{ fontSize: 12, color: '#374151' }}>Features</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => sendMessage("How do you ensure compliance?", "COMPLIANCE")}
                disabled={isLoading}
                style={{ marginRight: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f3f4f6', borderRadius: 16 }}
              >
                <Text style={{ fontSize: 12, color: '#374151' }}>Compliance</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => sendMessage("I'd like a demo", "DEMO")}
                disabled={isLoading}
                style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f3f4f6', borderRadius: 16 }}
              >
                <Text style={{ fontSize: 12, color: '#374151' }}>Demo</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        {/* Security Notice */}
        {isAuthenticated && (
          <View style={{
            marginTop: 8,
            padding: 8,
            backgroundColor: '#f0fdf4',
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Ionicons name="shield-checkmark" size={12} color="#10b981" />
            <Text style={{ fontSize: 10, color: '#10b981', marginLeft: 4, flex: 1 }}>
              Encrypted • Tenant isolated • Audit logged
            </Text>
          </View>
        )}

        {/* Voice Status */}
        {(isListening || isRecording) && (
          <View style={{
            marginTop: 8,
            padding: 8,
            backgroundColor: '#fef2f2',
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Ionicons 
              name={isRecording ? "mic" : "ear"} 
              size={16} 
              color="#ef4444" 
            />
            <Text style={{ fontSize: 12, color: '#ef4444', marginLeft: 8 }}>
              {isRecording ? 'Recording...' : 'Listening...'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default MobileAIAssistant;