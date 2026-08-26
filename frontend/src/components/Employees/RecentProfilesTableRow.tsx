import type { Employee } from "@/api/employees";
import { TableCell, TableRow } from "@mui/material";
import { styled } from "@mui/material/styles";
import { type FC } from "react";
import { Link } from "react-router";

interface RecentProfilesTableRowProps {
  employee: Employee;
}

const RecentProfilesTableRow: FC<RecentProfilesTableRowProps> = ({
  employee,
}) => {
  return (
    <TableRow>
      <StyledTableCell>
        <StyledLink to={`/employees/${employee.id}`}>
          {employee.fullName}
        </StyledLink>
      </StyledTableCell>
      <StyledTableCell>{employee.employeeId}</StyledTableCell>
      <StyledTableCell>{employee.position}</StyledTableCell>
      <StyledTableCell>{employee.project}</StyledTableCell>
    </TableRow>
  );
};

export default RecentProfilesTableRow;

const StyledLink = styled(Link)({
  color: "#191C1D",
  fontWeight: "600",
  textDecoration: "none",
  "&:visited, &:hover, &:active, &:focus": {
    color: "#191C1D",
    fontWeight: "600",
  },
});

const StyledTableCell = styled(TableCell)({
  fontFamily: "Public Sans",
  background: "#FFF",
});
