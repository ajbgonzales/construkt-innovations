import {
  downloadPayrollSpreadsheet,
  type PayrollPeriod,
} from "@/api/payrollGenerator";
import { downloadBlobResponse } from "@/utils/downloadBlob";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Box,
  Button,
  Snackbar,
  TableCell,
  TableRow,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { type FC, useState } from "react";
import { useNavigate } from "react-router";

interface PayrollsTableRowProps {
  payrollPeriod: PayrollPeriod;
}

const PayrollsTableRow: FC<PayrollsTableRowProps> = ({ payrollPeriod }) => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutate: handleDownload, isPending: isDownloading } = useMutation({
    mutationFn: () => downloadPayrollSpreadsheet(payrollPeriod.id),
    onSuccess: (response) =>
      downloadBlobResponse(response, "Daily Payroll.xlsx"),
    onError: () => {
      setErrorMessage(
        "Failed to download spreadsheet. Process attendance files for this period first.",
      );
    },
  });

  return (
    <TableRow>
      <StyledTableCell>
        {dayjs(payrollPeriod.startDate).format("MMM D, YYYY")} -{" "}
        {dayjs(payrollPeriod.endDate).format("MMM D, YYYY")}
      </StyledTableCell>
      <StyledTableCell>
        {dayjs(payrollPeriod.createdAt).format("MMM D, YYYY")}
      </StyledTableCell>
      <StyledTableCell>
        <Box sx={{ display: "flex", gap: "0.5rem" }}>
          <Tooltip title="View">
            <StyledButton
              onClick={() => navigate(`/payroll-periods/${payrollPeriod.id}`)}
            >
              <VisibilityOutlinedIcon />
            </StyledButton>
          </Tooltip>
          <Tooltip title="Download Payroll">
            <StyledButton
              disabled={isDownloading}
              onClick={() => handleDownload()}
            >
              <DownloadOutlinedIcon />
            </StyledButton>
          </Tooltip>
        </Box>
        <Snackbar
          open={!!errorMessage}
          autoHideDuration={6000}
          onClose={() => setErrorMessage(null)}
        >
          <Alert severity="error" onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        </Snackbar>
      </StyledTableCell>
    </TableRow>
  );
};

export default PayrollsTableRow;

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
