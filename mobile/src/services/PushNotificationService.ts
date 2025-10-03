import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import PushNotification, { Importance } from 'react-native-push-notification';
import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

export enum NotificationType {
  SHIFT_REMINDER = 'shift_reminder',
  SHIFT_ASSIGNMENT = 'shift_assignment',
  SHIFT_CHANGE = 'shift_change',
  OVERTIME_REQUEST = 'overtime_request',
  OVERTIME_APPROVED = 'overtime_approved',
  OVERTIME_REJECTED = 'overtime_rejected',
  HOLIDAY_APPROVED = 'holiday_approved',
  HOLIDAY_REJECTED = 'holiday_rejected',
  PAYSLIP_AVAILABLE = 'payslip_available',
  TIME_ENTRY_REMINDER = 'time_entry_reminder',
  ROTA_PUBLISHED = 'rota_published',
  EMERGENCY_ALERT = 'emergency_alert',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  POLICY_UPDATE = 'policy_update'
}

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  priority: 'high' | 'normal' | 'low';
  scheduledTime?: Date;
  userId: string;
  actionButtons?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  title: string;
  type: 'default' | 'destructive';
  action: string;
  data?: any;
}

export interface NotificationPreferences {
  enabled: boolean;
  shiftReminders: boolean;
  overtimeNotifications: boolean;
  holidayUpdates: boolean;
  payrollNotifications: boolean;
  emergencyAlerts: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export class PushNotificationService {
  private fcmToken: string | null = null;
  private isInitialized: boolean = false;
  private notificationHandlers: Map<NotificationType, Function> = new Map();
  private preferences: NotificationPreferences;

  constructor() {
    this.preferences = this.getDefaultPreferences();
    this.initialize();
  }

  // Initialization
  async initialize(): Promise<void> {
    try {
      await this.requestPermissions();
      await this.configurePushNotifications();
      await this.setupFirebaseMessaging();
      await this.loadPreferences();
      this.setupNotificationHandlers();
      this.isInitialized = true;
      console.log('Push notification service initialized');
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  // Permission Management
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
        if (!enabled) {
          Alert.alert(
            'Notifications Disabled',
            'Please enable notifications in Settings to receive important updates about your shifts, payroll, and holidays.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => Linking.openSettings() }
            ]
          );
        }
        
        return enabled;
      } else {
        // Android permissions are handled by react-native-push-notification
        return true;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const authStatus = await messaging().hasPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  // Firebase Cloud Messaging Setup
  private async setupFirebaseMessaging(): Promise<void> {
    try {
      // Get FCM token
      this.fcmToken = await messaging().getToken();
      console.log('FCM Token:', this.fcmToken);
      
      // Store token for server registration
      await AsyncStorage.setItem('fcm_token', this.fcmToken);

      // Handle token refresh
      messaging().onTokenRefresh(async (token) => {
        this.fcmToken = token;
        await AsyncStorage.setItem('fcm_token', token);
        await this.registerTokenWithServer(token);
      });

      // Handle foreground messages
      messaging().onMessage(async (remoteMessage) => {
        console.log('Foreground message:', remoteMessage);
        await this.handleForegroundMessage(remoteMessage);
      });

      // Handle background messages
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log('Background message:', remoteMessage);
        await this.handleBackgroundMessage(remoteMessage);
      });

      // Register token with server
      if (this.fcmToken) {
        await this.registerTokenWithServer(this.fcmToken);
      }

    } catch (error) {
      console.error('Error setting up Firebase messaging:', error);
    }
  }

