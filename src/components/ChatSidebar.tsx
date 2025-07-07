import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface ChatSidebarProps {
  onOpenChat: (chatId: string) => void;
  currentChatId: string | null;
}

export function ChatSidebar({ onOpenChat, currentChatId }: ChatSidebarProps) {
  const chats = useQuery(api.chats.list) || [];

  // Group chats by mentor
  const chatsByMentor = chats.reduce((acc: any, chat: any) => {
    if (!chat.mentor) return acc;
    
    const mentorId = chat.mentorId;
    if (!acc[mentorId]) {
      acc[mentorId] = {
        mentor: chat.mentor,
        chats: [],
      };
    }
    acc[mentorId].chats.push(chat);
    return acc;
  }, {} as Record<string, { mentor: any; chats: any[] }>);

  return (
    <div className="w-80 bg-white border-r h-full overflow-y-auto">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900">Your Chats</h3>
      </div>
      
      <div className="p-2">
        {Object.entries(chatsByMentor).map(([mentorId, { mentor, chats }]: any) => (
          <div key={mentorId} className="mb-4">
            <div className="flex items-center gap-2 px-2 py-1 mb-2">
              <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {mentor.profileImageUrl ? (
                  <img
                    src={mentor.profileImageUrl}
                    alt={mentor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-semibold">
                    {mentor.name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-gray-700">{mentor.name}</span>
            </div>
            
            <div className="space-y-1 ml-4">
              {chats.map((chat: any) => (
                <button
                  key={chat._id}
                  onClick={() => onOpenChat(chat._id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    currentChatId === chat._id
                      ? "bg-primary text-white"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div className="truncate">{chat.title}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
        
        {chats.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No chats yet. Start a conversation with a mentor!
          </div>
        )}
      </div>
    </div>
  );
}
