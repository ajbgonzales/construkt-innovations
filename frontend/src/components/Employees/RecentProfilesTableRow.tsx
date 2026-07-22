import { TableCell, TableRow } from "@mui/material";
import { styled } from "@mui/material/styles";
import { type FC } from "react";
import type { Employee } from "@/api/employees";

interface RecentProfilesTableRowProps {
  employee: Employee;
}

const RecentProfilesTableRow: FC<RecentProfilesTableRowProps> = ({
  employee,
}) => {
  return (
    <TableRow>
      <StyledTableCell>{employee.fullName}</StyledTableCell>
      <StyledTableCell>{employee.employeeId}</StyledTableCell>
      <StyledTableCell>{employee.position}</StyledTableCell>
      <StyledTableCell>{employee.project}</StyledTableCell>
    </TableRow>
  );
};

export default RecentProfilesTableRow;

const StyledTableCell = styled(TableCell)({
  fontFamily: "Work Sans",
  background: "#FFF",
});
