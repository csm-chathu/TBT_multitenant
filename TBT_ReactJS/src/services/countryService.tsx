import api from './api';

export interface CountryDto {
  id: number;
  name: string;
}

const API_URL = '/countries';

export const getAllCountries = async (): Promise<CountryDto[]> => {
  const response = await api.get(API_URL);
  return response.data;
};


