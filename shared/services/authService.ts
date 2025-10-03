/**
 * @fileoverview Authentication Service
 * @module AuthService
 * @version 1.0.0
 * @description Shared authentication service for PWA and mobile apps
 */

import { apiClient, ApiResponse } from './apiClient'
import { encryptData, decryptData } from '../utils/encryption'

// Types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  permissions: string[]
  organizationId: string
  organizationName: string
  department?: string
  jobTitle?: string
  phoneNumber?: string
  profileImage?: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
  preferences?: {
    language: string
    timezone: string
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
  }
  securitySettings?: {
    mfaEnabled: boolean
    biometricEnabled: boolean
    sessionTimeout: number
  }
}

export interface LoginCredentials {
  email: string
  password: string
  organizationCode?: string
  rememberMe?: boolean
  deviceId?: string
  platform?: string
}

export interface LoginResponse {
  user: User
  token: string
  refreshToken: string
  permissions: string[]
  expiresAt: string
  organizationSettings?: {
    features: string[]
    compliance: string[]
    branding?: {
      logo?: string
      primaryColor?: string
      secondaryColor?: string
    }
  }
}

export interface RefreshTokenResponse {
  token: string
  expiresAt: string
}

export interface PasswordResetRequest {
  email: string
  organizationCode?: string
}

export interface PasswordReset {
  token: string
  newPassword: string
  confirmPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface MFASetupResponse {
  qrCode: string
  secret: string
  backupCodes: string[]
}

export interface MFAVerification {
  code: string
  backupCode?: string
}

class AuthService {
  private readonly endpoints = {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
    updateProfile: '/auth/profile',
    changePassword: '/auth/change-password',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    setupMFA: '/auth/mfa/setup',
    verifyMFA: '/auth/mfa/verify',
    disableMFA: '/auth/mfa/disable',
    validateSession: '/auth/validate-session'
  }

  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    // Encrypt sensitive data before sending
    const encryptedCredentials = {
      ...credentials,
      password: encryptData(credentials.password)
    }

    const response = await apiClient.post<LoginResponse>(
      this.endpoints.login,
      encryptedCredentials
    )

    if (response.success && response.data) {
      // Store user data securely
      await this.storeUserData(response.data)
      return response.data
    }

    throw new Error(response.message || 'Login failed')
  }

  /**
   * Logout user and clear session
   */
  async logout(token?: string): Promise<void> {
    try {
      await apiClient.post(this.endpoints.logout, { token })
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error)
    } finally {
      await this.clearUserData()
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>(
      this.endpoints.refresh,
      { refreshToken }
    )

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Token refresh failed')
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(token?: string): Promise<User> {
    const response = await apiClient.get<User>(this.endpoints.me)

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to get user data')
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: Partial<User>, token?: string): Promise<User> {
    const response = await apiClient.put<User>(
      this.endpoints.updateProfile,
      profileData
    )

    if (response.success && response.data) {
      // Update stored user data
      await this.updateStoredUserData(response.data)
      return response.data
    }

    throw new Error(response.message || 'Profile update failed')
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    // Encrypt passwords before sending
    const encryptedData = {
      currentPassword: encryptData(passwordData.currentPassword),
      newPassword: encryptData(passwordData.newPassword),
      confirmPassword: encryptData(passwordData.confirmPassword)
    }

    const response = await apiClient.post(
      this.endpoints.changePassword,
      encryptedData
    )

    if (!response.success) {
      throw new Error(response.message || 'Password change failed')
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(request: PasswordResetRequest): Promise<void> {
    const response = await apiClient.post(
      this.endpoints.forgotPassword,
      request
    )

    if (!response.success) {
      throw new Error(response.message || 'Password reset request failed')
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetData: PasswordReset): Promise<void> {
    // Encrypt passwords before sending
    const encryptedData = {
      ...resetData,
      newPassword: encryptData(resetData.newPassword),
      confirmPassword: encryptData(resetData.confirmPassword)
    }

    const response = await apiClient.post(
      this.endpoints.resetPassword,
      encryptedData
    )

    if (!response.success) {
      throw new Error(response.message || 'Password reset failed')
    }
  }

  /**
   * Setup Multi-Factor Authentication
   */
  async setupMFA(): Promise<MFASetupResponse> {
    const response = await apiClient.post<MFASetupResponse>(
      this.endpoints.setupMFA
    )

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'MFA setup failed')
  }

  /**
   * Verify MFA code
   */
  async verifyMFA(verification: MFAVerification): Promise<void> {
    const response = await apiClient.post(
      this.endpoints.verifyMFA,
      verification
    )

    if (!response.success) {
      throw new Error(response.message || 'MFA verification failed')
    }
  }

  /**
   * Disable Multi-Factor Authentication
   */
  async disableMFA(password: string): Promise<void> {
    const response = await apiClient.post(
      this.endpoints.disableMFA,
      { password: encryptData(password) }
    )

    if (!response.success) {
      throw new Error(response.message || 'Failed to disable MFA')
    }
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<boolean> {
    try {
      const response = await apiClient.get(this.endpoints.validateSession)
      return response.success
    } catch (error) {
      return false
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string, userPermissions?: string[]): boolean {
    if (!userPermissions) {
      const userData = this.getStoredUserData()
      userPermissions = userData?.permissions || []
    }

    return userPermissions.includes(permission) || userPermissions.includes('admin')
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[], userPermissions?: string[]): boolean {
    return permissions.some(permission => 
      this.hasPermission(permission, userPermissions)
    )
  }

  /**
   * Store user data securely
   */
  private async storeUserData(loginData: LoginResponse): Promise<void> {
    try {
      const encryptedUserData = encryptData(JSON.stringify(loginData.user))
      
      if (typeof window !== 'undefined') {
        // PWA context
        localStorage.setItem('accessToken', loginData.token)
        localStorage.setItem('refreshToken', loginData.refreshToken)
        localStorage.setItem('currentUser', encryptedUserData)
        localStorage.setItem('userPermissions', JSON.stringify(loginData.permissions))
      } else {
        // React Native context - would use AsyncStorage or Keychain
        // Implementation would depend on the specific storage solution
        console.log('Storing user data in mobile context')
      }
    } catch (error) {
      console.error('Failed to store user data:', error)
    }
  }

  /**
   * Get stored user data
   */
  private getStoredUserData(): User | null {
    try {
      if (typeof window !== 'undefined') {
        const encryptedData = localStorage.getItem('currentUser')
        if (encryptedData) {
          const decryptedData = decryptData(encryptedData)
          return JSON.parse(decryptedData)
        }
      }
      return null
    } catch (error) {
      console.error('Failed to get stored user data:', error)
      return null
    }
  }

  /**
   * Update stored user data
   */
  private async updateStoredUserData(userData: User): Promise<void> {
    try {
      const encryptedUserData = encryptData(JSON.stringify(userData))
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', encryptedUserData)
      }
    } catch (error) {
      console.error('Failed to update stored user data:', error)
    }
  }

  /**
   * Clear all stored user data
   */
  private async clearUserData(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('currentUser')
        localStorage.removeItem('userPermissions')
      } else {
        // React Native context
        console.log('Clearing user data in mobile context')
      }
    } catch (error) {
      console.error('Failed to clear user data:', error)
    }
  }
}

export const authService = new AuthService()
export default authService