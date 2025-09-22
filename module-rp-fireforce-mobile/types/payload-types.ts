export interface LoginError {
  field?: "email" | "password" | "general";
  message: string;
  code?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginProps {
  onLogin: (
    email: string,
    password: string
  ) => Promise<{ authError: string } | null>;
}