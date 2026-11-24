import api from './api';

export interface IncidentType {
  id?: number;
  name: string;
}

const API_URL = '/incidents';

export const getAllIncidents = async (): Promise<IncidentType[]> => {
  const response = await api.get(API_URL);
  return response.data;
};



































