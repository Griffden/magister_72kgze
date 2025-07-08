import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ImageIcon, XIcon, MicIcon, MicOffIcon } from "lucide-react";

interface ChatPageProps {
  mentorId: string | null;
  chatId: string | null;
  onBack: () => void;
  onOpenChat: (chatId: string) => void;
  sidebarOpen: boolean;
}

export function ChatPage({ mentorId, chatId, onBack, onOpenChat, sidebarOpen }: ChatPageProps) {
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  
  // Update currentChatId when chatId prop changes
  useEffect(() => {
    setCurrentChatId(chatId);
  }, [chatId]);
  
  const chat = useQuery(api.chats.getById, 
    currentChatId ? { chatId: currentChatId as any } : "skip"
  );
  const messages = useQuery(api.chats.getMessages,
    currentChatId ? { chatId: currentChatId as any } : "skip"
  );
  const mentor = useQuery(api.mentors.getById, 
    mentorId && !currentChatId ? { mentorId: mentorId as any } : "skip"
  );
  const user = useQuery(api.users.getProfile);
  
  const createChat = useMutation(api.chats.create);
  const sendMessage = useMutation(api.chats.sendMessage);
  const updateTitle = useMutation(api.chats.updateTitle);
  const generateUploadUrl = useMutation(api.chats.generateUploadUrl);

  // Track streaming state based on message changes
  useEffect(() => {
    if (messages) {
      const currentMessageCount = messages.length;
      
      // If we just sent a user message and are waiting for AI response
      if (isLoading && currentMessageCount > lastMessageCount) {
        // Check if the last message is from AI and is empty or very short (indicating streaming start)
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage.isFromUser && lastMessage.content.length < 10) {
          setStreamingMessageId(lastMessage._id);
        }
      }
      
      // If we have a streaming message, check if it's complete
      if (streamingMessageId) {
        const streamingMessage = messages.find(m => m._id === streamingMessageId);
        if (streamingMessage && streamingMessage.content.length > 50) {
          // Message seems complete, stop showing cursor after a short delay
          setTimeout(() => {
            setStreamingMessageId(null);
          }, 1000);
        }
      }
      
      setLastMessageCount(currentMessageCount);
    }
  }, [messages, isLoading, lastMessageCount, streamingMessageId]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        
        // Mobile-optimized settings
        recognition.continuous = false;
        recognition.interimResults = false; // Disable interim results for mobile stability
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        
        // iOS specific settings (both Safari and Chrome)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isChrome = /Chrome/.test(navigator.userAgent);
        
        if (isIOS) {
          recognition.continuous = false;
          recognition.interimResults = false;
          
          // Chrome on iOS needs additional settings
          if (isChrome) {
            recognition.grammars = undefined;
            recognition.serviceURI = undefined;
          }
        }
        
        recognition.onstart = () => {
          console.log('Speech recognition started');
          setIsListening(true);
        };
        
        recognition.onresult = (event: any) => {
          console.log('Speech recognition result:', event);
          let finalTranscript = '';
          
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          
          // Update with final results only
          if (finalTranscript.trim()) {
            setMessage(prev => {
              const separator = prev.trim() ? ' ' : '';
              return prev + separator + finalTranscript.trim();
            });
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error, event);
          setIsListening(false);
          
          switch (event.error) {
            case 'no-speech':
              toast.error('No speech detected. Try speaking louder or closer to the microphone.');
              break;
            case 'audio-capture':
              toast.error('Microphone not accessible. Please check permissions and try again.');
              break;
            case 'not-allowed':
              toast.error('Microphone permission denied. Please enable microphone access in your browser settings.');
              break;
            case 'network':
              toast.error('Network error. Please check your connection and try again.');
              break;
            case 'service-not-allowed':
              toast.error('Speech recognition service not available. Please try again later.');
              break;
            case 'aborted':
              // Don't show error for user-initiated stops
              break;
            default:
              toast.error(`Speech recognition failed: ${event.error}. Please try again.`);
          }
        };
        
        recognition.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      } else {
        console.log('Speech recognition not supported');
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Add paste event listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only handle paste if the message input is focused
      if (document.activeElement !== messageInputRef.current) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Check if the item is an image
        if (item.type.startsWith('image/')) {
          e.preventDefault(); // Prevent default paste behavior
          
          const file = item.getAsFile();
          if (file) {
            handleImageSelect(file);
            toast.success('Image pasted successfully!');
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (messageInputRef.current) {
      const textarea = messageInputRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const requestMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices?.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      toast.error('Microphone permission required. Please allow microphone access and try again.');
      return false;
    }
  };

  const startListening = async () => {
    if (!speechSupported) {
      toast.error('Speech recognition is not supported in this browser.');
      return;
    }
    
    if (!recognitionRef.current) {
      toast.error('Speech recognition not initialized.');
      return;
    }
    
    if (isListening) {
      console.log('Already listening, ignoring start request');
      return;
    }
    
    // Chrome on iOS requires explicit microphone permission
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    
    if (isIOS && isChrome) {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) return;
    }
    
    try {
      // Stop any existing recognition first
      try {
        if (recognitionRef.current.state && recognitionRef.current.state !== 'inactive') {
          recognitionRef.current.abort();
        }
      } catch (e) {
        // Ignore errors when checking state
      }
      
      // Longer delay for Chrome on iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isChrome = /Chrome/.test(navigator.userAgent);
      const delay = isIOS && isChrome ? 300 : 100;
      
      setTimeout(() => {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          setIsListening(false);
          
          if (error instanceof Error) {
            if (error.name === 'InvalidStateError') {
              toast.error('Speech recognition is busy. Please wait and try again.');
            } else if (error.name === 'NotAllowedError') {
              toast.error('Microphone permission denied. Please enable microphone access.');
            } else {
              toast.error('Failed to start voice input. Please try again.');
            }
          } else {
            toast.error('Failed to start voice input. Please try again.');
          }
        }
      }, delay);
    } catch (error) {
      console.error('Error preparing speech recognition:', error);
      setIsListening(false);
      toast.error('Failed to start voice input. Please try again.');
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  // Handle image selection
  const handleImageSelect = (file: File) => {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10MB");
      return;
    }

    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a PNG, JPG, JPEG, or WebP image");
      return;
    }

    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedImage) return;

    let chatIdToUse = currentChatId;

    // Create new chat if needed
    if (!chatIdToUse && mentorId) {
      try {
        chatIdToUse = await createChat({ mentorId: mentorId as any, title: "New Chat" });
        setCurrentChatId(chatIdToUse);
      } catch (error) {
        toast.error("Failed to create chat");
        return;
      }
    }

    if (!chatIdToUse) return;

    setIsLoading(true);
    const messageToSend = message;
    let imageId: string | undefined;

    try {
      // Upload image if selected
      if (selectedImage) {
        const uploadUrl = await generateUploadUrl();
        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });

        if (!uploadResult.ok) {
          throw new Error("Failed to upload image");
        }

        const { storageId } = await uploadResult.json();
        imageId = storageId;
      }

      // Send message
      await sendMessage({
        chatId: chatIdToUse as any,
        content: messageToSend || (selectedImage ? "Shared an image" : ""),
        isFromUser: true,
        imageId: imageId as any,
      });

      // Clear form
      setMessage("");
      clearSelectedImage();
    } catch (error) {
      toast.error("Failed to send message");
      setMessage(messageToSend);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (!currentChatId || !newTitle.trim()) return;

    try {
      await updateTitle({
        chatId: currentChatId as any,
        title: newTitle.trim(),
      });
      setEditingTitle(false);
      toast.success("Title updated");
    } catch (error) {
      toast.error("Failed to update title");
    }
  };

  // Get mentor data from either direct mentor query or from chat data
  const currentMentor = mentor || (chat ? {
    _id: chat.mentorId,
    name: chat.mentorName || "Unknown Mentor",
    profileImageUrl: chat.mentorProfileImageUrl,
    bio: "",
    categories: [],
    createdBy: ""
  } : null);

  if (!currentMentor) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500">Mentor not found</p>
          <button onClick={onBack} className="mt-4 text-primary hover:text-primary-hover">
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat Header - Fixed at top */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {currentMentor.profileImageUrl ? (
                <img
                  src={currentMentor.profileImageUrl}
                  alt={currentMentor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-semibold">
                  {currentMentor.name.charAt(0)}
                </div>
              )}
            </div>
            
            <div>
              <h2 className="font-semibold text-gray-900">{currentMentor.name}</h2>
              {chat && (
                <div className="flex items-center gap-2">
                  {editingTitle ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateTitle();
                          if (e.key === "Escape") setEditingTitle(false);
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleUpdateTitle}
                        className="text-green-600 hover:text-green-700"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingTitle(false)}
                        className="text-red-600 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingTitle(true);
                        setNewTitle(chat.title);
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      {chat.title} ✏️
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container - Centered and scrollable */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="space-y-6">
              {messages?.map((msg: any, index: number) => (
                <div
                  key={index}
                  className={`flex gap-4 ${msg.isFromUser ? "justify-end" : "justify-start"}`}
                >
                  {/* Profile Image - Left side for mentor */}
                  {!msg.isFromUser && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 mt-1">
                      {currentMentor.profileImageUrl ? (
                        <img
                          src={currentMentor.profileImageUrl}
                          alt={currentMentor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-semibold">
                          {currentMentor.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Message Content */}
                  <div
                    className={`max-w-2xl px-4 py-3 rounded-2xl ${
                      msg.isFromUser
                        ? "bg-blue-600 text-white ml-12"
                        : "bg-white text-gray-900 border border-gray-200 mr-12"
                    }`}
                  >
                    {msg.imageUrl && (
                      <div className="mb-3">
                        <img
                          src={msg.imageUrl}
                          alt="Shared image"
                          className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ maxHeight: "300px" }}
                          onClick={() => setExpandedImage(msg.imageUrl)}
                        />
                      </div>
                    )}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                      {/* Only show cursor for the specific streaming message */}
                      {!msg.isFromUser && streamingMessageId === msg._id && (
                        <span className="inline-block w-0.5 h-4 bg-gray-600 ml-1 animate-pulse opacity-70"></span>
                      )}
                      {/* Show typing indicator for empty AI messages */}
                      {!msg.isFromUser && !msg.content && (
                        <span className="text-gray-500 italic">Typing...</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Profile Image - Right side for user */}
                  {msg.isFromUser && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 mt-1">
                      {user?.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt="You"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-semibold">
                          {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 mt-1">
                    {currentMentor.profileImageUrl ? (
                      <img
                        src={currentMentor.profileImageUrl}
                        alt={currentMentor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-semibold">
                        {currentMentor.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="bg-white text-gray-900 border border-gray-200 max-w-2xl px-4 py-3 rounded-2xl mr-12">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="border-t bg-white shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Voice Input Status */}
          {isListening && (
            <div className="mb-3 flex items-center gap-2 text-sm text-blue-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Listening... Speak now</span>
              <button
                onClick={stopListening}
                className="ml-2 text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Stop
              </button>
            </div>
          )}
          
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-32 max-h-32 rounded-lg border border-gray-200"
              />
              <button
                onClick={clearSelectedImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          )}
          

          
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <textarea
                ref={messageInputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Message ${currentMentor.name}...`}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[52px] max-h-[120px] overflow-y-auto text-sm"
                disabled={isLoading}
                rows={1}
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 #f1f5f9'
                }}
              />
            </div>
            
            {/* Voice Input Button */}
            {speechSupported && (
              <button
                onClick={isListening ? stopListening : startListening}
                className={`p-3 border rounded-xl transition-colors flex-shrink-0 ${
                  isListening
                    ? "bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
                    : "border-gray-300 hover:bg-gray-50 text-gray-500"
                }`}
                disabled={isLoading}
                title={isListening ? "Stop voice input" : "Start voice input"}
              >
                {isListening ? (
                  <MicOffIcon className="w-5 h-5" />
                ) : (
                  <MicIcon className="w-5 h-5" />
                )}
              </button>
            )}
            
            {/* Image Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
              disabled={isLoading}
              title="Upload image"
            >
              <ImageIcon className="w-5 h-5 text-gray-500" />
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageSelect(file);
              }}
              className="hidden"
            />
            
            <button
              onClick={handleSendMessage}
              disabled={(!message.trim() && !selectedImage) || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 font-medium"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Image Expansion Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={expandedImage}
              alt="Expanded view"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-white bg-opacity-20 text-white rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
