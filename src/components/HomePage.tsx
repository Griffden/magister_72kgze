import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { MentorCard } from "./MentorCard";
import { KnowledgeBaseModal } from "./KnowledgeBaseModal";
import { ChevronDownIcon, FilterIcon, PlusIcon, SparklesIcon, BrainIcon, BookOpenIcon } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

interface HomePageProps {
  onStartChat: (mentorId: string) => void;
  onBrowseCategory: (category: string) => void;
  onCreateMentor: () => void;
}

export function HomePage({ onStartChat, onBrowseCategory, onCreateMentor }: HomePageProps) {
  const mentors = useQuery(api.mentors.list) || [];
  const user = useQuery(api.auth.loggedInUser);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState<Id<"mentors"> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get unique categories from mentors
  const categories = Array.from(
    new Set(mentors.flatMap(mentor => mentor.categories))
  ).sort();

  // Filter mentors based on selected category
  const filteredMentors = selectedCategory
    ? mentors.filter(mentor => mentor.categories.includes(selectedCategory))
    : mentors;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setShowCategoryDropdown(false);
  };

  const clearCategoryFilter = () => {
    setSelectedCategory(null);
    setShowCategoryDropdown(false);
  };

  const handleOpenKnowledgeBase = (mentorId: Id<"mentors">) => {
    setSelectedMentorId(mentorId);
    setShowKnowledgeBase(true);
  };

  const handleCloseKnowledgeBase = () => {
    setShowKnowledgeBase(false);
    setSelectedMentorId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Create Mentor Hero Section */}
      <div className="mb-12">
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-2xl p-8 md:p-12 shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Content */}
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <BrainIcon className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                    Create Your AI Mentor
                  </h1>
                </div>
                
                <p className="text-lg md:text-xl text-white/90 mb-6 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Design a personalized AI mentor with unique expertise and personality. 
                  Share your knowledge with the world and help others grow.
                </p>
                
                {/* How it works */}
                <div className="grid sm:grid-cols-3 gap-4 mb-8 text-white/80">
                  <div className="flex items-center gap-3 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <span className="text-sm font-medium">Define expertise & personality</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <span className="text-sm font-medium">AI learns your mentor's style</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <span className="text-sm font-medium">Share & help others grow</span>
                  </div>
                </div>
                
                <button
                  onClick={onCreateMentor}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-purple-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                  </div>
                  Create Your Mentor
                  <SparklesIcon className="w-5 h-5 text-purple-500 group-hover:text-purple-600 transition-colors" />
                </button>
              </div>
              
              {/* Visual Element */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-48 h-48 md:w-56 md:h-56 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                        <SparklesIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                      </div>
                      <div className="text-white/90 font-medium text-sm md:text-base">
                        AI-Powered
                      </div>
                      <div className="text-white/70 text-xs md:text-sm">
                        Mentorship
                      </div>
                    </div>
                  </div>
                  {/* Floating elements */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400/80 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-400/80 rounded-full animate-pulse delay-1000"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter and Title */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">
            {selectedCategory ? `${selectedCategory} Mentors` : "All Mentors"}
          </h2>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-[200px] justify-between"
            >
              <div className="flex items-center gap-2">
                <FilterIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {selectedCategory || "Browse by Category"}
                </span>
              </div>
              <ChevronDownIcon 
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  showCategoryDropdown ? 'rotate-180' : ''
                }`} 
              />
            </button>

            {showCategoryDropdown && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                {/* Clear filter option */}
                <button
                  onClick={clearCategoryFilter}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    !selectedCategory ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  All Categories
                </button>
                
                {/* Category options */}
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      selectedCategory === category 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-gray-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
                
                {categories.length === 0 && (
                  <div className="px-4 py-3 text-gray-500 text-sm">
                    No categories available
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active filter indicator */}
        {selectedCategory && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">Filtered by:</span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {selectedCategory}
              <button
                onClick={clearCategoryFilter}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                title="Clear filter"
              >
                ✕
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Mentors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMentors.map((mentor) => (
          <MentorCard
            key={mentor._id}
            mentor={mentor}
            onStartChat={() => onStartChat(mentor._id)}
            onOpenKnowledgeBase={() => handleOpenKnowledgeBase(mentor._id as any)}
            currentUserId={user?._id}
          />
        ))}
      </div>

      {filteredMentors.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FilterIcon className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {selectedCategory ? `No mentors found in ${selectedCategory}` : "No mentors available"}
          </h3>
          <p className="text-gray-600 mb-4">
            {selectedCategory 
              ? "Try selecting a different category or browse all mentors."
              : "Be the first to create a mentor!"
            }
          </p>
          {selectedCategory ? (
            <button
              onClick={clearCategoryFilter}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
            >
              View All Mentors
            </button>
          ) : (
            <button
              onClick={onCreateMentor}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
            >
              Create Your First Mentor
            </button>
          )}
        </div>
      )}

      {/* Knowledge Base Modal */}
      {showKnowledgeBase && selectedMentorId && (
        <KnowledgeBaseModal
          isOpen={showKnowledgeBase}
          onClose={handleCloseKnowledgeBase}
          mentorId={selectedMentorId}
        />
      )}
    </div>
  );
}
