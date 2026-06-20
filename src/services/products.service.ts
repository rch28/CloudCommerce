import { requests } from "@/lib/axios";

export const productsApi = {
  list: (params?: Record<string, string>) => requests.get<any>("/products", { params }),
  get: (id: string) => requests.get<any>(`/products/${id}`),
  create: (data: any) => requests.post<any>("/products", data),
  update: (id: string, data: any) => requests.put<any>(`/products/${id}`, data),
  patch: (id: string, data: any) => requests.patch<any>(`/products/${id}`, data),
  duplicate: (id: string) => requests.post<any>(`/products/${id}/duplicate`),
  delete: (id: string) => requests.delete(`/products/${id}`),
  bulk: (data: any) => requests.post<any>("/products/bulk", data),
  generateVariants: (data: any) => requests.post<any>("/products/generate-variants", data),
  getOptions: (productId: string) => requests.get<any>(`/products/options`, { params: { productId } }),
};
