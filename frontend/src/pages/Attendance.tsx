import { PageHeader } from "@/components";
import { FilesTable, FileUpload } from "@/components/Attendance";
import useAttendanceStore from "@/store/useAttendanceStore";
import { Box } from "@mui/material";

const Attendance = () => {
  const { files } = useAttendanceStore();

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}
      >
        <PageHeader
          headerText="Attendance Processing"
          caption="Upload and configure daily attendance spreadsheets for active
            employees. Ensure all fields are verified before processing
            payroll."
        />
        <FileUpload />
        {files.length > 0 && <FilesTable />}
      </Box>
    </>
  );
};

export default Attendance;
