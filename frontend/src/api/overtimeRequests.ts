import api from "./base";
import type { Employee } from "./employees";

export interface OvertimeRequest {
  id: string;
  date: string;
  projectId: string;
  projectName: string;
  startTime: string;
  endTime: string;
  activities: string;
  employees: Employee[];
}

export interface OvertimeRequestPayload {
  date: string;
  projectId: string;
  startTime: string;
  endTime: string;
  activities: string;
  employeeIds: string[];
}

export const createOvertimeRequest = async (
  payload: OvertimeRequestPayload,
): Promise<OvertimeRequest> => {
  const { data } = await api.post<OvertimeRequest>(
    "/overtime-requests",
    payload,
  );
  return data;
};

export const updateOvertimeRequest = async (
  id: string,
  payload: OvertimeRequestPayload,
): Promise<OvertimeRequest> => {
  const { data } = await api.put<OvertimeRequest>(
    `/overtime-requests/${id}`,
    payload,
  );
  return data;
};

export const getOvertimeRequests = async (): Promise<OvertimeRequest[]> => {
  const { data } = await api.get<OvertimeRequest[]>("/overtime-requests");
  return data;
};

export const getOvertimeRequest = async (
  overtime_request_id: string | undefined,
): Promise<OvertimeRequest> => {
  const { data } = await api.get<OvertimeRequest>(
    `/overtime-requests/${overtime_request_id}`,
  );
  return data;
};

export const deleteOvertimeRequest = async (id: string): Promise<void> => {
  await api.delete(`/overtime-requests/${id}`);
};
