import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Loader2, 
  User, 
  X,
  MessageSquare,
  Brain,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Shield,
  Zap,
  Sparkles,
  Minimize2
} from 'lucide-react';

const AIChatbot = ({ incident }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [typingMessage, setTypingMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingMessage]);

  // Typing animation effect
  const typeMessage = (fullMessage, callback) => {
    setIsTyping(true);
    setTypingMessage('');
    let currentIndex = 0;
    
    // Clear any existing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    
    typingIntervalRef.current = setInterval(() => {
      if (currentIndex < fullMessage.length) {
        setTypingMessage(fullMessage.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingIntervalRef.current);
        setIsTyping(false);
        setTypingMessage('');
        if (callback) callback();
      }
    }, 15); // Adjust speed here (lower = faster)
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  // Initialize with a welcome message when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeText = `Hello! I'm your AI assistant for incident analysis.\n\n**${incident.title}**\n\nI can help you with:\n• Root cause analysis\n• Similar past incidents\n• Recommended actions\n• Impact assessment\n\nHow can I help you today?`;
      
      // Type the welcome message
      typeMessage(welcomeText, () => {
        setMessages([
          {
            id: Date.now(),
            type: 'bot',
            content: welcomeText,
            timestamp: new Date()
          }
        ]);
      });
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call the analyze API with incident details
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: incident.title,
          description: `${incident.description}\n\nUser Question: ${inputMessage}`,
          service: incident.source || incident.location || 'system'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Format the bot response
      let botMessageContent = '';

      if (data.analysis) {
        botMessageContent += `${data.analysis}\n\n`;
      }

      if (data.similar_past_incidents && data.similar_past_incidents.length > 0) {
        botMessageContent += `**Similar Past Incidents:**\n`;
        data.similar_past_incidents.forEach((incident, index) => {
          botMessageContent += `${index + 1}. **${incident.id}** - ${incident.title} (${Math.round(incident.similarity * 100)}% match)\n`;
        });
        botMessageContent += '\n';
      }

      if (data.used_rag) {
        botMessageContent += `✨ *Enhanced with RAG technology*`;
      }

      const finalContent = botMessageContent || 'I received your message but couldn\'t generate a proper response. Please try again.';

      // Type the response with animation
      typeMessage(finalContent, () => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: finalContent,
          timestamp: new Date(),
          data: data
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Error calling AI API:', error);
      
      const errorContent = `I'm sorry, I encountered an error while analyzing your request.\n\nPlease make sure the AI service is running on http://localhost:8000 and try again.\n\nError: ${error.message}`;
      
      typeMessage(errorContent, () => {
        const errorMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: errorContent,
          timestamp: new Date(),
          isError: true
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content) => {
    // Split by ** for bold text
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Split by newlines and render
      return part.split('\n').map((line, lineIndex) => (
        <span key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < part.split('\n').length - 1 && <br />}
        </span>
      ));
    });
  };

  const quickQuestions = [
    "What could be the root cause?",
    "Show me similar past incidents",
    "What actions should I take?",
    "What's the potential impact?"
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  if (!isOpen) {
    return (
      <div className="space-y-3">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200 hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h5 className="font-semibold text-gray-900 text-sm">AI Assistant</h5>
                <p className="text-gray-600 text-xs">Get instant help and analysis</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm flex items-center space-x-2 shadow-md hover:shadow-lg"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Open Chat</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-semibold text-sm">AI Assistant</h5>
              <p className="text-xs text-purple-100">Powered by AI</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Minimize Chat"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Container */}
        <div className="h-96 overflow-y-auto p-4 bg-gray-50 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start space-x-2 max-w-[85%] ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user'
                      ? 'bg-blue-600'
                      : message.isError
                      ? 'bg-red-600'
                      : 'bg-gradient-to-br from-purple-600 to-indigo-600'
                  }`}
                >
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : message.isError ? (
                    <AlertCircle className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.isError
                      ? 'bg-red-50 text-red-900 border border-red-200'
                      : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-line">
                    {formatMessage(message.content)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Animation */}
          {isTyping && typingMessage && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2 max-w-[85%]">
                <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl px-4 py-2.5 border border-gray-200 shadow-sm">
                  <div className="text-sm leading-relaxed whitespace-pre-line text-gray-800">
                    {formatMessage(typingMessage)}
                    <span className="inline-block w-1 h-4 bg-purple-600 ml-1 animate-pulse"></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && !isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl px-4 py-2.5 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length <= 1 && !isLoading && !isTyping && (
          <div className="px-4 py-2 bg-white border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2 font-medium">Quick questions:</p>
            <div className="flex flex-wrap gap-1.5">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors border border-purple-200 font-medium"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={isLoading || isTyping}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || isTyping}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px]"
            >
              {isLoading || isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
