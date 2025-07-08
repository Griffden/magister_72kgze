import { useState, useRef } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { XIcon, UploadIcon, FileTextIcon, TrashIcon, BookOpenIcon, SparklesIcon } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorId: Id<"mentors">;
}

export function KnowledgeBaseModal({ isOpen, onClose, mentorId }: KnowledgeBaseModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const documents = useQuery(api.documents.listByMentor, { mentorId }) || [];
  const uploadDocument = useMutation(api.documents.uploadDocument);
  const deleteDocument = useMutation(api.documents.deleteDocument);
  const mentor = useQuery(api.mentors.getById, { mentorId });
  const generateKnowledgeBase = useAction(api.ai.generateKnowledgeBase);

  const handleFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("File must be smaller than 5MB");
      return;
    }

    const allowedTypes = ['text/plain', 'application/pdf', 'text/markdown'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      toast.error("Please upload a TXT, MD, or PDF file");
      return;
    }

    setIsUploading(true);
    try {
      const text = await file.text();
      setTitle(file.name);
      setContent(text);
      toast.success("File loaded! Review and save to add to knowledge base.");
    } catch (error) {
      toast.error("Failed to read file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error("Please provide both title and content");
      return;
    }

    try {
      await uploadDocument({
        mentorId,
        title: title.trim(),
        content: content.trim(),
        fileType: "text",
      });
      
      toast.success("Document added to knowledge base!");
      setTitle("");
      setContent("");
    } catch (error) {
      toast.error("Failed to add document");
    }
  };

  const handleDelete = async (documentId: Id<"documents">) => {
    try {
      await deleteDocument({ documentId });
      toast.success("Document removed from knowledge base");
    } catch (error) {
      toast.error("Failed to remove document");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpenIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Knowledge Base
                </h2>
                <p className="text-sm text-gray-600">
                  Add documents to enhance your mentor's knowledge
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Add Document */}
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Document</h3>
              <button
                onClick={async () => {
                  setIsGenerating(true);
                  try {
                    const result = await generateKnowledgeBase({ 
                      mentorId, 
                      documents: documents.map(doc => ({ title: doc.title, content: doc.content }))
                    });
                    toast.success(result);
                  } catch (error) {
                    toast.error("Failed to generate knowledge base. Please set your OpenAI API key in environment variables.");
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                disabled={isGenerating}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-sm font-medium"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    AI Generate
                  </>
                )}
              </button>
            </div>
            
            {/* File Upload */}
            <div className="mb-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex flex-col items-center gap-2"
              >
                <UploadIcon className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {isUploading ? "Loading file..." : "Click to upload TXT, MD, or PDF"}
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
              />
            </div>

            {/* Manual Entry Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="doc-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Document Title
                </label>
                <input
                  id="doc-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Company Guidelines, Best Practices"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="doc-content" className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  id="doc-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste or type the document content here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={12}
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {content.length} characters
                </div>
              </div>

              <button
                type="submit"
                disabled={!title.trim() || !content.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add to Knowledge Base
              </button>
            </form>
          </div>

          {/* Right Panel - Document List */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Documents ({documents.length})
            </h3>
            
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <FileTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No documents added yet</p>
                <p className="text-sm text-gray-400">
                  Add documents to enhance your mentor's knowledge
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <FileTextIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <h4 className="font-medium text-gray-900 truncate">
                            {doc.title}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {doc.content.substring(0, 150)}
                          {doc.content.length > 150 && "..."}
                        </p>
                        <div className="text-xs text-gray-400 mt-2">
                          {doc.content.length} characters
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="ml-3 p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove document"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              💡 Documents help your mentor provide more accurate and detailed responses
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
