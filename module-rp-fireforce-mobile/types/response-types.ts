export type APIResponse<T = {}> = {
  data: any;
  httpStatus: string;
  message: string;
  object: T;
};

export type AuthenticateResponse = {
  object: any;
  httpStatus: string;
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  token: string;
};
