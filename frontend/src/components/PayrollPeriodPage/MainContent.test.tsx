import {
  generatePayslips,
  getPayslips,
  sendPayslips,
  type PayrollPeriodDetail,
} from "@/api/payrollGenerator";
import { makePayrollRecord, makePayslip } from "@/test/factories";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MainContent from "./MainContent";

vi.mock("@/api/payrollGenerator", () => ({
  generatePayslips: vi.fn(),
  getPayslips: vi.fn(),
  sendPayslips: vi.fn(),
  downloadPayslipPdf: vi.fn(),
  sendPayslip: vi.fn(),
}));

const period: PayrollPeriodDetail = {
  id: "period-1",
  startDate: "2026-09-07",
  endDate: "2026-09-11",
  createdAt: "2026-09-12T00:00:00Z",
  payrollRecords: [makePayrollRecord()],
};

const renderMainContent = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MainContent payrollPeriod={period} />
    </QueryClientProvider>,
  );

const sendButton = () => screen.getByRole("button", { name: "Send Payslips" });

describe("PayrollPeriodPage MainContent", () => {
  beforeEach(() => {
    vi.mocked(getPayslips).mockReset().mockResolvedValue([]);
    vi.mocked(generatePayslips).mockReset().mockResolvedValue([]);
    vi.mocked(sendPayslips).mockReset();
  });

  it("disables sending until payslips are generated", async () => {
    renderMainContent();

    await waitFor(() => expect(getPayslips).toHaveBeenCalledWith("period-1"));
    expect(sendButton()).toBeDisabled();
  });

  it("generates payslips for the period", async () => {
    const user = userEvent.setup();
    renderMainContent();

    await user.click(screen.getByRole("button", { name: "Generate Payslips" }));

    await waitFor(() =>
      expect(vi.mocked(generatePayslips).mock.calls[0]?.[0]).toBe("period-1"),
    );
  });

  it("shows an error when generating fails", async () => {
    vi.mocked(generatePayslips).mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderMainContent();

    await user.click(screen.getByRole("button", { name: "Generate Payslips" }));

    expect(
      await screen.findByText("Failed to generate payslips. Please try again."),
    ).toBeInTheDocument();
  });

  it("warns about and blocks sending stale payslips", async () => {
    vi.mocked(getPayslips).mockResolvedValue([
      makePayslip({ generatedAt: "2026-09-12T07:00:00Z" }),
    ]);
    renderMainContent();

    expect(
      await screen.findByText(/Payroll records for this period have been updated/),
    ).toBeInTheDocument();
    expect(sendButton()).toBeDisabled();
  });

  it("sends payslips after confirming and reports the result", async () => {
    vi.mocked(getPayslips).mockResolvedValue([makePayslip()]);
    vi.mocked(sendPayslips).mockResolvedValue({
      sent: ["Alice Active"],
      skipped: ["Bob NoEmail"],
      failed: [],
    });
    const user = userEvent.setup();
    renderMainContent();

    await waitFor(() => expect(sendButton()).toBeEnabled());
    await user.click(sendButton());
    const dialog = await screen.findByRole("presentation");
    await user.click(within(dialog).getByRole("button", { name: "Send Payslips" }));

    expect(
      await screen.findByText("1 sent, 1 skipped (no email on file)"),
    ).toBeInTheDocument();
    expect(vi.mocked(sendPayslips).mock.calls[0]?.[0]).toBe("period-1");
  });
});
