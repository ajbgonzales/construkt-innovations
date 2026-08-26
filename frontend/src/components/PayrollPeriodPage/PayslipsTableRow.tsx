import {
  downloadPayslipPdf,
  sendPayslip,
  type Payslip,
} from "@/api/payrollGenerator";
import { downloadBlobResponse } from "@/utils/downloadBlob";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import {
  Alert,
  Button,
  Chip,
  Snackbar,
  TableCell,
  TableRow,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { type FC, useState } from "react";
import SendPayslipModal from "./SendPayslipModal";

interface PayslipsTableRowProps {
  payslip: Payslip;
  sendDisabledReason: string | null;
}

const formatCurrency = (value: number) =>
  `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const PayslipsTableRow: FC<PayslipsTableRowProps> = ({
  payslip,
  sendDisabledReason,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendToast, setSendToast] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);
  const queryClient = useQueryClient();

  const { mutate: handleDownload, isPending: isDownloading } = useMutation({
    mutationFn: () => downloadPayslipPdf(payslip.payrollPeriodId, payslip.id),
    onSuccess: (response) =>
      downloadBlobResponse(
        response,
        `Payslip - ${payslip.employeeFullName}.pdf`,
      ),
    onError: () => {
      setErrorMessage("Failed to download payslip. Please try again.");
    },
  });

  const { mutate: handleSend, isPending: isSending } = useMutation({
    mutationFn: () => sendPayslip(payslip.payrollPeriodId, payslip.id),
    onSuccess: () => {
      setIsSendModalOpen(false);
      setSendToast({
        message: `Payslip sent to ${payslip.employeeFullName}.`,
        severity: "success",
      });
      queryClient.invalidateQueries({
        queryKey: ["payslips", payslip.payrollPeriodId],
      });
    },
    onError: (error) => {
      const detail = isAxiosError(error)
        ? (error.response?.data?.detail as string | undefined)
        : undefined;
      const message = detail ?? "Failed to send payslip. Please try again.";
      setIsSendModalOpen(false);
      setSendToast({ message, severity: "error" });
    },
  });

  return (
    <TableRow>
      <StyledTableCell>{payslip.employeeFullName}</StyledTableCell>
      <StyledTableCell>{payslip.projectName}</StyledTableCell>
      <StyledTableCell>{formatCurrency(payslip.netAmount)}</StyledTableCell>
      <StyledTableCell>
        {payslip.isHolidayPayEligible === null
          ? "N/A"
          : payslip.isHolidayPayEligible
            ? "Eligible"
            : "Not Eligible"}
      </StyledTableCell>
      <StyledTableCell>
        {new Date(payslip.generatedAt).toLocaleString()}
      </StyledTableCell>
      <StyledTableCell>
        {payslip.sentAt ? (
          <Tooltip title={new Date(payslip.sentAt).toLocaleString()}>
            <Chip label="Sent" color="success" size="small" />
          </Tooltip>
        ) : (
          <Chip label="Not Sent" size="small" />
        )}
      </StyledTableCell>
      <StyledTableCell>
        <Tooltip title="Download PDF">
          <StyledButton
            disabled={isDownloading}
            onClick={() => handleDownload()}
            sx={{ marginRight: "0.25rem" }}
          >
            <DownloadOutlinedIcon />
          </StyledButton>
        </Tooltip>
        <Tooltip title={sendDisabledReason ?? "Send Payslip"}>
          <span>
            <StyledButton
              disabled={!!sendDisabledReason}
              onClick={() => setIsSendModalOpen(true)}
            >
              <SendOutlinedIcon />
            </StyledButton>
          </span>
        </Tooltip>
        <SendPayslipModal
          isOpen={isSendModalOpen}
          isSending={isSending}
          employeeName={payslip.employeeFullName}
          onClose={() => {
            if (isSending) return;
            setIsSendModalOpen(false);
          }}
          onConfirm={() => handleSend()}
        />
        <Snackbar
          open={!!errorMessage}
          autoHideDuration={6000}
          onClose={() => setErrorMessage(null)}
        >
          <Alert severity="error" onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        </Snackbar>
        <Snackbar
          open={!!sendToast}
          autoHideDuration={6000}
          onClose={() => setSendToast(null)}
        >
          <Alert
            severity={sendToast?.severity}
            onClose={() => setSendToast(null)}
          >
            {sendToast?.message}
          </Alert>
        </Snackbar>
      </StyledTableCell>
    </TableRow>
  );
};

export default PayslipsTableRow;

const StyledButton = styled(Button)({
  padding: 0,
  margin: 0,
  minWidth: "fit-content",
  color: "rgba(0, 0, 0, 0.87)",
});

const StyledTableCell = styled(TableCell)({
  fontFamily: "Public Sans",
  background: "#FFF",
});
