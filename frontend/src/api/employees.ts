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

export interface EmployeeImportRowError {
  row: number;
  reason: string;
}

export interface EmployeeImportSummary {
  created: number;
  failed: EmployeeImportRowError[];
}

export const getEmployee = async (
  employee_id: string | undefined,
): Promise<Employee> => {
  const { data } = await api.get<Employee>(`/employees/${employee_id}`);
  return data;
};

export const getEmployees = async (): Promise<Employee[]> => {
  const { data } = await api.get<Employee[]>("/employees");
  return data;
};

export const importEmployees = async (
  file: File,
): Promise<EmployeeImportSummary> => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<EmployeeImportSummary>(
    "/employees/import",
    formData,
  );
  return data;
};

export const deleteEmployee = async (id: string): Promise<void> => {
  await api.delete(`/employees/${id}`);
};
