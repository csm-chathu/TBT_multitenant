export interface Agent {
  id?: number;
  nickname?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile_number?: string;
  phone_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  dob?: string;
  sex?: string;
  status?: string;
  hash?: string;
  description?: string;
  remarks?: string;
  data?: string;
  createdAt?: number | Date;
  updatedAt?: number | Date;
  salutation_id?: number;
  user_id?: number;
  country_id?: number;
  state_id?: number;
  // Optional nested relations returned by API includes
  Country?: {
    id?: number;
    name?: string;
  };
  State?: {
    id?: number;
    name?: string;
  };
  // Included from backend: Agent.hasMany(TeamAgent, { as: 'teamLinks' })
  teamLinks?: Array<{
    id?: number;
    roles?: string;
    data?: string | null;
    remarks?: string | null;
    team_id?: number;
    agent_id?: number;
    createdAt?: number | Date;
    updatedAt?: number | Date;
    Team?: {
      id?: number;
      name?: string;
      hash?: string;
    };
  }>;
}

export interface CreateAgentDto {
  nickname?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile_number?: string;
  phone_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  dob?: string;
  sex?: string;
  status?: string;
  hash?: string;
  description?: string;
  remarks?: string;
  data?: string;
  createdAt?: Date;
  updatedAt?: Date;
  salutation_id?: number;
  user_id?: number;
  country_id?: number;
  state_id?: number;
}

export interface UpdateAgentDto {
  id?: number;
  nickname?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile_number?: string;
  phone_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  dob?: string;
  sex?: string;
  status?: string;
  hash?: string;
  description?: string;
  remarks?: string;
  data?: string;
  createdAt?: Date;
  updatedAt?: Date;
  salutation_id?: number;
  user_id?: number;
  country_id?: number;
  state_id?: number;
}
