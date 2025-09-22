import { LoginData, LoginError } from "./payload-types";

export const validateEmail = (email: string): boolean => {
  return email.includes("@rocketpartners.io");
};

export const validateLoginForm = (data: LoginData): LoginError | null => {
  if (!data.email?.trim()) {
    return { field: "email", message: "Email is required" };
  }

  if (!validateEmail(data.email)) {
    return { field: "email", message: "Please use a rocketpartners.io email" };
  }

  if (!data.password?.trim()) {
    return { field: "password", message: "Password is required" };
  }

  if (data.password.length < 6) {
    return {
      field: "password",
      message: "Password must be at least 6 characters",
    };
  }

  return null;
};
