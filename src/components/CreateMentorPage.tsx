import { useState, useRef, useEffect } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { ArrowLeftIcon, ImageIcon, XIcon, PlusIcon, SparklesIcon, BookOpenIcon } from "lucide-react";
import { KnowledgeBaseModal } from "./KnowledgeBaseModal";
import { Id } from "../../convex/_generated/dataModel";

interface CreateMentorPageProps {
  onBack: () => void;
  onMentorCreated: (mentorId: string) => void;
  editingMentorId?: string | null;
}

export function CreateMentorPage({ onBack, onMentorCreated, editingMentorId }: CreateMentorPageProps) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [personaPrompt, setPersonaPrompt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [createdMentorId, setCreatedMentorId] = useState<Id<"mentors"> | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const createMentor = useMutation(api.mentors.create);
  const updateMentor = useMutation(api.mentors.update);
  const generateUploadUrl = useMutation(api.mentors.generateUploadUrl);
  const generateSuggestions = useAction(api.mentors.generateMentorSuggestions);
  
  // Get mentor data if editing
  const existingMentor = useQuery(
    api.mentors.getById,
    editingMentorId ? { mentorId: editingMentorId as any } : "skip"
  );

  const isEditing = !!editingMentorId;

  // Populate form when editing
  useEffect(() => {
    if (isEditing && existingMentor) {
      setName(existingMentor.name);
      setBio(existingMentor.bio);
      setPersonaPrompt(existingMentor.personaPrompt);
      setTags(existingMentor.categories);
      if (existingMentor.profileImageUrl) {
        setImagePreview(existingMentor.profileImageUrl);
      }
      setCreatedMentorId(existingMentor._id);
    }
  }, [isEditing, existingMentor]);

  const handleImageSelect = (file: File) => {
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a PNG, JPG, JPEG, or WebP image");
      return;
    }

    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleGenerateAISuggestions = async () => {
    if (!name.trim()) {
      toast.error("Please enter a mentor name first");
      return;
    }

    setIsGeneratingSuggestions(true);
    try {
      const suggestions = await generateSuggestions({ name: name.trim() });
      
      // Apply suggestions
      setBio(suggestions.bio);
      setPersonaPrompt(suggestions.personaPrompt);
      setTags(suggestions.tags);
      
      setShowAISuggestions(true);
      toast.success("AI suggestions generated! Review and customize as needed.");
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast.error("Failed to generate AI suggestions. Please try again.");
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    // Reset AI suggestions flag when name changes
    if (showAISuggestions) {
      setShowAISuggestions(false);
    }
  };

  const handleManageKnowledgeBase = () => {
    if (isEditing && editingMentorId) {
      setCreatedMentorId(editingMentorId as any);
      setShowKnowledgeBase(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter a mentor name");
      return;
    }
    
    if (!bio.trim()) {
      toast.error("Please enter a bio");
      return;
    }
    
    if (!personaPrompt.trim()) {
      toast.error("Please enter a persona prompt");
      return;
    }
    
    if (tags.length === 0) {
      toast.error("Please add at least one tag");
      return;
    }

    setIsSubmitting(true);
    
    try {
      let profileImageId: string | undefined;
      
      // Upload image if selected
      if (selectedImage) {
        const uploadUrl = await generateUploadUrl();
        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });

        if (!uploadResult.ok) {
          throw new Error("Failed to upload image");
        }

        const { storageId } = await uploadResult.json();
        profileImageId = storageId;
      }
      
      if (isEditing && editingMentorId) {
        // Update existing mentor
        await updateMentor({
          mentorId: editingMentorId as any,
          name: name.trim(),
          bio: bio.trim(),
          personaPrompt: personaPrompt.trim(),
          categories: tags,
          profileImage: profileImageId as any,
        });
        
        toast.success("Mentor updated successfully!");
        onMentorCreated(editingMentorId);
      } else {
        // Create new mentor
        const mentorId = await createMentor({
          name: name.trim(),
          bio: bio.trim(),
          personaPrompt: personaPrompt.trim(),
          categories: tags,
          profileImage: profileImageId as any,
        });
        
        setCreatedMentorId(mentorId);
        toast.success("Mentor created successfully! You can now add documents to enhance their knowledge.");
        
        // Show knowledge base modal instead of immediately going back
        setShowKnowledgeBase(true);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} mentor:`, error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} mentor. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKnowledgeBaseClose = () => {
    setShowKnowledgeBase(false);
    if (createdMentorId) {
      onMentorCreated(createdMentorId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-6 group"
          >
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Mentors
          </button>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              {isEditing ? 'Edit Mentor' : 'Create New Mentor'}
            </h1>
            <p className="text-gray-600 text-lg">
              {isEditing 
                ? 'Update your AI mentor\'s personality and expertise.'
                : 'Design an AI mentor with a unique personality and expertise to help others grow.'
              }
            </p>
          </div>
        </div>

        {/* Knowledge Base Management Button - Only show when editing */}
        {isEditing && existingMentor && (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <BookOpenIcon className="w-5 h-5" />
                  Knowledge Base
                </h3>
                <p className="text-sm text-blue-700">
                  Manage documents and knowledge sources for this mentor
                </p>
              </div>
              <button
                onClick={handleManageKnowledgeBase}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <BookOpenIcon className="w-4 h-4" />
                Manage Knowledge Base
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Profile Image */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Profile Image <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                
                <div className="flex items-center gap-6">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-4 border-gradient-to-r from-blue-200 to-purple-200 shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={clearSelectedImage}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full flex items-center justify-center hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg transform hover:scale-110"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-dashed border-gray-300 flex items-center justify-center shadow-inner">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-200 text-sm font-medium text-gray-700 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    {imagePreview ? "Change Image" : "Upload Image"}
                  </button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file);
                  }}
                  className="hidden"
                />
                
                <p className="text-xs text-gray-500 mt-3">
                  PNG, JPG, JPEG, or WebP. Max 5MB.
                </p>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">
                  Mentor Name <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="e.g., Dr. Sarah Chen, Marketing Guru Mike"
                    className="flex-1 px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                    maxLength={50}
                    required
                  />
                  {name.trim() && !showAISuggestions && !isEditing && (
                    <button
                      type="button"
                      onClick={handleGenerateAISuggestions}
                      disabled={isGeneratingSuggestions}
                      className="px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      title="Generate AI suggestions for bio, tags, and persona"
                    >
                      {isGeneratingSuggestions ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="hidden sm:inline">Generating...</span>
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">AI Assist</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {name.length}/50 characters
                </div>
                {name.trim() && !showAISuggestions && !isEditing && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-purple-700">
                      <SparklesIcon className="w-4 h-4" />
                      <span className="font-semibold">AI Assistance Available!</span>
                    </div>
                    <p className="text-xs text-purple-600 mt-1">
                      Click "AI Assist" to automatically generate bio, tags, and persona prompt based on the mentor name.
                    </p>
                  </div>
                )}
                {showAISuggestions && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <SparklesIcon className="w-4 h-4" />
                      <span className="font-semibold">AI suggestions applied!</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Review and customize the generated content below as needed.
                    </p>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 mb-3">
                  Short Bio <span className="text-red-500">*</span>
                  {showAISuggestions && (
                    <span className="ml-2 text-xs text-green-600 font-normal bg-green-100 px-2 py-1 rounded-full">✨ AI Generated</span>
                  )}
                </label>
                <input
                  id="bio"
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A brief description of the mentor's expertise and background"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                  maxLength={120}
                  required
                />
                <div className="text-xs text-gray-500 mt-2">
                  {bio.length}/120 characters
                </div>
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 mb-3">
                  Tags <span className="text-red-500">*</span>
                  {showAISuggestions && (
                    <span className="ml-2 text-xs text-green-600 font-normal bg-green-100 px-2 py-1 rounded-full">✨ AI Generated</span>
                  )}
                </label>
                
                {/* Tag Display */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:bg-blue-300 rounded-full p-1 transition-colors"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Tag Input */}
                <div className="flex gap-3">
                  <input
                    id="tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder="Add tags (e.g., Business, Leadership, Technology)"
                    className="flex-1 px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                    disabled={tags.length >= 10}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim() || tags.includes(tagInput.trim()) || tags.length >= 10}
                    className="px-4 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter or comma to add tags. Maximum 10 tags. ({tags.length}/10)
                </p>
              </div>

              {/* Persona Prompt */}
              <div>
                <label htmlFor="personaPrompt" className="block text-sm font-semibold text-gray-700 mb-3">
                  Persona Prompt <span className="text-red-500">*</span>
                  {showAISuggestions && (
                    <span className="ml-2 text-xs text-green-600 font-normal bg-green-100 px-2 py-1 rounded-full">✨ AI Generated</span>
                  )}
                </label>
                <textarea
                  id="personaPrompt"
                  value={personaPrompt}
                  onChange={(e) => setPersonaPrompt(e.target.value)}
                  placeholder="Describe how this mentor should behave, their communication style, expertise areas, and personality traits. This will guide the AI's responses."
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 shadow-sm hover:shadow-md"
                  rows={6}
                  maxLength={1000}
                  required
                />
                <div className="text-xs text-gray-500 mt-2">
                  {personaPrompt.length}/1000 characters
                </div>
                <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                  <p className="text-xs text-blue-700 flex items-start gap-2">
                    <span className="text-blue-500 text-sm">💡</span>
                    <span>
                      <strong>Tip:</strong> Be specific about the mentor's expertise, communication style, and how they should help users. 
                      This directly impacts the quality of AI responses.
                    </span>
                  </p>
                </div>
              </div>
            </form>
          </div>

          {/* Submit Section */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-t border-gray-200">
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-white transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !name.trim() || !bio.trim() || !personaPrompt.trim() || tags.length === 0}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    {isEditing ? 'Update Mentor' : 'Create Mentor'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Knowledge Base Modal */}
        {showKnowledgeBase && createdMentorId && (
          <KnowledgeBaseModal
            isOpen={showKnowledgeBase}
            onClose={handleKnowledgeBaseClose}
            mentorId={createdMentorId}
          />
        )}
      </div>
    </div>
  );
}
