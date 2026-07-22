import api from "./base";

export interface Employee {
  id: string;
  fullName: string;
  emailAddress: string | null;
  contactNumber: string | null;
  employeeId: string;
  project: string;
  position: string;
  rate: number;
  allowance: number;
  sss: number;
  hdmf: number;
  phic: number;
  createdAt: string;
}

export const getEmployees = async (): Promise<Employee[]> => {
  const { data } = await api.get<Employee[]>("/employees");
  return data;
};
