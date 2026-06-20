import api from "@/api/base";
import useAttendanceStore, {
  type ProjectMetadata,
} from "@/store/useAttendanceStore";
import { useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import FileRow from "./FileRow";
import { StyledButton } from "./styles";

interface Column {
  id:
    | "projectAndFile"
    | "startTime"
    | "compressed"
    | "overtime"
    | "workingDays"
    | "remove";
  label: string;
  width: string;
  textAlign: string;
}

const COLUMNS: Column[] = [
  {
    id: "projectAndFile",
    label: "Project & File",
    width: "45%",
    textAlign: "left",
  },
  {
    id: "startTime",
    label: "Start Time",
    width: "10%",
    textAlign: "left",
  },
  {
    id: "compressed",
    label: "Compressed Time",
    width: "10%",
    textAlign: "center",
  },
  {
    id: "overtime",
    label: "Overtime",
    width: "10%",
    textAlign: "center",
  },
  {
    id: "workingDays",
    label: "Working Days",
    width: "25%",
    textAlign: "left",
  },
  {
    id: "remove",
    label: "Remove",
    width: "10%",
    textAlign: "center",
  },
];

const FilesTable = () => {
  const { files, values } = useAttendanceStore();

  const { mutate } = useMutation({
    mutationFn: (formData: FormData) =>
      api.post("/process_attendance_records", formData).then((res) => res.data),
    onSuccess: (data) => {
      console.log("success:", data);
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
    <TableContainer>
      <Table sx={{ border: "1px solid #C4C6CD" }}>
        <TableHead>
          <TableRow sx={{ background: "#F2F4F6" }}>
            <TableCell colSpan={6}>
              <Typography sx={{ textTransform: "uppercase" }}>
                Active Project Records
              </Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            {COLUMNS.map((c) => (
              <TableCell
                key={c.id}
                sx={{ width: c.width, textAlign: c.textAlign }}
              >
                <Typography sx={{ textTransform: "uppercase" }}>
                  {c.label}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {files.map((f) => {
            return <FileRow key={f.name} fileName={f.name} />;
          })}
        </TableBody>
        <TableFooter>
          <TableRow sx={{ background: "#F2F4F6" }}>
            <TableCell colSpan={6} align="right">
              <StyledButton
                onClick={handleProcessFiles}
                sx={{ border: "1px solid #F5A623", background: "#F5A623" }}
              >
                Process Files
              </StyledButton>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export default FilesTable;
