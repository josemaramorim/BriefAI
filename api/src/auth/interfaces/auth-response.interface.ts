import { AuthUser } from './auth-user.interface';

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}
