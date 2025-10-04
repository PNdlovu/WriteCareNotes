/**
 * @fileoverview Redux Store Configuration
 * @module Store
 * @version 1.0.0
 * @description Redux store with healthcare-specific middleware and persistence
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { encryptTransform } from 'redux-persist-transform-encrypt'

import authSlice from './slices/authSlice'
import residentsSlice from './slices/residentsSlice'
import medicationSlice from './slices/medicationSlice'
import careNotesSlice from './slices/careNotesSlice'
import complianceSlice from './slices/complianceSlice'
import staffSlice from './slices/staffSlice'
import settingsSlice from './slices/settingsSlice'
import offlineSlice from './slices/offlineSlice'

// Encryption transform for sensitive data
const encryptTransform = encryptTransform({
  secretKey: process.env.VITE_REDUX_ENCRYPT_KEY || 'writecarenotes-default-key-2025',
  onError: (error) => {
    console.error('Redux encryption error:', error)
  }
})

// Root reducer
const rootReducer = combineReducers({
  auth: authSlice,
  residents: residentsSlice,
  medication: medicationSlice,
  careNotes: careNotesSlice,
  compliance: complianceSlice,
  staff: staffSlice,
  settings: settingsSlice,
  offline: offlineSlice
})

// Persist configuration
const persistConfig = {
  key: 'writecarenotes-pwa',
  version: 1,
  storage,
  transforms: [encryptTransform],
  whitelist: ['auth', 'settings', 'offline'], // Only persist these slices
  blacklist: ['residents', 'medication', 'careNotes', 'compliance', 'staff'] // Don't persist sensitive data
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

// Store configuration
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
})

/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch