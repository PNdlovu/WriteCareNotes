import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { UniversalUser, UniversalUserType, RelationshipType, UserStatus } from '../../src/entities/auth/UniversalUser';

export interface OnboardingInvitation {
  id: string;
  serviceUserId: string;
  serviceUserName: string;
  inviterName: string;
  inviterRole: string;
  relationshipType: RelationshipType;
  invitationCode: string;
  permissions: {
    canViewMedicalInfo: boolean;
    canViewFinancialInfo: boolean;
    hasDecisionMakingAuthority: boolean;
    receiveEmergencyAlerts: boolean;
    receiveVisitUpdates: boolean;
    receiveCareReports: boolean;
  };
  expiryDate: Date;
  createdAt: Date;
}

export interface OnboardingData {
  personalDetails: {
    firstName: string;
    lastName: string;
    preferredName?: string;
    phone: string;
    email: string;
    dateOfBirth?: Date;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      county: string;
      postcode: string;
      country: string;
    };
  };
  relationshipDetails: {
    relationshipType: RelationshipType;
    emergencyContact: boolean;
    preferredContactMethod: 'phone' | 'email' | 'sms' | 'app';
    contactTimePreferences: {
      startTime: string;
      endTime: string;
      timezone: string;
    };
  };
  notificationPreferences: {
    visitReminders: boolean;
    visitUpdates: boolean;
    emergencyAlerts: boolean;
    careReports: boolean;
    medicationAlerts: boolean;
    appointmentReminders: boolean;
    quietHours: {
      enabled: boolean;
      startTime: string;
      endTime: string;
    };
    deliveryMethods: {
      push: boolean;
      email: boolean;
      sms: boolean;
    };
  };
  appPreferences: {
    language: string;
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large' | 'extra_large';
    highContrast: boolean;
  };
}

export class FamilyOnboardingService {
  private readonly API_BASE_URL = 'https://api.writecarenotes.com'; // Replace with actual API URL

  constructor() {}

