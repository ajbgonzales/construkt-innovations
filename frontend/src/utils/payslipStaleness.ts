import type { PayrollRecord, Payslip } from "@/api/payrollGenerator";

export const isPayslipStale = (
  payslip: Payslip,
  payrollRecords: PayrollRecord[],
): boolean => {
  const record = payrollRecords.find(
    (r) => r.employeeId === payslip.employeeId,
  );
  if (!record) return false;
  return new Date(record.updatedAt) > new Date(payslip.generatedAt);
};

export const countStalePayslips = (
  payslips: Payslip[],
  payrollRecords: PayrollRecord[],
): number => payslips.filter((p) => isPayslipStale(p, payrollRecords)).length;

export const getSendDisabledReason = (
  payslips: Payslip[],
  payrollRecords: PayrollRecord[],
): string | null => {
  if (payslips.length === 0) return "Generate payslips before sending.";
  if (countStalePayslips(payslips, payrollRecords) > 0) {
    return "Payroll records have changed since payslips were generated. Regenerate payslips before sending.";
  }
  return null;
};
