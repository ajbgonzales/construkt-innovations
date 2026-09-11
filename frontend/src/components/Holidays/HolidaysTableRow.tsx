import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, Button, TableCell, TableRow, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import dayjs from "dayjs";
import { type FC } from "react";
import { HOLIDAY_TYPE_LABELS, type Holiday } from "@/api/holidays";

interface HolidaysTableRowProps {
  holiday: Holiday;
  onEdit: (holiday: Holiday) => void;
  onDelete: (holiday: Holiday) => void;
}

const HolidaysTableRow: FC<HolidaysTableRowProps> = ({
  holiday,
  onEdit,
  onDelete,
}) => {
  return (
    <TableRow>
      <StyledTableCell>
        {dayjs(holiday.date).format("MMM D, YYYY")}
      </StyledTableCell>
      <StyledTableCell>{holiday.name}</StyledTableCell>
      <StyledTableCell>{HOLIDAY_TYPE_LABELS[holiday.type]}</StyledTableCell>
      <StyledTableCell>
        <Box sx={{ display: "flex", gap: "0.5rem" }}>
          <Tooltip title="Edit">
            <StyledButton onClick={() => onEdit(holiday)}>
              <EditOutlinedIcon />
            </StyledButton>
          </Tooltip>
          <Tooltip title="Delete">
            <StyledButton onClick={() => onDelete(holiday)}>
              <DeleteOutlinedIcon />
            </StyledButton>
          </Tooltip>
        </Box>
      </StyledTableCell>
    </TableRow>
  );
};

export default HolidaysTableRow;

const StyledButton = styled(Button)({
  padding: 0,
  margin: 0,
  minWidth: "fit-content",
  color: "rgba(0, 0, 0, 0.87)",
});

const StyledTableCell = styled(TableCell)({
  background: "#FFF",
});
