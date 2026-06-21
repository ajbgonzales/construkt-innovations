import useAttendanceStore from "@/store/useAttendanceStore";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import {
  Box,
  Checkbox,
  IconButton,
  // InputAdornment,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { type FC } from "react";
import { StyledTableCell } from "./styles";

dayjs.extend(customParseFormat);

interface FileRowProps {
  fileName: string;
}

const FileRow: FC<FileRowProps> = ({ fileName }) => {
  const { values, updateValues, removeFile } = useAttendanceStore();

  // const handleChangeWorkingDays = (
  //   rowId: string,
  //   e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement, Element>,
  // ) => {
  //   const input = e.target.value;
  //   if (
  //     input === "" ||
  //     (/^\d*$/.test(input) && Number(input) >= 1 && Number(input) <= 7)
  //   ) {
  //     updateValues(rowId, "workingDays", input);
  //   }
  // };

  return (
    <TableRow>
      <StyledTableCell align="left" sx={{ maxWidth: "300px" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            maxWidth: "300px",
          }}
        >
          <TextField
            label="Project name"
            variant="outlined"
            required
            value={values[fileName].projectName}
            onChange={(e) =>
              updateValues(fileName, "projectName", e.target.value)
            }
          />
          <Tooltip title={fileName} placement="right">
            <Typography noWrap>{fileName}</Typography>
          </Tooltip>
        </Box>
      </StyledTableCell>
      <StyledTableCell>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <TimePicker
            value={dayjs(values[fileName].startTime, "HH:mm")}
            onChange={(value) =>
              updateValues(
                fileName,
                "startTime",
                value ? value.format("HH:mm") : null,
              )
            }
          />
        </LocalizationProvider>
      </StyledTableCell>
      <StyledTableCell sx={{ textAlign: "center" }}>
        <Checkbox
          value={values[fileName].isCompressed}
          onChange={(e) =>
            updateValues(fileName, "isCompressed", e.target.checked)
          }
        />
      </StyledTableCell>
      <StyledTableCell sx={{ textAlign: "center" }}>
        <Checkbox
          value={values[fileName].isOvertime}
          onChange={(e) =>
            updateValues(fileName, "isOvertime", e.target.checked)
          }
        />
      </StyledTableCell>
      {/* <StyledTableCell>
        <TextField
          variant="outlined"
          value={values[fileName].workingDays}
          onChange={(e) => handleChangeWorkingDays(fileName, e)}
          slotProps={{
            htmlInput: { inputMode: "numeric", pattern: "[0-9]*" },
            input: {
              endAdornment: (
                <InputAdornment position="end">Days per Week</InputAdornment>
              ),
            },
          }}
        />
      </StyledTableCell> */}
      <StyledTableCell sx={{ textAlign: "center" }}>
        <IconButton
          onClick={() => removeFile(fileName)}
          sx={{ color: "#BA1A1A" }}
        >
          <DeleteOutlineOutlinedIcon />
        </IconButton>
      </StyledTableCell>
    </TableRow>
  );
};

export default FileRow;
