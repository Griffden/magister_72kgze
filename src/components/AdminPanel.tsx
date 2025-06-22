import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { MessageSquareIcon, CheckIcon, XIcon, TrashIcon, ClockIcon, UserIcon, MailIcon, EyeOffIcon, EyeIcon } from "lucide-react";

interface AdminPanelProps {
  onBack: () => void;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const mentors = useQuery(api.mentors.listAll) || [];
  const feedback = useQuery(api.feedback.list) || [];
  const logoUrl = useQuery(api.admin.getLogo);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMentor, setEditingMentor] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"mentors" | "deactivated" | "feedback">("mentors");
  
  const createMentor = useMutation(api.mentors.create);
  const updateMentor = useMutation(api.mentors.update);
  const deactivateMentor = useMutation(api.mentors.deactivate);
  const reactivateMentor = useMutation(api.mentors.reactivate);
  const generateUploadUrl = useMutation(api.mentors.generateUploadUrl);
  const generateAdminUploadUrl = useMutation(api.admin.generateUploadUrl);
  const updateLogo = useMutation(api.admin.updateLogo);
  const markFeedbackResolved = useMutation(api.feedback.markResolved);
  const deleteFeedback = useMutation(api.feedback.deleteFeedback);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    categories: "",
    personaPrompt: "",
    profileImage: null as string | null,
  });

  // Filter mentors by active status
  const activeMentors = mentors.filter(mentor => mentor.isActive !== false);
  const deactivatedMentors = mentors.filter(mentor => mentor.isActive === false);

  const handleImageUpload = async (file: File) => {
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!result.ok) {
        throw new Error("Upload failed");
      }
      
      const { storageId } = await result.json();
      setFormData(prev => ({ ...prev, profileImage: storageId }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const mentorData = {
      name: formData.name,
      bio: formData.bio,
      categories: formData.categories.split(",").map(c => c.trim()).filter(Boolean),
      personaPrompt: formData.personaPrompt,
      profileImage: formData.profileImage ? formData.profileImage as any : undefined,
    };

    try {
      if (editingMentor) {
        await updateMentor({
          mentorId: editingMentor._id,
          ...mentorData,
        });
        toast.success("Mentor updated successfully");
      } else {
        await createMentor(mentorData);
        toast.success("Mentor created successfully");
      }
      
      setFormData({ name: "", bio: "", categories: "", personaPrompt: "", profileImage: null });
      setShowCreateForm(false);
      setEditingMentor(null);
    } catch (error) {
      toast.error("Failed to save mentor");
    }
  };

  const handleEdit = (mentor: any) => {
    setEditingMentor(mentor);
    setFormData({
      name: mentor.name,
      bio: mentor.bio,
      categories: mentor.categories.join(", "),
      personaPrompt: mentor.personaPrompt,
      profileImage: mentor.profileImage || null,
    });
    setShowCreateForm(true);
  };

  const handleDeactivate = async (mentorId: string) => {
    if (confirm("Are you sure you want to deactivate this mentor?")) {
      try {
        await deactivateMentor({ mentorId: mentorId as any });
        toast.success("Mentor deactivated");
      } catch (error) {
        toast.error("Failed to deactivate mentor");
      }
    }
  };

  const handleReactivate = async (mentorId: string) => {
    if (confirm("Are you sure you want to reactivate this mentor?")) {
      try {
        await reactivateMentor({ mentorId: mentorId as any });
        toast.success("Mentor reactivated");
      } catch (error) {
        toast.error("Failed to reactivate mentor");
      }
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo must be smaller than 5MB");
        return;
      }

      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a PNG, JPG, JPEG, WebP, or SVG image");
        return;
      }

      const uploadUrl = await generateAdminUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!result.ok) {
        throw new Error("Upload failed");
      }
      
      const { storageId } = await result.json();
      await updateLogo({ logoImage: storageId as any });
      toast.success("Logo updated successfully");
    } catch (error) {
      toast.error("Failed to upload logo");
    }
  };

  const handleToggleFeedbackResolved = async (feedbackId: string, currentStatus: boolean) => {
    try {
      await markFeedbackResolved({
        feedbackId: feedbackId as any,
        isResolved: !currentStatus,
      });
      toast.success(currentStatus ? "Feedback marked as unresolved" : "Feedback marked as resolved");
    } catch (error) {
      toast.error("Failed to update feedback status");
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (confirm("Are you sure you want to delete this feedback? This action cannot be undone.")) {
      try {
        await deleteFeedback({ feedbackId: feedbackId as any });
        toast.success("Feedback deleted successfully");
      } catch (error) {
        toast.error("Failed to delete feedback");
      }
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const resolvedFeedback = feedback.filter(f => f.isResolved);
  const unresolvedFeedback = feedback.filter(f => !f.isResolved);

  const renderMentorCard = (mentor: any, isDeactivated = false) => (
    <div key={mentor._id} className={`p-6 flex items-start justify-between ${isDeactivated ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 relative">
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
          {isDeactivated && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <EyeOffIcon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{mentor.name}</h3>
          <p className="text-gray-600 text-sm mb-2">{mentor.bio}</p>
          <div className="flex flex-wrap gap-1">
            {mentor.categories.map((category: string) => (
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
      
      <div className="flex gap-2">
        {!isDeactivated ? (
          <>
            <button
              onClick={() => handleEdit(mentor)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeactivate(mentor._id)}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center gap-1"
            >
              <EyeOffIcon className="w-3 h-3" />
              Deactivate
            </button>
          </>
        ) : (
          <button
            onClick={() => handleReactivate(mentor._id)}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors flex items-center gap-1"
          >
            <EyeIcon className="w-3 h-3" />
            Reactivate
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("mentors")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "mentors"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Active Mentors ({activeMentors.length})
        </button>
        <button
          onClick={() => setActiveTab("deactivated")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "deactivated"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <EyeOffIcon className="w-4 h-4" />
          Deactivated ({deactivatedMentors.length})
        </button>
        <button
          onClick={() => setActiveTab("feedback")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "feedback"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <MessageSquareIcon className="w-4 h-4" />
          Feedback
          {unresolvedFeedback.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unresolvedFeedback.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "mentors" ? (
        <>
          {/* Active Mentors Tab Content */}
          <div className="flex items-center justify-end mb-8">
            <button
              onClick={() => {
                setShowCreateForm(true);
                setEditingMentor(null);
                setFormData({ name: "", bio: "", categories: "", personaPrompt: "", profileImage: null });
              }}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
            >
              Add Mentor
            </button>
          </div>

          {/* Logo Upload Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">App Logo</h2>
            
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-3">
                  Upload a logo to display in the navigation bar. Recommended size: 64px tall.
                </p>
                
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              {logoUrl && (
                <div className="flex-shrink-0">
                  <p className="text-sm text-gray-600 mb-2">Current Logo:</p>
                  <img
                    src={logoUrl}
                    alt="Current Logo"
                    className="h-[64px] w-auto object-contain border border-gray-200 rounded-md p-2 bg-gray-50"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Create/Edit Form */}
          {showCreateForm && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">
                {editingMentor ? "Edit Mentor" : "Create New Mentor"}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categories (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.categories}
                    onChange={(e) => setFormData(prev => ({ ...prev, categories: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="AI, Investing, Product Design"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Persona Prompt
                  </label>
                  <textarea
                    value={formData.personaPrompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, personaPrompt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={6}
                    placeholder="You are [Name], a successful entrepreneur known for... Respond in character with..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                  >
                    {editingMentor ? "Update Mentor" : "Create Mentor"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingMentor(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Mentors List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Active Mentors</h2>
            </div>
            
            <div className="divide-y">
              {activeMentors.map((mentor) => renderMentorCard(mentor, false))}
            </div>
            
            {activeMentors.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No active mentors.
              </div>
            )}
          </div>
        </>
      ) : activeTab === "deactivated" ? (
        <>
          {/* Deactivated Mentors Tab Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b bg-orange-50">
              <div className="flex items-center gap-2">
                <EyeOffIcon className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-semibold text-orange-900">
                  Deactivated Mentors ({deactivatedMentors.length})
                </h2>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                These mentors are hidden from users but can be reactivated at any time.
              </p>
            </div>
            
            <div className="divide-y">
              {deactivatedMentors.map((mentor) => renderMentorCard(mentor, true))}
            </div>
            
            {deactivatedMentors.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                <EyeIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No deactivated mentors</p>
                <p className="text-xs text-gray-400 mt-1">All mentors are currently active!</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Feedback Tab Content */}
          <div className="space-y-6">
            {/* Unresolved Feedback */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b bg-red-50">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-red-600" />
                  <h2 className="text-xl font-semibold text-red-900">
                    Unresolved Feedback ({unresolvedFeedback.length})
                  </h2>
                </div>
              </div>
              
              <div className="divide-y">
                {unresolvedFeedback.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <CheckIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No unresolved feedback</p>
                    <p className="text-xs text-gray-400 mt-1">Great job staying on top of user feedback!</p>
                  </div>
                ) : (
                  unresolvedFeedback.map((item) => (
                    <div key={item._id} className="p-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg p-4 mb-3">
                            <p className="text-gray-900 whitespace-pre-wrap">{item.message}</p>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <ClockIcon className="w-4 h-4" />
                              {formatTimestamp(item._creationTime)}
                            </div>
                            
                            {item.userName && (
                              <div className="flex items-center gap-1">
                                <UserIcon className="w-4 h-4" />
                                {item.userName}
                              </div>
                            )}
                            
                            {item.email && (
                              <div className="flex items-center gap-1">
                                <MailIcon className="w-4 h-4" />
                                {item.email}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleFeedbackResolved(item._id, item.isResolved || false)}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors flex items-center gap-1"
                          >
                            <CheckIcon className="w-3 h-3" />
                            Mark Resolved
                          </button>
                          <button
                            onClick={() => handleDeleteFeedback(item._id)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center gap-1"
                          >
                            <TrashIcon className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Resolved Feedback */}
            {resolvedFeedback.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b bg-green-50">
                  <div className="flex items-center gap-2">
                    <CheckIcon className="w-5 h-5 text-green-600" />
                    <h2 className="text-xl font-semibold text-green-900">
                      Resolved Feedback ({resolvedFeedback.length})
                    </h2>
                  </div>
                </div>
                
                <div className="divide-y">
                  {resolvedFeedback.map((item) => (
                    <div key={item._id} className="p-6 opacity-75">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg p-4 mb-3">
                            <p className="text-gray-900 whitespace-pre-wrap">{item.message}</p>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <ClockIcon className="w-4 h-4" />
                              {formatTimestamp(item._creationTime)}
                            </div>
                            
                            {item.userName && (
                              <div className="flex items-center gap-1">
                                <UserIcon className="w-4 h-4" />
                                {item.userName}
                              </div>
                            )}
                            
                            {item.email && (
                              <div className="flex items-center gap-1">
                                <MailIcon className="w-4 h-4" />
                                {item.email}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleFeedbackResolved(item._id, item.isResolved || false)}
                            className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors flex items-center gap-1"
                          >
                            <XIcon className="w-3 h-3" />
                            Mark Unresolved
                          </button>
                          <button
                            onClick={() => handleDeleteFeedback(item._id)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center gap-1"
                          >
                            <TrashIcon className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
