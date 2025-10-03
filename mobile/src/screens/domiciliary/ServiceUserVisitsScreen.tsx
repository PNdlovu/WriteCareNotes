import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  ScrollView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

import { RootState } from '../../store/store';
import { DomiciliaryService } from '../../services/DomiciliaryService';
import { CareVisit, VisitStatus } from '../../entities/domiciliary/CareVisit';
import { ServiceUser } from '../../entities/domiciliary/ServiceUser';

interface ServiceUserVisitsScreenProps {}

export const ServiceUserVisitsScreen: React.FC<ServiceUserVisitsScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [visits, setVisits] = useState<CareVisit[]>([]);
  const [serviceUser, setServiceUser] = useState<ServiceUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<CareVisit | null>(null);
  const [showVisitDetail, setShowVisitDetail] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [showMap, setShowMap] = useState(false);

  const domiciliaryService = new DomiciliaryService();
  const serviceUserId = route.params?.serviceUserId;

  useEffect(() => {
    loadData();
    getCurrentLocation();
  }, [serviceUserId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load service user details and visits
      const [serviceUserData, visitsData] = await Promise.all([
        domiciliaryService.getServiceUser(serviceUserId),
        domiciliaryService.getServiceUserVisits(serviceUserId, user.id)
      ]);
      
      setServiceUser(serviceUserData);
      setVisits(visitsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load visit information');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => console.error('Error getting location:', error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleStartVisit = async (visit: CareVisit) => {
    try {
      if (!currentLocation) {
        Alert.alert('Location Required', 'Please enable location services to start the visit');
        return;
      }

      // Verify location is near service user's address
      const isLocationValid = await domiciliaryService.verifyVisitLocation(
        currentLocation,
        serviceUser!.personalDetails.address.coordinates!
      );

      if (!isLocationValid) {
        Alert.alert(
          'Location Verification Failed',
          'You must be at the service user\'s address to start the visit. Are you sure you\'re at the correct location?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Override', onPress: () => forceStartVisit(visit) }
          ]
        );
        return;
      }

      await domiciliaryService.startVisit(visit.id, user.id, currentLocation);
      
      Alert.alert('Visit Started', 'You have successfully started the visit', [
        { text: 'OK', onPress: () => navigation.navigate('VisitInProgress', { visitId: visit.id }) }
      ]);

    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to start visit');
    }
  };

  const forceStartVisit = async (visit: CareVisit) => {
    try {
      await domiciliaryService.startVisit(visit.id, user.id, currentLocation, {
        method: 'manual',
        override: true,
        reason: 'Location verification overridden by care worker'
      });
      
      navigation.navigate('VisitInProgress', { visitId: visit.id });
    } catch (error) {
      Alert.alert('Error', 'Failed to start visit');
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency',
      'What type of emergency?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Medical Emergency', onPress: () => raiseEmergency('medical') },
        { text: 'Safety Concern', onPress: () => raiseEmergency('safety') },
        { text: 'Security Issue', onPress: () => raiseEmergency('security') }
      ]
    );
  };

  const raiseEmergency = async (type: string) => {
    try {
      await domiciliaryService.raiseEmergencyAlert({
        type: type as any,
        priority: 'high',
        serviceUserId: serviceUser!.id,
        careWorkerId: user.id,
        location: {
          latitude: currentLocation?.latitude || 0,
          longitude: currentLocation?.longitude || 0,
          address: serviceUser!.getFullAddress()
        },
        description: `${type} emergency reported by care worker`,
        responders: []
      });

      Alert.alert('Emergency Reported', 'Emergency services and supervisors have been notified');
    } catch (error) {
      Alert.alert('Error', 'Failed to report emergency');
    }
  };

  const getStatusColor = (status: VisitStatus): string => {
    switch (status) {
      case VisitStatus.SCHEDULED: return '#3498db';
      case VisitStatus.EN_ROUTE: return '#f39c12';
      case VisitStatus.ARRIVED: return '#e67e22';
      case VisitStatus.IN_PROGRESS: return '#27ae60';
      case VisitStatus.COMPLETED: return '#2ecc71';
      case VisitStatus.MISSED: return '#e74c3c';
      case VisitStatus.CANCELLED: return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  const getStatusIcon = (status: VisitStatus): string => {
    switch (status) {
      case VisitStatus.SCHEDULED: return 'schedule';
      case VisitStatus.EN_ROUTE: return 'directions-car';
      case VisitStatus.ARRIVED: return 'location-on';
      case VisitStatus.IN_PROGRESS: return 'work';
      case VisitStatus.COMPLETED: return 'check-circle';
      case VisitStatus.MISSED: return 'error';
      case VisitStatus.CANCELLED: return 'cancel';
      default: return 'help';
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const renderVisitItem = ({ item }: { item: CareVisit }) => (
    <TouchableOpacity
      style={styles.visitCard}
      onPress={() => {
        setSelectedVisit(item);
        setShowVisitDetail(true);
      }}
    >
      <View style={styles.visitHeader}>
        <View style={styles.visitStatus}>
          <Icon 
            name={getStatusIcon(item.status)} 
            size={20} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.visitNumber}>{item.visitNumber}</Text>
      </View>

      <View style={styles.visitInfo}>
        <View style={styles.timeInfo}>
          <Icon name="access-time" size={16} color="#666" />
          <Text style={styles.timeText}>
            {formatTime(item.scheduledStartTime)} - {formatTime(item.scheduledEndTime)}
          </Text>
        </View>
        <View style={styles.durationInfo}>
          <Icon name="timer" size={16} color="#666" />
          <Text style={styles.durationText}>
            {formatDuration(item.plannedDuration)}
          </Text>
        </View>
      </View>

      <View style={styles.visitDetails}>
        <Text style={styles.visitType}>{item.type.replace('_', ' ')}</Text>
        <Text style={styles.taskCount}>
          {item.scheduledTasks.length} tasks scheduled
        </Text>
      </View>

      {item.status === VisitStatus.SCHEDULED && (
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => handleStartVisit(item)}
        >
          <Icon name="play-arrow" size={20} color="#fff" />
          <Text style={styles.startButtonText}>Start Visit</Text>
        </TouchableOpacity>
      )}

      {item.status === VisitStatus.IN_PROGRESS && (
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => navigation.navigate('VisitInProgress', { visitId: item.id })}
        >
          <Icon name="work" size={20} color="#fff" />
          <Text style={styles.continueButtonText}>Continue Visit</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderServiceUserInfo = () => {
    if (!serviceUser) return null;

    return (
      <View style={styles.serviceUserCard}>
        <View style={styles.serviceUserHeader}>
          <View style={styles.serviceUserInfo}>
            <Text style={styles.serviceUserName}>{serviceUser.getFullName()}</Text>
            <Text style={styles.serviceUserAge}>Age: {serviceUser.getAge()}</Text>
            <Text style={styles.careLevel}>Care Level: {serviceUser.careRequirements.careLevel}</Text>
          </View>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => setShowMap(true)}
          >
            <Icon name="map" size={24} color="#667eea" />
          </TouchableOpacity>
        </View>

        <View style={styles.addressInfo}>
          <Icon name="location-on" size={16} color="#666" />
          <Text style={styles.address}>{serviceUser.getFullAddress()}</Text>
        </View>

        {serviceUser.personalDetails.address.accessInstructions && (
          <View style={styles.accessInfo}>
            <Icon name="info" size={16} color="#f39c12" />
            <Text style={styles.accessText}>
              {serviceUser.personalDetails.address.accessInstructions}
            </Text>
          </View>
        )}

        <View style={styles.contactInfo}>
          <TouchableOpacity style={styles.contactButton}>
            <Icon name="phone" size={20} color="#27ae60" />
            <Text style={styles.contactText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={handleEmergencyCall}
          >
            <Icon name="emergency" size={20} color="#fff" />
            <Text style={styles.emergencyText}>Emergency</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderVisitDetail = () => {
    if (!selectedVisit) return null;

    return (
      <Modal
        visible={showVisitDetail}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowVisitDetail(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Visit Details</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>Visit Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Visit Number:</Text>
                <Text style={styles.detailValue}>{selectedVisit.visitNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>
                  {selectedVisit.type.replace('_', ' ')}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={styles.statusBadge}>
                  <Icon 
                    name={getStatusIcon(selectedVisit.status)} 
                    size={16} 
                    color={getStatusColor(selectedVisit.status)} 
                  />
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(selectedVisit.status) }]}>
                    {selectedVisit.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Scheduled:</Text>
                <Text style={styles.detailValue}>
                  {formatTime(selectedVisit.scheduledStartTime)} - {formatTime(selectedVisit.scheduledEndTime)}
                </Text>
              </View>
              {selectedVisit.actualStartTime && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Actual:</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(selectedVisit.actualStartTime)} 
                    {selectedVisit.actualEndTime && ` - ${formatTime(selectedVisit.actualEndTime)}`}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>Scheduled Tasks</Text>
              {selectedVisit.scheduledTasks.map((task, index) => (
                <View key={index} style={styles.taskItem}>
                  <Icon 
                    name={task.priority === 'critical' ? 'priority-high' : 'assignment'} 
                    size={20} 
                    color={task.priority === 'critical' ? '#e74c3c' : '#666'} 
                  />
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>{task.task}</Text>
                    <Text style={styles.taskCategory}>{task.category}</Text>
                    <Text style={styles.taskDuration}>
                      Est. {formatDuration(task.estimatedDuration)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {selectedVisit.visitNotes && (
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Visit Notes</Text>
                <Text style={styles.notesText}>{selectedVisit.visitNotes}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderMapModal = () => {
    if (!serviceUser || !currentLocation) return null;

    return (
      <Modal
        visible={showMap}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setShowMap(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.mapTitle}>Navigation</Text>
            <TouchableOpacity>
              <Icon name="directions" size={24} color="#667eea" />
            </TouchableOpacity>
          </View>

          <MapView
            style={styles.map}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="Your Location"
              pinColor="blue"
            />
            
            {serviceUser.personalDetails.address.coordinates && (
              <Marker
                coordinate={serviceUser.personalDetails.address.coordinates}
                title={serviceUser.getFullName()}
                description={serviceUser.getFullAddress()}
                pinColor="red"
              />
            )}
          </MapView>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading visits...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {renderServiceUserInfo()}
      
      <View style={styles.visitsContainer}>
        <Text style={styles.visitsTitle}>Today's Visits</Text>
        
        <FlatList
          data={visits}
          renderItem={renderVisitItem}
          keyExtractor={(item) => item.id}
          style={styles.visitsList}
          contentContainerStyle={styles.visitsListContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#fff"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="event-available" size={64} color="rgba(255,255,255,0.5)" />
              <Text style={styles.emptyText}>No visits scheduled for today</Text>
            </View>
          }
        />
      </View>

      {renderVisitDetail()}
      {renderMapModal()}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  serviceUserCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
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
    flex: 1,
  },
  serviceUserName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
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
  mapButton: {
    padding: 8,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  accessInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  accessText: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
  },
  contactInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 0.45,
    justifyContent: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#27ae60',
    marginLeft: 4,
    fontWeight: '600',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 0.45,
    justifyContent: 'center',
  },
  emergencyText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
  },
  visitsContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  visitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  visitsList: {
    flex: 1,
  },
  visitsListContent: {
    paddingBottom: 16,
  },
  visitCard: {
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
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  visitStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  visitNumber: {
    fontSize: 12,
    color: '#666',
  },
  visitInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  visitDetails: {
    marginBottom: 16,
  },
  visitType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  taskCount: {
    fontSize: 14,
    color: '#666',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f39c12',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  taskCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  taskDuration: {
    fontSize: 12,
    color: '#667eea',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  mapContainer: {
    flex: 1,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  map: {
    flex: 1,
  },
});

export default ServiceUserVisitsScreen;