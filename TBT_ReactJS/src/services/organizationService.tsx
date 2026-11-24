import { Organization } from "@/redux/organizations/organizationTypes";
import api from "./api";

const API_URL = "/organizations";

export const getAllOrganizations = async (): Promise<Organization[]> => {
  const response = await api.get(API_URL);
  return response.data;
};

export const deleteOrganization = async (id: number, reason?: string): Promise<void> => {
  await api.delete(`${API_URL}/${id}`, { data: { reason } });
};


