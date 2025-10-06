import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface QuickQuestion {
  question: string;
  category: 'features' | 'pricing' | 'compliance' | 'demo';
}

const quickQuestions: QuickQuestion[] = [
  { question: "What makes WriteCareNotes different?", category: 'features' },
  { question: "Show me pricing options", category: 'pricing' },
  { question: "How does RAG AI Policy Assistant work?", category: 'features' },
  { question: "Is it CQC compliant?", category: 'compliance' },
  { question: "Can I schedule a demo?", category: 'demo' },
  { question: "What about data security?", category: 'compliance' },
];

const aiResponses: Record<string, string> = {
  "what makes writecarenotes different": `🚀 **Unique Differentiators:**

• **RAG AI Policy Assistant** - ONLY platform with verified, source-based policy generation (24-36 month market lead)
• **7 Jurisdiction Compliance** - England, Scotland, Wales, Northern Ireland, Isle of Man, Jersey, Guernsey
• **WriteCare Connect** - Integrated real-time communications with AI moderation
• **30+ Microservices** - Enterprise-grade scalability
• **Document Intelligence** - AI-powered document analysis with multi-cloud storage

We're not just software - we're a complete care management ecosystem built by care professionals, for care professionals.`,

  "show me pricing options": `💰 **Enterprise Pricing (Transparent & Fair):**

**Starter** - £199/month
• Up to 50 residents
• Core care management
• Mobile apps (iOS/Android)
• Email support

**Professional** - £399/month
• Up to 150 residents
• RAG AI Policy Assistant
• WriteCare Connect
• Document Intelligence
• Priority support

**Enterprise** - Custom pricing
• Unlimited residents
• Multi-site management
• Dedicated account manager
• Custom integrations
• 24/7 premium support
• White-label options

💡 **ROI: Average savings of £8,400/year per home through reduced admin time**

Book a demo to discuss volume discounts!`,

  "how does rag ai policy assistant work": `🧠 **RAG AI Policy Assistant - Revolutionary Technology:**

**What is RAG?**
Retrieval-Augmented Generation - AI that doesn't hallucinate because it only uses verified sources.

**How It Works:**
1. **Verified Sources** - Indexes CQC, NICE, NHS guidelines, and your custom policies
2. **Smart Retrieval** - Finds exact relevant sections from verified documents
3. **Template-Based Synthesis** - Generates policies using approved templates
4. **Source Citations** - Every statement includes the source reference
5. **Multi-Jurisdiction** - Automatically adapts to England, Scotland, Wales, NI, etc.

**Why It Matters:**
❌ Traditional AI can make things up (hallucination)
✅ Our RAG AI ONLY uses verified, traceable sources

**Real Example:**
"Create infection control policy for England"
→ Retrieves CQC Regulation 12, NHS infection prevention guidelines
→ Generates policy with exact citations
→ 15 minutes instead of 8 hours

**Competitive Advantage:**
We're the ONLY care platform with this technology - 24-36 month market lead.`,

  "is it cqc compliant": `✅ **Full Regulatory Compliance - All British Isles:**

**England (CQC):**
• Regulations 9-20A (Fundamental Standards)
• KLOE (Key Lines of Enquiry) alignment
• Digital care records compliant
• Inspection-ready reports

**Scotland (Care Inspectorate):**
• Health and Social Care Standards
• Adult Support & Protection Act

**Wales (CIW - Care Inspectorates Wales):**
• Regulation and Inspection of Social Care Act
• Well-being of Future Generations Act

**Northern Ireland (RQIA):**
• DHSSPS Minimum Standards
• Quality Standards for Nursing Homes

**Crown Dependencies:**
• Isle of Man - DHSC compliance
• Jersey - Health & Social Services
• Guernsey - Committee for Health & Social Care

**Additional Certifications:**
🔐 ISO 27001 (Information Security)
🔐 ISO 9001 (Quality Management)
🔐 GDPR & UK DPA 2018 compliant
🔐 NHS Data Security & Protection Toolkit
🔐 Cyber Essentials Plus certified

**Automated Compliance:**
• Real-time regulation updates
• Automated compliance checking
• Inspection-ready documentation
• Audit trail for all changes`,

  "can i schedule a demo": `📅 **Absolutely! Let's Get You Started:**

**What You'll See in a Demo:**
• Live platform walkthrough (30 mins)
• RAG AI Policy Assistant in action
• WriteCare Connect communications
• Document Intelligence features
• Custom setup for your home(s)
• Q&A with our care experts

**Next Steps:**
1. **Book Your Demo** - Choose a convenient time
2. **Discovery Call** - We learn about your needs
3. **Personalized Demo** - Tailored to your requirements
4. **Trial Period** - 14-day free trial (no credit card)
5. **Onboarding** - Full migration support included

**Contact Options:**
📧 Email: demo@writecarenotes.com
📞 Phone: 0800 123 4567
🌐 Calendar: writecarenotes.com/book-demo

**Special Offer:**
Book this week → Get 2 months free on annual plans!

Ready to transform your care home?`,

  "what about data security": `🔐 **Enterprise-Grade Security (Bank-Level):**

**Infrastructure:**
• Multi-cloud redundancy (AWS, Azure, GCP)
• 99.99% uptime SLA
• Automated backups (every 6 hours)
• Disaster recovery < 1 hour RPO
• End-to-end encryption (AES-256)
• TLS 1.3 for all data in transit

**Access Control:**
• Role-based access control (RBAC)
• Multi-factor authentication (MFA)
• Single Sign-On (SSO) support
• Audit logs for all access
• Session management & timeout

**Compliance & Certifications:**
✅ ISO 27001 (Information Security)
✅ ISO 27017 (Cloud Security)
✅ ISO 27018 (Cloud Privacy)
✅ GDPR & UK DPA 2018
✅ NHS Data Security Toolkit
✅ Cyber Essentials Plus
✅ SOC 2 Type II compliant

**Data Residency:**
• UK data centers only
• No international transfers
• GDPR Article 44-50 compliant
• Data sovereignty guaranteed

**Monitoring:**
• 24/7 security monitoring
• Intrusion detection systems
• Automated threat response
• Regular penetration testing
• Quarterly security audits

**Your Data Rights:**
• You own 100% of your data
• Export anytime (JSON/CSV)
• Delete on request (GDPR)
• No vendor lock-in

We treat your residents' data like family - because it is.`,

  "default": `👋 **Hello! I'm your WriteCareNotes AI Assistant.**

I can help you learn about:

✨ **Platform Features** - RAG AI, WriteCare Connect, Document Intelligence
💰 **Pricing & Plans** - Transparent pricing for all home sizes
📋 **Compliance** - CQC, Care Inspectorate, CIW, RQIA, Crown Dependencies
🔐 **Security** - Enterprise-grade protection
📅 **Book a Demo** - See the platform in action

**Quick Questions:**
• "What makes WriteCareNotes different?"
• "Show me pricing options"
• "How does RAG AI Policy Assistant work?"
• "Is it CQC compliant?"
• "Can I schedule a demo?"
• "What about data security?"

**Or ask me anything!** I'm here to help you find the perfect care management solution.`,
};

