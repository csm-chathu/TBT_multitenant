import { Item } from '@/redux/item/itemTypes';
import api from './api';

const API_URL = '/inventory/items';

export const getAllItems = async (): Promise<Item[]> => {
  const response = await api.get(API_URL);
  return response.data;
};

export const getItemById = async (id: number): Promise<Item> => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const createItem = async (data: Item): Promise<Item> => {
  const response = await api.post(API_URL, data);
  return response.data;
};

export const updateItem = async (id: number, data: Item): Promise<Item> => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteItem = async (id: number): Promise<void> => {
  await api.delete(`${API_URL}/${id}`);
};

export interface CsvUploadResponse {
  success?: boolean;
  totalRecords: number;
  errorRecords: number;
  successRecords: number;
  errors?: Array<{
    index: number;
    field: string;
    message: string;
  }>;
  errorRows?: Array<{
    [key: string]: any;
    id?: number;
    errors?: string;
  }>;
  resultFilename?: string;
  message?: string;
}

export const uploadInventoryCsv = async (
  file: File,
  organizationId?: number
): Promise<CsvUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  if (organizationId) {
    formData.append('organization_id', organizationId.toString());
  }

  const response = await api.post('/inventory/csv/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const downloadSampleCsv = async (): Promise<Blob> => {
  const response = await api.get('/inventory/csv/sample', {
    responseType: 'blob',
  });
  return response.data;
};