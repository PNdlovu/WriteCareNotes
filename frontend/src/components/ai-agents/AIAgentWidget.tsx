/**
 * @fileoverview AI Agent Widget Component
 * @module AIAgentWidget
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-14
 * 
 * @description Floating widget that provides access to AI agents based on authentication status
 */

import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PublicAIAgentChat from './PublicAIAgentChat';
import TenantAIAssistant from './TenantAIAssistant';

interface AIAgentWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  residentId?: string;
  careContext?: any;
  defaultOpen?: boolean;
}

/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const AIAgentWidget: React.FC<AIAgentWidgetProps> = ({
  position = 'bottom-right',
  residentId,
  careContext,
  defaultOpen = false
}) => {
  const { user, tenant } = useAuth();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  const handleEscalation = (escalationData: any) => {
    // Handle escalation notification
    console.log('AI Agent escalation:', escalationData);
    
    // In production, this would trigger notifications to appropriate staff
    if (window.Notification && Notification.permission === 'granted') {
      new Notification('Care Assistant Escalation', {
        body: 'An AI assistant inquiry has been escalated and requires attention.',
        icon: '/favicon.ico',
        tag: 'ai-escalation'
      });
    }
  };

  const isAuthenticated = user && tenant;

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <div className={`fixed ${getPositionClasses()} z-50`}>
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            title={isAuthenticated ? 'Open Care Assistant' : 'Open Customer Support'}
          >
            {isAuthenticated ? (
              <MessageCircle className="w-6 h-6" />
            ) : (
              <MessageCircle className="w-6 h-6" />
            )}
          </button>
          
          {/* Notification badge for escalations */}
          {isAuthenticated && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              <MessageCircle className="w-2 h-2" />
            </div>
          )}
        </div>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className={`fixed ${getPositionClasses()} z-50`}>
          <div className={`bg-white rounded-lg shadow-2xl border transition-all duration-200 ${
            isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
          }`}>
            {/* Widget Header */}
            <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-lg">
              <div className="flex items-center space-x-2">
                {isAuthenticated ? (
                  <>
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-sm">Care Assistant</h4>
                      <p className="text-xs text-gray-500">Secure • {tenant || 'Organization'}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-sm">Customer Support</h4>
                      <p className="text-xs text-gray-500">Ask about WriteCareNotes</p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                  title={isMinimized ? 'Expand' : 'Minimize'}
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            {!isMinimized && (
              <div className="h-[calc(600px-4rem)]">
                {isAuthenticated ? (
                  <TenantAIAssistant
                    residentId={residentId}
                    careContext={careContext}
                    onEscalation={handleEscalation}
                  />
                ) : (
                  <PublicAIAgentChat />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default AIAgentWidget;