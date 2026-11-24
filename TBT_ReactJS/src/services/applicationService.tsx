import { Application } from "@/redux/applications/applicationTypes";
import api from './api';

const API_URL = '/applications';

export const getAllApplications = async (): Promise<Application[]> => {
  const response = await api.get(API_URL);
  return response.data;
};

export const getApplicationById = async (id: number): Promise<Application> => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const createApplication = async (data: Application): Promise<Application> => {
  const response = await api.post(API_URL, data);
  return response.data;
};

export const updateApplication = async (id: number, data: Application): Promise<Application> => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteApplication = async (id: number, reason?: string): Promise<void> => {
  await api.delete(`${API_URL}/${id}`, { data: { reason } });
};