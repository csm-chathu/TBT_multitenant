import api from './api';
import type { OutputData } from '@editorjs/editorjs';

export interface NoteItem {
  id: number;
  user_id?: number;
  title: string;
  content?: OutputData;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreateNotePayload {
  title?: string;
  content?: OutputData;
}

export interface UpdateNotePayload {
  title?: string;
  content?: OutputData;
}

const API_URL = '/notes';

export const getAllNotes = async (): Promise<NoteItem[]> => {
  const response = await api.get(API_URL);
  return response.data;
};

export const getNoteById = async (id: number): Promise<NoteItem> => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const createNoteApi = async (payload: CreateNotePayload): Promise<NoteItem> => {
  const response = await api.post(API_URL, payload);
  return response.data;
};

export const updateNoteApi = async (id: number, payload: UpdateNotePayload): Promise<NoteItem> => {
  const response = await api.put(`${API_URL}/${id}`, payload);
  return response.data;
};

export const deleteNoteApi = async (id: number): Promise<{ success: boolean }> => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response.data;
};
