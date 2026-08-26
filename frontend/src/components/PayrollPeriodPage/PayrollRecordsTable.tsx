import { type PayrollRecord } from "@/api/payrollGenerator";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Chip,
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
import { sortByProjectThenEmployee } from "./sorting";

interface PayrollRecordsTableProps {
  payrollRecords: PayrollRecord[];
}

const formatCurrency = (value: number) =>
  `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const PayrollRecordsTable: FC<PayrollRecordsTableProps> = ({
  payrollRecords,
}) => {
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const sortedRecords = useMemo(
    () => [...payrollRecords].sort(sortByProjectThenEmployee),
    [payrollRecords],
  );

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedRecords;
    return sortedRecords.filter((record) =>
      [record.employeeFullName, record.projectName]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [sortedRecords, search]);

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
                  Payroll Records
                </Typography>
                <StyledInput
                  name="search-payroll-records-input"
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
            <StyledHeaderCell>Employee</StyledHeaderCell>
            <StyledHeaderCell>Project</StyledHeaderCell>
            <StyledHeaderCell>Hours</StyledHeaderCell>
            <StyledHeaderCell>Overtime</StyledHeaderCell>
            <StyledHeaderCell>Gross</StyledHeaderCell>
            <StyledHeaderCell>Net</StyledHeaderCell>
            <StyledHeaderCell>Status</StyledHeaderCell>
          </StyledTableRow>
        </TableHead>
        <TableBody>
          {filteredRecords.length === 0 && (
            <TableRow>
              <StyledTableCell colSpan={7} sx={{ textAlign: "center" }}>
                {search
                  ? "No payroll records match your search."
                  : "No payroll records for this period."}
              </StyledTableCell>
            </TableRow>
          )}
          {filteredRecords
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((record) => (
              <TableRow key={record.id}>
                <StyledTableCell>{record.employeeFullName}</StyledTableCell>
                <StyledTableCell>{record.projectName}</StyledTableCell>
                <StyledTableCell>{record.totalWorkHours}</StyledTableCell>
                <StyledTableCell>{record.overtimeHours}</StyledTableCell>
                <StyledTableCell>
                  {formatCurrency(record.grossAmount)}
                </StyledTableCell>
                <StyledTableCell>
                  {formatCurrency(record.netAmount)}
                </StyledTableCell>
                <StyledTableCell>
                  {record.isFlagged ? (
                    <Chip label="Flagged" color="warning" size="small" />
                  ) : (
                    <Chip label="OK" color="success" size="small" />
                  )}
                </StyledTableCell>
              </TableRow>
            ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              colSpan={7}
              count={filteredRecords.length}
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

export default PayrollRecordsTable;

const StyledTableCell = styled(TableCell)({
  fontFamily: "Public Sans",
  background: "#FFF",
});

const StyledHeaderCell = styled(TableCell)({
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
