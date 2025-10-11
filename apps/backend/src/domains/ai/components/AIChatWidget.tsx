import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  X, 
  Minimize2, 
  Maximize2,
  Bot,
  User,
  Loader2,
  Volume2,
  VolumeX
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    agentType?: string;
    processingTime?: number;
  };
}

interface AIChatWidgetProps {
  agentType?: 'voice-note' | 'roster-optimize' | 'risk-flag';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark';
  compact?: boolean;
}

const AIChatWidget: React.FC<AIChatWidgetProps> = ({
  agentType = 'voice-note',
  position = 'bottom-right',
  theme = 'light',
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [agentStatus, setAgentStatus] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize chat with welcome message
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'agent',
      content: getWelcomeMessage(agentType),
      timestamp: new Date(),
      metadata: { agentType }
    };
    setMessages([welcomeMessage]);

    // Fetch agent status
    fetchAgentStatus();
  }, [agentType]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchAgentStatus = async () => {
    try {
      const response = await fetch('/api/ai-agents/status');
      const status = await response.json();
      setAgentStatus(status);
    } catch (error) {
      console.error('Failed to fetch agent status:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getWelcomeMessage = (type: string): string => {
    switch (type) {
      case 'voice-note':
        return "Hello! I'm the Voice-to-Note Agent. I can help you transcribe voice recordings and generate structured care notes. How can I assist you today?";
      case 'roster-optimize':
        return "Hi! I'm the Smart Roster Agent. I can help optimize staff schedules and manage shift assignments. What would you like to know?";
      case 'risk-flag':
        return "Hello! I'm the Risk Flag Agent. I monitor resident data for potential health risks and anomalies. How can I help you today?";
      default:
        return "Hello! I'm your AI assistant. How can I help you today?";
    }
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'voice-note':
        return <Mic className="h-4 w-4" />;
      case 'roster-optimize':
        return <MessageCircle className="h-4 w-4" />;
      case 'risk-flag':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getAgentName = (type: string): string => {
    switch (type) {
      case 'voice-note':
        return 'Voice-to-Note Agent';
      case 'roster-optimize':
        return 'Smart Roster Agent';
      case 'risk-flag':
        return 'Risk Flag Agent';
      default:
        return 'AI Assistant';
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-agents/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          agentType,
          context: { timestamp: new Date().toISOString() },
        }),
      });

      const data = await response.json();

      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: data.message,
        timestamp: new Date(),
        metadata: {
          agentType,
          confidence: data.confidence || 0.9,
          processingTime: data.processingTime || 0,
        },
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    // In a real implementation, this would start voice recording
    console.log('Starting voice recording...');
  };

  const stopRecording = () => {
    setIsRecording(false);
    // In a real implementation, this would stop recording and process audio
    console.log('Stopping voice recording...');
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4';
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

  const getThemeClasses = () => {
    return theme === 'dark' 
      ? 'bg-gray-900 text-white border-gray-700' 
      : 'bg-white text-gray-900 border-gray-200';
  };

  if (!isOpen) {
    return (
      <div className={`fixed ${getPositionClasses()} z-50`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          {getAgentIcon(agentType)}
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50`}>
      <Card className={`w-80 h-96 shadow-xl ${getThemeClasses()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getAgentIcon(agentType)}
              <CardTitle className="text-sm font-medium">
                {getAgentName(agentType)}
              </CardTitle>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {agentStatus && (
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-100 text-green-800 text-xs">
                {agentStatus.status}
              </Badge>
              <span className="text-xs text-gray-500">
                {agentStatus.processedCount} processed
              </span>
            </div>
          )}
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : message.type === 'agent'
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === 'agent' && (
                          <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        )}
                        {message.type === 'user' && (
                          <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs opacity-70">
                              {formatTime(message.timestamp)}
                            </span>
                            {message.metadata?.confidence && (
                              <span className="text-xs opacity-70">
                                {Math.round(message.metadata.confidence * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center space-x-2">
                      <Bot className="h-4 w-4" />
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-3">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <div className="flex-1 flex space-x-1">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={isRecording ? 'bg-red-500 text-white' : ''}
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleMute}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!inputValue.trim() || isLoading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default AIChatWidget;