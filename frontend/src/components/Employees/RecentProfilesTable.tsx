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
import { type FC, useMemo, useState } from "react";
import { getEmployees } from "@/api/employees";
import RecentProfilesTableHeader from "./RecentProfilesTableHeader";
import RecentProfilesTableRow from "./RecentProfilesTableRow";

interface RecentProfilesTableProps {
  search: string;
}

const RecentProfilesTable: FC<RecentProfilesTableProps> = ({ search }) => {
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [prevSearch, setPrevSearch] = useState<string>(search);

  if (search !== prevSearch) {
    setPrevSearch(search);
    setPage(0);
  }

  const {
    data: employees = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((employee) =>
      [
        employee.fullName,
        employee.employeeId,
        employee.position,
        employee.project,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [employees, search]);

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
        <RecentProfilesTableHeader />
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={4}>Loading employees…</TableCell>
            </TableRow>
          )}
          {isError && (
            <TableRow>
              <TableCell colSpan={4}>Failed to load employees.</TableCell>
            </TableRow>
          )}
          {!isLoading && !isError && filteredEmployees.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} sx={{ textAlign: "center" }}>
                {search
                  ? "No employees match your search."
                  : "No employees yet."}
              </TableCell>
            </TableRow>
          )}
          {filteredEmployees
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((employee) => (
              <RecentProfilesTableRow key={employee.id} employee={employee} />
            ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              count={filteredEmployees.length}
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

export default RecentProfilesTable;
