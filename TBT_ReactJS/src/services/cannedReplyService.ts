import api from './api'

export interface CannedReply {
  id: number
  text: string
  application_id?: number | null
  status?: 'pending' | 'approved'
  verification_count?: number
}

export const getCannedReplies = async (applicationId?: number): Promise<CannedReply[]> => {
  const params = applicationId ? { applicationId } : {}
  const res = await api.get<CannedReply[]>('/canned-replies', { params })
  return Array.isArray(res.data) ? res.data : []
}

export const getAllCannedReplies = async (applicationId?: number): Promise<CannedReply[]> => {
  const params: any = { all: 'true' }
  if (applicationId) params.applicationId = applicationId
  const res = await api.get<CannedReply[]>('/canned-replies', { params })
  return Array.isArray(res.data) ? res.data : []
}

export const verifyCannedReply = async (id: number): Promise<CannedReply> => {
  const res = await api.post<CannedReply>(`/canned-replies/${id}/verify`)
  return res.data
}

export const createCannedReply = async (text: string, applicationId?: number): Promise<CannedReply> => {
  const res = await api.post<CannedReply>('/canned-replies', { text, application_id: applicationId })
  return res.data
}

export const updateCannedReply = async (id: number, text: string): Promise<CannedReply | null> => {
  const res = await api.put<CannedReply>(`/canned-replies/${id}`, { text })
  return res.data
}

export const deleteCannedReply = async (id: number): Promise<void> => {
  await api.delete(`/canned-replies/${id}`)
}
