import { requests } from "@/lib/axios";

export interface MeUser {
  id: string; name: string; email: string; role: string; tenantId?: string;
}

export interface MeResponse {
  loggedIn: boolean;
  user?: MeUser;
}

const withAuth = { baseURL: "" };

export const authApi = {
  me: () => requests.get<MeResponse>("/api/auth/me", withAuth),
  login: (data: { email: string; password: string }) =>
    requests.post<{ user: MeUser }>("/api/auth/login", data, withAuth),
  register: (data: { email: string; password: string; name: string; role: string }) =>
    requests.post<{ user: MeUser }>("/api/auth/register", data, withAuth),
  logout: () => requests.post<void>("/api/auth/logout", undefined, withAuth),
};
