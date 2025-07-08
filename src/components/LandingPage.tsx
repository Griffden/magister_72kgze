import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DemoChatWindow } from "./DemoChatWindow";
import { 
  SparklesIcon, 
  BrainIcon, 
  UsersIcon, 
  MessageSquareIcon,
  ArrowRightIcon,
  CheckIcon,
  StarIcon
} from "lucide-react";

interface LandingPageProps {
  onShowAuth: (mode: "signin" | "signup") => void;
}

export function LandingPage({ onShowAuth }: LandingPageProps) {
  const logoUrl = useQuery(api.admin.getLogo);

  const handleSignUpClick = () => {
    onShowAuth("signup");
  };

  const handleSignInClick = () => {
    onShowAuth("signin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-[68px] w-auto object-contain"
                />
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSignInClick}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={handleSignUpClick}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium">
                  <SparklesIcon className="w-4 h-4" />
                  AI-Powered Mentorship Platform
                </div>
                
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Learn from the
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    {" "}world's greatest{" "}
                  </span>
                  minds
                </h1>
                
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                  Get personalized guidance from AI mentors trained on the wisdom of history's most successful entrepreneurs, innovators, and thought leaders.
                </p>
              </div>

              {/* Features */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl backdrop-blur-sm border border-white/40">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <BrainIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI-Powered</h3>
                    <p className="text-sm text-gray-600">Advanced AI mentors</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl backdrop-blur-sm border border-white/40">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <UsersIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Expert Mentors</h3>
                    <p className="text-sm text-gray-600">Learn from the best</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl backdrop-blur-sm border border-white/40">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MessageSquareIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">24/7 Available</h3>
                    <p className="text-sm text-gray-600">Always ready to help</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl backdrop-blur-sm border border-white/40">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Personalized</h3>
                    <p className="text-sm text-gray-600">Tailored guidance</p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSignUpClick}
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Start Learning Now
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button
                  onClick={handleSignInClick}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/80 text-gray-700 font-semibold rounded-xl hover:bg-white transition-colors border border-gray-200 backdrop-blur-sm"
                >
                  Sign In
                </button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Trusted by thousands</span> of learners worldwide
                </div>
              </div>
            </div>

            {/* Right Column - Interactive Demo */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative h-[600px] bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl">
                <DemoChatWindow onSignUpClick={handleSignUpClick} />
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-bounce opacity-80"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-400 rounded-full animate-bounce delay-1000 opacity-80"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our AI Mentors?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience personalized mentorship that adapts to your learning style and goals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white/80 rounded-2xl border border-white/40 backdrop-blur-sm">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BrainIcon className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Deep Expertise</h3>
              <p className="text-gray-600">
                Our AI mentors are trained on the knowledge and wisdom of world-class experts in their fields.
              </p>
            </div>

            <div className="text-center p-8 bg-white/80 rounded-2xl border border-white/40 backdrop-blur-sm">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageSquareIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Natural Conversations</h3>
              <p className="text-gray-600">
                Engage in natural, flowing conversations that feel like talking to a real mentor.
              </p>
            </div>

            <div className="text-center p-8 bg-white/80 rounded-2xl border border-white/40 backdrop-blur-sm">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <SparklesIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Always Available</h3>
              <p className="text-gray-600">
                Get guidance whenever you need it, 24/7. Your mentor is always ready to help you grow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with X Logo */}
      <section className="py-20 pb-16 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to accelerate your growth?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are already getting personalized guidance from AI mentors.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={handleSignUpClick}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
            >
              Get Started Free
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-8 text-indigo-200 text-sm mb-8">
            <div className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4" />
              <span>Start chatting instantly</span>
            </div>
          </div>

          {/* X Logo and Link */}
          <div className="flex items-center justify-center">
            <a
              href="https://x.com/magistermentor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-200 hover:text-white transition-colors duration-200 p-2 rounded-lg hover:bg-white/10"
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
      </section>
    </div>
  );
}
