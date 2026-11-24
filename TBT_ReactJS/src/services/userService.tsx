import api from './api';
import { User } from '@/redux/user/userTypes';

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>('/user');
  return response.data;
};

export const changePassword = async (payload: { oldPassword: string; newPassword: string }) => {
  const response = await api.post('auth/reset-password', payload);
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};

