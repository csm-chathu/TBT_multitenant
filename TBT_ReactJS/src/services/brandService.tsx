import { Brand } from '@/redux/brand/brandTypes';
import api from './api';

// Use relative path; resolves against axios baseURL (e.g., http://localhost:3000/api)
const API_URL = '/inventory/brands';

export const getAllBrands = async (): Promise<Brand[]> => {
  const response = await api.get(API_URL);
  return response.data;
};

export const getBrandById = async (id: number): Promise<Brand> => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const createBrand = async (data: Brand): Promise<Brand> => {
  const response = await api.post(API_URL, data);
  return response.data;
};

export const updateBrand = async (id: number, data: Brand): Promise<Brand> => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteBrand = async (id: number): Promise<void> => {
  await api.delete(`${API_URL}/${id}`);
};



