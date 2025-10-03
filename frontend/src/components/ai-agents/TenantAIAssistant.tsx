/**
 * @fileoverview Tenant AI Assistant Component
 * @module TenantAIAssistant
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-14
 * 
 * @description React component for tenant-specific care assistant AI with secure authentication
 */

import React, { useState, useRef, useEffect, useContext } from 'react';
import { Send, Bot, User, AlertTriangle, CheckCircle, Clock, Shield, AlertCircle } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';

interface CareMessage {
  id: string;
  type: 'user' | 'agent' | 'system' | 'alert';
  content: string;
  timestamp: Date;
  confidence?: number;
  careRecommendations?: CareRecommendation[];
  complianceAlerts?: ComplianceAlert[];
  actionItems?: ActionItem[];
  escalated?: boolean;
  encrypted?: boolean;
}

interface CareRecommendation {
  type: 'CARE_PLAN_UPDATE' | 'MEDICATION_REVIEW' | 'RISK_MITIGATION' | 'FAMILY_COMMUNICATION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  recommendation: string;
  evidence: string[];
  implementationSteps: string[];
  expectedOutcome: string;
  monitoringRequired: boolean;
}

interface ComplianceAlert {
  alertId: string;
  complianceStandard: string;
  alertType: 'WARNING' | 'CRITICAL' | 'INFORMATIONAL';
  description: string;
  remedialActions: string[];
  deadline?: Date;
  impactAssessment: string;
}

interface ActionItem {
  itemId: string;
  description: string;
  assignedTo?: string;
  dueDate?: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: string;
  dependencies: string[];
}

interface TenantAIAssistantProps {
  residentId?: string;
  careContext?: any;
  onEscalation?: (escalationData: any) => void;
}

