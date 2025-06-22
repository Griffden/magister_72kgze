import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { MessageSquareIcon, XIcon, SendIcon } from "lucide-react";

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 24 }); // Default: 24px from right and bottom
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const submitFeedback = useMutation(api.feedback.submit);

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('feedbackButtonPosition');
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (error) {
        // Use default position if parsing fails
      }
    }
  }, []);

  // Add global pointer event listeners for smoother dragging
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!isDragging || isOpen) return;
      
      e.preventDefault();
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const buttonSize = 64;
      
      const buttonLeft = e.clientX - dragOffset.x;
      const buttonTop = e.clientY - dragOffset.y;
      
      let newX = viewportWidth - (buttonLeft + buttonSize);
      let newY = viewportHeight - (buttonTop + buttonSize);
      
      newX = Math.max(8, Math.min(newX, viewportWidth - buttonSize - 8));
      newY = Math.max(8, Math.min(newY, viewportHeight - buttonSize - 8));
      
      setPosition({ x: newX, y: newY });
      
      // Check if we've moved enough to consider this a drag
      const moveDistance = Math.sqrt(
        Math.pow(e.clientX - dragStart.x, 2) + Math.pow(e.clientY - dragStart.y, 2)
      );
      
      if (moveDistance > 5) { // 5px threshold
        setHasMoved(true);
      }
    };

    const handleGlobalPointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
        savePosition(position);
        
        // Reset hasMoved after a delay to allow click detection
        setTimeout(() => {
          setHasMoved(false);
        }, 100);
      }
    };

    if (isDragging) {
      document.addEventListener('pointermove', handleGlobalPointerMove);
      document.addEventListener('pointerup', handleGlobalPointerUp);
    }

    return () => {
      document.removeEventListener('pointermove', handleGlobalPointerMove);
      document.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [isDragging, dragOffset, position, isOpen, dragStart]);

  // Save position to localStorage
  const savePosition = (newPosition: { x: number; y: number }) => {
    localStorage.setItem('feedbackButtonPosition', JSON.stringify(newPosition));
  };

  // Handle pointer down for dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isOpen) return; // Don't allow dragging when modal is open
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragOffset({ x: offsetX, y: offsetY });
      setIsDragging(true);
      setHasMoved(false);
    }
    
    // Capture pointer to handle movement outside button
    buttonRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
    savePosition(position);
    
    // Release pointer capture
    buttonRef.current?.releasePointerCapture(e.pointerId);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only prevent click if we actually moved during drag
    if (hasMoved) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error("Please enter your feedback message");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await submitFeedback({
        message: message.trim(),
        email: email.trim() || undefined,
      });
      
      toast.success("Thank you for your feedback!");
      setMessage("");
      setEmail("");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessage("");
    setEmail("");
  };

  return (
    <>
      {/* Floating Button */}
      <button
        ref={buttonRef}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className={`fixed z-40 bg-primary text-white p-4 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 select-none ${
          isDragging 
            ? 'cursor-grabbing scale-110 shadow-2xl' 
            : 'cursor-grab hover:bg-primary-hover hover:scale-105 transition-all duration-200'
        } ${isOpen ? 'pointer-events-none' : ''}`}
        style={{
          right: `${position.x}px`,
          bottom: `${position.y}px`,
          touchAction: 'none', // Prevent default touch behaviors
          userSelect: 'none', // Prevent text selection
          WebkitUserSelect: 'none', // Safari
          WebkitTouchCallout: 'none', // Prevent iOS callout
          transition: isDragging ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        title={isDragging ? "Drag to reposition" : "Send Feedback"}
      >
        <MessageSquareIcon className="w-6 h-6" />
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageSquareIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Send Feedback
                    </h2>
                    <p className="text-sm text-gray-600">
                      Help us improve your experience
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Feedback <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you think, report a bug, or suggest an improvement..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows={4}
                    required
                    disabled={isSubmitting}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {message.length}/500 characters
                  </div>
                </div>

                <div>
                  <label htmlFor="feedback-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={isSubmitting}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    We'll only use this to follow up on your feedback
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!message.trim() || isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <SendIcon className="w-4 h-4" />
                        Send Feedback
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
