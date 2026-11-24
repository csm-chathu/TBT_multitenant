import api from './api';

export interface StateDto {
  id: number;
  name: string;
  country_id?: number;
}

const API_URL = '/states';

export const getStatesByCountry = async (countryId: number): Promise<StateDto[]> => {
  const response = await api.get(`${API_URL}?country_id=${countryId}`);
  return response.data;
};


