import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  MessageCircle, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  X, 
  Loader2, 
  User, 
  Bot, 
  RefreshCw, 
  Minimize2,
  Maximize2,
  Moon,
  Sun,
  Languages,
  Settings,
  Trash2
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Switch } from './ui/switch';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Generate unique session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const UnifiedChatBot = () => {
  // Chat State
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // UI State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);
  const inputRef = useRef(null);
  
  // Auth
  const { user, isAuthenticated } = useAuth();

  // Initialize session and speech APIs
  useEffect(() => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    localStorage.setItem('unified-chat-session-id', newSessionId);
    
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
        toast.success('Voice input captured!');
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Voice recognition failed. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Initialize Speech Synthesis
    synthesisRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, [language]);

  // Load welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadChatHistory();
      
      const welcomeMessage = {
        id: 'welcome',
        type: 'bot',
        content: getWelcomeMessage(),
        timestamp: new Date(),
        isWelcome: true
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, isAuthenticated, user, language]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update speech recognition language
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const getWelcomeMessage = () => {
    if (language === 'hi-IN') {
      return isAuthenticated 
        ? `नमस्ते ${user?.name || 'जी'}! मिठास डिलाइट्स में फिर से आपका स्वागत है। मैं आपकी कैसे सहायता कर सकती हूं?`
        : 'नमस्ते! मिठास डिलाइट्स में आपका स्वागत है। मैं आपकी सहायक हूं। मैं उत्पादों, ऑर्डर और किसी भी प्रश्न में आपकी मदद कर सकती हूं।';
    }
    
    return isAuthenticated 
      ? `Hello ${user?.name || 'there'}! Welcome back to Mithaas Delights! 🍯\n\nI'm your AI assistant with access to your order history and preferences. How can I help you today?`
      : `Hello! Welcome to Mithaas Delights! 🍯\n\nI'm here to help you with:\n• Product information and recommendations\n• Order placement and tracking\n• Delivery and payment details\n• Any questions about our premium sweets and snacks\n\nHow can I assist you today?`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API}/chat/history/${sessionId}`, { headers });
      
      if (response.data.messages && response.data.messages.length > 0) {
        const formattedMessages = [];
        
        response.data.messages.forEach(msg => {
          formattedMessages.push({
            id: `${msg.message_id}_user` || Math.random().toString(36).substr(2, 9),
            type: 'user',
            content: msg.message,
            timestamp: new Date(msg.created_at)
          });
          
          formattedMessages.push({
            id: `${msg.message_id}_bot` || Math.random().toString(36).substr(2, 9),
            type: 'bot',
            content: msg.response,
            timestamp: new Date(msg.created_at)
          });
        });
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error('Voice input not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = language;
        recognitionRef.current.start();
        setIsListening(true);
        toast.info('Listening... Speak now!');
      } catch (error) {
        console.error('Error starting voice recognition:', error);
        toast.error('Failed to start voice recognition');
      }
    }
  };

  const speakMessage = (text) => {
    if (!synthesisRef.current || !voiceEnabled) {
      return;
    }

    // Cancel any ongoing speech
    synthesisRef.current.cancel();

    // Clean text for better speech
    const cleanText = text.replace(/[•\n]/g, ' ').replace(/\s+/g, ' ').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Use enhanced endpoint for better responses
      const endpoint = isAuthenticated ? `${API}/chat/enhanced/message` : `${API}/chat`;
      
      const response = await axios.post(
        endpoint,
        {
          session_id: sessionId,
          message: userMessage.content,
          user_id: user?.id || null
        },
        { headers }
      );

      const botMessage = {
        id: `bot_${Date.now()}`,
        type: 'bot',
        content: response.data.response,
        timestamp: new Date(),
        orderContext: response.data.order_context
      };

      setMessages(prev => [...prev, botMessage]);

      // Auto-speak the response if voice is enabled
      if (voiceEnabled) {
        speakMessage(botMessage.content);
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage = {
        id: `error_${Date.now()}`,
        type: 'bot',
        content: language === 'hi-IN'
          ? 'क्षमा करें, कुछ गलत हो गया। कृपया पुनः प्रयास करें या +91 8989549544 पर संपर्क करें।'
          : "I apologize, but I'm having trouble connecting right now. Please try again in a moment or contact our support team at +91 8989549544 for immediate assistance.",
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Chat service temporarily unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      await axios.delete(`${API}/chat/clear/${sessionId}`, { headers });
      
      setMessages([]);
      
      // Add new welcome message
      const welcomeMessage = {
        id: 'welcome_new',
        type: 'bot',
        content: getWelcomeMessage(),
        timestamp: new Date(),
        isWelcome: true
      };
      
      setMessages([welcomeMessage]);
      toast.success('Chat cleared successfully!');
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Failed to clear chat');
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'en-US' ? 'hi-IN' : 'en-US';
    setLanguage(newLang);
    toast.success(newLang === 'hi-IN' ? 'भाषा बदलकर हिंदी कर दी गई' : 'Language changed to English');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = language === 'hi-IN' ? [
    'आपकी सबसे अच्छी मिठाई कौन सी है?',
    'डिलीवरी चार्ज क्या है?',
    'मेरे ऑर्डर की स्थिति क्या है?',
    'त्योहार के विशेष कलेक्शन दिखाएं'
  ] : [
    'What are your bestselling sweets?',
    'Do you have festival special collections?',
    'What are your delivery charges?',
    'How can I track my order?',
    'Do you offer bulk orders for events?',
    'What ingredients do you use?'
  ];

  const MessageBubble = ({ message }) => {
    const isUser = message.type === 'user';
    const isError = message.isError;
    const isWelcome = message.isWelcome;
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
          isUser ? 'flex-row-reverse space-x-reverse' : ''
        }`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-orange-500 text-white' 
              : isError 
                ? 'bg-red-100 text-red-600'
                : isWelcome
                  ? 'bg-green-100 text-green-600'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-100 text-gray-600'
          }`}>
            {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </div>
          
          <div className={`px-3 py-2 rounded-lg relative group ${
            isUser 
              ? 'bg-orange-500 text-white' 
              : isError
                ? 'bg-red-50 text-red-800 border border-red-200'
                : isDarkMode
                  ? 'bg-gray-700 text-gray-100'
                  : 'bg-gray-100 text-gray-800'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            
            {message.orderContext && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  ℹ️ This response includes your order information
                </p>
              </div>
            )}
            
            {!isUser && voiceEnabled && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                onClick={() => speakMessage(message.content)}
                data-testid="speak-message-button"
              >
                <Volume2 className="w-3 h-3" />
              </Button>
            )}
            
            <p className={`text-xs mt-1 ${
              isUser ? 'text-orange-100' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Floating Chat Button
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 animate-pulse"
          data-testid="chatbot-open-button"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
        <Badge className="absolute -top-2 -left-2 bg-red-500 text-white text-xs px-1 animate-bounce">
          AI Help
        </Badge>
      </div>
    );
  }

  // Chat Window
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`transition-all duration-300 shadow-2xl ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
      } ${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'} flex flex-col`} data-testid="chatbot-window">
        
        {/* Header */}
        <CardHeader className={`pb-3 ${
          isDarkMode 
            ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white' 
            : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
        } rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 ${
                isDarkMode ? 'bg-gray-600' : 'bg-white/20'
              } rounded-full flex items-center justify-center`}>
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Mithaas AI Assistant</CardTitle>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs opacity-90">Online</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Settings Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 p-1 h-auto"
                    data-testid="chatbot-settings-button"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={toggleLanguage}>
                    <Languages className="w-4 h-4 mr-2" />
                    {language === 'en-US' ? 'Switch to Hindi' : 'Switch to English'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsDarkMode(!isDarkMode)}>
                    {isDarkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVoiceEnabled(!voiceEnabled)}>
                    {voiceEnabled ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                    {voiceEnabled ? 'Disable Voice' : 'Enable Voice'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={clearChat}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20 p-1 h-auto"
                data-testid="chatbot-minimize-button"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-1 h-auto"
                data-testid="chatbot-close-button"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2 mt-2">
            {isAuthenticated && (
              <Badge variant="secondary" className="text-xs">
                {user?.name || 'Authenticated'}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              Voice {voiceEnabled ? 'On' : 'Off'}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {language === 'en-US' ? 'English' : 'हिंदी'}
            </Badge>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <CardContent className="p-0 flex-1 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-1">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  
                  {/* Typing Indicator */}
                  {isLoading && (
                    <div className="flex justify-start mb-4">
                      <div className="flex-shrink-0 mr-2">
                        <div className={`w-8 h-8 ${
                          isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-orange-100 text-orange-600'
                        } rounded-full flex items-center justify-center`}>
                          <Bot className="w-4 h-4" />
                        </div>
                      </div>
                      <div className={`${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                      } rounded-lg px-4 py-2`}>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Voice Status Indicator */}
              {(isListening || isSpeaking) && (
                <div className={`px-4 py-2 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-orange-50 border-orange-100'
                } border-t`}>
                  <div className={`flex items-center gap-2 text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-orange-600'
                  }`}>
                    {isListening ? (
                      <>
                        <Mic className="w-4 h-4 animate-pulse" />
                        <span>{language === 'hi-IN' ? 'सुन रहा है...' : 'Listening...'}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={toggleVoiceInput}
                          className="ml-auto p-1 h-6"
                        >
                          <MicOff className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 animate-pulse" />
                        <span>{language === 'hi-IN' ? 'बोल रहा है...' : 'Speaking...'}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={stopSpeaking}
                          className="ml-auto p-1 h-6"
                        >
                          <VolumeX className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Suggested Questions */}
              {messages.length <= 1 && (
                <div className={`px-4 py-2 border-t ${
                  isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                }`}>
                  <p className={`text-xs mb-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {language === 'hi-IN' ? 'सुझावित प्रश्न:' : 'Suggested questions:'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {suggestedQuestions.slice(0, 2).map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-auto py-1 px-2"
                        onClick={() => {
                          setInputMessage(question);
                          setTimeout(() => {
                            const event = { preventDefault: () => {} };
                            sendMessage(event);
                          }, 100);
                        }}
                        data-testid="suggested-question-button"
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className={`border-t p-3 ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50'
              }`}>
                <div className="flex space-x-2">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      language === 'hi-IN' 
                        ? 'अपना संदेश लिखें...' 
                        : isAuthenticated 
                          ? "Ask about your orders, products, or anything..."
                          : "Ask about our sweets, orders, delivery..."
                    }
                    disabled={isLoading || isListening}
                    className={`flex-1 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500' 
                        : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                    }`}
                    data-testid="chatbot-input"
                  />
                  
                  {/* Voice Input Button */}
                  <Button
                    type="button"
                    onClick={toggleVoiceInput}
                    variant={isListening ? 'destructive' : 'outline'}
                    size="sm"
                    disabled={isLoading}
                    className="px-3"
                    data-testid="voice-input-button"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-orange-500 hover:bg-orange-600 px-3"
                    data-testid="chatbot-send-button"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
                
                {!isAuthenticated && (
                  <p className={`text-xs mt-2 text-center ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {language === 'hi-IN' 
                      ? '💡 व्यक्तिगत प्रतिक्रिया के लिए लॉगिन करें!'
                      : '💡 Login to get personalized responses about your orders!'
                    }
                  </p>
                )}
                
                <div className={`text-xs mt-2 text-center ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {language === 'hi-IN' 
                    ? 'AI द्वारा संचालित • मिठास डिलाइट्स के बारे में कुछ भी पूछें'
                    : 'Powered by AI • Ask me anything about Mithaas Delights'
                  }
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default UnifiedChatBot;