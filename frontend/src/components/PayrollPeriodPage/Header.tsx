import { downloadPayrollSpreadsheet } from "@/api/payrollGenerator";
import { downloadBlobResponse } from "@/utils/downloadBlob";
import { Alert, Box, Button, Snackbar, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { type FC, useState } from "react";

interface HeaderProps {
  id: string;
  startDate: string;
  endDate: string;
}

const Header: FC<HeaderProps> = ({ id, startDate, endDate }) => {
  const [downloadError, setDownloadError] = useState<string | null>(null);

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

  return (
    <Container>
      <Typography
        sx={{ fontFamily: "Public Sans", fontSize: "24px", fontWeight: 600 }}
      >
        {dayjs(startDate).format("MMM D, YYYY")} -{" "}
        {dayjs(endDate).format("MMM D, YYYY")}
      </Typography>
      <Button
        variant="outlined"
        sx={{ color: "#E67E22", border: "1px solid #E67E22" }}
        disabled={isDownloading}
        onClick={() => handleDownload()}
      >
        {isDownloading ? "Downloading…" : "Download Payroll"}
      </Button>
      <StyledSnackbar
        open={!!downloadError}
        autoHideDuration={6000}
        onClose={() => setDownloadError(null)}
      >
        <Alert severity="error" onClose={() => setDownloadError(null)}>
          {downloadError}
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
