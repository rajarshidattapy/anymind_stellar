import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ArrowLeft, Sparkles, Settings, X, Mic, MicOff, Edit2, Check, Search, Plus } from 'lucide-react';
import { useApiClient } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import InfoIcon from '../components/InfoIcon';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | string;
}

interface LLMConfig {
  id: string;
  name: string;
  displayName: string;
  platform: string;
  apiKeyConfigured: boolean;
}

interface AgentChatProps {
  activeModel: string;
  chatId?: string;
  chatName?: string;
  webSearchEnabled?: boolean;
  initialMessages: Message[];
  onBack: () => void;
  onUpdateMessages: (messages: Message[]) => void;
  onUpdateChatId?: (oldId: string, newId: string) => void;
  onUpdateChatName?: (chatId: string, newName: string) => void;
  onUpdateWebSearch?: (chatId: string, enabled: boolean) => void;
  customLLMs: LLMConfig[];
  onAddLLM: (llm: LLMConfig) => void;
}

const AgentChat: React.FC<AgentChatProps> = ({ 
  activeModel, 
  chatId,
  chatName,
  webSearchEnabled = false,
  initialMessages,
  onBack,
  onUpdateMessages,
  onUpdateChatId,
  onUpdateChatName,
  onUpdateWebSearch,
  customLLMs,
  onAddLLM
}) => {
  const api = useApiClient();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddLLM, setShowAddLLM] = useState(false);
  const [newLLMName, setNewLLMName] = useState('');
  const [newLLMModel, setNewLLMModel] = useState('');
  const [newLLMPlatform, setNewLLMPlatform] = useState('');
  const [newLLMApiKey, setNewLLMApiKey] = useState('');
  const [actualChatId, setActualChatId] = useState<string | undefined>(chatId);
  const [actualChatName, setActualChatName] = useState<string | undefined>(chatName);
  const [webSearchMode, setWebSearchMode] = useState<boolean>(webSearchEnabled);
  const [editingChatName, setEditingChatName] = useState(false);
  const [editingChatValue, setEditingChatValue] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  // Update actualChatName when chatName prop changes
  useEffect(() => {
    setActualChatName(chatName);
  }, [chatName]);

  // Update webSearchMode when webSearchEnabled prop changes
  useEffect(() => {
    setWebSearchMode(webSearchEnabled);
  }, [webSearchEnabled]);

  // Close plus menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setShowPlusMenu(false);
      }
    };

    if (showPlusMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showPlusMenu]);

  const handleToggleWebSearch = async () => {
    if (!actualChatId) return;
    
    const newValue = !webSearchMode;
    setWebSearchMode(newValue);
    
    try {
      const agentId = currentLLM?.id || activeModel;
      await api.updateChat(agentId, actualChatId, { web_search_enabled: newValue });
      
      // Notify parent component
      if (onUpdateWebSearch) {
        onUpdateWebSearch(actualChatId, newValue);
      }
    } catch (error) {
      console.error('Error updating web search mode:', error);
      // Revert on error
      setWebSearchMode(!newValue);
      alert('Failed to update web search mode. Please try again.');
    }
  };
  
  // Speech recognition
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    error: speechError,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Update actualChatId when chatId prop changes
  useEffect(() => {
    setActualChatId(chatId);
  }, [chatId]);

  // Update currentMessage when speech transcript changes
  // Only update if we're actively listening (to avoid overwriting manual edits)
  useEffect(() => {
    if (transcript && isListening) {
      setCurrentMessage(transcript);
    }
  }, [transcript, isListening]);

  // Handle speech recognition errors
  useEffect(() => {
    if (speechError) {
      setError(speechError);
    }
  }, [speechError]);

  const allLLMs: LLMConfig[] = [
    ...customLLMs
  ];

  // Better matching: try by id, name, displayName, or case-insensitive match
  const currentLLM = allLLMs.find(llm => 
    llm.id === activeModel || 
    llm.name === activeModel || 
    llm.displayName === activeModel ||
    llm.id.toLowerCase() === activeModel.toLowerCase() || 
    llm.name.toLowerCase() === activeModel.toLowerCase() ||
    llm.displayName.toLowerCase() === activeModel.toLowerCase()
  ) || (allLLMs.length > 0 ? allLLMs[0] : null); // Default to first only if no match found and LLMs exist

  // If no LLM is available, show error message
  if (!currentLLM) {
    return (
      <div className="flex flex-col h-screen bg-gray-900 items-center justify-center">
        <div className="text-center">
          <Bot className="h-16 w-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold text-white mb-2">No LLM Available</h3>
          <p className="text-gray-400 mb-4">Please add an LLM agent first to start chatting.</p>
          <button
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Load messages from API when chatId is available and not a new chat
  useEffect(() => {
    const loadMessages = async () => {
      if (!actualChatId || actualChatId.startsWith('new-') || messages.length > 0) {
        return; // Skip if new chat or messages already loaded
      }

      try {
        const apiMessages = await api.getMessages(currentLLM.id, actualChatId) as any[];
        const transformedMessages: Message[] = apiMessages.map((msg: any) => ({
          id: msg.id || Date.now().toString(),
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }));
        
        if (transformedMessages.length > 0) {
          setMessages(transformedMessages);
          onUpdateMessages(transformedMessages);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        // Continue with empty messages if load fails
      }
    };

    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualChatId, currentLLM.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !chatId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Ensure agent exists - create if it's a temporary custom LLM
      let agentId = currentLLM.id;
      console.log('Selected agent:', { agentId, activeModel, currentLLM: currentLLM.displayName });
      
      // Check if this is a temporary agent that needs to be created
      // Or if it's a custom agent that might not exist yet
      const isTemporaryAgent = agentId.startsWith('custom-');
      const hasApiKey = (currentLLM as any).apiKey;
      
      if (isTemporaryAgent && hasApiKey) {
        // This is a temporary agent that needs to be created
        const agentName = currentLLM.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '-');
        try {
          const createdAgent = await api.createAgent({
            name: agentName,
            display_name: currentLLM.displayName, // API expects display_name
            platform: currentLLM.platform,
            api_key: (currentLLM as any).apiKey,
            model: (currentLLM as any).model || currentLLM.displayName
          }) as any;
          
          agentId = createdAgent.id;
          console.log('Created new agent:', agentId);
          // Update the LLM config with the real ID
          currentLLM.id = agentId;
          delete (currentLLM as any).apiKey; // Remove API key from memory
        } catch (err) {
          console.error('Error creating agent:', err);
          throw new Error(`Failed to create agent: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Ensure chat exists - create if it's a temporary chat (starts with "new-")
      let currentChatId = actualChatId || chatId;
      if (!currentChatId || currentChatId.startsWith('new-')) {
        // Create chat via API with the correct agentId
        console.log('Creating new chat for agent:', agentId);
        try {
          const createdChat = await api.createChat(agentId, {
            name: `chat-${Date.now()}`,
            memory_size: 'Small',
            web_search_enabled: webSearchMode
          }) as any;
          currentChatId = createdChat.id;
          console.log('Created chat:', currentChatId, 'for agent:', agentId);
          
          // Update local state
          setActualChatId(currentChatId);
          
          // Update chat ID in parent component
          if (onUpdateChatId && chatId) {
            onUpdateChatId(chatId, currentChatId);
          }
        } catch (err) {
          console.error('Error creating chat:', err);
          throw new Error(`Failed to create chat: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
      
      console.log('Sending message to agent:', agentId, 'chat:', currentChatId);

      // Add user message to UI immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: currentMessage,
        timestamp: new Date()
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setCurrentMessage('');

      // Use streaming API for LLM responses
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      const initialMessagesWithAssistant = [...newMessages, assistantMessage];
      setMessages(initialMessagesWithAssistant);

      let streamingContent = '';

      await api.sendMessageStream(
        agentId,
        currentChatId,
        {
          role: 'user',
          content: currentMessage
        },
        (chunk: string) => {
          // Update streaming content
          streamingContent += chunk;
          // Update the assistant message in real-time
          setMessages(prevMessages => {
            const updated = [...prevMessages];
            const assistantIndex = updated.findIndex(m => m.id === assistantMessageId);
            if (assistantIndex !== -1) {
              updated[assistantIndex] = {
                ...updated[assistantIndex],
                content: streamingContent
              };
            }
            return updated;
          });
        },
        () => {
          // Streaming complete
          const finalMessages = [...newMessages, {
            ...assistantMessage,
            content: streamingContent
          }];
          setMessages(finalMessages);
          onUpdateMessages(finalMessages);
          setIsLoading(false);
        },
        (error: Error) => {
          // Error handling
          console.error('Streaming error:', error);
          setError(error.message);
          // Remove the empty assistant message on error
          setMessages(newMessages);
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Revert user message on error
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLLM = async () => {
    if (!newLLMName.trim() || !newLLMPlatform.trim() || !newLLMApiKey.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      // Create agent via API
      const agentName = newLLMName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '-');
      const agent = await api.createAgent({
        name: agentName,
        display_name: newLLMName,
        platform: newLLMPlatform,
        api_key: newLLMApiKey,
        model: newLLMModel.trim() || newLLMName // Use OpenRouter model name if provided, otherwise fallback to display name
      }) as any; // API returns snake_case, not camelCase

      const newLLM: LLMConfig = {
        id: agent.id,
        name: agent.name,
        displayName: agent.display_name || newLLMName,
        platform: agent.platform,
        apiKeyConfigured: true
      };

      onAddLLM(newLLM);
      setNewLLMName('');
      setNewLLMModel('');
      setNewLLMPlatform('');
      setNewLLMApiKey('');
      setShowAddLLM(false);
    } catch (err) {
      console.error('Error creating agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setIsLoading(false);
    }
  };

  const platforms = [
    'OpenRouter',
    'Cerebras',
    'OpenAI',
    'Anthropic',
    'Gemini',
    'Hugging Face',
    'Groq'
  ];

  const handleRenameChat = async () => {
    if (!editingChatValue.trim() || !actualChatId) {
      setEditingChatName(false);
      return;
    }

    try {
      const agentId = currentLLM?.id || activeModel;
      await api.updateChat(agentId, actualChatId, { name: editingChatValue.trim() });
      
      // Update local state
      setActualChatName(editingChatValue.trim());
      
      // Notify parent component to update its state
      if (onUpdateChatName) {
        onUpdateChatName(actualChatId, editingChatValue.trim());
      }
      
      setEditingChatName(false);
    } catch (error) {
      console.error('Error renaming chat:', error);
      alert('Failed to rename chat. Please try again.');
      setEditingChatName(false);
    }
  };

  // Generate human-readable chat name from ID
  const getChatDisplayName = (chatId: string | undefined): string => {
    if (!chatId) return 'New Chat';
    // If it's a new chat, return "New Chat"
    if (chatId.startsWith('new-')) {
      return 'New Chat';
    }
    
    // Remove "custom-" prefix if present
    let cleanId = chatId;
    if (chatId.startsWith('custom-')) {
      cleanId = chatId.substring(7);
    }
    
    // Try to extract a meaningful name from the ID
    // If it's a UUID or similar, use a generic name
    if (cleanId.length > 20 || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)) {
      // Generate a readable name based on timestamp or use a generic name
      return `Chat ${cleanId.substring(0, 8)}`;
    }
    
    // If it already looks readable, use it
    return cleanId;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </button>
            <div className="flex items-center space-x-2">
              {editingChatName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editingChatValue}
                    onChange={(e) => setEditingChatValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleRenameChat()}
                    className="text-lg font-semibold bg-gray-700 text-white px-2 py-1 rounded border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleRenameChat}
                    className="p-1 hover:bg-green-900/50 rounded transition-colors text-green-400 hover:text-green-300"
                    title="Save"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingChatName(false);
                      setEditingChatValue('');
                    }}
                    className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                    title="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-lg font-semibold text-white">
                    {actualChatName || getChatDisplayName(actualChatId || chatId)}
                  </h1>
                  {(actualChatId || chatId) && (
                    <>
                      <button
                        onClick={() => {
                          setEditingChatName(true);
                          setEditingChatValue(actualChatName || getChatDisplayName(actualChatId || chatId));
                        }}
                        className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-blue-400"
                        title="Rename chat"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <InfoIcon id={actualChatId || chatId || ''} label="Chat ID" />
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Removed web search toggle, delete button, and model name display */}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-20">
            <Bot className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold text-white mb-2">Start a conversation</h3>
            <p className="text-gray-400 mb-8">
              Chat with {currentLLM.displayName} to build intelligence in your memory capsule
            </p>
            <div className="max-w-md mx-auto space-y-2">
              {[
                'What are the best strategies for...',
                'Help me understand...',
                'Analyze this situation...'
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentMessage(suggestion)}
                  className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-sm transition-colors border border-gray-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex space-x-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                message.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'
              }`}>
                {message.role === 'user' ? 
                  <User className="h-5 w-5 text-white" /> : 
                  <Bot className="h-5 w-5 text-white" />
                }
              </div>
              
              <div className={`rounded-lg px-4 py-3 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-100 border border-gray-700'
              }`}>
                {message.role === 'assistant' ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        code: ({ children, ...props }: any) => 
                          props.inline ? (
                            <code className="bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>
                          ) : (
                            <code className="block bg-gray-700 p-2 rounded text-sm overflow-x-auto" {...props}>{children}</code>
                          ),
                        pre: ({ children }) => <pre className="bg-gray-700 p-2 rounded overflow-x-auto mb-2">{children}</pre>,
                        h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-bold mb-2">{children}</h3>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-600 pl-4 italic mb-2">{children}</blockquote>,
                        a: ({ href, children }) => <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
                {message.role === 'assistant' && message.content && message.content.trim() && (
                  <div className="text-xs text-green-400 mt-3 flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    + Memory stored
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-3 max-w-3xl">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-700 shrink-0">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
                <div className="flex space-x-2">
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

      {/* Error Display */}
      {error && (
        <div className="px-6 py-2 bg-red-900/20 border-t border-red-800">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <div className="flex space-x-4 max-w-4xl mx-auto">
          {/* Plus Button with Menu */}
          <div className="relative" ref={plusMenuRef}>
            <button
              onClick={() => setShowPlusMenu(!showPlusMenu)}
              className="p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors"
              title="Options"
            >
              <Plus className="h-5 w-5" />
            </button>
            
            {/* Plus Menu Dropdown */}
            {showPlusMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-2 min-w-[200px] z-50">
                <button
                  onClick={() => {
                    handleToggleWebSearch();
                    setShowPlusMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center space-x-2 ${
                    webSearchMode
                      ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Search className="h-4 w-4" />
                  <span>{webSearchMode ? 'Disable' : 'Enable'} Web Search</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder={`Message ${currentLLM.displayName}...`}
              className="w-full bg-gray-900 text-white px-4 py-3 pr-12 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              disabled={isLoading}
            />
            {browserSupportsSpeechRecognition && (
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isListening ? 'Stop voice input' : 'Start voice input'}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        {isListening && (
          <div className="max-w-4xl mx-auto mt-2">
            <div className="flex items-center space-x-2 text-sm text-blue-400">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Listening... Speak now</span>
            </div>
          </div>
        )}
      </div>

      {/* Add LLM Modal */}
      {showAddLLM && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Add New LLM</h2>
              </div>
              <button 
                onClick={() => setShowAddLLM(false)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newLLMName}
                  onChange={(e) => setNewLLMName(e.target.value)}
                  placeholder="e.g., Llama 3, Claude, Gemini Pro"
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is the name that will appear in the UI
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Model Name
                </label>
                <input
                  type="text"
                  value={newLLMModel}
                  onChange={(e) => setNewLLMModel(e.target.value)}
                  placeholder="e.g., meta-llama/llama-3.3-70b-instruct:free"
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The exact model identifier from OpenRouter (optional - will use display name if not provided)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Platform / Provider
                </label>
                <select
                  value={newLLMPlatform}
                  onChange={(e) => setNewLLMPlatform(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select a platform</option>
                  {platforms.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={newLLMApiKey}
                  onChange={(e) => setNewLLMApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Your API key is stored securely and never shared.
                </p>
              </div>

              <div className="bg-blue-600 bg-opacity-10 border border-blue-500 rounded-lg p-4">
                <h4 className="text-blue-400 font-medium mb-2">Supported Platforms</h4>
                <p className="text-sm text-gray-300">
                  We support any OpenAI-compatible API endpoint. Enter your provider's API key to get started.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAddLLM(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLLM}
                  disabled={!newLLMName.trim() || !newLLMPlatform || !newLLMApiKey.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Add LLM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentChat;
