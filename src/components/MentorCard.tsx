interface MentorCardProps {
  mentor: {
    _id: string;
    name: string;
    bio: string;
    categories: string[];
    profileImageUrl?: string | null;
    createdBy?: string;
  };
  onStartChat: () => void;
  onOpenKnowledgeBase?: () => void;
  currentUserId?: string;
}

import { BookOpenIcon } from "lucide-react";

export function MentorCard({ mentor, onStartChat, onOpenKnowledgeBase, currentUserId }: MentorCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
          {mentor.profileImageUrl ? (
            <img
              src={mentor.profileImageUrl}
              alt={mentor.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-semibold">
              {mentor.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">{mentor.name}</h3>
          <div className="flex flex-wrap gap-1 mb-2">
            {mentor.categories.map((category) => (
              <span
                key={category}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{mentor.bio}</p>
      
      <div className="flex gap-2">
        <button
          onClick={onStartChat}
          className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors font-medium"
        >
          Start Chat
        </button>
        {currentUserId && mentor.createdBy === currentUserId && onOpenKnowledgeBase && (
          <button
            onClick={onOpenKnowledgeBase}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            title="Manage Knowledge Base"
          >
            <BookOpenIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