  // Local Push Notification Configuration
  private configurePushNotifications(): void {
    PushNotification.configure({
      onRegister: (token) => {
        console.log('Local notification token:', token);
      },

      onNotification: (notification) => {
        console.log('Local notification received:', notification);
        this.handleLocalNotification(notification);
      },

      onAction: (notification) => {
        console.log('Notification action:', notification);
        this.handleNotificationAction(notification);
      },

      onRegistrationError: (error) => {
        console.error('Local notification registration error:', error);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Create notification channels for Android
    if (Platform.OS === 'android') {
      this.createNotificationChannels();
    }
  }

  private createNotificationChannels(): void {
    const channels = [
      {
        channelId: 'shift_notifications',
        channelName: 'Shift Notifications',
        channelDescription: 'Notifications about shifts and schedules',
        importance: Importance.HIGH,
        vibrate: true,
      },
      {
        channelId: 'payroll_notifications',
        channelName: 'Payroll Notifications',
        channelDescription: 'Notifications about payroll and payslips',
        importance: Importance.HIGH,
        vibrate: true,
      },
      {
        channelId: 'holiday_notifications',
        channelName: 'Holiday Notifications',
        channelDescription: 'Notifications about holiday requests and approvals',
        importance: Importance.HIGH,
        vibrate: true,
      },
      {
        channelId: 'emergency_notifications',
        channelName: 'Emergency Alerts',
        channelDescription: 'Critical emergency notifications',
        importance: Importance.MAX,
        vibrate: true,
      },
      {
        channelId: 'general_notifications',
        channelName: 'General Notifications',
        channelDescription: 'General app notifications',
        importance: Importance.DEFAULT,
        vibrate: false,
      }
    ];

    channels.forEach(channel => {
      PushNotification.createChannel(channel, () => {
        console.log(`Channel created: ${channel.channelId}`);
      });
    });
  }

  // Message Handlers
  private async handleForegroundMessage(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): Promise<void> {
    if (!this.shouldShowNotification(remoteMessage)) {
      return;
    }

    const notificationData = this.parseRemoteMessage(remoteMessage);
    
    // Show local notification for foreground messages
    this.showLocalNotification(notificationData);
    
    // Handle specific notification types
    await this.processNotification(notificationData);
  }

  private async handleBackgroundMessage(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): Promise<void> {
    const notificationData = this.parseRemoteMessage(remoteMessage);
    await this.processNotification(notificationData);
  }

  private handleLocalNotification(notification: any): void {
    // Handle local notification tap
    if (notification.userInteraction) {
      this.navigateToNotificationScreen(notification);
    }
  }

  private handleNotificationAction(notification: any): void {
    const { action, data } = notification;
    
    switch (action) {
      case 'view_shift':
        this.navigateToShiftDetails(data.shiftId);
        break;
      case 'approve_overtime':
        this.handleOvertimeApproval(data.requestId, true);
        break;
      case 'reject_overtime':
        this.handleOvertimeApproval(data.requestId, false);
        break;
      case 'view_payslip':
        this.navigateToPayslip(data.payslipId);
        break;
      default:
        console.log('Unknown notification action:', action);
    }
  }

  // Notification Display
  showLocalNotification(notificationData: NotificationData): void {
    if (!this.preferences.enabled) {
      return;
    }

    // Check quiet hours
    if (this.isQuietHours()) {
      return;
    }

    const channelId = this.getChannelId(notificationData.type);
    
    PushNotification.localNotification({
      id: notificationData.id,
      title: notificationData.title,
      message: notificationData.body,
      channelId,
      priority: notificationData.priority === 'high' ? 'high' : 'default',
      importance: notificationData.priority === 'high' ? 'high' : 'default',
      playSound: this.preferences.soundEnabled,
      vibrate: this.preferences.vibrationEnabled,
      actions: notificationData.actionButtons?.map(action => action.title) || [],
      userInfo: {
        type: notificationData.type,
        data: notificationData.data,
        actions: notificationData.actionButtons
      },
      when: notificationData.scheduledTime?.getTime(),
    });
  }

  // Scheduled Notifications
  async scheduleShiftReminder(shiftData: {
    shiftId: string;
    employeeId: string;
    startTime: Date;
    location: string;
  }): Promise<void> {
    if (!this.preferences.shiftReminders) {
      return;
    }

    // Schedule notification 30 minutes before shift
    const reminderTime = new Date(shiftData.startTime.getTime() - 30 * 60 * 1000);
    
    const notificationData: NotificationData = {
      id: `shift_reminder_${shiftData.shiftId}`,
      type: NotificationType.SHIFT_REMINDER,
      title: 'Shift Starting Soon',
      body: `Your shift at ${shiftData.location} starts in 30 minutes`,
      priority: 'high',
      scheduledTime: reminderTime,
      userId: shiftData.employeeId,
      data: { shiftId: shiftData.shiftId },
      actionButtons: [
        {
          id: 'view_shift',
          title: 'View Details',
          type: 'default',
          action: 'view_shift',
          data: { shiftId: shiftData.shiftId }
        }
      ]
    };

    PushNotification.localNotificationSchedule({
      id: notificationData.id,
      title: notificationData.title,
      message: notificationData.body,
      date: reminderTime,
      channelId: 'shift_notifications',
      userInfo: {
        type: notificationData.type,
        data: notificationData.data
      }
    });
  }

  async scheduleTimeEntryReminder(employeeId: string): Promise<void> {
    // Schedule daily reminder at end of work day (6 PM)
    const reminderTime = new Date();
    reminderTime.setHours(18, 0, 0, 0);
    
    // If it's already past 6 PM, schedule for tomorrow
    if (reminderTime < new Date()) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const notificationData: NotificationData = {
      id: `time_entry_reminder_${employeeId}`,
      type: NotificationType.TIME_ENTRY_REMINDER,
      title: 'Time Entry Reminder',
      body: 'Don\'t forget to clock out if you haven\'t already',
      priority: 'normal',
      scheduledTime: reminderTime,
      userId: employeeId
    };

    PushNotification.localNotificationSchedule({
      id: notificationData.id,
      title: notificationData.title,
      message: notificationData.body,
      date: reminderTime,
      channelId: 'general_notifications',
      repeatType: 'day', // Repeat daily
    });
  }

  // Server Communication
  private async registerTokenWithServer(token: string): Promise<void> {
    try {
      const deviceInfo = {
        token,
        platform: Platform.OS,
        deviceId: await DeviceInfo.getUniqueId(),
        appVersion: DeviceInfo.getVersion(),
        timestamp: new Date().toISOString()
      };

      // This would make an API call to register the token
      console.log('Registering token with server:', deviceInfo);
      
      // Store registration status
      await AsyncStorage.setItem('token_registered', 'true');
    } catch (error) {
      console.error('Error registering token with server:', error);
    }
  }

  // Notification Processing
  private async processNotification(notificationData: NotificationData): Promise<void> {
    const handler = this.notificationHandlers.get(notificationData.type);
    if (handler) {
      await handler(notificationData);
    }
    
    // Store notification for history
    await this.storeNotification(notificationData);
  }

  private setupNotificationHandlers(): void {
    this.notificationHandlers.set(NotificationType.SHIFT_REMINDER, this.handleShiftReminder.bind(this));
    this.notificationHandlers.set(NotificationType.OVERTIME_REQUEST, this.handleOvertimeRequest.bind(this));
    this.notificationHandlers.set(NotificationType.PAYSLIP_AVAILABLE, this.handlePayslipAvailable.bind(this));
    this.notificationHandlers.set(NotificationType.HOLIDAY_APPROVED, this.handleHolidayApproved.bind(this));
    this.notificationHandlers.set(NotificationType.EMERGENCY_ALERT, this.handleEmergencyAlert.bind(this));
  }

  private async handleShiftReminder(data: NotificationData): Promise<void> {
    // Update local shift data, sync if needed
    console.log('Processing shift reminder:', data);
  }

  private async handleOvertimeRequest(data: NotificationData): Promise<void> {
    // Handle overtime request notification
    console.log('Processing overtime request:', data);
  }

  private async handlePayslipAvailable(data: NotificationData): Promise<void> {
    // Trigger payslip sync
    console.log('Processing payslip notification:', data);
  }

  private async handleHolidayApproved(data: NotificationData): Promise<void> {
    // Update holiday status
    console.log('Processing holiday approval:', data);
  }

  private async handleEmergencyAlert(data: NotificationData): Promise<void> {
    // Handle emergency alert with high priority
    console.log('Processing emergency alert:', data);
    
    // Show immediate alert dialog
    Alert.alert(
      'Emergency Alert',
      data.body,
      [{ text: 'OK', style: 'default' }],
      { cancelable: false }
    );
  }

  // Navigation Handlers
  private navigateToNotificationScreen(notification: any): void {
    // This would use navigation service to navigate to appropriate screen
    console.log('Navigate to notification screen:', notification);
  }

  private navigateToShiftDetails(shiftId: string): void {
    console.log('Navigate to shift details:', shiftId);
  }

  private navigateToPayslip(payslipId: string): void {
    console.log('Navigate to payslip:', payslipId);
  }

  private async handleOvertimeApproval(requestId: string, approved: boolean): Promise<void> {
    console.log(`Overtime ${approved ? 'approved' : 'rejected'}:`, requestId);
    // Make API call to approve/reject overtime
  }

  // Utility Methods
  private parseRemoteMessage(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): NotificationData {
    return {
      id: remoteMessage.messageId || `msg_${Date.now()}`,
      type: (remoteMessage.data?.type as NotificationType) || NotificationType.SYSTEM_MAINTENANCE,
      title: remoteMessage.notification?.title || 'Notification',
      body: remoteMessage.notification?.body || '',
      priority: remoteMessage.data?.priority as 'high' | 'normal' | 'low' || 'normal',
      userId: remoteMessage.data?.userId || '',
      data: remoteMessage.data
    };
  }

  private shouldShowNotification(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): boolean {
    if (!this.preferences.enabled) {
      return false;
    }

    const type = remoteMessage.data?.type as NotificationType;
    
    switch (type) {
      case NotificationType.SHIFT_REMINDER:
        return this.preferences.shiftReminders;
      case NotificationType.OVERTIME_REQUEST:
      case NotificationType.OVERTIME_APPROVED:
      case NotificationType.OVERTIME_REJECTED:
        return this.preferences.overtimeNotifications;
      case NotificationType.HOLIDAY_APPROVED:
      case NotificationType.HOLIDAY_REJECTED:
        return this.preferences.holidayUpdates;
      case NotificationType.PAYSLIP_AVAILABLE:
        return this.preferences.payrollNotifications;
      case NotificationType.EMERGENCY_ALERT:
        return this.preferences.emergencyAlerts;
      default:
        return true;
    }
  }

  private getChannelId(type: NotificationType): string {
    switch (type) {
      case NotificationType.SHIFT_REMINDER:
      case NotificationType.SHIFT_ASSIGNMENT:
      case NotificationType.SHIFT_CHANGE:
      case NotificationType.ROTA_PUBLISHED:
        return 'shift_notifications';
      case NotificationType.PAYSLIP_AVAILABLE:
        return 'payroll_notifications';
      case NotificationType.HOLIDAY_APPROVED:
      case NotificationType.HOLIDAY_REJECTED:
        return 'holiday_notifications';
      case NotificationType.EMERGENCY_ALERT:
        return 'emergency_notifications';
      default:
        return 'general_notifications';
    }
  }

  private isQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { startTime, endTime } = this.preferences.quietHours;
    
    // Handle overnight quiet hours (e.g., 22:00 to 06:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    return currentTime >= startTime && currentTime <= endTime;
  }

  // Preferences Management
  private getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      shiftReminders: true,
      overtimeNotifications: true,
      holidayUpdates: true,
      payrollNotifications: true,
      emergencyAlerts: true,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '07:00'
      },
      soundEnabled: true,
      vibrationEnabled: true
    };
  }

  async loadPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('notification_preferences');
      if (stored) {
        this.preferences = { ...this.getDefaultPreferences(), ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }

  async savePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      this.preferences = { ...this.preferences, ...preferences };
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Notification History
  private async storeNotification(notificationData: NotificationData): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('notification_history');
      const history = stored ? JSON.parse(stored) : [];
      
      history.unshift({
        ...notificationData,
        receivedAt: new Date().toISOString()
      });
      
      // Keep only last 100 notifications
      const trimmedHistory = history.slice(0, 100);
      
      await AsyncStorage.setItem('notification_history', JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  async getNotificationHistory(): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem('notification_history');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  async clearNotificationHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem('notification_history');
    } catch (error) {
      console.error('Error clearing notification history:', error);
    }
  }

  // Public API
  getFCMToken(): string | null {
    return this.fcmToken;
  }

  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  async cancelScheduledNotification(notificationId: string): Promise<void> {
    PushNotification.cancelLocalNotifications({ id: notificationId });
  }

  async cancelAllScheduledNotifications(): Promise<void> {
    PushNotification.cancelAllLocalNotifications();
  }

  async getBadgeCount(): Promise<number> {
    return new Promise((resolve) => {
      PushNotification.getApplicationIconBadgeNumber((badgeCount) => {
        resolve(badgeCount);
      });
    });
  }

  async setBadgeCount(count: number): Promise<void> {
    PushNotification.setApplicationIconBadgeNumber(count);
  }

  async clearBadge(): Promise<void> {
    PushNotification.setApplicationIconBadgeNumber(0);
  }
}

export default PushNotificationService;