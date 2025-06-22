import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { AuthModal } from "./AuthModal";

interface LandingPageProps {
  onShowAuth: (mode: "signin" | "signup") => void;
}

export function LandingPage({ onShowAuth }: LandingPageProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn } = useAuthActions();

  const handleShowAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleDirectSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      toast.success("Signed in successfully!");
    } catch (error) {
      toast.error("Failed to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#4f46e5] flex flex-col lg:items-center lg:justify-center p-4 relative">
      {/* Logo/Brand Name - Fixed positioning with mobile adjustments */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-sm">Magister</h1>
      </div>
      
      {/* Mobile spacing to prevent overlap */}
      <div className="h-12 sm:h-16 lg:hidden"></div>
      
      <div className="w-full max-w-6xl mx-auto flex-1 lg:flex-none">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center h-full lg:h-auto">
          {/* Left Side - Login Container */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md mx-auto lg:mx-0">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome Back
                </h1>
                <p className="text-gray-600">
                  Connect with AI mentors and accelerate your growth
                </p>
              </div>

              <form onSubmit={handleDirectSignIn} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent transition-colors"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent transition-colors"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-[#4f46e5] border-gray-300 rounded focus:ring-[#4f46e5]"
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#4f46e5] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#3730a3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </button>
              </form>

              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>

                <button
                  onClick={() => handleShowAuth("signup")}
                  className="w-full mt-4 bg-white text-[#4f46e5] py-3 px-4 rounded-lg font-medium border-2 border-[#4f46e5] hover:bg-[#4f46e5] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2"
                >
                  Create Account
                </button>
              </div>


            </div>
          </div>

          {/* Right Side - Placeholder Graphic */}
          <div className="order-1 lg:order-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20">
              <div className="aspect-square sm:aspect-auto sm:min-h-[300px] lg:aspect-square bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                <div className="text-center text-white/80 p-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-4 sm:mb-6 bg-white/10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">AI-Powered Mentorship</h3>
                  <p className="text-sm sm:text-base lg:text-lg opacity-90 leading-relaxed">
                    Connect with expert AI mentors across various fields and accelerate your personal and professional growth.
                  </p>
                </div>
              </div>
              
              {/* Feature highlights */}
              <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 text-white/90">
                  <div className="w-2 h-2 bg-white/60 rounded-full flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm">Personalized guidance from AI experts</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <div className="w-2 h-2 bg-white/60 rounded-full flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm">24/7 availability for instant support</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <div className="w-2 h-2 bg-white/60 rounded-full flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm">Track progress and build lasting habits</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onSwitchMode={setAuthMode}
      />
    </div>
  );
}
