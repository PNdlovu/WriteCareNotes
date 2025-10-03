import { UniversalUser, RelationshipType } from '../../src/entities/auth/UniversalUser';
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
export declare class FamilyOnboardingService {
    private readonly API_BASE_URL;
    constructor();
    validateInvitationCode(invitationCode: string): Promise<OnboardingInvitation>;
    sendPhoneVerificationCode(phoneNumber: string): Promise<{
        verificationId: string;
    }>;
    verifyPhoneCode(verificationId: string, code: string): Promise<boolean>;
    sendEmailVerification(email: string): Promise<void>;
    createFamilyAccount(invitation: OnboardingInvitation, onboardingData: OnboardingData): Promise<UniversalUser>;
    saveOnboardingProgress(step: string, data: any): Promise<void>;
    getOnboardingProgress(): Promise<any>;
    clearOnboardingProgress(): Promise<void>;
    markTutorialCompleted(tutorialId: string): Promise<void>;
    isTutorialCompleted(tutorialId: string): Promise<boolean>;
    acceptTermsAndPrivacy(userId: string): Promise<void>;
    requestHelp(issue: {
        category: string;
        description: string;
        priority: 'low' | 'medium' | 'high';
        contactMethod: 'phone' | 'email';
    }): Promise<void>;
    openSupportChat(): Promise<void>;
    private launchSupportChat;
    getEmergencyContacts(serviceUserId: string): Promise<any[]>;
    callEmergencyContact(contactId: string, phoneNumber: string): Promise<void>;
    submitAppFeedback(feedback: {
        rating: number;
        comments?: string;
        category: 'usability' | 'features' | 'performance' | 'support' | 'other';
    }): Promise<void>;
    private storeUserData;
    isOnboardingCompleted(): Promise<boolean>;
    getUserData(): Promise<UniversalUser | null>;
    validateEmail(email: string): boolean;
    validatePhoneNumber(phone: string): boolean;
    validatePostcode(postcode: string): boolean;
    formatPhoneNumber(phone: string): string;
    requestNotificationPermissions(): Promise<boolean>;
    setupNotificationCategories(): Promise<void>;
}
export default FamilyOnboardingService;
//# sourceMappingURL=FamilyOnboardingService.d.ts.map