/**
 * @fileoverview App Navigator
 * @module AppNavigator
 * @version 1.0.0
 * @description Main navigation setup for React Native app
 */

import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createDrawerNavigator } from '@react-navigation/drawer'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { useSelector } from 'react-redux'

import { RootState } from '../store/store'
import { AuthNavigator } from './AuthNavigator'
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen'
import { ResidentsScreen } from '../screens/Residents/ResidentsScreen'
import { ResidentDetailsScreen } from '../screens/Residents/ResidentDetailsScreen'
import { MedicationScreen } from '../screens/Medication/MedicationScreen'
import { MedicationDetailsScreen } from '../screens/Medication/MedicationDetailsScreen'
import { CareNotesScreen } from '../screens/CareNotes/CareNotesScreen'
import { CareNoteDetailsScreen } from '../screens/CareNotes/CareNoteDetailsScreen'
import { IncidentsScreen } from '../screens/Incidents/IncidentsScreen'
import { ProfileScreen } from '../screens/Profile/ProfileScreen'
import { SettingsScreen } from '../screens/Settings/SettingsScreen'
import { NotificationsScreen } from '../screens/Notifications/NotificationsScreen'
import { OfflineScreen } from '../screens/Offline/OfflineScreen'
import { CustomDrawerContent } from '../components/CustomDrawerContent'
import { HeaderRight } from '../components/HeaderRight'

export type RootStackParamList = {
  Auth: undefined
  Main: undefined
  ResidentDetails: { residentId: string }
  MedicationDetails: { medicationId: string }
  CareNoteDetails: { noteId: string }
  Profile: undefined
  Settings: undefined
  Notifications: undefined
  Offline: undefined
}

export type TabParamList = {
  Dashboard: undefined
  Residents: undefined
  Medication: undefined
  CareNotes: undefined
  Incidents: undefined
}

const Stack = createStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()
const Drawer = createDrawerNavigator()

// Tab Navigator for main screens
const TabNavigator: React.FC = () => {
  const theme = {
    primary: '#1976d2',
    secondary: '#dc004e',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#000000'
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard'
              break
            case 'Residents':
              iconName = 'people'
              break
            case 'Medication':
              iconName = 'local-pharmacy'
              break
            case 'CareNotes':
              iconName = 'assignment'
              break
            case 'Incidents':
              iconName = 'local-hospital'
              break
            default:
              iconName = 'help'
          }

          return <Icon name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60
        },
        headerStyle: {
          backgroundColor: theme.primary
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold'
        }
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerRight: () => <HeaderRight />
        }}
      />
      <Tab.Screen 
        name="Residents" 
        component={ResidentsScreen}
        options={{
          title: 'Residents',
          headerRight: () => <HeaderRight />
        }}
      />
      <Tab.Screen 
        name="Medication" 
        component={MedicationScreen}
        options={{
          title: 'Medication',
          headerRight: () => <HeaderRight />
        }}
      />
      <Tab.Screen 
        name="CareNotes" 
        component={CareNotesScreen}
        options={{
          title: 'Care Notes',
          headerRight: () => <HeaderRight />
        }}
      />
      <Tab.Screen 
        name="Incidents" 
        component={IncidentsScreen}
        options={{
          title: 'Incidents',
          headerRight: () => <HeaderRight />
        }}
      />
    </Tab.Navigator>
  )
}

// Drawer Navigator for additional screens
const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#f5f5f5',
          width: 280
        },
        drawerActiveTintColor: '#1976d2',
        drawerInactiveTintColor: '#666666'
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={TabNavigator}
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Icon name="account-circle" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Icon name="settings" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          drawerIcon: ({ color, size }) => (
            <Icon name="notifications" size={size} color={color} />
          )
        }}
      />
    </Drawer.Navigator>
  )
}

// Main App Navigator
export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)
  const { isOnline } = useSelector((state: RootState) => state.network)

  if (isLoading) {
    return null // Loading screen is handled in App.tsx
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : !isOnline ? (
        <Stack.Screen name="Offline" component={OfflineScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={DrawerNavigator} />
          <Stack.Screen 
            name="ResidentDetails" 
            component={ResidentDetailsScreen}
            options={{
              headerShown: true,
              title: 'Resident Details',
              headerStyle: { backgroundColor: '#1976d2' },
              headerTintColor: '#ffffff'
            }}
          />
          <Stack.Screen 
            name="MedicationDetails" 
            component={MedicationDetailsScreen}
            options={{
              headerShown: true,
              title: 'Medication Details',
              headerStyle: { backgroundColor: '#1976d2' },
              headerTintColor: '#ffffff'
            }}
          />
          <Stack.Screen 
            name="CareNoteDetails" 
            component={CareNoteDetailsScreen}
            options={{
              headerShown: true,
              title: 'Care Note',
              headerStyle: { backgroundColor: '#1976d2' },
              headerTintColor: '#ffffff'
            }}
          />
        </>
      )}
    </Stack.Navigator>
  )
}