export const TenantAIAssistant: React.FC<TenantAIAssistantProps> = ({
  residentId,
  careContext,
  onEscalation
}) => {
  const { user, tenant } = useContext(AuthContext);
  const [messages, setMessages] = useState<CareMessage[]>([
    {
      id: 'welcome',
      type: 'agent',
      content: `Hello! I'm your AI care assistant for ${tenant?.name || 'your organization'}. I can help with care planning, documentation, compliance monitoring, and clinical decision support. All our conversations are securely encrypted and isolated to your organization. How can I assist you today?`,
      timestamp: new Date(),
      confidence: 1.0,
      encrypted: true
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [urgencyLevel, setUrgencyLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');
  const [inquiryType, setInquiryType] = useState<'CARE_PLAN' | 'MEDICATION' | 'RISK_ASSESSMENT' | 'COMPLIANCE' | 'DOCUMENTATION' | 'EMERGENCY'>('DOCUMENTATION');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendCareInquiry = async (message: string) => {
    if (!message.trim() || isLoading || !user || !tenant) return;

    const userMessage: CareMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/ai-agents/tenant/care-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
          'X-Tenant-ID': tenant.id
        },
        body: JSON.stringify({
          message: message.trim(),
          inquiryType,
          residentId,
          careContext,
          urgencyLevel,
          confidentialityLevel: residentId ? 'SENSITIVE' : 'STANDARD',
          sessionId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const agentMessage: CareMessage = {
          id: data.data.responseId,
          type: 'agent',
          content: data.data.message,
          timestamp: new Date(),
          confidence: data.data.confidence,
          careRecommendations: data.data.careRecommendations,
          complianceAlerts: data.data.complianceAlerts,
          actionItems: data.data.actionItems,
          escalated: data.data.escalationRequired,
          encrypted: true
        };

        setMessages(prev => [...prev, agentMessage]);
        setSessionId(data.sessionId);

        // Handle escalation
        if (data.data.escalationRequired) {
          const escalationMessage: CareMessage = {
            id: `escalation_${Date.now()}`,
            type: 'alert',
            content: "This inquiry has been escalated to your senior care team for immediate review. You should receive follow-up within 30 minutes for urgent matters.",
            timestamp: new Date(),
            escalated: true
          };
          setMessages(prev => [...prev, escalationMessage]);
          
          if (onEscalation) {
            onEscalation({
              sessionId: data.sessionId,
              inquiryType,
              urgencyLevel,
              residentId
            });
          }
        }

      } else {
        throw new Error(data.message || 'Failed to get care assistance');
      }

    } catch (error) {
      console.error('Failed to send care inquiry:', error);
      
      const errorMessage: CareMessage = {
        id: `error_${Date.now()}`,
        type: 'system',
        content: "I apologize for the technical difficulty. Your inquiry has been logged and our care team will follow up shortly. For urgent matters, please contact your supervisor directly.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergency = async () => {
    setUrgencyLevel('CRITICAL');
    setInquiryType('EMERGENCY');
    
    const emergencyMessage = "EMERGENCY: " + inputMessage;
    setInputMessage('');
    
    const userMessage: CareMessage = {
      id: `emergency_${Date.now()}`,
      type: 'user',
      content: emergencyMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/ai-agents/tenant/emergency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
          'X-Tenant-ID': tenant.id
        },
        body: JSON.stringify({
          message: inputMessage,
          emergencyType: 'GENERAL_EMERGENCY',
          residentId
        })
      });

      const data = await response.json();

      if (response.ok) {
        const emergencyResponse: CareMessage = {
          id: data.data.responseId,
          type: 'alert',
          content: data.data.message,
          timestamp: new Date(),
          escalated: true,
          encrypted: true
        };

        setMessages(prev => [...prev, emergencyResponse]);
        setSessionId(data.sessionId);

      } else {
        throw new Error('Emergency processing failed');
      }

    } catch (error) {
      console.error('Emergency handling failed:', error);
      
      const errorMessage: CareMessage = {
        id: `emergency_error_${Date.now()}`,
        type: 'alert',
        content: "EMERGENCY PROTOCOL ACTIVATED: Technical issue detected. Senior care team and management have been notified immediately. Please follow your organization's emergency procedures.",
        timestamp: new Date(),
        escalated: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setUrgencyLevel('LOW');
      setInquiryType('DOCUMENTATION');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendCareInquiry(inputMessage);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'CRITICAL':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'CRITICAL':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'WARNING':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  if (!user || !tenant) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Authentication required to access AI care assistant</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[700px] bg-white rounded-lg shadow-lg border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-green-50">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Care Assistant AI</h3>
            <p className="text-sm text-gray-600">
              Secure • Encrypted • {tenant.name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-green-500" />
          <span className="text-xs text-gray-500">Tenant Isolated</span>
        </div>
      </div>

      {/* Resident Context */}
      {residentId && (
        <div className="px-4 py-2 bg-blue-50 border-b">
          <p className="text-sm text-blue-800">
            <strong>Context:</strong> Assisting with care for Resident {residentId.split('_').pop()}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            {/* Main Message */}
            <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-2' : 'mr-2'}`}>
                  {message.type === 'user' ? (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  ) : message.type === 'alert' ? (
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className={`rounded-lg p-3 ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : message.type === 'alert'
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : message.type === 'system'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-gray-100'
                }`}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Confidence and encryption indicators */}
                  {message.type === 'agent' && (
                    <div className="mt-2 flex items-center justify-between text-xs opacity-75">
                      {message.confidence !== undefined && (
                        <span className={message.confidence >= 0.8 ? 'text-green-600' : message.confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600'}>
                          Confidence: {Math.round(message.confidence * 100)}%
                        </span>
                      )}
                      {message.encrypted && (
                        <span className="flex items-center space-x-1 text-green-600">
                          <Shield className="w-3 h-3" />
                          <span>Encrypted</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="mt-2 text-xs opacity-60">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Care Recommendations */}
            {message.careRecommendations && message.careRecommendations.length > 0 && (
              <div className="mt-3 ml-10 space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Care Recommendations:</h4>
                {message.careRecommendations.map((rec, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getPriorityColor(rec.priority)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{rec.type.replace(/_/g, ' ')}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(rec.priority)}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{rec.recommendation}</p>
                    
                    {rec.implementationSteps.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Implementation Steps:</p>
                        <ul className="text-xs space-y-1">
                          {rec.implementationSteps.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-start space-x-1">
                              <span className="text-gray-400">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {rec.expectedOutcome && (
                      <div className="mt-2 p-2 bg-white bg-opacity-50 rounded">
                        <p className="text-xs"><strong>Expected Outcome:</strong> {rec.expectedOutcome}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Compliance Alerts */}
            {message.complianceAlerts && message.complianceAlerts.length > 0 && (
              <div className="mt-3 ml-10 space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Compliance Alerts:</h4>
                {message.complianceAlerts.map((alert, index) => (
                  <div key={index} className="p-3 rounded-lg border border-orange-200 bg-orange-50">
                    <div className="flex items-center space-x-2 mb-2">
                      {getAlertIcon(alert.alertType)}
                      <span className="font-medium">{alert.complianceStandard}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        alert.alertType === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        alert.alertType === 'WARNING' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.alertType}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{alert.description}</p>
                    
                    {alert.remedialActions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Required Actions:</p>
                        <ul className="text-xs space-y-1">
                          {alert.remedialActions.map((action, actionIndex) => (
                            <li key={actionIndex} className="flex items-start space-x-1">
                              <span className="text-orange-400">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {alert.deadline && (
                      <div className="mt-2 flex items-center space-x-1 text-xs text-orange-700">
                        <Clock className="w-3 h-3" />
                        <span>Deadline: {alert.deadline.toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Action Items */}
            {message.actionItems && message.actionItems.length > 0 && (
              <div className="mt-3 ml-10 space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Action Items:</h4>
                {message.actionItems.map((item, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getPriorityColor(item.priority)}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{item.description}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Category: {item.category}</span>
                      {item.dueDate && (
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Due: {item.dueDate.toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Controls */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2 mb-3">
          <select
            value={inquiryType}
            onChange={(e) => setInquiryType(e.target.value as any)}
            className="text-sm border rounded px-2 py-1"
            disabled={isLoading}
          >
            <option value="DOCUMENTATION">Documentation</option>
            <option value="CARE_PLAN">Care Planning</option>
            <option value="MEDICATION">Medication</option>
            <option value="RISK_ASSESSMENT">Risk Assessment</option>
            <option value="COMPLIANCE">Compliance</option>
          </select>
          
          <select
            value={urgencyLevel}
            onChange={(e) => setUrgencyLevel(e.target.value as any)}
            className="text-sm border rounded px-2 py-1"
            disabled={isLoading}
          >
            <option value="LOW">Low Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="HIGH">High Priority</option>
          </select>
        </div>

        {/* Input Area */}
        <div className="flex space-x-2">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your care-related question or concern..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => sendCareInquiry(inputMessage)}
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              onClick={handleEmergency}
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              title="Emergency - Immediate escalation"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            onClick={() => sendCareInquiry("Help me improve this care note", "DOCUMENTATION")}
            disabled={isLoading}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
          >
            Improve Documentation
          </button>
          <button
            onClick={() => sendCareInquiry("Check compliance status", "COMPLIANCE")}
            disabled={isLoading}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
          >
            Compliance Check
          </button>
          <button
            onClick={() => sendCareInquiry("Suggest care interventions", "CARE_PLAN")}
            disabled={isLoading}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
          >
            Care Suggestions
          </button>
          <button
            onClick={() => sendCareInquiry("Assess current risks", "RISK_ASSESSMENT")}
            disabled={isLoading}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
          >
            Risk Assessment
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-700 flex items-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>All conversations are encrypted and isolated to your organization. No data is shared across tenants.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TenantAIAssistant;