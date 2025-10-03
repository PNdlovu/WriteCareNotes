import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Family Engagement Hook
 * @module useFamilyEngagement
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Custom hook for family engagement portal functionality
 * providing real-time updates, communication, and care information access.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { useToast } from './useToast';

interface ResidentProfile {
  id: string;
  firstName: string;
  lastName: string;
  roomNumber: string;
  admissionDate: Date;
  careLevel: string;
  primaryContact: string;
  emergencyContact: string;
}

interface FamilyMessage {
  id: string;
  subject: string;
  content: string;
  fromStaff: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  attachments?: string[];
}

interface CareUpdate {
  id: string;
  careDate: Date;
  activities: string[];
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string[];
  };
  mood: 'excellent' | 'good' | 'fair' | 'concerning';
  socialInteraction: string;
  physicalActivity: string;
  medicalNotes?: string;
  photos?: string[];
  staffNotes: string;
}

interface UpcomingEvent {
  id: string;
  type: 'appointment' | 'activity' | 'visit' | 'therapy' | 'assessment';
  title: string;
  description: string;
  scheduledTime: Date;
  location: string;
  attendees: string[];
  preparation?: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  size: number;
  downloadUrl: string;
}

export const useFamilyEngagement = (familyId: string, residentId: string) => {
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch resident profile
  const { data: residentProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['residentProfile', residentId],
    queryFn: async (): Promise<ResidentProfile> => {
      try {
        const response = await apiClient.get(`/api/family-portal/careplan?residentId=${residentId}`);
        return response.data.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch resident profile');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch recent updates
  const { data: recentUpdates, isLoading: updatesLoading } = useQuery({
    queryKey: ['familyUpdates', residentId],
    queryFn: async (): Promise<any[]> => {
      try {
        const response = await apiClient.get(`/api/family-portal/updates?residentId=${residentId}`);
        return response.data.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch updates');
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch care updates
  const { data: careUpdates, isLoading: careLoading } = useQuery({
    queryKey: ['careUpdates', residentId],
    queryFn: async (): Promise<CareUpdate[]> => {
      try {
        const response = await apiClient.get(`/api/family-portal/activities?residentId=${residentId}`);
        return response.data.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch care updates');
      }
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch upcoming events
  const { data: upcomingEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['upcomingEvents', residentId],
    queryFn: async (): Promise<UpcomingEvent[]> => {
      try {
        const response = await apiClient.get(`/api/family-portal/updates?residentId=${residentId}&type=appointment`);
        return response.data.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch events');
      }
    },
  });

  // Fetch unread messages
  const { data: unreadMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['familyMessages', familyId, residentId],
    queryFn: async (): Promise<FamilyMessage[]> => {
      try {
        const response = await apiClient.get(`/api/family-portal/messages?residentId=${residentId}&unreadOnly=true`);
        return response.data.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch messages');
      }
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch documents
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['familyDocuments', residentId],
    queryFn: async (): Promise<Document[]> => {
      try {
        const response = await apiClient.get(`/api/family-portal/documents?residentId=${residentId}`);
        return response.data.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch documents');
      }
    },
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiClient.patch(`/api/family-portal/messages/${messageId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMessages'] });
      toast({
        title: 'Message marked as read',
        type: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to mark message as read',
        description: error.response?.data?.message || 'Please try again',
        type: 'error',
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { subject: string; content: string; priority: string }) => {
      const response = await apiClient.post(`/api/family-portal/messages`, {
        ...messageData,
        residentId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMessages'] });
      toast({
        title: 'Message sent successfully',
        type: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send message',
        description: error.response?.data?.message || 'Please try again',
        type: 'error',
      });
    },
  });

  // Request video call mutation
  const videoCallMutation = useMutation({
    mutationFn: async (requestData: { preferredTime: Date; duration: number; participants: string[] }) => {
      const response = await apiClient.post(`/api/family-portal/video-call-request`, {
        ...requestData,
        residentId,
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Video call requested',
        description: 'Care team will contact you to confirm the appointment',
        type: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to request video call',
        description: error.response?.data?.message || 'Please try again',
        type: 'error',
      });
    },
  });

  // Submit feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: async (feedbackData: { type: string; rating: number; comments: string; anonymous: boolean }) => {
      const response = await apiClient.post(`/api/family-portal/feedback`, {
        ...feedbackData,
        residentId,
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Feedback submitted',
        description: 'Thank you for your feedback. We value your input.',
        type: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to submit feedback',
        description: error.response?.data?.message || 'Please try again',
        type: 'error',
      });
    },
  });

  // Download document function
  const downloadDocument = useCallback(async (documentId: string) => {
    try {
      const response = await apiClient.get(`/api/family-portal/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `document-${documentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Document downloaded',
        type: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to download document',
        description: error.response?.data?.message || 'Please try again',
        type: 'error',
      });
    }
  }, [toast]);

  // Helper functions
  const markAsRead = useCallback((messageId: string) => {
    markAsReadMutation.mutate(messageId);
  }, [markAsReadMutation]);

  const sendMessage = useCallback((messageData: { subject: string; content: string; priority: string }) => {
    sendMessageMutation.mutate(messageData);
  }, [sendMessageMutation]);

  const requestVideoCall = useCallback((requestData?: { preferredTime: Date; duration: number; participants: string[] }) => {
    const defaultRequest = {
      preferredTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      duration: 30, // 30 minutes
      participants: [familyId],
    };
    videoCallMutation.mutate(requestData || defaultRequest);
  }, [videoCallMutation, familyId]);

  const submitFeedback = useCallback((feedbackData: { type: string; rating: number; comments: string; anonymous: boolean }) => {
    feedbackMutation.mutate(feedbackData);
  }, [feedbackMutation]);

  const loading = profileLoading || updatesLoading || careLoading || eventsLoading || messagesLoading || documentsLoading;

  return {
    residentProfile,
    recentUpdates,
    careUpdates,
    upcomingEvents,
    unreadMessages,
    documents,
    loading,
    error,
    markAsRead,
    sendMessage,
    requestVideoCall,
    downloadDocument,
    submitFeedback,
  };
};