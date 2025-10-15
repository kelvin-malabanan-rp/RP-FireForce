// Common types used throughout the application

export interface User {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatar?: string;
  role?: 'user' | 'admin' | 'moderator';
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  status: number;
  httpStatus?: string;
}

export interface ApiError {
  message: string;
  status: number;
  data?: any;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
  service?: string; // Optional service field for API compatibility
}

export interface LoginResponse {
  user: User;
  token: string;
  id?: string;
  email?: string;
}

export interface AuthResponse {
  data: LoginResponse;
  message?: string;
  httpStatus: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  avatar?: string;
}

// Incident Types
export interface Incident {
  id: string;
  incident_id?: string; // Add this line
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved' | 'closed' | 'investigating';
  timestamp: string;
  created_at?: string;
  updated_at?: string;
  assigned_to?: string;
  team_id?: string;
  location?: string;
  reported_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  aws_alarm_name?: string;
  aws_account_id?: string;
  aws_console_url?: string;
}

export interface IncidentComment {
  id: string;
  incident_id: string;
  user_id: string;
  user_email?: string;
  userEmail?: string;
  userFullname?: string;
  comment: string;
  timestamp?: string; // Some APIs return timestamp
  created_at: string;
  createdAt?: string;
  updated_at?: string;
}

export interface CreateIncidentData {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: string | null;
  reportedBy: string;
  notifyUsers?: string[] | null; // optional array of user IDs
  notify_users?: string[] | null; // API also accepts this format
}

export interface RespondToIncidentData {
  incidentId: string;
  action: 'acknowledge' | 'escalate' | 'assign';
  userId: string;
}

export interface ResolveIncidentData {
  incidentId: string;
  resolvedBy: string;
  resolution: string;
}

export interface CreateCommentData {
  incidentId: string;
  userId: string;
  comment: string;
}

export interface IncidentStats {
  total: number;
  open: number;
  acknowledged?: number;
  investigating?: number;
  resolved: number;
  closed?: number;
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
}

// On-Call Types
export interface OnCallMember {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface OnCallTeam {
  id: string;
  teamId?: string;
  name: string;
  description?: string;
  members?: number;
  currentOnCall?: OnCallMember;
}

export interface OnCallSchedule {
  id: string;
  date: string;
  dayOfWeek: string;
  members: OnCallMember[];
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  loading: boolean;
  error?: string | null;
}

export interface FormState<T> extends LoadingState {
  data: T;
  touched: Partial<Record<keyof T, boolean>>;
  errors: Partial<Record<keyof T, string>>;
}
