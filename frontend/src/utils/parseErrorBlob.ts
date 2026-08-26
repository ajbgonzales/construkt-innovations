import type { AxiosError } from "axios";

export const getBlobErrorDetail = async (
  error: AxiosError,
  fallback: string,
): Promise<string> => {
  const data = error.response?.data;
  if (!(data instanceof Blob)) return fallback;

  try {
    const parsed = JSON.parse(await data.text());
    return typeof parsed.detail === "string" ? parsed.detail : fallback;
  } catch {
    return fallback;
  }
};
