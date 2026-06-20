import { Tab } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledTab = styled(Tab)({
  color: "#64748b",
  textTransform: "uppercase",
  justifyContent: "left",
  "&.Mui-selected": {
    color: "#EA580C",
  },
});
