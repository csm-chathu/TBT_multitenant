import api from './api';

export interface NotificationRecord {
  id?: string | number;
  createdAt?: string;
  updatedAt?: string;
  ticketId?: string | number;
  event?: string;
  message?: {
    event?: string;
    ticketId?: string | number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface NotificationsResponse {
  notifications: NotificationRecord[];
  errors?: unknown[];
  id?: string | number;
}

export const fetchNotifications = async (limit?: number, sinceId?: number): Promise<NotificationsResponse> => {
  const params: any = {};
  if (typeof limit !== 'undefined') params.limit = limit;
  if (typeof sinceId !== 'undefined') params.sinceId = sinceId;

  const response = await api.get<NotificationsResponse>(`/notifications`, {
    params,
  });
  const data = response.data ?? { notifications: [] };
  return {
    notifications: Array.isArray(data.notifications) ? data.notifications : [],
    errors: data.errors,
    id: data.id,
  };
};

export const markNotificationRead = async (notificationId: string | number): Promise<boolean> => {
  try {
    // Backend expects PATCH /notifications/:id to update the notification
    await api.patch(`/notifications/${notificationId}`, { read: true });
    return true
  } catch (err) {
    console.warn('Failed to mark notification read:', err)
    return false
  }
}

export const markAllNotificationsRead = async (): Promise<boolean> => {
  try {
    // Backend endpoint to mark all as read
    await api.patch(`/notifications/mark-all-read`)
    return true
  } catch (err) {
    console.warn('Failed to mark all notifications read:', err)
    return false
  }
}

