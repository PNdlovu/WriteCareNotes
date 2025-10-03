"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FamilyOnboardingService = void 0;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const react_native_1 = require("react-native");
const messaging_1 = __importDefault(require("@react-native-firebase/messaging"));
const UniversalUser_1 = require("../../src/entities/auth/UniversalUser");
class FamilyOnboardingService {
    API_BASE_URL = 'https://api.writecarenotes.com'; // Replace with actual API URL
    constructor() { }
    // Invitation Validation
    async validateInvitationCode(invitationCode) {
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
        }
        catch (error) {
            console.error('Error validating invitation:', error);
            throw new Error('Unable to validate invitation code. Please check the code and try again.');
        }
    }
    // Phone Verification
    async sendPhoneVerificationCode(phoneNumber) {
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
        }
        catch (error) {
            console.error('Error sending phone verification:', error);
            throw new Error('Unable to send verification code. Please try again.');
        }
    }
    async verifyPhoneCode(verificationId, code) {
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
        }
        catch (error) {
            console.error('Error verifying phone code:', error);
            throw new Error('Invalid verification code. Please try again.');
        }
    }
    // Email Verification
    async sendEmailVerification(email) {
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
        }
        catch (error) {
            console.error('Error sending email verification:', error);
            throw new Error('Unable to send verification email. Please try again.');
        }
    }
    // Account Creation
    async createFamilyAccount(invitation, onboardingData) {
        try {
            // Get FCM token for notifications
            const fcmToken = await (0, messaging_1.default)().getToken();
            const userData = {
                userType: UniversalUser_1.UniversalUserType.FAMILY_MEMBER,
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
        }
        catch (error) {
            console.error('Error creating family account:', error);
            throw new Error('Unable to create account. Please try again.');
        }
    }
    // Onboarding Flow Management
    async saveOnboardingProgress(step, data) {
        try {
            const progressKey = 'onboarding_progress';
            const existingProgress = await async_storage_1.default.getItem(progressKey);
            const progress = existingProgress ? JSON.parse(existingProgress) : {};
            progress[step] = {
                ...data,
                completedAt: new Date().toISOString(),
            };
            await async_storage_1.default.setItem(progressKey, JSON.stringify(progress));
        }
        catch (error) {
            console.error('Error saving onboarding progress:', error);
        }
    }
    async getOnboardingProgress() {
        try {
            const progressKey = 'onboarding_progress';
            const progress = await async_storage_1.default.getItem(progressKey);
            return progress ? JSON.parse(progress) : {};
        }
        catch (error) {
            console.error('Error getting onboarding progress:', error);
            return {};
        }
    }
    async clearOnboardingProgress() {
        try {
            await async_storage_1.default.removeItem('onboarding_progress');
        }
        catch (error) {
            console.error('Error clearing onboarding progress:', error);
        }
    }
    // Tutorial and Help
    async markTutorialCompleted(tutorialId) {
        try {
            const tutorialsKey = 'completed_tutorials';
            const existingTutorials = await async_storage_1.default.getItem(tutorialsKey);
            const tutorials = existingTutorials ? JSON.parse(existingTutorials) : [];
            if (!tutorials.includes(tutorialId)) {
                tutorials.push(tutorialId);
                await async_storage_1.default.setItem(tutorialsKey, JSON.stringify(tutorials));
            }
        }
        catch (error) {
            console.error('Error marking tutorial completed:', error);
        }
    }
    async isTutorialCompleted(tutorialId) {
        try {
            const tutorialsKey = 'completed_tutorials';
            const tutorials = await async_storage_1.default.getItem(tutorialsKey);
            const completedTutorials = tutorials ? JSON.parse(tutorials) : [];
            return completedTutorials.includes(tutorialId);
        }
        catch (error) {
            console.error('Error checking tutorial completion:', error);
            return false;
        }
    }
    // Privacy and Terms
    async acceptTermsAndPrivacy(userId) {
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
            await async_storage_1.default.setItem('terms_accepted', 'true');
            await async_storage_1.default.setItem('privacy_accepted', 'true');
        }
        catch (error) {
            console.error('Error accepting terms:', error);
            throw new Error('Unable to accept terms. Please try again.');
        }
    }
    // Support and Help
    async requestHelp(issue) {
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
            react_native_1.Alert.alert('Help Request Submitted', 'We\'ve received your help request and will get back to you soon.', [{ text: 'OK' }]);
        }
        catch (error) {
            console.error('Error requesting help:', error);
            react_native_1.Alert.alert('Error', 'Unable to submit help request. Please try again.');
        }
    }
    async openSupportChat() {
        // This would integrate with a chat system like Intercom, Zendesk, etc.
        react_native_1.Alert.alert('Support Chat', 'Would you like to start a chat with our support team?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Start Chat', onPress: this.launchSupportChat }
        ]);
    }
    launchSupportChat = () => {
        // This would open the integrated chat system
        console.log('Launching support chat...');
    };
    // Emergency Contacts
    async getEmergencyContacts(serviceUserId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/service-users/${serviceUserId}/emergency-contacts`);
            if (!response.ok) {
                throw new Error('Failed to get emergency contacts');
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error getting emergency contacts:', error);
            return [];
        }
    }
    async callEmergencyContact(contactId, phoneNumber) {
        react_native_1.Alert.alert('Call Emergency Contact', `Call ${phoneNumber}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call', onPress: () => react_native_1.Linking.openURL(`tel:${phoneNumber}`) }
        ]);
    }
    // Feedback and Ratings
    async submitAppFeedback(feedback) {
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
            react_native_1.Alert.alert('Thank You', 'Your feedback has been submitted successfully.');
        }
        catch (error) {
            console.error('Error submitting feedback:', error);
            react_native_1.Alert.alert('Error', 'Unable to submit feedback. Please try again.');
        }
    }
    // Utility Methods
    async storeUserData(user) {
        try {
            await async_storage_1.default.setItem('user_data', JSON.stringify(user));
            await async_storage_1.default.setItem('user_type', user.userType);
            await async_storage_1.default.setItem('onboarding_completed', 'true');
        }
        catch (error) {
            console.error('Error storing user data:', error);
        }
    }
    async isOnboardingCompleted() {
        try {
            const completed = await async_storage_1.default.getItem('onboarding_completed');
            return completed === 'true';
        }
        catch (error) {
            console.error('Error checking onboarding completion:', error);
            return false;
        }
    }
    async getUserData() {
        try {
            const userData = await async_storage_1.default.getItem('user_data');
            return userData ? JSON.parse(userData) : null;
        }
        catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }
    // Validation Helpers
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    validatePhoneNumber(phone) {
        // UK phone number validation
        const ukPhoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/;
        return ukPhoneRegex.test(phone.replace(/\s/g, ''));
    }
    validatePostcode(postcode) {
        // UK postcode validation
        const postcodeRegex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i;
        return postcodeRegex.test(postcode);
    }
    formatPhoneNumber(phone) {
        // Format UK phone numbers
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('44')) {
            return `+${cleaned}`;
        }
        else if (cleaned.startsWith('07')) {
            return `+44${cleaned.substring(1)}`;
        }
        return phone;
    }
    // App Permissions
    async requestNotificationPermissions() {
        try {
            const authStatus = await (0, messaging_1.default)().requestPermission();
            return authStatus === messaging_1.default.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging_1.default.AuthorizationStatus.PROVISIONAL;
        }
        catch (error) {
            console.error('Error requesting notification permissions:', error);
            return false;
        }
    }
    async setupNotificationCategories() {
        // This would set up notification categories for iOS
        // and notification channels for Android
        console.log('Setting up notification categories...');
    }
}
exports.FamilyOnboardingService = FamilyOnboardingService;
exports.default = FamilyOnboardingService;
//# sourceMappingURL=FamilyOnboardingService.js.map