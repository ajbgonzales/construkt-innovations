import useAttendanceStore from "@/store/useAttendanceStore";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { type TimeValidationError } from "@mui/x-date-pickers/models";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { type FC, useMemo, useState } from "react";
import { StyledAccordionDetails } from "./styles";

dayjs.extend(customParseFormat);

interface FileRowProps {
  fileName: string;
}

const FileRow: FC<FileRowProps> = ({ fileName }) => {
  const { values, updateValues, removeFile } = useAttendanceStore();
  const [error, setError] = useState<TimeValidationError | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const { projectName } = values[fileName];
  const hasProjectName = projectName.trim() !== "";

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

  const errorMessage = useMemo(() => {
    switch (error) {
      case "maxTime": {
        return "Start Time must be less than End Time";
      }
      default: {
        return "";
      }
    }
  }, [error]);

  return (
    <Accordion
      expanded={isExpanded}
      onChange={(_, isExpanded) => setIsExpanded(isExpanded)}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          <Typography
            sx={{
              color: hasProjectName ? "inherit" : "red",
            }}
          >
            {hasProjectName ? projectName.trim() : "No project name"}
          </Typography>
          <Tooltip title={fileName} placement="right">
            <Typography noWrap>{fileName}</Typography>
          </Tooltip>
          {errorMessage && !isExpanded && (
            <Typography sx={{ color: "red" }}>{errorMessage}</Typography>
          )}
        </Box>
      </AccordionSummary>
      <StyledAccordionDetails>
        <TextField
          label="Project name (required)"
          variant="outlined"
          value={values[fileName].projectName}
          onChange={(e) =>
            updateValues(fileName, "projectName", e.target.value)
          }
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <TimePicker
            label="Start Time"
            value={dayjs(values[fileName].startTime, "HH:mm")}
            maxTime={dayjs(values[fileName].endTime, "HH:mm")}
            onChange={(value) =>
              updateValues(
                fileName,
                "startTime",
                value ? value.format("HH:mm") : null,
              )
            }
            onError={(newError) => setError(newError)}
            slotProps={{
              textField: {
                helperText: errorMessage,
              },
            }}
          />
        </LocalizationProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <TimePicker
            label="Weekday End Time"
            value={dayjs(values[fileName].endTime, "HH:mm")}
            onChange={(value) =>
              updateValues(
                fileName,
                "endTime",
                value ? value.format("HH:mm") : null,
              )
            }
          />
        </LocalizationProvider>
        <FormControlLabel
          label="Include Saturday"
          control={
            <Checkbox
              checked={values[fileName].includeSaturday}
              onChange={(e) =>
                updateValues(fileName, "includeSaturday", e.target.checked)
              }
            />
          }
        />
        {values[fileName].includeSaturday && (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <TimePicker
              label="Saturday End Time"
              value={dayjs(values[fileName].saturdayEndTime, "HH:mm")}
              onChange={(value) =>
                updateValues(
                  fileName,
                  "saturdayEndTime",
                  value ? value.format("HH:mm") : null,
                )
              }
            />
          </LocalizationProvider>
        )}
        {/* <TextField
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
          sx={{ maxWidth: "10rem" }}
        /> */}
        <FormControlLabel
          label="Compressed Time"
          control={
            <Checkbox
              checked={values[fileName].isCompressed}
              onChange={(e) =>
                updateValues(fileName, "isCompressed", e.target.checked)
              }
            />
          }
        />
        <FormControlLabel
          label="Overtime"
          control={
            <Checkbox
              checked={values[fileName].isOvertime}
              onChange={(e) =>
                updateValues(fileName, "isOvertime", e.target.checked)
              }
            />
          }
        />
      </StyledAccordionDetails>
      <AccordionDetails sx={{ display: "flex", justifyContent: "end" }}>
        <Button
          variant="outlined"
          startIcon={<DeleteOutlineOutlinedIcon />}
          onClick={() => removeFile(fileName)}
          sx={{
            color: "#BA1A1A",
            border: "1px solid #BA1A1A",
          }}
        >
          <Typography sx={{ fontWeight: 600 }}>Remove</Typography>
        </Button>
      </AccordionDetails>
    </Accordion>
  );
};

export default FileRow;
