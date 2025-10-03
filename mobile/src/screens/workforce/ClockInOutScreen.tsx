import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Geolocation from '@react-native-community/geolocation';
import { launchCamera } from 'react-native-image-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import TouchID from 'react-native-touch-id';
import DeviceInfo from 'react-native-device-info';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootState } from '../../store/store';
import { timeTrackingActions } from '../../store/slices/timeTrackingSlice';
import { TimeTrackingService } from '../../services/TimeTrackingService';
import { LocationService } from '../../services/LocationService';
import { BiometricService } from '../../services/BiometricService';

interface ClockInOutScreenProps {}

export const ClockInOutScreen: React.FC<ClockInOutScreenProps> = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentTimeEntry, isLoading } = useSelector((state: RootState) => state.timeTracking);
  
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  const timeTrackingService = new TimeTrackingService();
  const locationService = new LocationService();
  const biometricService = new BiometricService();

  useEffect(() => {
    checkBiometricAvailability();
    getCurrentLocation();
    loadCurrentTimeEntry();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const biometricType = await TouchID.isSupported();
      setIsBiometricEnabled(!!biometricType);
    } catch (error) {
      setIsBiometricEnabled(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsLocationLoading(true);
      const hasPermission = await requestLocationPermission();
      
      if (hasPermission) {
        const location = await locationService.getCurrentLocation();
        setCurrentLocation(location);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setIsLocationLoading(false);
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    const permission = Platform.OS === 'ios' 
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

    const result = await request(permission);
    return result === RESULTS.GRANTED;
  };

  const loadCurrentTimeEntry = async () => {
    try {
      dispatch(timeTrackingActions.setLoading(true));
      const currentEntry = await timeTrackingService.getCurrentTimeEntry(user.id);
      dispatch(timeTrackingActions.setCurrentTimeEntry(currentEntry));
    } catch (error) {
      console.error('Error loading current time entry:', error);
    } finally {
      dispatch(timeTrackingActions.setLoading(false));
    }
  };

  const handleBiometricAuth = async (): Promise<boolean> => {
    if (!isBiometricEnabled) return true;

    try {
      await TouchID.authenticate('Authenticate to clock in/out', {
        title: 'Biometric Authentication',
        subtitle: 'Use your fingerprint or face to authenticate',
        description: 'This ensures secure time tracking',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
      });
      return true;
    } catch (error) {
      Alert.alert('Authentication Failed', 'Please try again or use your passcode');
      return false;
    }
  };

  const handleClockIn = async () => {
    try {
      const authenticated = await handleBiometricAuth();
      if (!authenticated) return;

      dispatch(timeTrackingActions.setLoading(true));

      const deviceInfo = {
        deviceId: await DeviceInfo.getUniqueId(),
        deviceType: await DeviceInfo.getDeviceType(),
        platform: Platform.OS,
        appVersion: DeviceInfo.getVersion(),
        userAgent: await DeviceInfo.getUserAgent()
      };

      const clockInData = {
        employeeId: user.id,
        location: currentLocation,
        deviceInfo,
        notes: notes || undefined,
        photoUrl: photoUri || undefined
      };

      const timeEntry = await timeTrackingService.clockIn(clockInData);
      dispatch(timeTrackingActions.setCurrentTimeEntry(timeEntry));

      Alert.alert('Success', 'Clocked in successfully!', [
        { text: 'OK', onPress: () => {
          setNotes('');
          setPhotoUri(null);
          setShowNotesModal(false);
        }}
      ]);

    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to clock in');
    } finally {
      dispatch(timeTrackingActions.setLoading(false));
    }
  };

  const handleClockOut = async () => {
    try {
      const authenticated = await handleBiometricAuth();
      if (!authenticated) return;

      dispatch(timeTrackingActions.setLoading(true));

      const deviceInfo = {
        deviceId: await DeviceInfo.getUniqueId(),
        deviceType: await DeviceInfo.getDeviceType(),
        platform: Platform.OS,
        appVersion: DeviceInfo.getVersion(),
        userAgent: await DeviceInfo.getUserAgent()
      };

      const clockOutData = {
        employeeId: user.id,
        location: currentLocation,
        deviceInfo,
        notes: notes || undefined,
        photoUrl: photoUri || undefined
      };

      const timeEntry = await timeTrackingService.clockOut(clockOutData);
      dispatch(timeTrackingActions.setCurrentTimeEntry(null));

      const hoursWorked = timeEntry.hoursWorked || 0;
      Alert.alert('Success', `Clocked out successfully!\nHours worked: ${hoursWorked.toFixed(2)}`, [
        { text: 'OK', onPress: () => {
          setNotes('');
          setPhotoUri(null);
          setShowNotesModal(false);
        }}
      ]);

    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to clock out');
    } finally {
      dispatch(timeTrackingActions.setLoading(false));
    }
  };

  const handleTakePhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.7,
      maxWidth: 800,
      maxHeight: 600,
    };

    launchCamera(options, (response) => {
      if (response.assets && response.assets[0]) {
        setPhotoUri(response.assets[0].uri);
      }
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getCurrentStatus = () => {
    if (!currentTimeEntry) return 'Not Clocked In';
    if (currentTimeEntry.type === 'CLOCK_IN') return 'Clocked In';
    return 'Not Clocked In';
  };

  const getStatusColor = () => {
    if (!currentTimeEntry) return '#e74c3c';
    if (currentTimeEntry.type === 'CLOCK_IN') return '#27ae60';
    return '#e74c3c';
  };

  const isClockedIn = currentTimeEntry && currentTimeEntry.type === 'CLOCK_IN';
  const now = new Date();

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user.firstName}!</Text>
        <Text style={styles.dateText}>{formatDate(now)}</Text>
        <Text style={styles.timeText}>{formatTime(now)}</Text>
      </View>

      <View style={styles.statusCard}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>{getCurrentStatus()}</Text>
        {isClockedIn && (
          <Text style={styles.clockedInTime}>
            Since: {formatTime(new Date(currentTimeEntry.timestamp))}
          </Text>
        )}
      </View>

      <View style={styles.locationCard}>
        <Icon name="location-on" size={20} color="#666" />
        {isLocationLoading ? (
          <ActivityIndicator size="small" color="#666" style={{ marginLeft: 8 }} />
        ) : currentLocation ? (
          <Text style={styles.locationText}>
            {currentLocation.address || `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
          </Text>
        ) : (
          <Text style={styles.locationText}>Location not available</Text>
        )}
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.clockButton,
            isClockedIn ? styles.clockOutButton : styles.clockInButton,
            isLoading && styles.disabledButton
          ]}
          onPress={isClockedIn ? handleClockOut : handleClockIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <>
              <Icon 
                name={isClockedIn ? "access-time" : "play-arrow"} 
                size={48} 
                color="#fff" 
              />
              <Text style={styles.clockButtonText}>
                {isClockedIn ? 'Clock Out' : 'Clock In'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notesButton}
          onPress={() => setShowNotesModal(true)}
        >
          <Icon name="note-add" size={24} color="#667eea" />
          <Text style={styles.notesButtonText}>Add Notes</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('TimeHistory')}
        >
          <Icon name="history" size={24} color="#667eea" />
          <Text style={styles.quickActionText}>Time History</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('MyShifts')}
        >
          <Icon name="schedule" size={24} color="#667eea" />
          <Text style={styles.quickActionText}>My Shifts</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => getCurrentLocation()}
        >
          <Icon name="my-location" size={24} color="#667eea" />
          <Text style={styles.quickActionText}>Refresh Location</Text>
        </TouchableOpacity>
      </View>

      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotesModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Notes</Text>
            <TouchableOpacity onPress={() => setShowNotesModal(false)}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any notes about your shift..."
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
              maxLength={500}
            />

            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleTakePhoto}
            >
              <Icon name="camera-alt" size={24} color="#667eea" />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>

            {photoUri && (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photoUri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => setPhotoUri(null)}
                >
                  <Icon name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  clockedInTime: {
    fontSize: 14,
    color: '#666',
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  actionContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  clockButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  clockInButton: {
    backgroundColor: '#27ae60',
  },
  clockOutButton: {
    backgroundColor: '#e74c3c',
  },
  disabledButton: {
    opacity: 0.6,
  },
  clockButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  notesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesButtonText: {
    fontSize: 16,
    color: '#667eea',
    marginLeft: 8,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionButton: {
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    color: '#667eea',
    marginTop: 4,
    fontWeight: '500',
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  doneButton: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
  },
  photoButtonText: {
    fontSize: 16,
    color: '#667eea',
    marginLeft: 8,
    fontWeight: '500',
  },
  photoPreview: {
    position: 'relative',
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ClockInOutScreen;