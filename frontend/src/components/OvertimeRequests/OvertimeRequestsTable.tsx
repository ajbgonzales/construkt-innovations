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
import { getOvertimeRequests } from "@/api/overtimeRequests";
import OvertimeRequestsTableHeader from "./OvertimeRequestsTableHeader";
import OvertimeRequestsTableRow from "./OvertimeRequestsTableRow";

const OvertimeRequestsTable = () => {
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  const {
    data: overtimeRequests = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["overtimeRequests"],
    queryFn: getOvertimeRequests,
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
        <OvertimeRequestsTableHeader />
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5}>Loading overtime requests…</TableCell>
            </TableRow>
          )}
          {isError && (
            <TableRow>
              <TableCell colSpan={5}>
                Failed to load overtime requests.
              </TableCell>
            </TableRow>
          )}
          {!isLoading && !isError && overtimeRequests.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} sx={{ textAlign: "center" }}>
                No overtime requests yet.
              </TableCell>
            </TableRow>
          )}
          {overtimeRequests
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((request) => (
              <OvertimeRequestsTableRow
                key={request.id}
                overtimeRequest={request}
              />
            ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              count={overtimeRequests.length}
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

export default OvertimeRequestsTable;
