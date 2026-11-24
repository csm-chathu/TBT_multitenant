export interface ApplicationRef {
  id: number;
  name: string;
}

export interface TeamAgent {
  agent_id: number;
  role_id?: number;
  data?: string;
  remarks?: string;
}

export interface AgentRef {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  email?: string;
  TeamAgent?: {
    role_id?: number;
    data?: string;
    remarks?: string;
  };
}

export interface Team {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  status?: string;
  hash?: string;
  data?: string;
  description?: string;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
  application_id?: number;
  // Some endpoints include the related Application object
  Application?: ApplicationRef;
  agent_id?: number;
  leader_id?: number;
  // New fields for team-agent assignment
  agents?: TeamAgent[];
  // For responses that include agent details
  agents_details?: AgentRef[];
}

export interface CreateTeamWithAgentsDto {
  name: string;
  email?: string;
  phone_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  status?: string;
  hash?: string;
  description?: string;
  remarks?: string;
  application_id?: number;
  leader_id?: number;
  agents?: TeamAgent[];
}