import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { MentorCard } from "./MentorCard";
import { ChevronDownIcon, FilterIcon } from "lucide-react";

interface HomePageProps {
  onStartChat: (mentorId: string) => void;
  onBrowseCategory: (category: string) => void;
}

export function HomePage({ onStartChat, onBrowseCategory }: HomePageProps) {
  const mentors = useQuery(api.mentors.list) || [];
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{ color: '#4f46e5' }}>
          Connect with AI Mentors
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Get personalized guidance from AI-powered mentors across various fields.
          Start meaningful conversations that help you grow.
        </p>
      </div>

      {/* Category Filter Dropdown */}
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
              : "Check back later for new mentors."
            }
          </p>
          {selectedCategory && (
            <button
              onClick={clearCategoryFilter}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
            >
              View All Mentors
            </button>
          )}
        </div>
      )}
    </div>
  );
}
