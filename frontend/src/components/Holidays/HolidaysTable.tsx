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
import { type FC, useState } from "react";
import { getHolidays, type Holiday } from "@/api/holidays";
import HolidaysTableHeader from "./HolidaysTableHeader";
import HolidaysTableRow from "./HolidaysTableRow";

interface HolidaysTableProps {
  onEdit: (holiday: Holiday) => void;
  onDelete: (holiday: Holiday) => void;
}

const HolidaysTable: FC<HolidaysTableProps> = ({ onEdit, onDelete }) => {
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  const {
    data: holidays = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["holidays"],
    queryFn: getHolidays,
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
        <HolidaysTableHeader />
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={4}>Loading holidays…</TableCell>
            </TableRow>
          )}
          {isError && (
            <TableRow>
              <TableCell colSpan={4}>Failed to load holidays.</TableCell>
            </TableRow>
          )}
          {!isLoading && !isError && holidays.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} sx={{ textAlign: "center" }}>
                No holidays yet.
              </TableCell>
            </TableRow>
          )}
          {holidays
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((holiday) => (
              <HolidaysTableRow
                key={holiday.id}
                holiday={holiday}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              count={holidays.length}
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

export default HolidaysTable;
