import { Location } from "@/redux/location/locationTypes";
import api from './api';

const API_URL = "/inventory/locations";

export const getAllLocations = async (): Promise<Location[]> => {
  const response = await api.get(API_URL);
  return response.data;
};

export const getLocationById = async (id: number): Promise<Location> => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const createLocation = async (data: Location): Promise<Location> => {
  const response = await api.post(API_URL, data);
  return response.data;
};

export const updateLocation = async (
  id: number,
  data: Location
): Promise<Location> => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteLocation = async (id: number): Promise<void> => {
  await api.delete(`${API_URL}/${id}`);
};
