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
  TextInput,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import DatePicker from 'react-native-date-picker';
import { Picker } from '@react-native-picker/picker';

import { RootState } from '../../store/store';
import { holidayActions } from '../../store/slices/holidaySlice';
import { HolidayService } from '../../services/HolidayService';
import { Holiday, HolidayType, HolidayDuration } from '../../entities/workforce/Holiday';

interface HolidaysScreenProps {}

export const HolidaysScreen: React.FC<HolidaysScreenProps> = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { holidays, isLoading } = useSelector((state: RootState) => state.holidays);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'pending' | 'history'>('upcoming');
  
  // New request form state
  const [requestType, setRequestType] = useState<HolidayType>(HolidayType.ANNUAL_LEAVE);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [duration, setDuration] = useState<HolidayDuration>(HolidayDuration.FULL_DAY);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Holiday allowance info
  const [holidayAllowance, setHolidayAllowance] = useState({
    totalDays: 28,
    usedDays: 12,
    pendingDays: 3,
    remainingDays: 13
  });

  const holidayService = new HolidayService();

  useEffect(() => {
    loadHolidays();
    loadHolidayAllowance();
  }, []);

  const loadHolidays = async () => {
    try {
      dispatch(holidayActions.setLoading(true));
      const data = await holidayService.getEmployeeHolidays(user.id);
      dispatch(holidayActions.setHolidays(data));
    } catch (error) {
      console.error('Error loading holidays:', error);
      Alert.alert('Error', 'Failed to load holidays');
    } finally {
      dispatch(holidayActions.setLoading(false));
    }
  };

  const loadHolidayAllowance = async () => {
    try {
      const allowance = await holidayService.getHolidayAllowance(user.id);
      setHolidayAllowance(allowance);
    } catch (error) {
      console.error('Error loading holiday allowance:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadHolidays(), loadHolidayAllowance()]);
    setIsRefreshing(false);
  };

  const handleSubmitRequest = async () => {
    try {
      setIsSubmitting(true);

      // Validate dates
      if (startDate > endDate) {
        Alert.alert('Error', 'Start date cannot be after end date');
        return;
      }

      // Calculate days requested
      const timeDiff = endDate.getTime() - startDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
      
      let daysRequested = daysDiff;
      if (duration === HolidayDuration.HALF_DAY_AM || duration === HolidayDuration.HALF_DAY_PM) {
        daysRequested = 0.5;
      }

      const requestData = {
        employeeId: user.id,
        type: requestType,
        duration,
        startDate,
        endDate,
        daysRequested,
        reason: reason || undefined,
        notes: notes || undefined,
        requestedAt: new Date()
      };

      const newRequest = await holidayService.createHolidayRequest(requestData);
      dispatch(holidayActions.addHoliday(newRequest));

      Alert.alert('Success', 'Holiday request submitted successfully!', [
        { text: 'OK', onPress: () => {
          setShowRequestModal(false);
          resetForm();
          loadHolidayAllowance(); // Refresh allowance
        }}
      ]);

    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit holiday request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (holiday: Holiday) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this holiday request?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: async () => {
          try {
            await holidayService.cancelHolidayRequest(holiday.id, user.id, 'Cancelled by employee');
            dispatch(holidayActions.updateHoliday({ ...holiday, status: 'CANCELLED' }));
            loadHolidayAllowance();
          } catch (error) {
            Alert.alert('Error', 'Failed to cancel request');
          }
        }}
      ]
    );
  };

  const resetForm = () => {
    setRequestType(HolidayType.ANNUAL_LEAVE);
    setStartDate(new Date());
    setEndDate(new Date());
    setDuration(HolidayDuration.FULL_DAY);
    setReason('');
    setNotes('');
  };

  const getFilteredHolidays = () => {
    const now = new Date();
    
    switch (selectedTab) {
      case 'upcoming':
        return holidays.filter(h => 
          h.isApproved() && h.startDate >= now
        );
      case 'pending':
        return holidays.filter(h => h.isPending());
      case 'history':
        return holidays.filter(h => 
          h.endDate < now || h.isRejected() || h.status === 'CANCELLED'
        );
      default:
        return holidays;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'APPROVED': return '#27ae60';
      case 'PENDING': return '#f39c12';
      case 'REJECTED': return '#e74c3c';
      case 'CANCELLED': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  const getTypeIcon = (type: HolidayType): string => {
    switch (type) {
      case HolidayType.ANNUAL_LEAVE: return 'beach-access';
      case HolidayType.SICK_LEAVE: return 'local-hospital';
      case HolidayType.MATERNITY_LEAVE: return 'child-care';
      case HolidayType.PATERNITY_LEAVE: return 'family-restroom';
      case HolidayType.COMPASSIONATE_LEAVE: return 'favorite';
      case HolidayType.STUDY_LEAVE: return 'school';
      case HolidayType.UNPAID_LEAVE: return 'money-off';
      case HolidayType.EMERGENCY_LEAVE: return 'emergency';
      case HolidayType.JURY_DUTY: return 'gavel';
      case HolidayType.MEDICAL_APPOINTMENT: return 'medical-services';
      default: return 'event';
    }
  };

  const formatDateRange = (start: Date, end: Date): string => {
    const startStr = new Date(start).toLocaleDateString();
    const endStr = new Date(end).toLocaleDateString();
    return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
  };

  const renderHolidayItem = ({ item }: { item: Holiday }) => (
    <TouchableOpacity style={styles.holidayCard}>
      <View style={styles.holidayHeader}>
        <View style={styles.holidayType}>
          <Icon 
            name={getTypeIcon(item.type)} 
            size={24} 
            color="#667eea" 
          />
          <Text style={styles.holidayTypeText}>
            {item.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.holidayDetails}>
        <View style={styles.dateInfo}>
          <Icon name="event" size={16} color="#666" />
          <Text style={styles.dateText}>{formatDateRange(item.startDate, item.endDate)}</Text>
        </View>
        <View style={styles.daysInfo}>
          <Icon name="today" size={16} color="#666" />
          <Text style={styles.daysText}>{item.daysRequested} days</Text>
        </View>
      </View>

      {item.reason && (
        <Text style={styles.reasonText}>{item.reason}</Text>
      )}

      <View style={styles.holidayFooter}>
        <Text style={styles.requestedText}>
          Requested: {new Date(item.requestedAt).toLocaleDateString()}
        </Text>
        {item.canBeCancelled() && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelRequest(item)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderAllowanceCard = () => (
    <View style={styles.allowanceCard}>
      <Text style={styles.allowanceTitle}>Holiday Allowance {new Date().getFullYear()}</Text>
      
      <View style={styles.allowanceGrid}>
        <View style={styles.allowanceItem}>
          <Text style={styles.allowanceNumber}>{holidayAllowance.totalDays}</Text>
          <Text style={styles.allowanceLabel}>Total Days</Text>
        </View>
        <View style={styles.allowanceItem}>
          <Text style={[styles.allowanceNumber, { color: '#e74c3c' }]}>
            {holidayAllowance.usedDays}
          </Text>
          <Text style={styles.allowanceLabel}>Used</Text>
        </View>
        <View style={styles.allowanceItem}>
          <Text style={[styles.allowanceNumber, { color: '#f39c12' }]}>
            {holidayAllowance.pendingDays}
          </Text>
          <Text style={styles.allowanceLabel}>Pending</Text>
        </View>
        <View style={styles.allowanceItem}>
          <Text style={[styles.allowanceNumber, { color: '#27ae60' }]}>
            {holidayAllowance.remainingDays}
          </Text>
          <Text style={styles.allowanceLabel}>Remaining</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${(holidayAllowance.usedDays / holidayAllowance.totalDays) * 100}%` }
          ]} 
        />
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {[
        { key: 'upcoming', label: 'Upcoming', icon: 'event-upcoming' },
        { key: 'pending', label: 'Pending', icon: 'pending' },
        { key: 'history', label: 'History', icon: 'history' }
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            selectedTab === tab.key && styles.activeTab
          ]}
          onPress={() => setSelectedTab(tab.key as any)}
        >
          <Icon 
            name={tab.icon} 
            size={20} 
            color={selectedTab === tab.key ? '#667eea' : '#666'} 
          />
          <Text style={[
            styles.tabText,
            selectedTab === tab.key && styles.activeTabText
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Holidays</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowRequestModal(true)}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {renderAllowanceCard()}
      {renderTabs()}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading holidays...</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredHolidays()}
          renderItem={renderHolidayItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
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
              <Text style={styles.emptyText}>
                {selectedTab === 'upcoming' && 'No upcoming holidays'}
                {selectedTab === 'pending' && 'No pending requests'}
                {selectedTab === 'history' && 'No holiday history'}
              </Text>
            </View>
          }
        />
      )}

      {/* Request Modal */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRequestModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Holiday Request</Text>
            <TouchableOpacity 
              onPress={handleSubmitRequest}
              disabled={isSubmitting}
            >
              <Text style={[
                styles.submitButton,
                isSubmitting && styles.disabledButton
              ]}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Holiday Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={requestType}
                  onValueChange={setRequestType}
                  style={styles.picker}
                >
                  <Picker.Item label="Annual Leave" value={HolidayType.ANNUAL_LEAVE} />
                  <Picker.Item label="Sick Leave" value={HolidayType.SICK_LEAVE} />
                  <Picker.Item label="Maternity Leave" value={HolidayType.MATERNITY_LEAVE} />
                  <Picker.Item label="Paternity Leave" value={HolidayType.PATERNITY_LEAVE} />
                  <Picker.Item label="Compassionate Leave" value={HolidayType.COMPASSIONATE_LEAVE} />
                  <Picker.Item label="Study Leave" value={HolidayType.STUDY_LEAVE} />
                  <Picker.Item label="Unpaid Leave" value={HolidayType.UNPAID_LEAVE} />
                  <Picker.Item label="Emergency Leave" value={HolidayType.EMERGENCY_LEAVE} />
                  <Picker.Item label="Medical Appointment" value={HolidayType.MEDICAL_APPOINTMENT} />
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Duration</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={duration}
                  onValueChange={setDuration}
                  style={styles.picker}
                >
                  <Picker.Item label="Full Day" value={HolidayDuration.FULL_DAY} />
                  <Picker.Item label="Half Day (AM)" value={HolidayDuration.HALF_DAY_AM} />
                  <Picker.Item label="Half Day (PM)" value={HolidayDuration.HALF_DAY_PM} />
                </Picker>
              </View>
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateGroup}>
                <Text style={styles.formLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {startDate.toLocaleDateString()}
                  </Text>
                  <Icon name="calendar-today" size={20} color="#667eea" />
                </TouchableOpacity>
              </View>

              <View style={styles.dateGroup}>
                <Text style={styles.formLabel}>End Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {endDate.toLocaleDateString()}
                  </Text>
                  <Icon name="calendar-today" size={20} color="#667eea" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Reason (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter reason for leave..."
                value={reason}
                onChangeText={setReason}
                maxLength={200}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Additional Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="Any additional information..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>
          </ScrollView>
        </View>

        {/* Date Pickers */}
        <DatePicker
          modal
          open={showStartDatePicker}
          date={startDate}
          mode="date"
          minimumDate={new Date()}
          onConfirm={(date) => {
            setStartDate(date);
            setShowStartDatePicker(false);
            if (date > endDate) {
              setEndDate(date);
            }
          }}
          onCancel={() => setShowStartDatePicker(false)}
        />

        <DatePicker
          modal
          open={showEndDatePicker}
          date={endDate}
          mode="date"
          minimumDate={startDate}
          onConfirm={(date) => {
            setEndDate(date);
            setShowEndDatePicker(false);
          }}
          onCancel={() => setShowEndDatePicker(false)}
        />
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  allowanceCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  allowanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  allowanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  allowanceItem: {
    alignItems: 'center',
  },
  allowanceNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  allowanceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#f0f0f0',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#667eea',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  holidayCard: {
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
  holidayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  holidayType: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  holidayTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  holidayDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  daysInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  holidayFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestedText: {
    fontSize: 12,
    color: '#999',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  submitButton: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  picker: {
    height: 50,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateGroup: {
    flex: 0.48,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 16,
    fontSize: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
});

export default HolidaysScreen;