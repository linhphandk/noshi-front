export interface AuthUser {
  id: string
  email: string
  name: string
}

export interface AuthTokens {
  user: AuthUser
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface RegisterRequest {
  email: string
  name: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface ApiError {
  message: string
}
