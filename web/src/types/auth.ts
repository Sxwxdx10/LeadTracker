// Types d'authentification pour le frontend

export interface LoginRequest {
  email: string;
  password: string;
  organizationDomain: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  organizationName: string;
  organizationDescription?: string;
  organizationDomain?: string;
}

export interface ResetPasswordRequest {
  email: string;
  organizationDomain: string;
}

export interface ConfirmResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfo;
  organization: OrganizationInfo;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
  jobTitle?: string;
  roles: string[];
}

export interface OrganizationInfo {
  id: string;
  name: string;
  domain: string;
  timeZone?: string;
  currency?: string;
}

export interface AuthState {
  user: UserInfo | null;
  organization: OrganizationInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface VerifyEmailRequest {
  email: string;
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
  organizationDomain: string;
}

export interface RegisterWithInvitationRequest {
  invitationToken: string;
  password: string;
  confirmPassword: string;
}

export interface InvitationValidationResponse {
  valid: boolean;
  invitation?: {
    email: string;
    firstName: string;
    lastName: string;
    jobTitle?: string;
    role: string;
    organization: {
      id: string;
      name: string;
      domain: string;
    };
  };
  message?: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  registerWithInvitation: (data: RegisterWithInvitationRequest) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: UserInfo) => void;
}
