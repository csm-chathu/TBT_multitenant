import api from './api';

export interface TicketResource {
  id: number;
  ticketId: number;
  s3Key?: string;
  file_url?: string;
  thumb_url?: string;
  file_mime_type?: string;
  file_path?: string;
  originalName?: string;
  remarks?: string | null;
  createdAt?: string;
}

export interface UploadTicketResourceResponse extends TicketResource {}

const DEFAULT_SIGNED_URL_ENDPOINT = '/tickets/resources/signed-url';
const SIGNED_URL_ENDPOINT = import.meta.env?.VITE_SIGNED_URL_ENDPOINT ?? DEFAULT_SIGNED_URL_ENDPOINT;

const extractSignedUrl = (payload: any): string | null => {
  if (!payload) return null;

  if (typeof payload === 'string') {
    return payload || null;
  }

  if (typeof payload === 'object') {
    return (
      payload.url ||
      payload.signedUrl ||
      payload.signedURL ||
      payload.downloadUrl ||
      payload.downloadURL ||
      payload.file_url ||
      payload.fileUrl ||
      null
    );
  }

  return null;
};

export const listTicketResources = async (ticketId: number): Promise<TicketResource[]> => {
  const response = await api.get(`/tickets/${ticketId}/resources`);
  return response.data;
};

export const uploadTicketResource = async (
  ticketHash: string,
  file: File,
  remarks?: string
): Promise<UploadTicketResourceResponse> => {
  console.log('uploadTicketResource called with:', { ticketHash, fileName: file.name, fileSize: file.size, fileType: file.type });

  const formData = new FormData();
  formData.append('file', file);
  if (remarks) {
    formData.append('remarks', remarks);
  }

  console.log('FormData prepared, making API call to:', `/tickets/${ticketHash}/resources/upload`);

  try {
    const response = await api.post(
      `/tickets/${ticketHash}/resources/upload`,
      formData
    );
    console.log('Upload API response:', response);
    return response.data;
  } catch (error) {
    console.error('Upload API error:', error);
    throw error;
  }
};

export const deleteTicketResource = async (
  ticketId: number,
  resourceId: number
): Promise<void> => {
  await api.delete(`/tickets/${ticketId}/resources/${resourceId}`);
};

export const getTicketResourceSignedUrl = async (filePath?: string | null): Promise<string | null> => {
  if (!filePath) return null;

  const trimmedPath = filePath.trim();
  if (!trimmedPath) return null;

  // First attempt via GET with query params
  try {
    const response = await api.get(SIGNED_URL_ENDPOINT, {
      params: { filePath: trimmedPath },
    });
    const url = extractSignedUrl(response.data);
    if (url) {
      return url;
    }
  } catch (error) {
    console.warn('GET signed URL request failed, will try POST fallback:', error);
  }

  // Fallback to POST body
  try {
    const response = await api.post(SIGNED_URL_ENDPOINT, {
      filePath: trimmedPath,
    });
    const url = extractSignedUrl(response.data);
    if (url) {
      return url;
    }
  } catch (error) {
    console.error('POST signed URL request failed:', error);
  }

  return null;
};





