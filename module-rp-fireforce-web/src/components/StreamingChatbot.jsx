import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  X,
  MessageSquare,
  Brain,
  AlertCircle,
  Minimize2,
  Sparkles,
  Zap,
  ExternalLink,
  Clock,
  AlertTriangle
} from 'lucide-react';

const StreamingChatbot = ({ incident }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          type: 'bot',
          content: `Hello! I'm your AI assistant for this incident.\n\n**${incident.title}**\n\nI can help you with:\n• Root cause analysis\n• Similar past incidents\n• Recommended actions\n• Impact assessment\n\nAsk me anything!`,
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isStreaming) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      // Create AbortController for cancellation
      abortControllerRef.current = new AbortController();

      // Call the streaming API
      const response = await fetch('http://localhost:8000/analyze/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: incident.title,
          description: `${incident.description}\n\nUser Question: ${inputMessage}`,
          service: incident.source || incident.location || 'system'
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let similarIncidents = null;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        // Decode the chunk
        buffer += decoder.decode(value, { stream: false });
        
        // Process complete lines in the buffer
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim(); // Remove 'data: ' prefix
            
            if (!data || data === '[DONE]') {
              continue;
            }
            
            try {
              const parsed = JSON.parse(data);
              
              // Handle token streaming
              if (parsed.token !== undefined) {
                accumulatedText += parsed.token;
                setStreamingMessage(accumulatedText);
              }
              
              // Handle completion with similar incidents
              if (parsed.done === true) {
                if (parsed.similar_incidents) {
                  similarIncidents = parsed.similar_incidents;
                }
              }
              
              // Fallback for other formats
              if (parsed.word) {
                accumulatedText += (accumulatedText ? ' ' : '') + parsed.word;
                setStreamingMessage(accumulatedText);
              } else if (parsed.content) {
                accumulatedText += parsed.content;
                setStreamingMessage(accumulatedText);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e, data);
            }
          }
        }
      }

      // Save the complete message
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: accumulatedText || 'I received your message but couldn\'t generate a response.',
        timestamp: new Date(),
        similarIncidents: similarIncidents
      };

      setMessages(prev => [...prev, botMessage]);
      setStreamingMessage('');
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        console.error('Error calling streaming API:', error);
        
        const errorMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: `I'm sorry, I encountered an error.\n\nPlease make sure the AI service is running on http://localhost:8000 and try again.\n\nError: ${error.message}`,
          timestamp: new Date(),
          isError: true
        };

        setMessages(prev => [...prev, errorMessage]);
        setStreamingMessage('');
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content) => {
    // Split by ** for bold text and • for bullets
    const parts = content.split(/(\*\*.*?\*\*|•.*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('•')) {
        return (
          <div key={index} className="flex items-start ml-2 my-1">
            <span className="text-purple-600 mr-2">•</span>
            <span>{part.slice(1).trim()}</span>
          </div>
        );
      }
      // Split by newlines
      return part.split('\n').map((line, lineIndex) => (
        <span key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < part.split('\n').length - 1 && <br />}
        </span>
      ));
    });
  };

  const quickQuestions = [
    "What's the root cause?",
    "Show similar incidents",
    "What should I do?",
    "What's the impact?"
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  // Component to render similar incidents
  const SimilarIncidentsCard = ({ incidents }) => {
    if (!incidents || incidents.length === 0) return null;

    const getSeverityColor = (severity) => {
      const sev = severity?.toLowerCase();
      if (sev === 'critical') return 'bg-red-100 text-red-800 border-red-300';
      if (sev === 'high') return 'bg-orange-100 text-orange-800 border-orange-300';
      if (sev === 'medium') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      return 'bg-green-100 text-green-800 border-green-300';
    };

    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center space-x-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-semibold text-purple-900">Similar Incidents Found</span>
        </div>
        {incidents.slice(0, 3).map((inc, idx) => (
          <div key={idx} className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h6 className="text-xs font-semibold text-gray-900 truncate mb-1">
                  {inc.title || 'Untitled Incident'}
                </h6>
                {inc.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {inc.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {inc.severity && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getSeverityColor(inc.severity)}`}>
                      {inc.severity}
                    </span>
                  )}
                  {inc.timestamp && (
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(inc.timestamp).toLocaleDateString()}
                    </span>
                  )}
                  {inc.similarity_score !== undefined && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                      {Math.round(inc.similarity_score * 100)}% match
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {incidents.length > 3 && (
          <p className="text-xs text-gray-500 text-center italic">
            +{incidents.length - 3} more similar incident{incidents.length - 3 > 1 ? 's' : ''}
          </p>
        )}
      </div>
    );
  };

  if (isMinimized) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 text-sm">AI Assistant</h5>
              <p className="text-gray-600 text-xs">Click to expand</p>
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            Open
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-semibold text-sm">AI Assistant</h5>
            <p className="text-xs text-purple-100 flex items-center">
              <Sparkles className="w-3 h-3 mr-1" />
              Streaming AI
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          title="Minimize"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="h-[500px] overflow-y-auto p-4 bg-gray-50 space-y-3">
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
                
                {/* Render Similar Incidents if present */}
                {message.type === 'bot' && message.similarIncidents && (
                  <SimilarIncidentsCard incidents={message.similarIncidents} />
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming Message */}
        {isStreaming && streamingMessage && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2 max-w-[85%]">
              <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white rounded-2xl px-4 py-2.5 border border-gray-200 shadow-sm">
                <div className="text-sm leading-relaxed whitespace-pre-line text-gray-800">
                  {formatMessage(streamingMessage)}
                  <span className="inline-block w-0.5 h-4 bg-purple-600 ml-1 animate-pulse"></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator (before streaming starts) */}
        {isStreaming && !streamingMessage && (
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
                  <span className="text-sm text-gray-600">Connecting...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && !isStreaming && (
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
            disabled={isStreaming}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 disabled:bg-gray-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isStreaming}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px]"
          >
            {isStreaming ? (
              <Zap className="w-4 h-4 animate-pulse" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StreamingChatbot;
