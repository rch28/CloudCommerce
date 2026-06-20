import { requests } from "@/lib/axios";

export interface MeResponse {
  loggedIn: boolean;
  user?: { id: string; name: string; email: string; role: string };
}

export const authApi = {
  me: () => requests.get<MeResponse>("/auth/me"),
};
