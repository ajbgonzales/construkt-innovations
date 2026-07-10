import api from "@/api/base";
import useAttendanceStore, {
  type ProjectMetadata,
} from "@/store/useAttendanceStore";
import { useMutation } from "@tanstack/react-query";
import { Box, Typography } from "@mui/material";
import FileRow from "./FileRow";
import { StyledButton } from "./styles";

const FilesTable = () => {
  const { files, values } = useAttendanceStore();

  const isProcessFilesDisabled = () => {
    return Object.values(values).some((v) => {
      const isEndAfterStart = v.endTime > v.startTime;
      return v.projectName.trim() === "" || !isEndAfterStart;
    });
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (formData: FormData) =>
      api.post("/process_attendance_records", formData, {
        responseType: "blob",
      }),
    onSuccess: (res) => {
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;

      const contentDisposition = res.headers["content-disposition"];
      const match = contentDisposition?.match(/filename="?([^"]+)"?/);
      a.download = match?.[1] ?? "Daily Payroll.xlsx";

      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (error) => {
      console.error("failed:", error);
    },
  });

  const handleProcessFiles = () => {
    const formData = new FormData();
    const projectsMetadata: { [key: string]: ProjectMetadata } = {};

    files.forEach((f) => {
      const projectMetadata = values[f.name];

      formData.append("files", f);
      projectsMetadata[f.name] = { ...projectMetadata };
    });
    formData.append("projects_metadata", JSON.stringify(projectsMetadata));
    mutate(formData);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid #C4C6CD",
        background: "#F2F4F6",
      }}
    >
      <Typography
        sx={{
          padding: "1rem",
          alignSelf: "start",
          textTransform: "uppercase",
        }}
      >
        Active Project Records
      </Typography>
      <Box>
        {files.map((f) => {
          return <FileRow key={f.name} fileName={f.name} />;
        })}
      </Box>
      <StyledButton
        disabled={isProcessFilesDisabled() || isPending}
        onClick={handleProcessFiles}
      >
        {isPending ? "Processing..." : "Process Files"}
      </StyledButton>
    </Box>
  );
};

export default FilesTable;
