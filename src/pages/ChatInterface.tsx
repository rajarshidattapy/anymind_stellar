import { useState } from 'react';
import { Send, Bot, User, ChevronDown, Plus, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  name: string;
  domain: string;
  memorySize: 'Small' | 'Medium' | 'Large';
  messages: Message[];
}

const ChatInterface = () => {
  const [selectedChat, setSelectedChat] = useState<string>('1');
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('Default Model');
  
  const chats: Chat[] = [
    {
      id: '1',
      name: 'Trading Chat',
      domain: 'Finance',
      memorySize: 'Large',
      messages: [
        {
          id: '1',
          type: 'user',
          content: 'What are the key technical indicators for crypto trading?',
          timestamp: new Date()
        },
        {
          id: '2',
          type: 'assistant',
          content: 'Based on my understanding of crypto markets, here are the most effective technical indicators...',
          timestamp: new Date()
        }
      ]
    },
    {
      id: '2',
      name: 'Pokémon Strategy',
      domain: 'Gaming',
      memorySize: 'Medium',
      messages: []
    },
    {
      id: '3',
      name: 'Fitness Coach',
      domain: 'Health',
      memorySize: 'Small',
      messages: []
    }
  ];

  const currentChat = chats.find(chat => chat.id === selectedChat);

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    // Add user message logic here
    setCurrentMessage('');
  };

  const getMemoryColor = (size: string) => {
    switch (size) {
      case 'Small': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'Large': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex h-screen">
      {/* Chat List */}
      <div className="w-80 bg-gray-800 border-r border-gray-700">
        <div className="p-4">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center">
            <Plus className="h-5 w-5 mr-2" />
            New Chat
          </button>
        </div>
        
        <div className="space-y-2 px-4">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`w-full text-left p-4 rounded-lg transition-colors ${
                selectedChat === chat.id 
                  ? 'bg-gray-700 border border-blue-500' 
                  : 'bg-gray-750 hover:bg-gray-700 border border-transparent'
              }`}
            >
              <div className="font-medium text-white mb-1">{chat.name}</div>
              <div className="text-sm text-gray-400 mb-2">{chat.domain}</div>
              <div className={`text-xs ${getMemoryColor(chat.memorySize)}`}>
                Memory: {chat.memorySize}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option>Default Model</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-400">Active Capsule:</span>
                <span className="text-white">{currentChat?.name}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center space-x-1 text-green-400">
                <Sparkles className="h-4 w-4" />
                <span>Memory: Growing</span>
              </div>
              <div className="text-gray-400">
                Capsule Size: {currentChat?.memorySize}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentChat?.messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' ? 'bg-blue-600' : 'bg-gray-700'
                }`}>
                  {message.type === 'user' ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-white" />}
                </div>
                
                <div className={`rounded-lg px-4 py-3 ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-100'
                }`}>
                  <p>{message.content}</p>
                  {message.type === 'assistant' && (
                    <div className="text-xs text-green-400 mt-2 flex items-center">
                      <Sparkles className="h-3 w-3 mr-1" />
                      + Memory stored
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {currentChat?.messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">
              <Bot className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p>Begin chatting to build this memory capsule's intelligence.</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;