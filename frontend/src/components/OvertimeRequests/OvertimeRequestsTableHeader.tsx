import { TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const OvertimeRequestsTableHeader = () => {
  return (
    <TableHead>
      <StyledTableRow sx={{ background: "#F3F4F5" }}>
        <TableCell colSpan={5}>
          <Typography
            sx={{
              fontSize: "1.25rem",
              fontWeight: 600,
              fontFamily: "Work Sans",
            }}
          >
            Recent Overtime Requests
          </Typography>
        </TableCell>
      </StyledTableRow>
      <StyledTableRow
        sx={{
          background: "#F8F9FA",
        }}
      >
        <StyledTableCell>Project</StyledTableCell>
        <StyledTableCell>Date of Overtime</StyledTableCell>
        <StyledTableCell>Duration of Overtime</StyledTableCell>
        <StyledTableCell>Activities</StyledTableCell>
        <StyledTableCell>Actions</StyledTableCell>
      </StyledTableRow>
    </TableHead>
  );
};

export default OvertimeRequestsTableHeader;

const StyledTableCell = styled(TableCell)({
  fontFamily: "Work Sans",
  fontWeight: 800,
  textTransform: "uppercase",
});

const StyledTableRow = styled(TableRow)({
  "& .MuiTableCell-root": { borderBottom: "1px solid #DCC1B1" },
});
