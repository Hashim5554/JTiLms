import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import Tilt from 'react-parallax-tilt';
import { useSession } from '../contexts/SessionContext';

export function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session, user } = useSession();

  useEffect(() => {
    if (session && user) {
      console.log('Login.tsx: Session detected, redirecting to home', session, user);
      navigate('/');
    }
  }, [session, user, navigate]);

  useEffect(() => {
    // Debug logging for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Login.tsx: Auth state change', event, session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error('Error logging in with Google:', error.message);
      setError('Failed to sign in with Google. Please try again.');
      setLoading(false);
    }
  };

  const handleSignInWithDifferentAccount = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First sign out the current user
      await supabase.auth.signOut();
      
      // Then sign in with Google, which will prompt for account selection
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account' // This forces Google to show account selection
          }
        },
      });
      
      if (error) {
        console.error('Error signing in with different account:', error.message);
        setError('Failed to sign in with different account. Please try again.');
        setLoading(false);
      }
      // Don't set loading to false here - let the OAuth redirect handle it
      // The loading state will be reset when the user returns from Google OAuth
    } catch (error) {
      console.error('Error in handleSignInWithDifferentAccount:', error);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Subtle Floating Shapes in Gray/Indigo/White */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-40 h-40 bg-indigo-100 dark:bg-gray-800 rounded-full blur-2xl animate-float-slow" />
        <div className="absolute bottom-20 right-20 w-56 h-56 bg-white/30 dark:bg-gray-700 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full blur-xl animate-float-reverse" />
      </div>

      {/* Login Card with 3D Tilt */}
      <Tilt tiltMaxAngleX={15} tiltMaxAngleY={15} glareEnable={true} glareMaxOpacity={0.18} className="z-10">
        <div className="w-full max-w-lg p-12 space-y-8 rounded-3xl shadow-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border border-white/30 dark:border-gray-700/40 relative">
          {/* Animated Logo */}
          <div className="flex justify-center">
            <div className="animate-fade-in-up">
              <Logo />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white drop-shadow-lg tracking-tight animate-fade-in-up delay-100">
              LGS JTi LMS
            </h1>
            <p className="mt-2 text-lg text-gray-700 dark:text-gray-300 animate-fade-in-up delay-200">
              Sign in to continue
            </p>
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg animate-fade-in-up delay-300">
              {error}
            </div>
          )}

          <div className="space-y-4 animate-fade-in-up delay-400">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-white bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 disabled:opacity-50 transition-transform transform hover:scale-105 active:scale-95"
              style={{ boxShadow: '0 8px 32px 0 rgba(185, 28, 28, 0.13)' }}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <>
                  <span className="bg-white rounded-full p-1 mr-3 shadow-md flex items-center justify-center" style={{ minWidth: 32, minHeight: 32 }}>
                    <svg
                      className="w-6 h-6"
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.99 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                  </span>
                  Sign in with Google
                </>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400">or</span>
              </div>
            </div>

            <button
              onClick={handleSignInWithDifferentAccount}
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg text-lg font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50 transition-transform transform hover:scale-105 active:scale-95"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 dark:border-gray-400"></div>
              ) : (
                <>
                  <span className="bg-white rounded-full p-1 mr-3 shadow-md flex items-center justify-center" style={{ minWidth: 32, minHeight: 32 }}>
                    <svg
                      className="w-6 h-6"
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.99 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                  </span>
                  Sign in with different account
                </>
              )}
            </button>
          </div>
        </div>
      </Tilt>

      {/* Custom Animations */}
      <style>{`
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float 10s ease-in-out infinite;
        }
        .animate-float-reverse {
          animation: float-reverse 8s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(30px) scale(0.97); }
        }
        .animate-fade-in-up {
          opacity: 0;
          transform: translateY(30px) scale(0.98);
          animation: fadeInUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        .animate-fade-in-up.delay-100 { animation-delay: 0.1s; }
        .animate-fade-in-up.delay-200 { animation-delay: 0.2s; }
        .animate-fade-in-up.delay-300 { animation-delay: 0.3s; }
        .animate-fade-in-up.delay-400 { animation-delay: 0.4s; }
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}