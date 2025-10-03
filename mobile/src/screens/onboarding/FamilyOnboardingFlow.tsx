import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Switch
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Picker } from '@react-native-picker/picker';

import { FamilyOnboardingService, OnboardingInvitation, OnboardingData } from '../../services/FamilyOnboardingService';
import { RelationshipType } from '../../../src/entities/auth/UniversalUser';

interface FamilyOnboardingFlowProps {}

export const FamilyOnboardingFlow: React.FC<FamilyOnboardingFlowProps> = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [invitation, setInvitation] = useState<OnboardingInvitation | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    personalDetails: {
      firstName: '',
      lastName: '',
      preferredName: '',
      phone: '',
      email: '',
    },
    relationshipDetails: {
      relationshipType: RelationshipType.CHILD,
      emergencyContact: false,
      preferredContactMethod: 'app',
      contactTimePreferences: {
        startTime: '08:00',
        endTime: '22:00',
        timezone: 'Europe/London',
      },
    },
    notificationPreferences: {
      visitReminders: true,
      visitUpdates: true,
      emergencyAlerts: true,
      careReports: true,
      medicationAlerts: true,
      appointmentReminders: true,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
      },
      deliveryMethods: {
        push: true,
        email: true,
        sms: false,
      },
    },
    appPreferences: {
      language: 'en-GB',
      theme: 'auto',
      fontSize: 'medium',
      highContrast: false,
    },
  });

  const [invitationCode, setInvitationCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');

  const onboardingService = new FamilyOnboardingService();

  const totalSteps = 6;

  useEffect(() => {
    loadSavedProgress();
  }, []);

  const loadSavedProgress = async () => {
    try {
      const progress = await onboardingService.getOnboardingProgress();
      if (progress.step) {
        setCurrentStep(progress.step);
      }
      if (progress.onboardingData) {
        setOnboardingData(progress.onboardingData);
      }
      if (progress.invitation) {
        setInvitation(progress.invitation);
      }
    } catch (error) {
      console.error('Error loading saved progress:', error);
    }
  };

  const saveProgress = async () => {
    try {
      await onboardingService.saveOnboardingProgress('step', currentStep);
      await onboardingService.saveOnboardingProgress('onboardingData', onboardingData);
      if (invitation) {
        await onboardingService.saveOnboardingProgress('invitation', invitation);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleNext = async () => {
    await saveProgress();
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateInvitation = async () => {
    if (!invitationCode.trim()) {
      Alert.alert('Error', 'Please enter your invitation code');
      return;
    }

    try {
      setIsLoading(true);
      const validatedInvitation = await onboardingService.validateInvitationCode(invitationCode);
      setInvitation(validatedInvitation);
      handleNext();
    } catch (error) {
      Alert.alert('Invalid Invitation', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendPhoneVerification = async () => {
    if (!onboardingService.validatePhoneNumber(onboardingData.personalDetails.phone)) {
      Alert.alert('Error', 'Please enter a valid UK phone number');
      return;
    }

    try {
      setIsLoading(true);
      const result = await onboardingService.sendPhoneVerificationCode(
        onboardingService.formatPhoneNumber(onboardingData.personalDetails.phone)
      );
      setVerificationId(result.verificationId);
      Alert.alert('Verification Code Sent', 'Please check your phone for the verification code');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPhone = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    try {
      setIsLoading(true);
      await onboardingService.verifyPhoneCode(verificationId, verificationCode);
      handleNext();
    } catch (error) {
      Alert.alert('Verification Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      setIsLoading(true);
      
      // Create the family account
      const user = await onboardingService.createFamilyAccount(invitation!, onboardingData);
      
      // Clear onboarding progress
      await onboardingService.clearOnboardingProgress();
      
      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
      
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePersonalDetails = (field: string, value: string) => {
    setOnboardingData(prev => ({
      ...prev,
      personalDetails: {
        ...prev.personalDetails,
        [field]: value,
      },
    }));
  };

  const updateRelationshipDetails = (field: string, value: any) => {
    setOnboardingData(prev => ({
      ...prev,
      relationshipDetails: {
        ...prev.relationshipDetails,
        [field]: value,
      },
    }));
  };

  const updateNotificationPreferences = (field: string, value: any) => {
    setOnboardingData(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [field]: value,
      },
    }));
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${(currentStep / totalSteps) * 100}%` }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Icon name="mail" size={64} color="#667eea" style={styles.stepIcon} />
      <Text style={styles.stepTitle}>Welcome to WriteCareNotes</Text>
      <Text style={styles.stepDescription}>
        You've been invited to join as a family member to stay connected with your loved one's care.
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Invitation Code</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your invitation code"
          value={invitationCode}
          onChangeText={setInvitationCode}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, (!invitationCode.trim() || isLoading) && styles.disabledButton]}
        onPress={validateInvitation}
        disabled={!invitationCode.trim() || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Validate Invitation</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Icon name="person" size={64} color="#667eea" style={styles.stepIcon} />
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepDescription}>
        Please provide your personal details to create your account.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>First Name *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your first name"
          value={onboardingData.personalDetails.firstName}
          onChangeText={(value) => updatePersonalDetails('firstName', value)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Last Name *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your last name"
          value={onboardingData.personalDetails.lastName}
          onChangeText={(value) => updatePersonalDetails('lastName', value)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Preferred Name (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="What would you like to be called?"
          value={onboardingData.personalDetails.preferredName}
          onChangeText={(value) => updatePersonalDetails('preferredName', value)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email Address *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your email address"
          value={onboardingData.personalDetails.email}
          onChangeText={(value) => updatePersonalDetails('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!onboardingData.personalDetails.firstName || 
           !onboardingData.personalDetails.lastName || 
           !onboardingService.validateEmail(onboardingData.personalDetails.email)) && styles.disabledButton
        ]}
        onPress={handleNext}
        disabled={!onboardingData.personalDetails.firstName || 
                  !onboardingData.personalDetails.lastName || 
                  !onboardingService.validateEmail(onboardingData.personalDetails.email)}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Icon name="phone" size={64} color="#667eea" style={styles.stepIcon} />
      <Text style={styles.stepTitle}>Phone Verification</Text>
      <Text style={styles.stepDescription}>
        We need to verify your phone number for security and emergency notifications.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Phone Number *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="07123 456789"
          value={onboardingData.personalDetails.phone}
          onChangeText={(value) => updatePersonalDetails('phone', value)}
          keyboardType="phone-pad"
        />
      </View>

      {!verificationId ? (
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!onboardingService.validatePhoneNumber(onboardingData.personalDetails.phone) || isLoading) && styles.disabledButton
          ]}
          onPress={sendPhoneVerification}
          disabled={!onboardingService.validatePhoneNumber(onboardingData.personalDetails.phone) || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Send Verification Code</Text>
          )}
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Verification Code</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!verificationCode.trim() || isLoading) && styles.disabledButton
            ]}
            onPress={verifyPhone}
            disabled={!verificationCode.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Verify Phone</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={sendPhoneVerification}
          >
            <Text style={styles.secondaryButtonText}>Resend Code</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderStep4 = () => (
    <ScrollView style={styles.stepContainer}>
      <Icon name="family-restroom" size={64} color="#667eea" style={styles.stepIcon} />
      <Text style={styles.stepTitle}>Relationship Details</Text>
      <Text style={styles.stepDescription}>
        Help us understand your relationship with {invitation?.serviceUserName}.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Relationship Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={onboardingData.relationshipDetails.relationshipType}
            onValueChange={(value) => updateRelationshipDetails('relationshipType', value)}
            style={styles.picker}
          >
            <Picker.Item label="Child" value={RelationshipType.CHILD} />
            <Picker.Item label="Spouse/Partner" value={RelationshipType.SPOUSE} />
            <Picker.Item label="Parent" value={RelationshipType.PARENT} />
            <Picker.Item label="Sibling" value={RelationshipType.SIBLING} />
            <Picker.Item label="Grandchild" value={RelationshipType.GRANDCHILD} />
            <Picker.Item label="Other Family" value={RelationshipType.OTHER} />
            <Picker.Item label="Friend" value={RelationshipType.FRIEND} />
            <Picker.Item label="Guardian" value={RelationshipType.GUARDIAN} />
          </Picker>
        </View>
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Emergency Contact</Text>
        <Switch
          value={onboardingData.relationshipDetails.emergencyContact}
          onValueChange={(value) => updateRelationshipDetails('emergencyContact', value)}
          trackColor={{ false: '#767577', true: '#667eea' }}
          thumbColor={onboardingData.relationshipDetails.emergencyContact ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Preferred Contact Method</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={onboardingData.relationshipDetails.preferredContactMethod}
            onValueChange={(value) => updateRelationshipDetails('preferredContactMethod', value)}
            style={styles.picker}
          >
            <Picker.Item label="Mobile App" value="app" />
            <Picker.Item label="Phone Call" value="phone" />
            <Picker.Item label="Email" value="email" />
            <Picker.Item label="Text Message" value="sms" />
          </Picker>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleNext}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep5 = () => (
    <ScrollView style={styles.stepContainer}>
      <Icon name="notifications" size={64} color="#667eea" style={styles.stepIcon} />
      <Text style={styles.stepTitle}>Notification Preferences</Text>
      <Text style={styles.stepDescription}>
        Choose what notifications you'd like to receive about {invitation?.serviceUserName}'s care.
      </Text>

      <View style={styles.preferencesContainer}>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Visit Reminders</Text>
          <Switch
            value={onboardingData.notificationPreferences.visitReminders}
            onValueChange={(value) => updateNotificationPreferences('visitReminders', value)}
            trackColor={{ false: '#767577', true: '#667eea' }}
          />
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Visit Updates</Text>
          <Switch
            value={onboardingData.notificationPreferences.visitUpdates}
            onValueChange={(value) => updateNotificationPreferences('visitUpdates', value)}
            trackColor={{ false: '#767577', true: '#667eea' }}
          />
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Emergency Alerts</Text>
          <Switch
            value={onboardingData.notificationPreferences.emergencyAlerts}
            onValueChange={(value) => updateNotificationPreferences('emergencyAlerts', value)}
            trackColor={{ false: '#767577', true: '#667eea' }}
          />
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Care Reports</Text>
          <Switch
            value={onboardingData.notificationPreferences.careReports}
            onValueChange={(value) => updateNotificationPreferences('careReports', value)}
            trackColor={{ false: '#767577', true: '#667eea' }}
          />
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Medication Alerts</Text>
          <Switch
            value={onboardingData.notificationPreferences.medicationAlerts}
            onValueChange={(value) => updateNotificationPreferences('medicationAlerts', value)}
            trackColor={{ false: '#767577', true: '#667eea' }}
          />
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Appointment Reminders</Text>
          <Switch
            value={onboardingData.notificationPreferences.appointmentReminders}
            onValueChange={(value) => updateNotificationPreferences('appointmentReminders', value)}
            trackColor={{ false: '#767577', true: '#667eea' }}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleNext}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep6 = () => (
    <View style={styles.stepContainer}>
      <Icon name="check-circle" size={64} color="#27ae60" style={styles.stepIcon} />
      <Text style={styles.stepTitle}>Almost Done!</Text>
      <Text style={styles.stepDescription}>
        Review your information and complete your account setup.
      </Text>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Name:</Text>
          <Text style={styles.summaryValue}>
            {onboardingData.personalDetails.preferredName || onboardingData.personalDetails.firstName} {onboardingData.personalDetails.lastName}
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Email:</Text>
          <Text style={styles.summaryValue}>{onboardingData.personalDetails.email}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Phone:</Text>
          <Text style={styles.summaryValue}>{onboardingData.personalDetails.phone}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Relationship:</Text>
          <Text style={styles.summaryValue}>
            {onboardingData.relationshipDetails.relationshipType.replace('_', ' ')} of {invitation?.serviceUserName}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.disabledButton]}
        onPress={completeOnboarding}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Complete Setup</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return renderStep1();
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderProgressBar()}
        
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderCurrentStep()}
        </ScrollView>

        {currentStep > 1 && (
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
            >
              <Icon name="arrow-back" size={20} color="#667eea" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  stepIcon: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  picker: {
    height: 50,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  preferencesContainer: {
    width: '100%',
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    width: '100%',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  summaryContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  summaryLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  navigationContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 8,
  },
});

export default FamilyOnboardingFlow;