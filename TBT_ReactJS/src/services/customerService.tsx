import { Customer } from '@/redux/customer/customerTypes';
import api from './api';

const API_URL = '/customers';

export interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedCustomers {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getAllCustomers = async (filters?: CustomerFilters): Promise<PaginatedCustomers> => {
  const params: Record<string, string> = {};
  if (filters?.page) params.page = String(filters.page);
  if (filters?.limit) params.limit = String(filters.limit);
  if (filters?.search && filters.search.trim().length >= 2) params.search = filters.search.trim();
  const response = await api.get(API_URL, { params });
  return response.data;
};

export const getCustomerById = async (id: number): Promise<Customer> => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const createCustomer = async (data: Customer): Promise<Customer> => {
  const response = await api.post(API_URL, data);
  return response.data;
};

export const updateCustomer = async (id: number, data: Customer): Promise<Customer> => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteCustomer = async (id: number, reason?: string): Promise<void> => {
  // Axios DELETE with a request body: pass `data` in config
  const config = reason ? { data: { reason } } : undefined;
  await api.delete(`${API_URL}/${id}`, config as any);
};

export interface CustomerSmsCount {
  total: number;
  outbound: number;
  inbound: number;
}

export const getCustomerSmsCount = async (id: number): Promise<CustomerSmsCount> => {
  const response = await api.get(`${API_URL}/${id}/sms-count`);
  return response.data;
};

