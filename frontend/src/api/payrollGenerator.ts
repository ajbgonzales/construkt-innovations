import api from "./base";

export interface PayrollPeriod {
  id: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeFullName: string;
  projectId: string;
  projectName: string;
  totalWorkHours: number;
  overtimeHours: number;
  rate: number;
  allowance: number;
  sss: number;
  hdmf: number;
  phic: number;
  others: number;
  grossAmount: number;
  netAmount: number;
  isFlagged: boolean;
  notes: string | null;
  updatedAt: string;
}

export interface PayrollPeriodDetail extends PayrollPeriod {
  payrollRecords: PayrollRecord[];
}

export interface Payslip {
  id: string;
  payrollRecordId: string;
  payrollPeriodId: string;
  employeeId: string;
  employeeFullName: string;
  projectId: string;
  projectName: string;
  totalWorkHours: number;
  overtimeHours: number;
  rate: number;
  allowance: number;
  sss: number;
  hdmf: number;
  phic: number;
  others: number;
  grossAmount: number;
  netAmount: number;
  isHolidayPayEligible: boolean | null;
  holidayDate: string | null;
  generatedAt: string;
  sentAt: string | null;
}

export interface SendPayslipsResult {
  sent: string[];
  skipped: string[];
  failed: string[];
}

export const getPayrollPeriods = async (): Promise<PayrollPeriod[]> => {
  const { data } = await api.get<PayrollPeriod[]>("/payroll-periods");
  return data;
};

export const getPayrollPeriod = async (
  id: string | undefined,
): Promise<PayrollPeriodDetail> => {
  const { data } = await api.get<PayrollPeriodDetail>(`/payroll-periods/${id}`);
  return data;
};

export const generatePayslips = async (id: string): Promise<Payslip[]> => {
  const { data } = await api.post<Payslip[]>(`/payroll-periods/${id}/payslips`);
  return data;
};

export const getPayslips = async (
  id: string | undefined,
): Promise<Payslip[]> => {
  const { data } = await api.get<Payslip[]>(`/payroll-periods/${id}/payslips`);
  return data;
};

export const downloadPayrollSpreadsheet = (id: string) =>
  api.get(`/payroll-periods/${id}/spreadsheet`, { responseType: "blob" });

export const downloadPayslipPdf = (periodId: string, payslipId: string) =>
  api.get(`/payroll-periods/${periodId}/payslips/${payslipId}/pdf`, {
    responseType: "blob",
  });

export const sendPayslips = async (id: string): Promise<SendPayslipsResult> => {
  const { data } = await api.post<SendPayslipsResult>(
    `/payroll-periods/${id}/payslips/send`,
  );
  return data;
};

export const sendPayslip = async (
  periodId: string,
  payslipId: string,
): Promise<Payslip> => {
  const { data } = await api.post<Payslip>(
    `/payroll-periods/${periodId}/payslips/${payslipId}/send`,
  );
  return data;
};
