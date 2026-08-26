import {
  downloadPayrollSpreadsheet,
  generatePayslips,
  getPayslips,
  sendPayslips,
  type PayrollRecord,
  type SendPayslipsResult,
} from "@/api/payrollGenerator";
import { downloadBlobResponse } from "@/utils/downloadBlob";
import { getSendDisabledReason } from "@/utils/payslipStaleness";
import {
  Alert,
  Box,
  Button,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { type FC, useState } from "react";
import SendPayslipsModal from "./SendPayslipsModal";

interface HeaderProps {
  id: string;
  startDate: string;
  endDate: string;
  payrollRecords: PayrollRecord[];
}

const formatSendResult = (result: SendPayslipsResult) => {
  const parts = [`${result.sent.length} sent`];
  if (result.skipped.length > 0) {
    parts.push(`${result.skipped.length} skipped (no email on file)`);
  }
  if (result.failed.length > 0) {
    parts.push(`${result.failed.length} failed: ${result.failed.join("; ")}`);
  }
  return parts.join(", ");
};

const Header: FC<HeaderProps> = ({
  id,
  startDate,
  endDate,
  payrollRecords,
}) => {
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendResultMessage, setSendResultMessage] = useState<string | null>(
    null,
  );
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: payslips = [] } = useQuery({
    queryKey: ["payslips", id],
    queryFn: () => getPayslips(id),
  });

  const sendDisabledReason = getSendDisabledReason(payslips, payrollRecords);

  const { mutate: handleGenerate, isPending: isGenerating } = useMutation({
    mutationFn: () => generatePayslips(id),
    onSuccess: () => {
      setGenerateError(null);
      queryClient.invalidateQueries({ queryKey: ["payslips", id] });
    },
    onError: () => {
      setGenerateError("Failed to generate payslips. Please try again.");
    },
  });

  const { mutate: handleDownload, isPending: isDownloading } = useMutation({
    mutationFn: () => downloadPayrollSpreadsheet(id),
    onSuccess: (response) => {
      setDownloadError(null);
      downloadBlobResponse(response, "Daily Payroll.xlsx");
    },
    onError: () => {
      setDownloadError(
        "Failed to download payroll spreadsheet. Process attendance files for this period first.",
      );
    },
  });

  const { mutate: handleSend, isPending: isSending } = useMutation({
    mutationFn: () => sendPayslips(id),
    onSuccess: (result) => {
      setSendError(null);
      setIsSendModalOpen(false);
      setSendResultMessage(formatSendResult(result));
      queryClient.invalidateQueries({ queryKey: ["payslips", id] });
    },
    onError: () => {
      setSendError("Failed to send payslips. Please try again.");
    },
  });

  return (
    <Container>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography
          sx={{ fontFamily: "Public Sans", fontSize: "24px", fontWeight: 600 }}
        >
          {dayjs(startDate).format("MMM D, YYYY")} -{" "}
          {dayjs(endDate).format("MMM D, YYYY")}
        </Typography>
        {generateError && (
          <Typography sx={{ color: "red", fontSize: "0.875rem" }}>
            {generateError}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: "flex", gap: "0.5rem" }}>
        <Button
          variant="outlined"
          sx={{ color: "#E67E22", border: "1px solid #E67E22" }}
          disabled={isDownloading}
          onClick={() => handleDownload()}
        >
          {isDownloading ? "Downloading…" : "Download Payroll"}
        </Button>
        <Button
          variant="contained"
          sx={{ background: "#E67E22" }}
          disabled={isGenerating}
          onClick={() => handleGenerate()}
        >
          {isGenerating ? "Generating…" : "Generate Payslips"}
        </Button>
        <Tooltip title={sendDisabledReason ?? ""}>
          <span>
            <Button
              variant="contained"
              sx={{ background: "#564337" }}
              disabled={!!sendDisabledReason}
              onClick={() => setIsSendModalOpen(true)}
            >
              Send Payslips
            </Button>
          </span>
        </Tooltip>
      </Box>
      <SendPayslipsModal
        isOpen={isSendModalOpen}
        isSending={isSending}
        errorMessage={sendError}
        onClose={() => {
          if (isSending) return;
          setSendError(null);
          setIsSendModalOpen(false);
        }}
        onConfirm={() => handleSend()}
      />
      <StyledSnackbar
        open={!!downloadError}
        autoHideDuration={6000}
        onClose={() => setDownloadError(null)}
      >
        <Alert severity="error" onClose={() => setDownloadError(null)}>
          {downloadError}
        </Alert>
      </StyledSnackbar>
      <StyledSnackbar
        open={!!sendResultMessage}
        autoHideDuration={10000}
        onClose={() => setSendResultMessage(null)}
      >
        <Alert
          severity={
            sendResultMessage?.includes("failed") ? "warning" : "success"
          }
          onClose={() => setSendResultMessage(null)}
        >
          {sendResultMessage}
        </Alert>
      </StyledSnackbar>
    </Container>
  );
};

export default Header;

const Container = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "0.5rem",
});

const StyledSnackbar = styled(Snackbar)({
  textAlign: "left",
});
