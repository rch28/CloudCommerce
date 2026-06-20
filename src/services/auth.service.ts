import { requests } from "@/lib/axios";

export interface MeResponse {
  loggedIn: boolean;
  user?: { id: string; name: string; email: string; role: string };
}

const withAuth = { baseURL: "" };

export const authApi = {
  me: () => requests.get<MeResponse>("/api/auth/me", withAuth),
  login: (data: { email: string; password: string }) =>
    requests.post<{ user: { id: string; name: string; email: string; role: string } }>("/api/auth/login", data, withAuth),
  register: (data: { email: string; password: string; name: string; role: string }) =>
    requests.post<{ user: { id: string; name: string; email: string; role: string } }>("/api/auth/register", data, withAuth),
  logout: () => requests.post<void>("/api/auth/logout", undefined, withAuth),
};
