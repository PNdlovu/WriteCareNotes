/**
 * @fileoverview Public AI Agent Chat Component
 * @module PublicAIAgentChat
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-14
 * 
 * @description React component for public customer support AI agent chat interface
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ExternalLink, Calendar, Download, Phone } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  confidence?: number;
  suggestedActions?: SuggestedAction[];
  followUpQuestions?: string[];
}

interface SuggestedAction {
  type: 'SCHEDULE_DEMO' | 'DOWNLOAD_BROCHURE' | 'CONTACT_SALES' | 'VIEW_CASE_STUDY' | 'COMPLIANCE_GUIDE';
  label: string;
  url?: string;
  parameters?: Record<string, any>;
}

interface UserContext {
  organizationType?: string;
  organizationSize?: string;
  currentSoftware?: string;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
  contactPreference?: 'EMAIL' | 'PHONE' | 'VIDEO';
}

export const PublicAIAgentChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'agent',
      content: "Hello! I'm here to help you learn about WriteCareNotes, the UK's leading care home management system. I can assist with product information, compliance questions, pricing, and scheduling demos. How can I help you today?",
      timestamp: new Date(),
      confidence: 1.0,
      suggestedActions: [
        {
          type: 'VIEW_CASE_STUDY',
          label: 'View Case Studies',
          url: '/case-studies'
        },
        {
          type: 'SCHEDULE_DEMO',
          label: 'Schedule Demo',
          url: '/schedule-demo'
        }
      ],
      followUpQuestions: [
        "What type of care organization are you working with?",
        "Are you looking to replace an existing system?",
        "What's your biggest challenge with care management?"
      ]
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<UserContext>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (message: string, inquiryType: string = 'GENERAL') => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/ai-agents/public/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message.trim(),
          inquiryType,
          userContext,
          sessionId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const agentMessage: Message = {
          id: data.data.responseId,
          type: 'agent',
          content: data.data.message,
          timestamp: new Date(),
          confidence: data.data.confidence,
          suggestedActions: data.data.suggestedActions,
          followUpQuestions: data.data.followUpQuestions
        };

        setMessages(prev => [...prev, agentMessage]);
        setSessionId(data.sessionId);

        // Show escalation notice if required
        if (data.data.escalationRequired) {
          const escalationMessage: Message = {
            id: `escalation_${Date.now()}`,
            type: 'system',
            content: "I've escalated your inquiry to our specialist team. You can expect a follow-up within 2 hours, or contact us directly for immediate assistance.",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, escalationMessage]);
        }

      } else {
        throw new Error(data.message || 'Failed to get response');
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        type: 'system',
        content: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment, or contact our support team directly.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedAction = (action: SuggestedAction) => {
    if (action.url) {
      window.open(action.url, '_blank');
    }
    
    // Track action for analytics
    fetch('/api/v1/analytics/ai-agent-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        actionType: action.type,
        actionLabel: action.label,
        timestamp: new Date()
      })
    }).catch(console.error);
  };

  const handleFollowUpQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'SCHEDULE_DEMO':
        return <Calendar className="w-4 h-4" />;
      case 'DOWNLOAD_BROCHURE':
        return <Download className="w-4 h-4" />;
      case 'CONTACT_SALES':
        return <Phone className="w-4 h-4" />;
      case 'VIEW_CASE_STUDY':
      case 'COMPLIANCE_GUIDE':
        return <ExternalLink className="w-4 h-4" />;
      default:
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-white rounded-lg shadow-lg border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-50">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">WriteCareNotes Assistant</h3>
            <p className="text-sm text-gray-600">Ask me about our care management system</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-500">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-2' : 'mr-2'}`}>
                {message.type === 'user' ? (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className={`rounded-lg p-3 ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : message.type === 'system'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-gray-100'
              }`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Confidence indicator for agent messages */}
                {message.type === 'agent' && message.confidence !== undefined && (
                  <div className="mt-2 text-xs opacity-75">
                    <span className={getConfidenceColor(message.confidence)}>
                      Confidence: {Math.round(message.confidence * 100)}%
                    </span>
                  </div>
                )}

                {/* Suggested Actions */}
                {message.suggestedActions && message.suggestedActions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Suggested actions:</p>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestedActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestedAction(action)}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm rounded-full transition-colors"
                        >
                          {getActionIcon(action.type)}
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up Questions */}
                {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">You might also ask:</p>
                    <div className="space-y-1">
                      {message.followUpQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleFollowUpQuestion(question)}
                          className="block text-left text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          "{question}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className="mt-2 text-xs opacity-60">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* User Context Form */}
      {messages.length === 1 && (
        <div className="px-4 py-2 border-t bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">Help me provide better assistance:</p>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={userContext.organizationType || ''}
              onChange={(e) => setUserContext(prev => ({ ...prev, organizationType: e.target.value }))}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="">Organization Type</option>
              <option value="care_home">Care Home</option>
              <option value="nursing_home">Nursing Home</option>
              <option value="domiciliary_care">Domiciliary Care</option>
              <option value="care_group">Care Group</option>
            </select>
            <select
              value={userContext.organizationSize || ''}
              onChange={(e) => setUserContext(prev => ({ ...prev, organizationSize: e.target.value }))}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="">Organization Size</option>
              <option value="small">Small (under 20 beds)</option>
              <option value="medium">Medium (20-50 beds)</option>
              <option value="large">Large (50+ beds)</option>
              <option value="multi_site">Multi-site</option>
            </select>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about WriteCareNotes features, pricing, compliance, or anything else..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={() => sendMessage(inputMessage)}
            disabled={isLoading || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            onClick={() => sendMessage("Tell me about your pricing", "PRICING")}
            disabled={isLoading}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
          >
            Pricing
          </button>
          <button
            onClick={() => sendMessage("How do you ensure CQC compliance?", "COMPLIANCE")}
            disabled={isLoading}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
          >
            Compliance
          </button>
          <button
            onClick={() => sendMessage("What features do you offer?", "FEATURE")}
            disabled={isLoading}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => sendMessage("I'd like to schedule a demo", "DEMO")}
            disabled={isLoading}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
          >
            Demo
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 mt-2">
          This AI assistant provides general information. For specific requirements, our specialists will follow up with you.
        </p>
      </div>
    </div>
  );
};

export default PublicAIAgentChat;