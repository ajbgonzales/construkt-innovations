import { TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const PayrollsTableHeader = () => {
  return (
    <TableHead>
      <StyledTableRow sx={{ background: "#F3F4F5" }}>
        <TableCell colSpan={3}>
          <Typography
            sx={{
              fontSize: "1.25rem",
              fontWeight: 600,
              fontFamily: "Public Sans",
            }}
          >
            Payroll Periods
          </Typography>
        </TableCell>
      </StyledTableRow>
      <StyledTableRow
        sx={{
          background: "#F8F9FA",
        }}
      >
        <StyledTableCell>Period</StyledTableCell>
        <StyledTableCell>Created</StyledTableCell>
        <StyledTableCell>Actions</StyledTableCell>
      </StyledTableRow>
    </TableHead>
  );
};

export default PayrollsTableHeader;

const StyledTableCell = styled(TableCell)({
  fontFamily: "Public Sans",
  fontWeight: 800,
  textTransform: "uppercase",
});

const StyledTableRow = styled(TableRow)({
  "& .MuiTableCell-root": { borderBottom: "1px solid #DCC1B1" },
});
