import {
  generatePayslips,
  getPayslips,
  sendPayslips,
  type PayrollPeriodDetail,
  type SendPayslipsResult,
} from "@/api/payrollGenerator";
import {
  countStalePayslips,
  getSendDisabledReason,
} from "@/utils/payslipStaleness";
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
import { type FC, useState } from "react";
import PayrollRecordsTable from "./PayrollRecordsTable";
import PayslipsTable from "./PayslipsTable";
import SendPayslipsModal from "./SendPayslipsModal";

interface MainContentProps {
  payrollPeriod: PayrollPeriodDetail;
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

const MainContent: FC<MainContentProps> = ({ payrollPeriod }) => {
  const queryClient = useQueryClient();
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendResultMessage, setSendResultMessage] = useState<string | null>(
    null,
  );
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  const { data: payslips = [] } = useQuery({
    queryKey: ["payslips", payrollPeriod.id],
    queryFn: () => getPayslips(payrollPeriod.id),
  });

  const stalePayslipCount = countStalePayslips(
    payslips,
    payrollPeriod.payrollRecords,
  );
  const sendDisabledReason = getSendDisabledReason(
    payslips,
    payrollPeriod.payrollRecords,
  );

  const { mutate: handleGenerate, isPending: isGenerating } = useMutation({
    mutationFn: () => generatePayslips(payrollPeriod.id),
    onSuccess: () => {
      setGenerateError(null);
      queryClient.invalidateQueries({
        queryKey: ["payslips", payrollPeriod.id],
      });
    },
    onError: () => {
      setGenerateError("Failed to generate payslips. Please try again.");
    },
  });

  const { mutate: handleSend, isPending: isSending } = useMutation({
    mutationFn: () => sendPayslips(payrollPeriod.id),
    onSuccess: (result) => {
      setSendError(null);
      setIsSendModalOpen(false);
      setSendResultMessage(formatSendResult(result));
      queryClient.invalidateQueries({
        queryKey: ["payslips", payrollPeriod.id],
      });
    },
    onError: () => {
      setSendError("Failed to send payslips. Please try again.");
    },
  });

  return (
    <Container>
      {stalePayslipCount > 0 && (
        <Alert severity="warning">
          Payroll records for this period have been updated. Review the records
          and click Generate Payslips to refresh them with the latest numbers
          before sending.
        </Alert>
      )}
      <PayrollRecordsTable payrollRecords={payrollPeriod.payrollRecords} />
      <ActionsRow>
        {generateError && (
          <Typography sx={{ color: "red", fontSize: "0.875rem" }}>
            {generateError}
          </Typography>
        )}
        <ButtonsBox>
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
        </ButtonsBox>
      </ActionsRow>
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
      <PayslipsTable
        payslips={payslips}
        sendDisabledReason={sendDisabledReason}
      />
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

export default MainContent;

const Container = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
  textAlign: "left",
});

const ActionsRow = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "0.5rem",
});

const ButtonsBox = styled(Box)({
  display: "flex",
  gap: "0.5rem",
  marginLeft: "auto",
});

const StyledSnackbar = styled(Snackbar)({
  textAlign: "left",
});
