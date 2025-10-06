import { useState, useEffect, useCallback } from 'react';

export interface AuditEvent {
  id: string;
  action: string;
  userId: string;
  resource: string;
  timestamp: Date;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export const useAudit = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const logEvent = useCallback(async (event: Omit<AuditEvent, 'id' | 'timestamp'>) => {
    const auditEvent: AuditEvent = {
      ...event,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    setEvents(prev => [auditEvent, ...prev]);

    // In a real implementation, this would send to an audit service
    try {
      console.log('Audit Event:', auditEvent);
      // await fetch('/api/audit', { method: 'POST', body: JSON.stringify(auditEvent) });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }, []);

  const getEvents = useCallback(async (filters?: { action?: string; userId?: string; resource?: string }) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from an audit service
      // const response = await fetch('/api/audit/events');
      // const events = await response.json();
      setIsLoading(false);
      return events;
    } catch (error) {
      setIsLoading(false);
      console.error('Failed to fetch audit events:', error);
      return [];
    }
  }, [events]);

  return {
    logEvent,
    getEvents,
    events,
    isLoading,
  };
};