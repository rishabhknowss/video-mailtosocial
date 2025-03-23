// app/components/AppLayout.tsx
"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { 
  User, 
  LogOut, 
  Video, 
  Mic, 
  FileText, 
  PlayCircle,
  Home
} from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6" />
            <span>VideoGen</span>
          </Link>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-md hover:bg-purple-700 focus:outline-none"
            onClick={toggleMobileMenu}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {session ? (
              <>
                <Link href="/dashboard" className="hover:text-gray-200 flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link href="/upload" className="hover:text-gray-200 flex items-center gap-1">
                  <Video className="h-4 w-4" />
                  <span>Upload</span>
                </Link>
                <Link href="/voice" className="hover:text-gray-200 flex items-center gap-1">
                  <Mic className="h-4 w-4" />
                  <span>Voice</span>
                </Link>
                <Link href="/create" className="hover:text-gray-200 flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>Create</span>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    {session.user?.image && (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || "User"} 
                        className="h-8 w-8 rounded-full"
                      />
                    )}
                    <span className="ml-2">{session.user?.name}</span>
                  </div>
                  <button 
                    onClick={() => signOut()} 
                    className="p-2 rounded-full hover:bg-purple-700"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <button 
                onClick={() => signIn("google")} 
                className="px-4 py-2 bg-white text-purple-600 rounded-md hover:bg-gray-100 flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                <span>Login</span>
              </button>
            )}
          </nav>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-purple-700 p-4">
            <nav className="flex flex-col space-y-4">
              {session ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className="text-white hover:bg-purple-600 px-3 py-2 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/upload" 
                    className="text-white hover:bg-purple-600 px-3 py-2 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Upload
                  </Link>
                  <Link 
                    href="/voice" 
                    className="text-white hover:bg-purple-600 px-3 py-2 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Voice
                  </Link>
                  <Link 
                    href="/create" 
                    className="text-white hover:bg-purple-600 px-3 py-2 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Create
                  </Link>
                  <div className="border-t border-purple-500 pt-2 flex items-center justify-between">
                    <div className="flex items-center">
                      {session.user?.image && (
                        <img 
                          src={session.user.image} 
                          alt={session.user.name || "User"} 
                          className="h-8 w-8 rounded-full"
                        />
                      )}
                      <span className="ml-2">{session.user?.name}</span>
                    </div>
                    <button 
                      onClick={() => signOut()} 
                      className="p-2 rounded-full hover:bg-purple-600 text-white"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <button 
                  onClick={() => signIn("google")} 
                  className="w-full px-4 py-2 bg-white text-purple-600 rounded-md hover:bg-gray-100 flex items-center justify-center gap-2"
                >
                  <User className="h-4 w-4" />
                  <span>Login</span>
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {status === "loading" ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : status === "unauthenticated" ? (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Welcome to VideoGen</h1>
            <p className="text-gray-600 mb-8">Sign in to create your own AI-powered videos</p>
            <button 
              onClick={() => signIn("google")} 
              className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2 mx-auto"
            >
              <User className="h-5 w-5" />
              <span>Sign in with Google</span>
            </button>
          </div>
        ) : (
          children
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} VideoGen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}