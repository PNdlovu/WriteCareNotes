import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';

import { RootState } from '../store/store';
import { UniversalUserType } from '../../../src/entities/auth/UniversalUser';

// Staff Screens
import { ClockInOutScreen } from '../screens/workforce/ClockInOutScreen';
import { PayslipsScreen } from '../screens/workforce/PayslipsScreen';
import { HolidaysScreen } from '../screens/workforce/HolidaysScreen';
import { ServiceUserVisitsScreen } from '../screens/domiciliary/ServiceUserVisitsScreen';

// Family Screens
import { FamilyDashboardScreen } from '../screens/family/FamilyDashboardScreen';
import { ServiceUserProfileScreen } from '../screens/family/ServiceUserProfileScreen';
import { VisitHistoryScreen } from '../screens/family/VisitHistoryScreen';
import { CareReportsScreen } from '../screens/family/CareReportsScreen';
import { FamilyCommunicationScreen } from '../screens/family/FamilyCommunicationScreen';

// Executive Screens
import { ExecutiveDashboardScreen } from '../screens/executive/ExecutiveDashboardScreen';
import { StrategicAnalyticsScreen } from '../screens/executive/StrategicAnalyticsScreen';
import { ComplianceOverviewScreen } from '../screens/executive/ComplianceOverviewScreen';
import { FinancialDashboardScreen } from '../screens/executive/FinancialDashboardScreen';

// Manager Screens
import { ManagerDashboardScreen } from '../screens/manager/ManagerDashboardScreen';
import { TeamManagementScreen } from '../screens/manager/TeamManagementScreen';
import { ApprovalsScreen } from '../screens/manager/ApprovalsScreen';
import { StaffReportsScreen } from '../screens/manager/StaffReportsScreen';

// Shared Screens
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { SettingsScreen } from '../screens/shared/SettingsScreen';
import { HelpSupportScreen } from '../screens/shared/HelpSupportScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Staff Navigation
const StaffTabNavigator = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'TimeTracking':
              iconName = 'access-time';
              break;
            case 'Visits':
              iconName = 'home';
              break;
            case 'Payroll':
              iconName = 'payment';
              break;
            case 'Holidays':
              iconName = 'event-available';
              break;
            case 'Profile':
              iconName = 'person';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      {/* Care Worker Tabs */}
      {user?.userType === UniversalUserType.CARE_WORKER && (
        <>
          <Tab.Screen 
            name="Visits" 
            component={ServiceUserVisitsScreen}
            options={{ title: 'My Visits' }}
          />
          <Tab.Screen 
            name="TimeTracking" 
            component={ClockInOutScreen}
            options={{ title: 'Time' }}
          />
          <Tab.Screen 
            name="Payroll" 
            component={PayslipsScreen}
            options={{ title: 'Payslips' }}
          />
          <Tab.Screen 
            name="Holidays" 
            component={HolidaysScreen}
          />
          <Tab.Screen 
            name="Profile" 
            component={ProfileScreen}
          />
        </>
      )}

      {/* Manager Tabs */}
      {[UniversalUserType.MANAGER, UniversalUserType.DEPUTY_MANAGER].includes(user?.userType) && (
        <>
          <Tab.Screen 
            name="Dashboard" 
            component={ManagerDashboardScreen}
          />
          <Tab.Screen 
            name="Team" 
            component={TeamManagementScreen}
          />
          <Tab.Screen 
            name="Approvals" 
            component={ApprovalsScreen}
          />
          <Tab.Screen 
            name="Reports" 
            component={StaffReportsScreen}
          />
          <Tab.Screen 
            name="Profile" 
            component={ProfileScreen}
          />
        </>
      )}

      {/* Executive Tabs */}
      {user?.userType === UniversalUserType.EXECUTIVE && (
        <>
          <Tab.Screen 
            name="Dashboard" 
            component={ExecutiveDashboardScreen}
          />
          <Tab.Screen 
            name="Analytics" 
            component={StrategicAnalyticsScreen}
          />
          <Tab.Screen 
            name="Compliance" 
            component={ComplianceOverviewScreen}
          />
          <Tab.Screen 
            name="Financials" 
            component={FinancialDashboardScreen}
          />
          <Tab.Screen 
            name="Profile" 
            component={ProfileScreen}
          />
        </>
      )}
    </Tab.Navigator>
  );
};

// Family Navigation
const FamilyTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'ServiceUser':
              iconName = 'person';
              break;
            case 'Visits':
              iconName = 'schedule';
              break;
            case 'Reports':
              iconName = 'description';
              break;
            case 'Communication':
              iconName = 'chat';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={FamilyDashboardScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="ServiceUser" 
        component={ServiceUserProfileScreen}
        options={{ title: 'Care Info' }}
      />
      <Tab.Screen 
        name="Visits" 
        component={VisitHistoryScreen}
        options={{ title: 'Visits' }}
      />
      <Tab.Screen 
        name="Reports" 
        component={CareReportsScreen}
        options={{ title: 'Reports' }}
      />
      <Tab.Screen 
        name="Communication" 
        component={FamilyCommunicationScreen}
        options={{ title: 'Messages' }}
      />
    </Tab.Navigator>
  );
};

// Main Universal Navigator
export const UniversalNavigator = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) {
    return null; // Handle auth loading state
  }

  // Determine navigation structure based on user type
  const getMainNavigator = () => {
    if (user.isStaffMember()) {
      return (
        <Drawer.Navigator
          screenOptions={{
            drawerActiveTintColor: '#667eea',
            drawerInactiveTintColor: 'gray',
            headerShown: true,
            headerStyle: { backgroundColor: '#667eea' },
            headerTintColor: '#fff',
          }}
        >
          <Drawer.Screen 
            name="MainTabs" 
            component={StaffTabNavigator}
            options={{
              title: 'Dashboard',
              drawerIcon: ({ color, size }) => (
                <Icon name="dashboard" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen 
            name="Notifications" 
            component={NotificationsScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Icon name="notifications" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Icon name="settings" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen 
            name="Help" 
            component={HelpSupportScreen}
            options={{
              title: 'Help & Support',
              drawerIcon: ({ color, size }) => (
                <Icon name="help" size={size} color={color} />
              ),
            }}
          />
        </Drawer.Navigator>
      );
    } else if (user.isFamilyMember()) {
      return (
        <Drawer.Navigator
          screenOptions={{
            drawerActiveTintColor: '#667eea',
            drawerInactiveTintColor: 'gray',
            headerShown: true,
            headerStyle: { backgroundColor: '#667eea' },
            headerTintColor: '#fff',
          }}
        >
          <Drawer.Screen 
            name="MainTabs" 
            component={FamilyTabNavigator}
            options={{
              title: 'Family Portal',
              drawerIcon: ({ color, size }) => (
                <Icon name="family-restroom" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen 
            name="Notifications" 
            component={NotificationsScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Icon name="notifications" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              drawerIcon: ({ color, size }) => (
                <Icon name="settings" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen 
            name="Help" 
            component={HelpSupportScreen}
            options={{
              title: 'Help & Support',
              drawerIcon: ({ color, size }) => (
                <Icon name="help" size={size} color={color} />
              ),
            }}
          />
        </Drawer.Navigator>
      );
    } else {
      // External users get a simplified interface
      return (
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#667eea' },
            headerTintColor: '#fff',
          }}
        >
          <Stack.Screen 
            name="Dashboard" 
            component={FamilyDashboardScreen}
            options={{ title: 'Portal Access' }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
          />
        </Stack.Navigator>
      );
    }
  };

  return getMainNavigator();
};

export default UniversalNavigator;