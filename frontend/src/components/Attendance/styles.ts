import { AccordionDetails, Button, TableCell } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledAccordionDetails = styled(AccordionDetails)({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))",
  gap: "1rem",
});

export const StyledButton = styled(Button)({
  borderRadius: "2px",
  color: "#2A1700",
  border: "1px solid #F5A623",
  background: "#F5A623",
  marginTop: "1rem",
  marginBottom: "1rem",
  width: "fit-content",
  alignSelf: "end",
});

export const StyledTableCell = styled(TableCell)({
  verticalAlign: "top",
});
