import { FilesTable, FileUpload } from "@/components/Attendance";
import useAttendanceStore from "@/store/useAttendanceStore";
import { Box, Typography } from "@mui/material";

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
        <Box sx={{ textAlign: "left" }}>
          <Typography sx={{ color: "#041627", marginBottom: "8px" }}>
            Attendance Processing
          </Typography>
          <Typography sx={{ color: "#44474C" }}>
            Upload and configure daily attendance spreadsheets for active
            construction sites. Ensure all fields are verified before processing
            payroll.
          </Typography>
        </Box>
        <FileUpload />
        {files.length > 0 && <FilesTable />}
      </Box>
    </>
  );
};

export default Attendance;
