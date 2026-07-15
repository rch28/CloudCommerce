import { requests } from "@/lib/axios";

function tenantHeaders(): Record<string, Record<string, string>> | undefined {
  if (typeof window === "undefined") return undefined;
  const match = window.location.pathname.match(/\/store\/([^/]+)/);
  const tenantId = match?.[1];
  return tenantId ? { headers: { "x-tenant-id": tenantId } } : undefined;
}

export const cmsApi = {
  listPages: () => requests.get<any[]>("/cms/pages", tenantHeaders()),
  getPage: (id: string) => requests.get<any>(`/cms/pages/${id}`, tenantHeaders()),
  createPage: (data: any) => requests.post<any>("/cms/pages", data, tenantHeaders()),
  updatePage: (id: string, data: any) => requests.patch<any>(`/cms/pages/${id}`, data, tenantHeaders()),
  deletePage: (id: string) => requests.delete(`/cms/pages/${id}`, tenantHeaders()),
  publishPage: (id: string, data: any) => requests.post<any>(`/cms/pages/${id}/publish`, data, tenantHeaders()),
  listBanners: () => requests.get<any[]>("/cms/banners", tenantHeaders()),
  createBanner: (data: any) => requests.post<any>("/cms/banners", data, tenantHeaders()),
  updateBanner: (id: string, data: any) => requests.patch<any>(`/cms/banners/${id}`, data, tenantHeaders()),
  deleteBanner: (id: string) => requests.delete(`/cms/banners/${id}`, tenantHeaders()),
};
