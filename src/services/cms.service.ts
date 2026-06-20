import { requests } from "@/lib/axios";

export const cmsApi = {
  listPages: () => requests.get<any[]>("/cms/pages"),
  getPage: (id: string) => requests.get<any>(`/cms/pages/${id}`),
  createPage: (data: any) => requests.post<any>("/cms/pages", data),
  updatePage: (id: string, data: any) => requests.patch<any>(`/cms/pages/${id}`, data),
  deletePage: (id: string) => requests.delete(`/cms/pages/${id}`),
  publishPage: (id: string, data: any) => requests.post<any>(`/cms/pages/${id}/publish`, data),
  listBanners: () => requests.get<any[]>("/cms/banners"),
  createBanner: (data: any) => requests.post<any>("/cms/banners", data),
  updateBanner: (id: string, data: any) => requests.patch<any>(`/cms/banners/${id}`, data),
  deleteBanner: (id: string) => requests.delete(`/cms/banners/${id}`),
};
