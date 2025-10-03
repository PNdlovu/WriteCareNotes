/**
 * @fileoverview Authentication Redux Slice
 * @module AuthSlice
 * @version 1.0.0
 * @description Authentication state management with healthcare role-based access
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authService } from '@services/authService'
import { User, LoginCredentials, AuthState } from '@types/auth'

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  permissions: [],
  organizationId: null,
  lastActivity: null
}

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials)
      
      // Store tokens securely
      localStorage.setItem('accessToken', response.token)
      localStorage.setItem('refreshToken', response.refreshToken)
      
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed')
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState }
      
      if (auth.token) {
        await authService.logout(auth.token)
      }
      
      // Clear stored tokens
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      
      return null
    } catch (error: any) {
      // Even if logout fails on server, clear local data
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      return null
    }
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState }
      
      if (!auth.refreshToken) {
        throw new Error('No refresh token available')
      }
      
      const response = await authService.refreshToken(auth.refreshToken)
      
      // Update stored token
      localStorage.setItem('accessToken', response.token)
      
      return response
    } catch (error: any) {
      // If refresh fails, clear all auth data
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed')
    }
  }
)

export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken')
      
      if (!token) {
        throw new Error('No token found')
      }
      
      const user = await authService.getCurrentUser(token)
      
      return { user, token }
    } catch (error: any) {
      // Clear invalid tokens
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      return rejectWithValue(error.response?.data?.message || 'Authentication check failed')
    }
  }
)

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: Partial<User>, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState }
      
      if (!auth.token) {
        throw new Error('No authentication token')
      }
      
      const updatedUser = await authService.updateProfile(profileData, auth.token)
      
      return updatedUser
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Profile update failed')
    }
  }
)

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateLastActivity: (state) => {
      state.lastActivity = Date.now()
    },
    setPermissions: (state, action: PayloadAction<string[]>) => {
      state.permissions = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.permissions = action.payload.permissions || []
        state.organizationId = action.payload.user.organizationId
        state.lastActivity = Date.now()
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.refreshToken = null
        state.permissions = []
        state.organizationId = null
        state.error = action.payload as string
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.refreshToken = null
        state.permissions = []
        state.organizationId = null
        state.lastActivity = null
        state.error = null
        state.isLoading = false
      })
      
      // Refresh token
      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isLoading = false
        state.token = action.payload.token
        state.lastActivity = Date.now()
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.refreshToken = null
        state.permissions = []
        state.organizationId = null
      })
      
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        state.permissions = action.payload.user.permissions || []
        state.organizationId = action.payload.user.organizationId
        state.lastActivity = Date.now()
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.refreshToken = null
        state.permissions = []
        state.organizationId = null
      })
      
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.lastActivity = Date.now()
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  }
})

export const { clearError, updateLastActivity, setPermissions } = authSlice.actions
export default authSlice.reducer