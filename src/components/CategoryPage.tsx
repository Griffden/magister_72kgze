import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MentorCard } from "./MentorCard";

interface CategoryPageProps {
  category: string;
  onBack: () => void;
  onStartChat: (mentorId: string) => void;
}

export function CategoryPage({ category, onBack, onStartChat }: CategoryPageProps) {
  const mentors = useQuery(api.mentors.getByCategory, { category }) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{category} Mentors</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentors.map((mentor) => (
          <MentorCard
            key={mentor._id}
            mentor={mentor}
            onStartChat={() => onStartChat(mentor._id)}
          />
        ))}
      </div>

      {mentors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No mentors found in this category.</p>
        </div>
      )}
    </div>
  );
}
