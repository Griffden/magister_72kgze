import { useState, useRef, useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ChevronDownIcon, UserIcon, SettingsIcon, LogOutIcon, UsersIcon } from "lucide-react";

interface UserDropdownProps {
  user: any;
  onProfileClick: () => void;
  onAdminClick: () => void;
  onMentorManagerClick: () => void;
}

export function UserDropdown({ user, onProfileClick, onAdminClick, onMentorManagerClick }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuthActions();
  const userProfile = useQuery(api.users.getProfile);
  const userMentors = useQuery(api.mentors.listByUser) || [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const handleProfileClick = () => {
    onProfileClick();
    setIsOpen(false);
  };

  const handleAdminClick = () => {
    onAdminClick();
    setIsOpen(false);
  };

  const handleMentorManagerClick = () => {
    onMentorManagerClick();
    setIsOpen(false);
  };

  // Show Mentor Manager only if user has created at least one mentor
  const showMentorManager = userMentors.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
          {userProfile?.profileImageUrl ? (
            <img
              src={userProfile.profileImageUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <UserIcon className="w-5 h-5" />
            </div>
          )}
        </div>
        <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {userProfile?.profileImageUrl ? (
                  <img
                    src={userProfile.profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                    <UserIcon className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || user?.username || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || "No email"}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <UserIcon className="w-4 h-4" />
              My Profile
            </button>

            {showMentorManager && (
              <button
                onClick={handleMentorManagerClick}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <UsersIcon className="w-4 h-4" />
                Mentor Manager
                <span className="ml-auto text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                  {userMentors.length}
                </span>
              </button>
            )}

            {user?.isAdmin && (
              <button
                onClick={handleAdminClick}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <SettingsIcon className="w-4 h-4" />
                Admin Panel
              </button>
            )}
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOutIcon className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
