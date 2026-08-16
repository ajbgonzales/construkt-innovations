import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItem,
  Snackbar,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useRef, useState, type ChangeEvent } from "react";
import { importEmployees, type EmployeeImportSummary } from "@/api/employees";

const ImportEmployeesButton = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<EmployeeImportSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await importEmployees(file);
      setSummary(result);
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
    } catch (error) {
      const detail = isAxiosError(error)
        ? (error.response?.data?.detail as string | undefined)
        : undefined;
      setErrorMessage(
        detail ??
          "Failed to import file. Please check the format and try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box sx={{ alignSelf: "end" }}>
      <Button
        variant="outlined"
        startIcon={
          isUploading ? <CircularProgress size={16} /> : <UploadFileIcon />
        }
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          background: "#FFF",
          border: "1px solid #E67E22",
          color: "#E67E22",
        }}
      >
        Import from File
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        hidden
        onChange={handleFileChange}
      />
      <Snackbar
        open={!!summary}
        autoHideDuration={8000}
        onClose={() => setSummary(null)}
      >
        <Alert
          severity={
            summary && summary.failed.length > 0 ? "warning" : "success"
          }
          onClose={() => setSummary(null)}
        >
          {summary && (
            <>
              {summary.created} employee{summary.created === 1 ? "" : "s"}{" "}
              imported.
              {summary.failed.length > 0 && (
                <List dense>
                  {summary.failed.map((failure) => (
                    <ListItem key={failure.row} disableGutters>
                      Row {failure.row}: {failure.reason}
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
      >
        <Alert severity="error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ImportEmployeesButton;
