import { TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const RecentProfilesTableHeader = () => {
  return (
    <TableHead>
      <StyledTableRow sx={{ background: "#F3F4F5" }}>
        <TableCell colSpan={4}>
          <Typography
            sx={{
              fontSize: "1.25rem",
              fontWeight: 600,
              fontFamily: "Public Sans",
            }}
          >
            Recent Employee Profiles
          </Typography>
        </TableCell>
      </StyledTableRow>
      <StyledTableRow
        sx={{
          background: "#F8F9FA",
        }}
      >
        <StyledTableCell>Full Name</StyledTableCell>
        <StyledTableCell>Employee ID</StyledTableCell>
        <StyledTableCell>Position</StyledTableCell>
        <StyledTableCell>Project</StyledTableCell>
      </StyledTableRow>
    </TableHead>
  );
};

export default RecentProfilesTableHeader;

const StyledTableCell = styled(TableCell)({
  fontFamily: "Public Sans",
  fontWeight: 800,
  textTransform: "uppercase",
});

const StyledTableRow = styled(TableRow)({
  "& .MuiTableCell-root": { borderBottom: "1px solid #DCC1B1" },
});
