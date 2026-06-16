import api from "@/lib/axios";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface MeResponse {
  loggedIn: boolean;
  user: User | null;
}

export async function getMe(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>("/me");
  return data;
}
