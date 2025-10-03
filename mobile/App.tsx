/**
 * @fileoverview React Native Main App Component
 * @module App
 * @version 1.0.0
 * @description Main application component for WriteCareNotes Mobile
 */

import React, { useEffect, useState } from 'react'
import { StatusBar, Platform, Alert } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from 'react-query'
import { PersistGate } from 'redux-persist/integration/react'
import SplashScreen from 'react-native-splash-screen'
import DeviceInfo from 'react-native-device-info'
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions'
import messaging from '@react-native-firebase/messaging'
import crashlytics from '@react-native-firebase/crashlytics'

import { store, persistor } from './src/store/store'
import { AppNavigator } from './src/navigation/AppNavigator'
import { ErrorBoundary } from './src/components/ErrorBoundary'
import { NetworkProvider } from './src/components/NetworkProvider'
import { NotificationProvider } from './src/components/NotificationProvider'
import { LoadingScreen } from './src/components/LoadingScreen'
import { SecurityProvider } from './src/components/SecurityProvider'
import { navigationRef } from './src/navigation/navigationService'
import { initializeApp } from './src/services/appInitializationService'

// React Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.response?.status === 401) return false
        // Don't retry on client errors (4xx)
        if (error?.response?.status >= 400 && error?.response?.status < 500) return false
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always'
    },
    mutations: {
      retry: 1
    }
  }
})

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    initializeApplication()
  }, [])

  const initializeApplication = async () => {
    try {
      // Hide splash screen after initialization
      setTimeout(() => {
        SplashScreen.hide()
      }, 2000)

      // Initialize Firebase Crashlytics
      await crashlytics().setCrashlyticsCollectionEnabled(true)
      
      // Set device info for crash reporting
      const deviceId = await DeviceInfo.getUniqueId()
      const deviceName = await DeviceInfo.getDeviceName()
      const systemVersion = DeviceInfo.getSystemVersion()
      
      await crashlytics().setAttributes({
        deviceId,
        deviceName,
        systemVersion,
        platform: Platform.OS
      })

      // Request necessary permissions
      await requestPermissions()

      // Initialize push notifications
      await initializePushNotifications()

      // Initialize app services
      await initializeApp()

      setIsInitialized(true)
    } catch (error) {
      console.error('App initialization failed:', error)
      crashlytics().recordError(error as Error)
      setInitError('Failed to initialize application. Please restart the app.')
    }
  }

  const requestPermissions = async () => {
    const permissions = Platform.select({
      ios: [
        PERMISSIONS.IOS.CAMERA,
        PERMISSIONS.IOS.PHOTO_LIBRARY,
        PERMISSIONS.IOS.MICROPHONE,
        PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        PERMISSIONS.IOS.FACE_ID
      ],
      android: [
        PERMISSIONS.ANDROID.CAMERA,
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        PERMISSIONS.ANDROID.RECORD_AUDIO,
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        PERMISSIONS.ANDROID.USE_FINGERPRINT,
        PERMISSIONS.ANDROID.USE_BIOMETRIC
      ]
    })

    if (permissions) {
      for (const permission of permissions) {
        try {
          const result = await check(permission)
          if (result === RESULTS.DENIED) {
            await request(permission)
          }
        } catch (error) {
          console.warn(`Failed to request permission ${permission}:`, error)
        }
      }
    }
  }

  const initializePushNotifications = async () => {
    try {
      // Request permission for push notifications
      const authStatus = await messaging().requestPermission()
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL

      if (enabled) {
        // Get FCM token
        const fcmToken = await messaging().getToken()
        console.log('FCM Token:', fcmToken)
        
        // Store token for server registration
        // This would be sent to your backend API
      }

      // Handle foreground messages
      messaging().onMessage(async remoteMessage => {
        console.log('Foreground message:', remoteMessage)
        Alert.alert(
          remoteMessage.notification?.title || 'Notification',
          remoteMessage.notification?.body || 'You have a new message'
        )
      })

      // Handle background/quit state messages
      messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('Notification opened app:', remoteMessage)
        // Navigate to appropriate screen based on notification data
      })

      // Check if app was opened from a notification
      const initialNotification = await messaging().getInitialNotification()
      if (initialNotification) {
        console.log('App opened from notification:', initialNotification)
        // Handle initial notification
      }
    } catch (error) {
      console.error('Push notification setup failed:', error)
      crashlytics().recordError(error as Error)
    }
  }

  if (!isInitialized) {
    return <LoadingScreen error={initError} />
  }

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <SecurityProvider>
              <NetworkProvider>
                <NotificationProvider>
                  <NavigationContainer ref={navigationRef}>
                    <StatusBar
                      barStyle="light-content"
                      backgroundColor="#1976d2"
                      translucent={false}
                    />
                    <AppNavigator />
                  </NavigationContainer>
                </NotificationProvider>
              </NetworkProvider>
            </SecurityProvider>
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  )
}

export default App