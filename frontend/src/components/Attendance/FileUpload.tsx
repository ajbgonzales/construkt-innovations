import useAttendanceStore from "@/store/useAttendanceStore";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import { Box, Button, Typography } from "@mui/material";
import { useDropzone } from "react-dropzone";

const FileUpload = () => {
  const { setFiles } = useAttendanceStore();

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles);
    },
  });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <Box
        sx={{
          backgroundColor: "#FFF",
          padding: "48.5px 32px",
          border: "1px solid #C4C6CD",
        }}
      >
        <CloudUploadOutlinedIcon
          sx={{
            color: "#855300",
            padding: "20px 15.5px",
            height: "96px",
            width: "96px",
            background: "#ECEEF0",
            border: "1px solid #ECEEF0",
            borderRadius: "12px",
          }}
        />
        <Typography sx={{ color: "#041627" }}>
          Upload Attendance Sheet
        </Typography>
        <Typography sx={{ color: "#44474C" }}>
          Drag and drop your .xls, .xlsx, or .csv files here to start processing
        </Typography>
        <Button
          sx={{ color: "#2A1700", background: "#FEA619", marginTop: "1.5em" }}
        >
          Select files from computer
        </Button>
      </Box>
    </div>
  );
};

export default FileUpload;
