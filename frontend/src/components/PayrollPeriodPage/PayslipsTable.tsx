import { type Payslip } from "@/api/payrollGenerator";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Input,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { type FC, useMemo, useState } from "react";
import PayslipsTableRow from "./PayslipsTableRow";
import { sortByProjectThenEmployee } from "./sorting";

interface PayslipsTableProps {
  payslips: Payslip[];
  sendDisabledReason: string | null;
}

const PayslipsTable: FC<PayslipsTableProps> = ({
  payslips,
  sendDisabledReason,
}) => {
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const sortedPayslips = useMemo(
    () => [...payslips].sort(sortByProjectThenEmployee),
    [payslips],
  );

  const filteredPayslips = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedPayslips;
    return sortedPayslips.filter((payslip) =>
      [payslip.employeeFullName, payslip.projectName]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [sortedPayslips, search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handlePageChange = (
    _: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (payslips.length === 0) return null;

  return (
    <TableContainer sx={{ border: "1px solid #DCC1B1" }}>
      <Table>
        <TableHead>
          <StyledTableRow sx={{ background: "#F3F4F5" }}>
            <TableCell colSpan={7}>
              <TitleRow>
                <Typography
                  sx={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    fontFamily: "Public Sans",
                  }}
                >
                  Generated Payslips
                </Typography>
                <StyledInput
                  name="search-generated-payslips-input"
                  placeholder="Search by employee or project"
                  disableUnderline={true}
                  startAdornment={
                    <SearchIcon fontSize="small" sx={{ marginRight: "8px" }} />
                  }
                  onChange={(e) => handleSearchChange(e.target.value)}
                  value={search}
                />
              </TitleRow>
            </TableCell>
          </StyledTableRow>
          <StyledTableRow sx={{ background: "#F8F9FA" }}>
            <StyledTableCell>Employee</StyledTableCell>
            <StyledTableCell>Project</StyledTableCell>
            <StyledTableCell>Net Pay</StyledTableCell>
            <StyledTableCell>Holiday Pay</StyledTableCell>
            <StyledTableCell>Generated</StyledTableCell>
            <StyledTableCell>Sent</StyledTableCell>
            <StyledTableCell>Actions</StyledTableCell>
          </StyledTableRow>
        </TableHead>
        <TableBody>
          {filteredPayslips.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                sx={{ textAlign: "center", fontFamily: "Public Sans" }}
              >
                No payslips match your search.
              </TableCell>
            </TableRow>
          )}
          {filteredPayslips
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((payslip) => (
              <PayslipsTableRow
                key={payslip.id}
                payslip={payslip}
                sendDisabledReason={sendDisabledReason}
              />
            ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              colSpan={7}
              count={filteredPayslips.length}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[10, 25, 50]}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export default PayslipsTable;

const StyledTableCell = styled(TableCell)({
  fontFamily: "Public Sans",
  fontWeight: 800,
  textTransform: "uppercase",
});

const StyledTableRow = styled(TableRow)({
  "& .MuiTableCell-root": { borderBottom: "1px solid #DCC1B1" },
});

const TitleRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
});

const StyledInput = styled(Input)({
  fontFamily: "Public Sans",
  border: "1px solid #DCC1B1",
  background: "#FFF",
  padding: "6px 12px",
  fontSize: "0.875rem",
  width: "280px",
});
