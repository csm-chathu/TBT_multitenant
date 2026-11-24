import api from './api';

export interface RealtimeConfig {
  enabled: boolean;
  key: string;
  cluster?: string;
  useTLS?: boolean;
  channel: string;
  authEndpoint?: string;
  logToConsole?: boolean;
}

export const fetchRealtimeConfig = async (): Promise<RealtimeConfig | null> => {
  try {
    const response = await api.get<RealtimeConfig>('/realtime/config');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch realtime configuration:', error);
    return null;
  }
};

