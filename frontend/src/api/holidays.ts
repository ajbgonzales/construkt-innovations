import api from "./base";

export type HolidayType = "regular" | "special_non_working";

export const HOLIDAY_TYPE_LABELS: Record<HolidayType, string> = {
  regular: "Regular",
  special_non_working: "Special Non-Working",
};

export interface Holiday {
  id: string;
  date: string;
  name: string;
  type: HolidayType;
  createdAt: string;
}

export interface HolidayPayload {
  date: string;
  name: string;
  type: HolidayType;
}

export const getHolidays = async (): Promise<Holiday[]> => {
  const { data } = await api.get<Holiday[]>("/holidays");
  return data;
};

export const createHoliday = async (
  payload: HolidayPayload,
): Promise<Holiday> => {
  const { data } = await api.post<Holiday>("/holidays", payload);
  return data;
};

export const updateHoliday = async (
  id: string,
  payload: HolidayPayload,
): Promise<Holiday> => {
  const { data } = await api.put<Holiday>(`/holidays/${id}`, payload);
  return data;
};

export const deleteHoliday = async (id: string): Promise<void> => {
  await api.delete(`/holidays/${id}`);
};
