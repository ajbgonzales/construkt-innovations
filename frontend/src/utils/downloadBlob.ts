import type { AxiosResponse } from "axios";

export const downloadBlobResponse = (
  response: AxiosResponse<Blob>,
  fallbackFilename: string,
) => {
  const url = URL.createObjectURL(response.data);
  const a = document.createElement("a");
  a.href = url;

  const contentDisposition = response.headers["content-disposition"];
  const match = contentDisposition?.match(/filename="?([^"]+)"?/);
  a.download = match?.[1] ?? fallbackFilename;

  a.click();
  URL.revokeObjectURL(url);
};
