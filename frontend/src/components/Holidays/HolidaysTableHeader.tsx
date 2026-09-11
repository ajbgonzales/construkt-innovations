import { TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const HolidaysTableHeader = () => {
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
            Holidays
          </Typography>
        </TableCell>
      </StyledTableRow>
      <StyledTableRow
        sx={{
          background: "#F8F9FA",
        }}
      >
        <StyledTableCell>Date</StyledTableCell>
        <StyledTableCell>Name</StyledTableCell>
        <StyledTableCell>Type</StyledTableCell>
        <StyledTableCell>Actions</StyledTableCell>
      </StyledTableRow>
    </TableHead>
  );
};

export default HolidaysTableHeader;

const StyledTableCell = styled(TableCell)({
  fontFamily: "Public Sans",
  fontWeight: 800,
  textTransform: "uppercase",
});

const StyledTableRow = styled(TableRow)({
  "& .MuiTableCell-root": { borderBottom: "1px solid #DCC1B1" },
});