export const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: aiResponses.default,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findBestResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    // Direct matches
    for (const [key, response] of Object.entries(aiResponses)) {
      if (key === 'default') continue;
      if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
        return response;
      }
    }

    // Keyword matching
    if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('pricing')) {
      return aiResponses["show me pricing options"];
    }
    if (lowerQuery.includes('rag') || lowerQuery.includes('ai') || lowerQuery.includes('policy')) {
      return aiResponses["how does rag ai policy assistant work"];
    }
    if (lowerQuery.includes('cqc') || lowerQuery.includes('complian') || lowerQuery.includes('regulat')) {
      return aiResponses["is it cqc compliant"];
    }
    if (lowerQuery.includes('demo') || lowerQuery.includes('trial') || lowerQuery.includes('book')) {
      return aiResponses["can i schedule a demo"];
    }
    if (lowerQuery.includes('secur') || lowerQuery.includes('data') || lowerQuery.includes('gdpr')) {
      return aiResponses["what about data security"];
    }
    if (lowerQuery.includes('different') || lowerQuery.includes('unique') || lowerQuery.includes('why')) {
      return aiResponses["what makes writecarenotes different"];
    }

    return aiResponses.default;
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const aiResponse = findBestResponse(text);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Open AI Chat Assistant"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />
            <div className="relative flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-105">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="font-semibold">Ask AI Assistant</span>
              <MessageCircle className="w-6 h-6" />
            </div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">WriteCare AI Assistant</h3>
                <p className="text-xs text-blue-100">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 shadow-sm',
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
                  )}
                >
                  {message.type === 'ai' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-600">AI Assistant</span>
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-line leading-relaxed">
                    {message.content}
                  </div>
                  <div
                    className={cn(
                      'text-xs mt-2',
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                    )}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm text-gray-600">AI is typing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="px-4 py-3 bg-white border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-2">Quick Questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.slice(0, 3).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(q.question)}
                    className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    {q.question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about WriteCareNotes..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isTyping}
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
