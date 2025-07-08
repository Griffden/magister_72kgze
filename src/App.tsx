import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { HomePage } from "./components/HomePage";
import { ChatPage } from "./components/ChatPage";
import { CategoryPage } from "./components/CategoryPage";
import { AdminPanel } from "./components/AdminPanel";
import { ProfilePage } from "./components/ProfilePage";
import { CreateMentorPage } from "./components/CreateMentorPage";
import { MentorManagerPage } from "./components/MentorManagerPage";
import { AuthModal } from "./components/AuthModal";
import { GlobalChatSidebar } from "./components/GlobalChatSidebar";
import { UserDropdown } from "./components/UserDropdown";
import { LandingPage } from "./components/LandingPage";
import { FeedbackButton } from "./components/FeedbackButton";
import { MenuIcon } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import { useIsMobile } from "./hooks/useIsMobile";

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>("home");
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState<"signin" | "signup">("signin");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingMentorId, setEditingMentorId] = useState<string | null>(null);
  
  const user = useQuery(api.auth.loggedInUser);
  const logoUrl = useQuery(api.admin.getLogo);
  const isMobile = useIsMobile();

  // MOBILE LANDING PAGE CONTROL - Change this to true to re-enable landing page for mobile
  const showLandingPageOnMobile = false;

  // Set admin status on login
  useEffect(() => {
    if (user?.email === "griffden@gmail.com" && !user.isAdmin) {
      // This will be handled by the setAdminStatus mutation
    }
  }, [user]);

  const handleStartChat = (mentorId: string) => {
    if (!user) {
      setShowAuthModal(true);
      setAuthAction("signin");
      return;
    }
    setSelectedMentorId(mentorId);
    setSelectedChatId(null);
    setCurrentPage("chat");
  };

  const handleOpenChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setSelectedMentorId(null);
    setCurrentPage("chat");
  };

  const handleBrowseCategory = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage("category");
  };

  const handleCreateMentor = () => {
    if (!user) {
      setShowAuthModal(true);
      setAuthAction("signin");
      return;
    }
    setEditingMentorId(null);
    setCurrentPage("create-mentor");
  };

  const handleEditMentor = (mentorId: string) => {
    setEditingMentorId(mentorId);
    setCurrentPage("create-mentor");
  };

  const handleMentorCreated = (mentorId: string) => {
    setCurrentPage("home");
    // Optionally start a chat with the newly created mentor
    // handleStartChat(mentorId);
  };

  const handleShowAuth = (mode: "signin" | "signup") => {
    setShowAuthModal(true);
    setAuthAction(mode);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "chat":
        return (
          <ChatPage
            mentorId={selectedMentorId}
            chatId={selectedChatId}
            onBack={() => {
              setCurrentPage("home");
              setSelectedMentorId(null);
              setSelectedChatId(null);
            }}
            onOpenChat={handleOpenChat}
            sidebarOpen={sidebarOpen}
          />
        );
      case "category":
        return (
          <CategoryPage
            category={selectedCategory!}
            onBack={() => setCurrentPage("home")}
            onStartChat={handleStartChat}
          />
        );
      case "admin":
        return <AdminPanel onBack={() => setCurrentPage("home")} />;
      case "profile":
        return <ProfilePage onBack={() => setCurrentPage("home")} />;
      case "create-mentor":
        return (
          <CreateMentorPage
            onBack={() => setCurrentPage("home")}
            onMentorCreated={handleMentorCreated}
            editingMentorId={editingMentorId}
          />
        );
      case "mentor-manager":
        return (
          <MentorManagerPage
            onBack={() => setCurrentPage("home")}
            onCreateMentor={handleCreateMentor}
            onEditMentor={handleEditMentor}
          />
        );
      default:
        return (
          <HomePage
            onStartChat={handleStartChat}
            onBrowseCategory={handleBrowseCategory}
            onCreateMentor={handleCreateMentor}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Unauthenticated>
        {/* Show landing page for desktop OR mobile if enabled */}
        {!isMobile || showLandingPageOnMobile ? (
          <LandingPage onShowAuth={handleShowAuth} />
        ) : (
          // Mobile users see main app interface with sign-in button
          <>
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm h-20 flex justify-between items-center border-b shadow-sm px-4">
              <div className="flex items-center gap-3">
                {/* Logo */}
                {logoUrl && (
                  <button
                    onClick={() => setCurrentPage("home")}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="h-[95px] w-auto object-contain"
                    />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleShowAuth("signin")}
                  className="px-4 py-2 text-white font-medium rounded-lg transition-colors"
                  style={{ backgroundColor: '#4f46e5' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                >
                  Sign In
                </button>
              </div>
            </header>

            <main className="flex-1 min-w-0 overflow-auto">
              {renderCurrentPage()}
            </main>

            {/* Footer - Hide on chat pages */}
            {currentPage !== "chat" && (
              <footer className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12 px-4 mt-auto">
                <div className="max-w-6xl mx-auto">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a
                      href="https://x.com/magistermentor"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-gray-200 transition-colors duration-200"
                      title="Follow us on X"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </footer>
            )}
          </>
        )}
      </Unauthenticated>

      <Authenticated>
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm h-20 flex justify-between items-center border-b shadow-sm px-4">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle - always visible when authenticated */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            
            {/* Logo */}
            {logoUrl && (
              <button
                onClick={() => setCurrentPage("home")}
                className="hover:opacity-80 transition-opacity"
              >
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-[95px] w-auto object-contain"
                />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <UserDropdown
              user={user}
              onProfileClick={() => setCurrentPage("profile")}
              onAdminClick={() => setCurrentPage("admin")}
              onMentorManagerClick={() => setCurrentPage("mentor-manager")}
            />
          </div>
        </header>

        <div className="flex flex-1 relative overflow-hidden">
          <GlobalChatSidebar
            onOpenChat={handleOpenChat}
            currentChatId={selectedChatId}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="flex-1 min-w-0 overflow-auto">
            {renderCurrentPage()}
          </main>
        </div>

        {/* Feedback Button - Only show when authenticated */}
        <FeedbackButton />

        {/* Footer - Hide on chat pages */}
        {currentPage !== "chat" && (
          <footer className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12 px-4 mt-auto">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="https://x.com/magistermentor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                  title="Follow us on X"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>
          </footer>
        )}
      </Authenticated>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authAction}
        onSwitchMode={setAuthAction}
      />

      <Toaster />
      <Analytics />
    </div>
  );
}
