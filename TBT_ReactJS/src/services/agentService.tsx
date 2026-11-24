import { Agent, CreateAgentDto, UpdateAgentDto } from '@/redux/agent/agentTypes';
import api from './api';

const API_URL = '/agents';

export const getAllAgents = async (): Promise<Agent[]> => {
  const response = await api.get(API_URL);
  return response.data;
};

export const getAgentById = async (id: number): Promise<Agent> => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const createAgent = async (data: CreateAgentDto): Promise<Agent> => {
  const response = await api.post(API_URL, data);
  return response.data;
};

export const updateAgent = async (id: number, data: UpdateAgentDto): Promise<Agent> => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteAgent = async (id: number, reason?: string): Promise<void> => {
  if (reason) {
    await api.delete(`${API_URL}/${id}`, { data: { reason } });
    return;
  }
  await api.delete(`${API_URL}/${id}`);
};
