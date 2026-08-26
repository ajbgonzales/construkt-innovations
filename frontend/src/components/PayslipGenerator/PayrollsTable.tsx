import { getPayrollPeriods } from "@/api/payrollGenerator";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TablePagination,
  TableRow,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import PayrollsTableHeader from "./PayrollsTableHeader";
import PayrollsTableRow from "./PayrollsTableRow";

const PayrollsTable = () => {
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  const {
    data: payrollPeriods = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["payrollPeriods"],
    queryFn: getPayrollPeriods,
  });

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
        <PayrollsTableHeader />
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={3}>Loading payroll periods…</TableCell>
            </TableRow>
          )}
          {isError && (
            <TableRow>
              <TableCell colSpan={3}>
                Failed to load payroll periods.
              </TableCell>
            </TableRow>
          )}
          {!isLoading && !isError && payrollPeriods.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} sx={{ textAlign: "center" }}>
                No payroll periods yet.
              </TableCell>
            </TableRow>
          )}
          {payrollPeriods
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((payrollPeriod) => (
              <PayrollsTableRow
                key={payrollPeriod.id}
                payrollPeriod={payrollPeriod}
              />
            ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              count={payrollPeriods.length}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export default PayrollsTable;
