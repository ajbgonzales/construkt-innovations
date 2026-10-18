import { makePayrollRecord, makePayslip } from "@/test/factories";
import { describe, expect, it } from "vitest";
import {
  countStalePayslips,
  getSendDisabledReason,
  isPayslipStale,
} from "./payslipStaleness";

describe("isPayslipStale", () => {
  it("is stale when the payroll record changed after the payslip was generated", () => {
    const payslip = makePayslip({ generatedAt: "2026-09-12T09:00:00Z" });
    const records = [makePayrollRecord({ updatedAt: "2026-09-12T10:00:00Z" })];

    expect(isPayslipStale(payslip, records)).toBe(true);
  });

  it("is not stale when the payslip was generated after the last change", () => {
    const payslip = makePayslip({ generatedAt: "2026-09-12T09:00:00Z" });
    const records = [makePayrollRecord({ updatedAt: "2026-09-12T08:00:00Z" })];

    expect(isPayslipStale(payslip, records)).toBe(false);
  });

  it("is not stale when the employee has no payroll record", () => {
    const payslip = makePayslip({ employeeId: "someone-else" });

    expect(isPayslipStale(payslip, [makePayrollRecord()])).toBe(false);
  });
});

describe("countStalePayslips", () => {
  it("counts only the stale payslips", () => {
    const records = [
      makePayrollRecord({ employeeId: "a", updatedAt: "2026-09-12T10:00:00Z" }),
      makePayrollRecord({ employeeId: "b", updatedAt: "2026-09-12T08:00:00Z" }),
    ];
    const payslips = [
      makePayslip({ employeeId: "a", generatedAt: "2026-09-12T09:00:00Z" }),
      makePayslip({ employeeId: "b", generatedAt: "2026-09-12T09:00:00Z" }),
    ];

    expect(countStalePayslips(payslips, records)).toBe(1);
  });
});

describe("getSendDisabledReason", () => {
  it("asks to generate payslips when there are none", () => {
    expect(getSendDisabledReason([], [makePayrollRecord()])).toBe(
      "Generate payslips before sending.",
    );
  });

  it("asks to regenerate when any payslip is stale", () => {
    const payslips = [makePayslip({ generatedAt: "2026-09-12T07:00:00Z" })];

    expect(getSendDisabledReason(payslips, [makePayrollRecord()])).toMatch(
      /Regenerate payslips before sending/,
    );
  });

  it("allows sending when every payslip is up to date", () => {
    expect(
      getSendDisabledReason([makePayslip()], [makePayrollRecord()]),
    ).toBeNull();
  });
});
