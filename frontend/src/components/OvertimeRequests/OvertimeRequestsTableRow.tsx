import type { OvertimeRequest } from "@/api/overtimeRequests";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Box, Button, TableCell, TableRow, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import dayjs from "dayjs";
import { type FC } from "react";
import { useNavigate } from "react-router";

interface OvertimeRequestsTableRowProps {
  overtimeRequest: OvertimeRequest;
}

const formatTime = (time: string) => dayjs(time, "HH:mm:ss").format("h:mm A");

const OvertimeRequestsTableRow: FC<OvertimeRequestsTableRowProps> = ({
  overtimeRequest,
}) => {
  const navigate = useNavigate();

  return (
    <TableRow>
      <StyledTableCell>{overtimeRequest.projectName}</StyledTableCell>
      <StyledTableCell>
        {dayjs(overtimeRequest.date).format("MMM D, YYYY")}
      </StyledTableCell>
      <StyledTableCell>
        {formatTime(overtimeRequest.startTime)} -{" "}
        {formatTime(overtimeRequest.endTime)}
      </StyledTableCell>
      <StyledTableCell>{overtimeRequest.activities}</StyledTableCell>
      <StyledTableCell>
        <Box sx={{ display: "flex", gap: "0.5rem" }}>
          <Tooltip title="Edit">
            <StyledButton
              onClick={() =>
                navigate(`/overtime-requests/${overtimeRequest.id}/edit`)
              }
            >
              <EditOutlinedIcon />
            </StyledButton>
          </Tooltip>
          <Tooltip title="View">
            <StyledButton
              onClick={() =>
                navigate(`/overtime-requests/${overtimeRequest.id}`)
              }
            >
              <VisibilityOutlinedIcon />
            </StyledButton>
          </Tooltip>
        </Box>
      </StyledTableCell>
    </TableRow>
  );
};

export default OvertimeRequestsTableRow;

const StyledButton = styled(Button)({
  padding: 0,
  margin: 0,
  minWidth: "fit-content",
  color: "rgba(0, 0, 0, 0.87)",
});

const StyledTableCell = styled(TableCell)({
  background: "#FFF",
});
