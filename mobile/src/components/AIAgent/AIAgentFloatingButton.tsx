/**
 * @fileoverview AI Agent Floating Button Component
 * @module AIAgentFloatingButton
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-14
 * 
 * @description Floating action button for quick AI agent access in mobile app
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  PanResponder
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MobileAIAssistant from './MobileAIAssistant';

interface AIAgentFloatingButtonProps {
  tenantId?: string;
  userId?: string;
  userToken?: string;
  residentId?: string;
  careContext?: any;
  onEscalation?: (data: any) => void;
  position?: 'bottom-right' | 'bottom-left';
}

export const AIAgentFloatingButton: React.FC<AIAgentFloatingButtonProps> = ({
  tenantId,
  userId,
  userToken,
  residentId,
  careContext,
  onEscalation,
  position = 'bottom-right'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [dragPosition] = useState(new Animated.ValueXY());
  const { width, height } = Dimensions.get('window');

  const isAuthenticated = !!(tenantId && userId && userToken);

  // Pan responder for draggable floating button
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      dragPosition.setOffset({
        x: dragPosition.x._value,
        y: dragPosition.y._value
      });
    },
    onPanResponderMove: Animated.event(
      [null, { dx: dragPosition.x, dy: dragPosition.y }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: () => {
      dragPosition.flattenOffset();
      
      // Snap to edges
      const currentX = dragPosition.x._value;
      const currentY = dragPosition.y._value;
      
      const snapToRight = currentX > width / 2;
      const targetX = snapToRight ? width - 80 : 20;
      const targetY = Math.max(100, Math.min(height - 200, currentY));
      
      Animated.spring(dragPosition, {
        toValue: { x: targetX, y: targetY },
        useNativeDriver: false
      }).start();
    }
  });

  const getInitialPosition = () => {
    return position === 'bottom-right' 
      ? { x: width - 80, y: height - 200 }
      : { x: 20, y: height - 200 };
  };

  // Initialize position
  React.useEffect(() => {
    const initialPos = getInitialPosition();
    dragPosition.setValue(initialPos);
  }, []);

  const openAIAssistant = () => {
    setIsVisible(true);
  };

  const closeAIAssistant = () => {
    setIsVisible(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 56,
            height: 56,
            zIndex: 1000
          },
          {
            transform: [
              { translateX: dragPosition.x },
              { translateY: dragPosition.y }
            ]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={openAIAssistant}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: isAuthenticated ? '#10b981' : '#3b82f6',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 4
            },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 8
          }}
        >
          <Ionicons 
            name={isAuthenticated ? "medical" : "help-circle"} 
            size={24} 
            color="white" 
          />
          
          {/* Notification badge for escalations */}
          {isAuthenticated && (
            <View style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: '#ef4444',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Ionicons name="notifications" size={8} color="white" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* AI Assistant Modal */}
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeAIAssistant}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            paddingTop: 50,
            backgroundColor: isAuthenticated ? '#10b981' : '#3b82f6'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons 
                name={isAuthenticated ? "medical" : "help-circle"} 
                size={24} 
                color="white" 
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
                  {isAuthenticated ? 'AI Care Assistant' : 'Customer Support'}
                </Text>
                <Text style={{ color: 'white', opacity: 0.8, fontSize: 12 }}>
                  {isAuthenticated ? 'Secure • Encrypted' : 'Product Information'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              onPress={closeAIAssistant}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.2)',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* AI Assistant */}
          <MobileAIAssistant
            tenantId={tenantId}
            userId={userId}
            userToken={userToken}
            residentId={residentId}
            careContext={careContext}
            onEscalation={onEscalation}
          />
        </View>
      </Modal>
    </>
  );
};

export default AIAgentFloatingButton;