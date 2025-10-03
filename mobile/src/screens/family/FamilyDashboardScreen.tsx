import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

import { RootState } from '../../store/store';
import { FamilyService } from '../../services/FamilyService';
import { ServiceUser } from '../../../src/entities/domiciliary/ServiceUser';
import { CareVisit, VisitStatus } from '../../../src/entities/domiciliary/CareVisit';

const { width } = Dimensions.get('window');

interface FamilyDashboardData {
  serviceUsers: ServiceUser[];
  todaysVisits: CareVisit[];
  recentReports: any[];
  upcomingAppointments: any[];
  emergencyContacts: any[];
  notifications: any[];
}

export const FamilyDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [dashboardData, setDashboardData] = useState<FamilyDashboardData>({
    serviceUsers: [],
    todaysVisits: [],
    recentReports: [],
    upcomingAppointments: [],
    emergencyContacts: [],
    notifications: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const familyService = new FamilyService();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await familyService.getFamilyDashboardData(user.id);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleEmergencyCall = (serviceUserId: string) => {
    Alert.alert(
      'Emergency Call',
      'This will immediately contact emergency services and notify the care team.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 999', onPress: () => initiateEmergencyCall(serviceUserId), style: 'destructive' }
      ]
    );
  };

  const initiateEmergencyCall = async (serviceUserId: string) => {
    try {
      await familyService.initiateEmergencyCall({
        serviceUserId,
        initiatedBy: user.id,
        type: 'family_emergency',
        location: 'family_app',
        description: 'Emergency initiated by family member via mobile app'
      });
      
      Alert.alert(
        'Emergency Services Contacted',
        'Emergency services have been contacted and the care team has been notified.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to contact emergency services. Please call 999 directly.');
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getVisitStatusColor = (status: VisitStatus) => {
    switch (status) {
      case VisitStatus.COMPLETED: return '#27ae60';
      case VisitStatus.IN_PROGRESS: return '#f39c12';
      case VisitStatus.SCHEDULED: return '#3498db';
      case VisitStatus.MISSED: return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const renderWelcomeCard = () => (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.welcomeCard}
    >
      <View style={styles.welcomeContent}>
        <Text style={styles.welcomeTitle}>Welcome, {user.getDisplayName()}</Text>
        <Text style={styles.welcomeSubtitle}>
          Stay connected with your loved one's care
        </Text>
      </View>
      <View style={styles.welcomeStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{dashboardData.serviceUsers.length}</Text>
          <Text style={styles.statLabel}>Care Recipients</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{dashboardData.todaysVisits.length}</Text>
          <Text style={styles.statLabel}>Today's Visits</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const renderServiceUserCards = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Care Recipients</Text>
      {dashboardData.serviceUsers.map((serviceUser) => (
        <TouchableOpacity
          key={serviceUser.id}
          style={styles.serviceUserCard}
          onPress={() => navigation.navigate('ServiceUserProfile', { serviceUserId: serviceUser.id })}
        >
          <View style={styles.serviceUserHeader}>
            <View style={styles.serviceUserInfo}>
              {serviceUser.profilePhotoUrl ? (
                <Image source={{ uri: serviceUser.profilePhotoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Icon name="person" size={24} color="#666" />
                </View>
              )}
              <View style={styles.serviceUserDetails}>
                <Text style={styles.serviceUserName}>{serviceUser.getFullName()}</Text>
                <Text style={styles.serviceUserAge}>Age: {serviceUser.getAge()}</Text>
                <Text style={styles.careLevel}>
                  {serviceUser.careRequirements.careLevel.replace('_', ' ')} care
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.emergencyButton}
              onPress={() => handleEmergencyCall(serviceUser.id)}
            >
              <Icon name="emergency" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.serviceUserFooter}>
            <View style={styles.addressInfo}>
              <Icon name="location-on" size={16} color="#666" />
              <Text style={styles.addressText} numberOfLines={1}>
                {serviceUser.getFullAddress()}
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color="#ccc" />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTodaysVisits = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Care Visits</Text>
        <TouchableOpacity onPress={() => navigation.navigate('VisitHistory')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      {dashboardData.todaysVisits.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="event-available" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No visits scheduled for today</Text>
        </View>
      ) : (
        dashboardData.todaysVisits.map((visit) => (
          <TouchableOpacity
            key={visit.id}
            style={styles.visitCard}
            onPress={() => navigation.navigate('VisitDetails', { visitId: visit.id })}
          >
            <View style={styles.visitHeader}>
              <View style={styles.visitTime}>
                <Icon name="access-time" size={16} color="#666" />
                <Text style={styles.visitTimeText}>
                  {formatTime(visit.scheduledStartTime)} - {formatTime(visit.scheduledEndTime)}
                </Text>
              </View>
              <View style={[styles.visitStatus, { backgroundColor: getVisitStatusColor(visit.status) }]}>
                <Text style={styles.visitStatusText}>
                  {visit.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            
            <Text style={styles.visitType}>
              {visit.type.replace('_', ' ')} visit
            </Text>
            
            <View style={styles.visitFooter}>
              <Text style={styles.careWorkerName}>
                Care Worker: {visit.careWorker?.getFullName() || 'TBC'}
              </Text>
              <Icon name="chevron-right" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('Communication')}
        >
          <Icon name="chat" size={32} color="#667eea" />
          <Text style={styles.quickActionText}>Message Care Team</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('CareReports')}
        >
          <Icon name="description" size={32} color="#27ae60" />
          <Text style={styles.quickActionText}>Care Reports</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('Appointments')}
        >
          <Icon name="event" size={32} color="#f39c12" />
          <Text style={styles.quickActionText}>Appointments</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('MedicalInfo')}
        >
          <Icon name="local-hospital" size={32} color="#e74c3c" />
          <Text style={styles.quickActionText}>Medical Info</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecentUpdates = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Updates</Text>
      {dashboardData.notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="notifications-none" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No recent updates</Text>
        </View>
      ) : (
        dashboardData.notifications.slice(0, 3).map((notification, index) => (
          <View key={index} style={styles.notificationCard}>
            <View style={styles.notificationIcon}>
              <Icon name="info" size={20} color="#667eea" />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationText}>{notification.message}</Text>
              <Text style={styles.notificationTime}>
                {new Date(notification.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#667eea']}
        />
      }
    >
      {renderWelcomeCard()}
      {renderServiceUserCards()}
      {renderTodaysVisits()}
      {renderQuickActions()}
      {renderRecentUpdates()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  welcomeCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  welcomeStats: {
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    marginVertical: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  serviceUserCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceUserHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceUserDetails: {
    flex: 1,
  },
  serviceUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  serviceUserAge: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  careLevel: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  emergencyButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 20,
    padding: 8,
  },
  serviceUserFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  visitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  visitTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visitTimeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  visitStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  visitStatusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  visitType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  visitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  careWorkerName: {
    fontSize: 14,
    color: '#666',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: (width - 48) / 2,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationIcon: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 8,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
});

export default FamilyDashboardScreen;