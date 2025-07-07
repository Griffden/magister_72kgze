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
  ImageIcon
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
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Mentor Manager</h1>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Mentors Created Yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You haven't created any mentors yet. Create your first mentor to start building your AI mentor collection.
            </p>
            <button
              onClick={onCreateMentor}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Create Your First Mentor
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mentor Manager</h1>
              <p className="text-gray-600">Manage your {userMentors.length} mentor{userMentors.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onCreateMentor}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Create New Mentor
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search mentors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            {selectedMentors.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedMentors.size} selected
                </span>
                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
              className={`bg-white rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md ${
                selectedMentors.has(mentor._id) ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedMentors.has(mentor._id)}
                      onChange={() => handleSelectMentor(mentor._id)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {mentor.profileImageUrl ? (
                        <img
                          src={mentor.profileImageUrl}
                          alt={mentor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 font-semibold">
                          {mentor.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{mentor.name}</h3>
                      <p className="text-sm text-gray-500">
                        {mentor.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowMentorMenu(showMentorMenu === mentor._id ? null : mentor._id)}
                      className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <MoreVerticalIcon className="w-4 h-4 text-gray-500" />
                    </button>
                    
                    {showMentorMenu === mentor._id && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[160px]">
                        <button
                          onClick={() => {
                            onEditMentor(mentor._id);
                            setShowMentorMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <EditIcon className="w-4 h-4" />
                          Edit Mentor
                        </button>
                        <button
                          onClick={() => handleDuplicateMentor(mentor)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <CopyIcon className="w-4 h-4" />
                          Duplicate
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(mentor._id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {truncateText(mentor.bio, 100)}
                </p>
                
                {/* Tags */}
                {mentor.categories.length > 0 && (
                  <div className="flex items-center gap-1 mb-3 flex-wrap">
                    <TagIcon className="w-3 h-3 text-gray-400" />
                    {mentor.categories.slice(0, 3).map((category, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md"
                      >
                        {category}
                      </span>
                    ))}
                    {mentor.categories.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{mentor.categories.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                
                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    Created {formatDate(mentor._creationTime)}
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{mentor.chatCount || 0} chats</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t border-gray-100 p-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditMentor(mentor._id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <EditIcon className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDuplicateMentor(mentor)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <CopyIcon className="w-3 h-3" />
                    Duplicate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredMentors.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No mentors found</h3>
            <p className="text-gray-600">
              No mentors match your search for "{searchTerm}". Try a different search term.
            </p>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {filteredMentors.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedMentors.size === filteredMentors.length && filteredMentors.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">
                    Select all ({filteredMentors.length})
                  </span>
                </label>
              </div>
              
              <div className="text-sm text-gray-600">
                Total: {userMentors.length} mentor{userMentors.length !== 1 ? 's' : ''}
                {searchTerm && ` • Showing: ${filteredMentors.length}`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Mentor
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this mentor? This action cannot be undone and will also delete all associated chats and conversations.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteMentor(showDeleteModal)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Multiple Mentors
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete {selectedMentors.size} mentor{selectedMentors.size !== 1 ? 's' : ''}? 
                This action cannot be undone and will also delete all associated chats and conversations.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
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
