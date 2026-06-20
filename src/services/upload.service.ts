import { requests } from "@/lib/axios";

export const uploadApi = {
  upload: (formData: FormData) => requests.post<any>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  delete: (data: any) => requests.delete("/upload", { data }),
};
