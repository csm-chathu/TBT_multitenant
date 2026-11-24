import { Category } from '@/redux/category/categoryTypes';
import api from './api';

const API_URL = '/inventory/categories';

export const getAllCategories = async (): Promise<Category[]> => {
  const response = await api.get(API_URL);
  return response.data;
};

export const getCategoryById = async (id: number): Promise<Category> => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const createCategory = async (data: Category): Promise<Category> => {
  const response = await api.post(API_URL, data);
  return response.data;
};

export const updateCategory = async (id: number, data: Category): Promise<Category> => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`${API_URL}/${id}`);
};



