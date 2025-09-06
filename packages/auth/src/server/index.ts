/**
 * Server-side authentication utilities
 * 
 * Main entry point for server-side auth functions
 */

// Export auth functions
export {
  getUser,
  getSession as getAuthSession,
  signInWithPassword,
  signUpWithPassword,
  signInWithOAuth,
  signOut,
  resetPasswordForEmail,
  updatePassword,
  refreshSession as refreshAuthSession,
  exchangeCodeForSession,
  isAuthenticated,
  requireAuth
} from './auth';

// Export profile functions
export {
  getProfile,
  getProfileById,
  upsertProfile,
  updateProfile,
  deleteProfile,
  getUserWithProfile,
  ensureProfile
} from './profile';

// Export session functions
export {
  getSession,
  refreshSession,
  setSession,
  verifySession,
  onAuthStateChange,
  isSessionValid,
  getSessionExpiresIn,
  createSessionRefreshTimer
} from './session';

// Export client factories
export {
  createServerClient,
  createServiceRoleClient
} from '../clients/server';

// Re-export types for convenience
export type {
  AuthUser,
  AuthProfile,
  AuthSession,
  AuthError,
  AuthResponse,
  SignInCredentials,
  SignUpCredentials,
  OAuthSignInOptions,
  PasswordResetOptions,
  UpdatePasswordOptions
} from '../types';