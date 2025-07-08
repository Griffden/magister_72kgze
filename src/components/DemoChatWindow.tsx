import { useState, useRef, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SendIcon, SparklesIcon, UserIcon } from "lucide-react";

interface Message {
  id: string;
  content: string;
  isFromUser: boolean;
  timestamp: number;
}

interface DemoChatWindowProps {
  onSignUpClick: () => void;
}

export function DemoChatWindow({ onSignUpClick }: DemoChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hey there! I'm Elon Musk, your AI mentor. I'm here to help you think bigger, innovate faster, and maybe even get to Mars someday. What's on your mind?",
      isFromUser: false,
      timestamp: Date.now() - 1000,
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  const MAX_MESSAGES = 4; // Allow 4 user messages before showing signup

  const generateDemoResponse = useAction(api.ai.generateDemoResponse);
  
  // Get Elon Musk's mentor profile for avatar
  const mentors = useQuery(api.mentors.list) || [];
  const elonMentor = mentors.find(mentor => 
    mentor.name.toLowerCase().includes('elon') || 
    mentor.name.toLowerCase().includes('musk')
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Removed auto-scroll functionality - users can manually scroll if needed

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || messageCount >= MAX_MESSAGES) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue.trim(),
      isFromUser: true,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setMessageCount(prev => prev + 1);

    try {
      // Check if this is the last allowed message
      if (messageCount + 1 >= MAX_MESSAGES) {
        // Show signup prompt after a brief delay
        setTimeout(() => {
          setShowSignUpPrompt(true);
          setIsLoading(false);
        }, 1500);
        return;
      }

      const response = await generateDemoResponse({
        message: userMessage.content,
        conversationHistory: messages.map(m => ({
          content: m.content,
          isFromUser: m.isFromUser
        }))
      });

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: response,
        isFromUser: false,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error generating response:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "Sorry, I'm having trouble responding right now. Try again in a moment!",
        isFromUser: false,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const remainingMessages = Math.max(0, MAX_MESSAGES - messageCount);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/30">
            {elonMentor?.profileImageUrl ? (
              <img
                src={elonMentor.profileImageUrl}
                alt="Elon Musk"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/20 flex items-center justify-center">
                <SparklesIcon className="w-6 h-6" />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg">Elon Musk</h3>
            <p className="text-white/90 text-sm">AI Mentor • Entrepreneur & Innovator</p>
          </div>
          <div className="ml-auto">
            <SparklesIcon className="w-5 h-5 text-white/80" />
          </div>
        </div>
        
        {/* Message counter */}
        {!showSignUpPrompt && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>
                {remainingMessages > 0 
                  ? `${remainingMessages} free message${remainingMessages === 1 ? '' : 's'} remaining`
                  : "Demo limit reached"
                }
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.isFromUser ? "justify-end" : "justify-start"}`}
          >
            {!message.isFromUser && (
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                {elonMentor?.profileImageUrl ? (
                  <img
                    src={elonMentor.profileImageUrl}
                    alt="Elon Musk"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            )}
            
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                message.isFromUser
                  ? "bg-blue-600 text-white rounded-br-md"
                  : "bg-white text-gray-800 rounded-bl-md shadow-sm border"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            </div>

            {message.isFromUser && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              {elonMentor?.profileImageUrl ? (
                <img
                  src={elonMentor.profileImageUrl}
                  alt="Elon Musk"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-bl-md shadow-sm border">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        {/* Sign up prompt */}
        {showSignUpPrompt && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white text-center">
            <div className="mb-4">
              <SparklesIcon className="w-12 h-12 mx-auto mb-3 text-white/90" />
              <h4 className="text-lg font-bold mb-2">Continue the conversation!</h4>
              <p className="text-white/90 text-sm">
                You've reached the demo limit. Sign up to continue chatting with Elon and explore all our AI mentors.
              </p>
            </div>
            <button
              onClick={onSignUpClick}
              className="w-full bg-white text-purple-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
            >
              Sign Up to Continue
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        {!showSignUpPrompt ? (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                messageCount >= MAX_MESSAGES 
                  ? "Demo limit reached - sign up to continue"
                  : "Ask Elon anything..."
              }
              disabled={isLoading || messageCount >= MAX_MESSAGES}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || messageCount >= MAX_MESSAGES}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <SendIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-500 text-sm">
            <p>Demo complete! Sign up above to continue chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