  // Invitation Validation
  async validateInvitationCode(invitationCode: string): Promise<OnboardingInvitation> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/invitations/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationCode }),
      });

      if (!response.ok) {
        throw new Error('Invalid invitation code');
      }

      const invitation = await response.json();
      
      // Check if invitation has expired
      if (new Date(invitation.expiryDate) < new Date()) {
        throw new Error('Invitation has expired');
      }

      return invitation;
    } catch (error) {
      console.error('Error validating invitation:', error);
      throw new Error('Unable to validate invitation code. Please check the code and try again.');
    }
  }

  // Phone Verification
  async sendPhoneVerificationCode(phoneNumber: string): Promise<{ verificationId: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/auth/send-phone-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        throw new Error('Failed to send verification code');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending phone verification:', error);
      throw new Error('Unable to send verification code. Please try again.');
    }
  }

  async verifyPhoneCode(verificationId: string, code: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/auth/verify-phone-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verificationId, code }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      return true;
    } catch (error) {
      console.error('Error verifying phone code:', error);
      throw new Error('Invalid verification code. Please try again.');
    }
  }

  // Email Verification
  async sendEmailVerification(email: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/auth/send-email-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to send verification email');
      }
    } catch (error) {
      console.error('Error sending email verification:', error);
      throw new Error('Unable to send verification email. Please try again.');
    }
  }

  // Account Creation
  async createFamilyAccount(
    invitation: OnboardingInvitation,
    onboardingData: OnboardingData
  ): Promise<UniversalUser> {
    try {
      // Get FCM token for notifications
      const fcmToken = await messaging().getToken();

      const userData = {
        userType: UniversalUserType.FAMILY_MEMBER,
        personalDetails: onboardingData.personalDetails,
        familyMemberDetails: {
          relationshipType: onboardingData.relationshipDetails.relationshipType,
          serviceUserIds: [invitation.serviceUserId],
          emergencyContact: onboardingData.relationshipDetails.emergencyContact,
          hasDecisionMakingAuthority: invitation.permissions.hasDecisionMakingAuthority,
          canViewMedicalInfo: invitation.permissions.canViewMedicalInfo,
          canViewFinancialInfo: invitation.permissions.canViewFinancialInfo,
          receiveEmergencyAlerts: invitation.permissions.receiveEmergencyAlerts,
          receiveVisitUpdates: invitation.permissions.receiveVisitUpdates,
          receiveCareReports: invitation.permissions.receiveCareReports,
          preferredContactMethod: onboardingData.relationshipDetails.preferredContactMethod,
          contactTimePreferences: onboardingData.relationshipDetails.contactTimePreferences,
        },
        accessPermissions: {
          canViewServiceUsers: [invitation.serviceUserId],
          canViewAllServiceUsers: false,
          canEditServiceUsers: [],
          canViewVisits: [invitation.serviceUserId],
          canEditVisits: [],
          canViewReports: true,
          canViewFinancials: invitation.permissions.canViewFinancialInfo,
          canReceiveEmergencyAlerts: invitation.permissions.receiveEmergencyAlerts,
          canInitiateEmergencyAlerts: true,
          maxDataRetentionDays: 365,
          requiresBiometricAuth: false,
          allowedDeviceTypes: ['personal'],
        },
        notificationPreferences: {
          enabled: true,
          ...onboardingData.notificationPreferences,
          systemUpdates: true,
          marketingCommunications: false,
        },
        appPreferences: {
          ...onboardingData.appPreferences,
          defaultDashboard: 'family_dashboard',
          showTutorials: true,
          voiceOver: false,
          reducedMotion: false,
        },
        invitationCode: invitation.invitationCode,
        fcmToken,
      };

      const response = await fetch(`${this.API_BASE_URL}/api/auth/create-family-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create account');
      }

      const user = await response.json();
      
      // Store user data locally
      await this.storeUserData(user);
      
      return user;
    } catch (error) {
      console.error('Error creating family account:', error);
      throw new Error('Unable to create account. Please try again.');
    }
  }

  // Onboarding Flow Management
  async saveOnboardingProgress(step: string, data: any): Promise<void> {
    try {
      const progressKey = 'onboarding_progress';
      const existingProgress = await AsyncStorage.getItem(progressKey);
      const progress = existingProgress ? JSON.parse(existingProgress) : {};
      
      progress[step] = {
        ...data,
        completedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(progressKey, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving onboarding progress:', error);
    }
  }

  async getOnboardingProgress(): Promise<any> {
    try {
      const progressKey = 'onboarding_progress';
      const progress = await AsyncStorage.getItem(progressKey);
      return progress ? JSON.parse(progress) : {};
    } catch (error) {
      console.error('Error getting onboarding progress:', error);
      return {};
    }
  }

  async clearOnboardingProgress(): Promise<void> {
    try {
      await AsyncStorage.removeItem('onboarding_progress');
    } catch (error) {
      console.error('Error clearing onboarding progress:', error);
    }
  }

  // Tutorial and Help
  async markTutorialCompleted(tutorialId: string): Promise<void> {
    try {
      const tutorialsKey = 'completed_tutorials';
      const existingTutorials = await AsyncStorage.getItem(tutorialsKey);
      const tutorials = existingTutorials ? JSON.parse(existingTutorials) : [];
      
      if (!tutorials.includes(tutorialId)) {
        tutorials.push(tutorialId);
        await AsyncStorage.setItem(tutorialsKey, JSON.stringify(tutorials));
      }
    } catch (error) {
      console.error('Error marking tutorial completed:', error);
    }
  }

  async isTutorialCompleted(tutorialId: string): Promise<boolean> {
    try {
      const tutorialsKey = 'completed_tutorials';
      const tutorials = await AsyncStorage.getItem(tutorialsKey);
      const completedTutorials = tutorials ? JSON.parse(tutorials) : [];
      return completedTutorials.includes(tutorialId);
    } catch (error) {
      console.error('Error checking tutorial completion:', error);
      return false;
    }
  }

  // Privacy and Terms
  async acceptTermsAndPrivacy(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/users/${userId}/accept-terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          termsAccepted: true,
          privacyPolicyAccepted: true,
          acceptedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept terms');
      }

      // Store acceptance locally
      await AsyncStorage.setItem('terms_accepted', 'true');
      await AsyncStorage.setItem('privacy_accepted', 'true');
    } catch (error) {
      console.error('Error accepting terms:', error);
      throw new Error('Unable to accept terms. Please try again.');
    }
  }

  // Support and Help
  async requestHelp(issue: {
    category: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    contactMethod: 'phone' | 'email';
  }): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/support/family-help`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...issue,
          timestamp: new Date().toISOString(),
          source: 'mobile_app',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit help request');
      }

      Alert.alert(
        'Help Request Submitted',
        'We\'ve received your help request and will get back to you soon.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error requesting help:', error);
      Alert.alert('Error', 'Unable to submit help request. Please try again.');
    }
  }

  async openSupportChat(): Promise<void> {
    // This would integrate with a chat system like Intercom, Zendesk, etc.
    Alert.alert(
      'Support Chat',
      'Would you like to start a chat with our support team?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Chat', onPress: this.launchSupportChat }
      ]
    );
  }

  private launchSupportChat = (): void => {
    // This would open the integrated chat system
    console.log('Launching support chat...');
  };

  // Emergency Contacts
  async getEmergencyContacts(serviceUserId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/service-users/${serviceUserId}/emergency-contacts`);
      
      if (!response.ok) {
        throw new Error('Failed to get emergency contacts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting emergency contacts:', error);
      return [];
    }
  }

  async callEmergencyContact(contactId: string, phoneNumber: string): Promise<void> {
    Alert.alert(
      'Call Emergency Contact',
      `Call ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phoneNumber}`) }
      ]
    );
  }

  // Feedback and Ratings
  async submitAppFeedback(feedback: {
    rating: number;
    comments?: string;
    category: 'usability' | 'features' | 'performance' | 'support' | 'other';
  }): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/feedback/app-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...feedback,
          timestamp: new Date().toISOString(),
          platform: 'mobile',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      Alert.alert('Thank You', 'Your feedback has been submitted successfully.');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Unable to submit feedback. Please try again.');
    }
  }

  // Utility Methods
  private async storeUserData(user: UniversalUser): Promise<void> {
    try {
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      await AsyncStorage.setItem('user_type', user.userType);
      await AsyncStorage.setItem('onboarding_completed', 'true');
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  }

  async isOnboardingCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem('onboarding_completed');
      return completed === 'true';
    } catch (error) {
      console.error('Error checking onboarding completion:', error);
      return false;
    }
  }

  async getUserData(): Promise<UniversalUser | null> {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Validation Helpers
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePhoneNumber(phone: string): boolean {
    // UK phone number validation
    const ukPhoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/;
    return ukPhoneRegex.test(phone.replace(/\s/g, ''));
  }

  validatePostcode(postcode: string): boolean {
    // UK postcode validation
    const postcodeRegex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i;
    return postcodeRegex.test(postcode);
  }

  formatPhoneNumber(phone: string): string {
    // Format UK phone numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('44')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('07')) {
      return `+44${cleaned.substring(1)}`;
    }
    return phone;
  }

  // App Permissions
  async requestNotificationPermissions(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async setupNotificationCategories(): Promise<void> {
    // This would set up notification categories for iOS
    // and notification channels for Android
    console.log('Setting up notification categories...');
  }
}

export default FamilyOnboardingService;