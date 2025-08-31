import React from 'react';
import { useAuth } from './AuthProvider';

export function AuthButton() {
  const { user, profile, loading, signIn, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {profile?.avatar_url && (
            <img 
              src={profile.avatar_url} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm text-gray-700">
            {profile?.display_name || user.email}
          </span>
        </div>
        <button
          onClick={signOut}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
    >
      Sign in with Google
    </button>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ConverText</h1>
          <p className="text-gray-600 mb-6">
            Sign in to save your conversion routines and access your history.
          </p>
          <AuthButton />
          <p className="text-xs text-gray-500 mt-4">
            You can still use ConverText without signing in, but your data won't be saved.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}