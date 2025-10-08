// Team and User selection types for incident creation

export interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'primary' | 'backup' | 'escalation';
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  members?: TeamMember[];
  memberCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamApiResponse {
  success: boolean;
  object?: Team[];
  data?: Team[];
  error?: string;
  message?: string;
}
