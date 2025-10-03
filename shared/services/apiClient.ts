/**
 * @fileoverview Shared API Client
 * @module ApiClient
 * @version 1.0.0
 * @description Shared API client for both PWA and mobile applications
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { Platform } from 'react-native' // Will be undefined in PWA context

// Types
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export interface ApiError {
  message: string
  code?: string
  status?: number
  errors?: string[]
}

// Configuration
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || process.env.API_URL || 'https://api.writecarenotes.com/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Platform': typeof Platform !== 'undefined' ? Platform.OS : 'web',
    'X-Client-Version': '1.0.0'
  }
}

class ApiClient {
  private client: AxiosInstance
  private refreshTokenPromise: Promise<string> | null = null

  constructor() {
    this.client = axios.create(API_CONFIG)
    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add authentication token
        const token = this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId()

        // Add organization context if available
        const orgId = this.getOrganizationId()
        if (orgId) {
          config.headers['X-Organization-ID'] = orgId
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      async (error) => {
        const originalRequest = error.config

        // Handle token expiration
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const newToken = await this.refreshAuthToken()
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.handleAuthenticationFailure()
            return Promise.reject(refreshError)
          }
        }

        // Handle network errors
        if (!error.response) {
          return Promise.reject({
            message: 'Network error. Please check your internet connection.',
            code: 'NETWORK_ERROR'
          } as ApiError)
        }

        // Handle API errors
        const apiError: ApiError = {
          message: error.response.data?.message || 'An unexpected error occurred',
          code: error.response.data?.code,
          status: error.response.status,
          errors: error.response.data?.errors
        }

        return Promise.reject(apiError)
      }
    )
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      // PWA context
      return localStorage.getItem('accessToken')
    } else {
      // React Native context - would need AsyncStorage
      // This is a placeholder - actual implementation would use AsyncStorage
      return null
    }
  }

  private getOrganizationId(): string | null {
    if (typeof window !== 'undefined') {
      // PWA context
      const user = localStorage.getItem('currentUser')
      return user ? JSON.parse(user).organizationId : null
    } else {
      // React Native context
      return null
    }
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private async refreshAuthToken(): Promise<string | null> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise
    }

    this.refreshTokenPromise = this.performTokenRefresh()
    
    try {
      const token = await this.refreshTokenPromise
      return token
    } finally {
      this.refreshTokenPromise = null
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    const refreshToken = this.getRefreshToken()
    
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await axios.post(`${API_CONFIG.baseURL}/auth/refresh`, {
      refreshToken
    })

    const { token } = response.data.data
    this.setAuthToken(token)
    
    return token
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken')
    } else {
      return null
    }
  }

  private setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token)
    }
  }

  private handleAuthenticationFailure(): void {
    // Clear stored tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('currentUser')
      
      // Redirect to login page
      window.location.href = '/login'
    } else {
      // React Native context - would need to handle navigation differently
      console.log('Authentication failed - need to handle navigation')
    }
  }

  // Public API methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config)
    return response.data
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config)
    return response.data
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config)
    return response.data
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data, config)
    return response.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config)
    return response.data
  }

  // File upload method
  async upload<T = any>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })
    return response.data
  }

  // Download method
  async download(url: string, filename?: string): Promise<Blob | string> {
    const response = await this.client.get(url, {
      responseType: 'blob'
    })

    if (typeof window !== 'undefined') {
      // PWA context - return blob for download
      return response.data
    } else {
      // React Native context - would need different handling
      return response.data
    }
  }
}

export const apiClient = new ApiClient()
export default apiClient