import axios, { AxiosError, AxiosResponse } from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

export default api;
export const requests = {
  get: <T = unknown>(url: string, config?: any) =>
    api.get<T>(url, config).then((res) => res.data),

  post: <T = unknown, D = unknown>(url: string, data?: D, config?: any) =>
    api.post<T, AxiosResponse<T>, D>(url, data, config).then((res) => res.data),

  put: <T = unknown, D = unknown>(url: string, data?: D, config?: any) =>
    api.put<T, AxiosResponse<T>, D>(url, data, config).then((res) => res.data),

  patch: <T = unknown, D = unknown>(url: string, data?: D, config?: any) =>
    api
      .patch<T, AxiosResponse<T>, D>(url, data, config)
      .then((res) => res.data),

  delete: <T = unknown>(url: string, config?: any) =>
    api.delete<T>(url, config).then((res) => res.data),
} as const;

export class ApiError extends Error {
  status: number;
  data?: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}
