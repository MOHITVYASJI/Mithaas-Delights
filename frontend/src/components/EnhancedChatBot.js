import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageCircle, Send, X, User, Bot, ShoppingCart, Package, MapPin, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Enhanced Order-Aware ChatBot Component
export const EnhancedChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef(null);
  const { user, isAuthenticated } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Load chat history when opened
      loadChatHistory();
      
      // Send welcome message
      const welcomeMessage = {
        id: 'welcome',
        type: 'bot',
        message: isAuthenticated 
          ? `Namaste ${user?.name || 'there'}! Welcome back to Mithaas Delights. How can I help you today?`
          : 'Namaste! Welcome to Mithaas Delights. I\'m your AI assistant here to help with product information, orders, and any questions you might have. How can I assist you?',
        timestamp: new Date().toISOString(),
        isWelcome: true
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, isAuthenticated, user]);

  const loadChatHistory = async () => {
    try {
      const response = await axios.get(`${API}/chat/history/${sessionId}`);
      if (response.data.messages && response.data.messages.length > 0) {
        const formattedMessages = response.data.messages.map(msg => ({
          id: msg.message_id || Math.random().toString(36).substr(2, 9),
          type: 'user',
          message: msg.message,
          timestamp: msg.created_at
        })).concat(response.data.messages.map(msg => ({
          id: `${msg.message_id}_response` || Math.random().toString(36).substr(2, 9),
          type: 'bot',
          message: msg.response,
          timestamp: msg.created_at
        })));
        
        // Sort by timestamp
        formattedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'user',
      message: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Use enhanced chatbot endpoint
      const response = await axios.post(
        `${API}/chat/enhanced/message`, 
        {
          session_id: sessionId,
          message: userMessage.message
        },
        { headers }
      );

      const botMessage = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'bot',
        message: response.data.response,
        timestamp: response.data.timestamp || new Date().toISOString(),
        orderContext: response.data.order_context
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'bot',
        message: 'I apologize, I\'m having trouble connecting right now. Please try again in a moment or contact our support team at +91 8989549544.',
        timestamp: new Date().toISOString(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Chat service temporarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    // Add welcome message back
    const welcomeMessage = {
      id: 'welcome_new',
      type: 'bot',
      message: 'Chat cleared. How can I help you?',
      timestamp: new Date().toISOString(),
      isWelcome: true
    };
    setMessages([welcomeMessage]);
  };

  const suggestedQuestions = [
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
                  : 'bg-gray-100 text-gray-600'
          }`}>
            {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </div>
          
          <div className={`px-3 py-2 rounded-lg ${
            isUser 
              ? 'bg-orange-500 text-white' 
              : isError
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-gray-100 text-gray-800'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
            
            {message.orderContext && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  ℹ️ This response includes your order information
                </p>
              </div>
            )}
            
            <p className={`text-xs mt-1 ${
              isUser ? 'text-orange-100' : 'text-gray-500'
            }`}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg"
          data-testid="chat-toggle-button"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md h-[600px] p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-semibold">Mithaas AI Assistant</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">Online</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearChat}
                  data-testid="clear-chat-button"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsOpen(false)}
                  data-testid="close-chat-button"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              
              {loading && (
                <div className="flex justify-start mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg">
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
          </ScrollArea>
          
          {/* Suggested Questions (only when chat is empty or just welcome message) */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 border-t">
              <p className="text-xs text-gray-600 mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-1">
                {suggestedQuestions.slice(0, 3).map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1 px-2"
                    onClick={() => {
                      setInputMessage(question);
                      setTimeout(() => sendMessage(), 100);
                    }}
                    data-testid="suggested-question-button"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* User Status */}
          {isAuthenticated && (
            <div className="px-4 py-2 bg-orange-50 border-t">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-700">Logged in as {user?.name}</span>
                <Badge variant="outline" className="text-xs">
                  <Package className="w-3 h-3 mr-1" />
                  Order-aware
                </Badge>
              </div>
            </div>
          )}
          
          {/* Chat Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isAuthenticated ? "Ask about your orders, products, or anything..." : "Ask me anything about our sweets and services..."}
                disabled={loading}
                className="flex-1"
                data-testid="chat-input"
              />
              <Button 
                onClick={sendMessage}
                disabled={loading || !inputMessage.trim()}
                className="bg-orange-500 hover:bg-orange-600"
                data-testid="send-message-button"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {!isAuthenticated && (
              <p className="text-xs text-gray-500 mt-1">
                💡 Login to get personalized responses about your orders!
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedChatBot;
