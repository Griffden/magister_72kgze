import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, ChevronRightIcon, MessageCircleIcon, XIcon, TrashIcon, MoreVerticalIcon, EditIcon } from "lucide-react";
import { toast } from "sonner";

interface GlobalChatSidebarProps {
  onOpenChat: (chatId: string) => void;
  currentChatId?: string | null;
  isOpen: boolean;
  onToggle: () => void;
}

export function GlobalChatSidebar({ onOpenChat, currentChatId, isOpen, onToggle }: GlobalChatSidebarProps) {
  const chats = useQuery(api.chats.list) || [];
  const [expandedMentors, setExpandedMentors] = useState<Set<string>>(new Set());
  const [showMentorMenu, setShowMentorMenu] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  
  const deleteChat = useMutation(api.chatDeletion.deleteChat);
  const deleteAllChatsWithMentor = useMutation(api.chatDeletion.deleteAllChatsWithMentor);
  const updateChatTitle = useMutation(api.chats.updateTitle);

  // Group chats by mentor
  const chatsByMentor = chats.reduce((acc: any, chat: any) => {
    if (!chat.mentorName) return acc;
    
    const mentorId = chat.mentorId;
    if (!acc[mentorId]) {
      acc[mentorId] = {
        mentor: {
          name: chat.mentorName,
          profileImageUrl: chat.mentorProfileImageUrl,
        },
        chats: [],
      };
    }
    acc[mentorId].chats.push(chat);
    return acc;
  }, {} as Record<string, { mentor: any; chats: any[] }>);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMentorMenu(null);
        setShowChatMenu(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMentorExpansion = (mentorId: string) => {
    const newExpanded = new Set(expandedMentors);
    if (newExpanded.has(mentorId)) {
      newExpanded.delete(mentorId);
    } else {
      newExpanded.add(mentorId);
    }
    setExpandedMentors(newExpanded);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleDeleteChat = async (chatId: string, chatTitle: string) => {
    if (confirm(`Are you sure you want to delete "${chatTitle}"? This action cannot be undone.`)) {
      try {
        await deleteChat({ chatId: chatId as any });
        toast.success("Chat deleted successfully");
        setShowChatMenu(null);
      } catch (error) {
        toast.error("Failed to delete chat");
      }
    }
  };

  const handleDeleteAllChatsWithMentor = async (mentorId: string, mentorName: string) => {
    if (confirm(`Are you sure you want to delete ALL chats with ${mentorName}? This will also delete your conversation memory. This action cannot be undone.`)) {
      try {
        await deleteAllChatsWithMentor({ mentorId: mentorId as any });
        toast.success(`All chats with ${mentorName} deleted successfully`);
        setShowMentorMenu(null);
      } catch (error) {
        toast.error("Failed to delete chats");
      }
    }
  };

  const handleRenameChat = (chatId: string, currentTitle: string) => {
    setShowRenameModal(chatId);
    setNewChatTitle(currentTitle);
    setShowChatMenu(null);
  };

  const handleSubmitRename = async () => {
    if (!showRenameModal || !newChatTitle.trim()) return;

    try {
      await updateChatTitle({
        chatId: showRenameModal as any,
        title: newChatTitle.trim(),
      });
      toast.success("Chat renamed successfully");
      setShowRenameModal(null);
      setNewChatTitle("");
    } catch (error) {
      toast.error("Failed to rename chat");
    }
  };

  const handleCancelRename = () => {
    setShowRenameModal(null);
    setNewChatTitle("");
  };

  return (
    <div ref={menuRef}>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-50 transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-80 lg:relative lg:top-0 lg:h-[calc(100vh-4rem)] lg:z-auto
        ${!isOpen ? 'lg:w-0 lg:overflow-hidden lg:border-r-0' : 'lg:w-80'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <MessageCircleIcon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-900">Chat History</h3>
            </div>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-200 rounded-md transition-colors lg:hidden"
            >
              <XIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {Object.keys(chatsByMentor).length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircleIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No chats yet</p>
                <p className="text-xs text-gray-400 mt-1">Start a conversation with a mentor!</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {Object.entries(chatsByMentor).map(([mentorId, { mentor, chats }]: any) => {
                  const isExpanded = expandedMentors.has(mentorId);
                  const sortedChats = chats.sort((a: any, b: any) => b.lastMessageTime - a.lastMessageTime);
                  
                  return (
                    <div key={mentorId} className="mb-2">
                      {/* Mentor Header */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleMentorExpansion(mentorId)}
                          className="flex-1 flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                            {mentor.profileImageUrl ? (
                              <img
                                src={mentor.profileImageUrl}
                                alt={mentor.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm font-semibold">
                                {mentor.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 text-left">
                            <div className="font-medium text-gray-900 text-sm">{mentor.name}</div>
                            <div className="text-xs text-gray-500">{chats.length} chat{chats.length !== 1 ? 's' : ''}</div>
                          </div>
                          
                          {isExpanded ? (
                            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMentorMenu(showMentorMenu === mentorId ? null : mentorId);
                              setShowChatMenu(null);
                            }}
                            className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                          >
                            <MoreVerticalIcon className="w-4 h-4 text-gray-500" />
                          </button>
                          
                          {showMentorMenu === mentorId && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[160px]">
                              <button
                                onClick={() => handleDeleteAllChatsWithMentor(mentorId, mentor.name)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <TrashIcon className="w-4 h-4" />
                                Delete All Chats
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Chat Sessions */}
                      {isExpanded && (
                        <div className="ml-4 space-y-1 mt-1">
                          {sortedChats.map((chat: any) => (
                            <div key={chat._id} className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  onOpenChat(chat._id);
                                  // Close sidebar on mobile after selection
                                  if (window.innerWidth < 1024) {
                                    onToggle();
                                  }
                                }}
                                className={`flex-1 text-left p-3 rounded-lg transition-colors ${
                                  currentChatId === chat._id
                                    ? "bg-primary text-white"
                                    : "hover:bg-gray-100 text-gray-700"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">
                                      {chat.title}
                                    </div>
                                    <div className={`text-xs mt-1 ${
                                      currentChatId === chat._id ? "text-white/80" : "text-gray-500"
                                    }`}>
                                      {formatTimestamp(chat.lastMessageTime)}
                                    </div>
                                  </div>
                                </div>
                              </button>
                              
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowChatMenu(showChatMenu === chat._id ? null : chat._id);
                                    setShowMentorMenu(null);
                                  }}
                                  className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                                >
                                  <MoreVerticalIcon className="w-3 h-3 text-gray-500" />
                                </button>
                                
                                {showChatMenu === chat._id && (
                                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[140px]">
                                    <button
                                      onClick={() => handleRenameChat(chat._id, chat.title)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                      <EditIcon className="w-3 h-3" />
                                      Rename Chat
                                    </button>
                                    <button
                                      onClick={() => handleDeleteChat(chat._id, chat.title)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      <TrashIcon className="w-3 h-3" />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rename Chat Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Rename Chat
              </h3>
              
              <div className="mb-4">
                <label htmlFor="chat-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Chat Title
                </label>
                <input
                  id="chat-title"
                  type="text"
                  value={newChatTitle}
                  onChange={(e) => setNewChatTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSubmitRename();
                    } else if (e.key === "Escape") {
                      handleCancelRename();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter new chat title..."
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelRename}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRename}
                  disabled={!newChatTitle.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                >
                  Rename
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
