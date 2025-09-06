/**
 * React components and hooks for authentication
 */

// Context and Provider
export {
  AuthProvider,
  useAuthContext,
  type AuthContextValue,
  type AuthProviderProps
} from './context';

// Hooks
export {
  useAuth,
  useUser,
  useProfile,
  useSession,
  useRequireAuth,
  useAuthGuard,
  useRole,
  usePermission,
  useSessionManager
} from './hooks';

// Guard Components
export {
  AuthGuard,
  RoleGuard,
  PermissionGuard,
  GuestGuard,
  ConditionalRender,
  ProfileGuard,
  type AuthGuardProps,
  type RoleGuardProps,
  type PermissionGuardProps,
  type GuestGuardProps,
  type ConditionalRenderProps,
  type ProfileGuardProps
} from './guards';

// Server Components
export {
  ServerAuthWrapper,
  getCurrentUser,
  getUserProfile,
  isAuthenticated,
  requireAuth,
  hasRole,
  hasPermission,
  type ServerAuthWrapperProps
} from './server';