import { Team, CreateTeamWithAgentsDto } from "@/redux/team/teamTypes";
import api from "./api";

const API_URL = "/teams";

export const getAllTeams = async (): Promise<Team[]> => {
  const response = await api.get(API_URL);
  return response.data;
};

export const getTeamById = async (id: number): Promise<Team> => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const createTeam = async (data: Team): Promise<Team> => {
  const response = await api.post(API_URL, data);
  return response.data;
};

export const createTeamWithAgents = async (data: CreateTeamWithAgentsDto): Promise<Team> => {
  const response = await api.post(`${API_URL}/with-agents`, data);
  return response.data;
};

export const updateTeam = async (
  id: number,
  data: Team
): Promise<Team> => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteTeam = async (id: number, reason?: string): Promise<void> => {
  // If a reason is provided, send it in the request body using axios `data` option
  if (reason) {
    await api.delete(`${API_URL}/${id}`, { data: { reason } });
    return;
  }
  await api.delete(`${API_URL}/${id}`);
};
