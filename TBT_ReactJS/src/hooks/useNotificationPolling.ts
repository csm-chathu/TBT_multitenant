import { useEffect, useRef } from 'react';
import { fetchNotifications, NotificationRecord } from '@/services/notificationService';
import { getCurrentUserId } from '@/lib/jwt';

export type TicketEventName = string;

const POLL_INTERVAL_MS = 60000;

const deriveEventName = (notification: NotificationRecord): TicketEventName | null => {
  console.log(notification);
  
  const eventFromRecord = typeof notification.event === 'string' ? notification.event : undefined;

  if (eventFromRecord && ['ticket.created', 'ticket.updated', 'ticket.deleted'].includes(eventFromRecord)) {
    return eventFromRecord as TicketEventName;
  }

  if (notification.message && typeof notification.message === 'object') {
    const embeddedEvent = (notification.message as { event?: string }).event;
    if (embeddedEvent && ['ticket.created', 'ticket.updated', 'ticket.deleted'].includes(embeddedEvent)) {
      return embeddedEvent as TicketEventName;
    }
  }

  return null;
};

const normalisePayload = (notification: NotificationRecord): unknown => {
  if (notification.message && typeof notification.message === 'object') {
    return notification.message;
  }
  return notification;
};

const getNotificationKey = (notification: NotificationRecord): string => {
  if (notification.id !== undefined && notification.id !== null) {
    return String(notification.id);
  }
  if (notification.ticketId !== undefined && notification.ticketId !== null) {
    return `ticket:${notification.ticketId}:${notification.event ?? ''}`;
  }
  return JSON.stringify(notification);
};

interface UseNotificationPollingOptions {
  enabled: boolean;
  onEvent: (event: TicketEventName, payload: unknown) => void;
}

export const useNotificationPolling = ({ enabled, onEvent }: UseNotificationPollingOptions) => {
  const knownKeysRef = useRef<Set<string>>(new Set());
  const initialisedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef(onEvent);
  const enabledRef = useRef(enabled);

  // Update refs without causing re-initialization
  useEffect(() => {
    onEventRef.current = onEvent;
    enabledRef.current = enabled;
  }, [enabled, onEvent]);

  useEffect(() => {
    if (!enabledRef.current) {
      knownKeysRef.current = new Set();
      initialisedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return () => undefined;
    }

    let cancelled = false;

    const userId = getCurrentUserId();
    if (!userId) {
      console.warn('Notification polling skipped: no user id available');
      return undefined;
    }

    const poll = async () => {
      if (cancelled || !enabledRef.current) {
        return;
      }

      try {
        const { notifications } = await fetchNotifications(100);
        if (cancelled || !enabledRef.current) {
          return;
        }

        notifications.forEach((notification) => {
          const key = getNotificationKey(notification);
          if (knownKeysRef.current.has(key)) {
            return;
          }
          knownKeysRef.current.add(key);

          if (initialisedRef.current) {
            const eventName = deriveEventName(notification);
            if (eventName) {
              onEventRef.current(eventName, normalisePayload(notification));
            }
          }
        });

        if (!initialisedRef.current) {
          initialisedRef.current = true;
        }
      } catch (error) {
        console.error('Failed to poll notifications:', error);
      } finally {
        if (!cancelled && enabledRef.current) {
          timeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled]); // Only depend on enabled, not onEvent to prevent re-initialization
};

