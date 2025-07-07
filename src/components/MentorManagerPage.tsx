import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { 
  ArrowLeftIcon, 
  EditIcon, 
  TrashIcon, 
  CopyIcon, 
  SearchIcon,
  PlusIcon,
  CalendarIcon,
  TagIcon,
  UserIcon,
  MoreVerticalIcon,
  ImageIcon,
  SparklesIcon
} from "lucide-react";

interface MentorManagerPageProps {
  onBack: () => void;
  onCreateMentor: () => void;
  onEditMentor: (mentorId: string) => void;
}

export function MentorManagerPage({ onBack, onCreateMentor, onEditMentor }: MentorManagerPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMentors, setSelectedMentors] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showMentorMenu, setShowMentorMenu] = useState<string | null>(null);

  const userMentors = useQuery(api.mentors.listByUser) || [];
  const deleteMentor = useMutation(api.mentors.delete_);

  // Filter mentors based on search term
  const filteredMentors = userMentors.filter(mentor =>
    mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectMentor = (mentorId: string) => {
    const newSelected = new Set(selectedMentors);
    if (newSelected.has(mentorId)) {
      newSelected.delete(mentorId);
    } else {
      newSelected.add(mentorId);
    }
    setSelectedMentors(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMentors.size === filteredMentors.length) {
      setSelectedMentors(new Set());
    } else {
      setSelectedMentors(new Set(filteredMentors.map(m => m._id)));
    }
  };

  const handleDeleteMentor = async (mentorId: string) => {
    try {
      await deleteMentor({ mentorId: mentorId as any });
      toast.success("Mentor deleted successfully");
      setShowDeleteModal(null);
      setShowMentorMenu(null);
    } catch (error) {
      toast.error("Failed to delete mentor");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        Array.from(selectedMentors).map(mentorId =>
          deleteMentor({ mentorId: mentorId as any })
        )
      );
      toast.success(`${selectedMentors.size} mentor(s) deleted successfully`);
      setSelectedMentors(new Set());
      setShowBulkDeleteModal(false);
    } catch (error) {
      toast.error("Failed to delete mentors");
    }
  };

  const handleDuplicateMentor = async (mentor: any) => {
    // For now, just show a toast - this would need a duplicate mutation
    toast.info("Duplicate feature coming soon!");
    setShowMentorMenu(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (userMentors.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={onBack}
              className="p-3 hover:bg-white/80 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 group"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all" />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Mentor Manager
              </h1>
              <p className="text-gray-600 mt-1">Create and manage your AI mentors</p>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No Mentors Created Yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              You haven't created any mentors yet. Create your first mentor to start building your AI mentor collection.
            </p>
            <button
              onClick={onCreateMentor}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium text-lg"
            >
              <SparklesIcon className="w-5 h-5" />
              Create Your First Mentor
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-3 hover:bg-white/80 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 group"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all" />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Mentor Manager
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your {userMentors.length} mentor{userMentors.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onCreateMentor}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
          >
            <PlusIcon className="w-5 h-5" />
            Create New Mentor
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search mentors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
              />
            </div>
            
            {selectedMentors.size > 0 && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-red-50 to-pink-50 px-4 py-2 rounded-xl border border-red-200">
                <span className="text-sm font-medium text-red-700">
                  {selectedMentors.size} selected
                </span>
                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium"
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mentors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((mentor) => (
            <div
              key={mentor._id}
              className={`bg-white rounded-2xl shadow-lg border transition-all duration-200 hover:shadow-xl transform hover:-translate-y-1 ${
                selectedMentors.has(mentor._id) 
                  ? 'border-blue-300 ring-2 ring-blue-200 shadow-blue-100' 
                  : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedMentors.has(mentor._id)}
                      onChange={() => handleSelectMentor(mentor._id)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors"
                    />
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden flex-shrink-0 shadow-md">
                      {mentor.profileImageUrl ? (
                        <img
                          src={mentor.profileImageUrl}
                          alt={mentor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-lg">
                          {mentor.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-lg">{mentor.name}</h3>
                      <p className={`text-sm font-medium ${mentor.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                        {mentor.isActive ? '● Active' : '○ Inactive'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowMentorMenu(showMentorMenu === mentor._id ? null : mentor._id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVerticalIcon className="w-5 h-5 text-gray-500" />
                    </button>
                    
                    {showMentorMenu === mentor._id && (
                      <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-10 min-w-[180px] overflow-hidden">
                        <button
                          onClick={() => {
                            onEditMentor(mentor._id);
                            setShowMentorMenu(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <EditIcon className="w-4 h-4" />
                          Edit Mentor
                        </button>
                        <button
                          onClick={() => handleDuplicateMentor(mentor)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <CopyIcon className="w-4 h-4" />
                          Duplicate
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(mentor._id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                  {truncateText(mentor.bio, 100)}
                </p>
                
                {/* Tags */}
                {mentor.categories.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <TagIcon className="w-4 h-4 text-gray-400" />
                    {mentor.categories.slice(0, 3).map((category, index) => (
                      <span
                        key={index}
                        className="inline-block px-3 py-1 text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full font-medium"
                      >
                        {category}
                      </span>
                    ))}
                    {mentor.categories.length > 3 && (
                      <span className="text-xs text-gray-500 font-medium">
                        +{mentor.categories.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                
                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Created {formatDate(mentor._creationTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{mentor.chatCount || 0} chats</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t border-gray-100 p-4 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex gap-3">
                  <button
                    onClick={() => onEditMentor(mentor._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    <EditIcon className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDuplicateMentor(mentor)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    <CopyIcon className="w-4 h-4" />
                    Duplicate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredMentors.length === 0 && searchTerm && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <SearchIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">No mentors found</h3>
            <p className="text-gray-600 text-lg">
              No mentors match your search for "<span className="font-medium text-gray-900">{searchTerm}</span>". Try a different search term.
            </p>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {filteredMentors.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMentors.size === filteredMentors.length && filteredMentors.length > 0}
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select all ({filteredMentors.length})
                  </span>
                </label>
              </div>
              
              <div className="text-sm text-gray-600 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-lg border border-blue-200">
                <span className="font-medium">Total: {userMentors.length} mentor{userMentors.length !== 1 ? 's' : ''}</span>
                {searchTerm && <span> • Showing: {filteredMentors.length}</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrashIcon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                Delete Mentor
              </h3>
              <p className="text-gray-600 mb-8 text-center leading-relaxed">
                Are you sure you want to delete this mentor? This action cannot be undone and will also delete all associated chats and conversations.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteMentor(showDeleteModal)}
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Delete Mentor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrashIcon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                Delete Multiple Mentors
              </h3>
              <p className="text-gray-600 mb-8 text-center leading-relaxed">
                Are you sure you want to delete <span className="font-medium text-gray-900">{selectedMentors.size} mentor{selectedMentors.size !== 1 ? 's' : ''}</span>? 
                This action cannot be undone and will also delete all associated chats and conversations.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Delete {selectedMentors.size} Mentor{selectedMentors.size !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
