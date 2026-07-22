import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import SearchIcon from "@mui/icons-material/Search";
import { Box, Button, Input } from "@mui/material";
import { styled } from "@mui/material/styles";
import { type FC } from "react";
import { useNavigate } from "react-router";

interface ActionsContainerProps {
  search: string;
  onSearchChange: (search: string) => void;
}

const ActionsContainer: FC<ActionsContainerProps> = ({
  search,
  onSearchChange,
}) => {
  const navigate = useNavigate();

  return (
    <StyledContainer>
      <StyledInput
        name="search-employee-input"
        placeholder="Search for an existing employee profile"
        disableUnderline={true}
        startAdornment={<SearchIcon sx={{ marginRight: "15px" }} />}
        onChange={(e) => onSearchChange(e.target.value)}
        value={search}
      />
      <StyledButton
        startIcon={<PersonAddAltIcon />}
        onClick={() => navigate("/employees/new")}
      >
        Add New Employee
      </StyledButton>
    </StyledContainer>
  );
};

export default ActionsContainer;

const StyledButton = styled(Button)({
  width: "fit-content",
  background: "#E67E22",
  padding: "12px 20px",
  textTransform: "uppercase",
  color: "#FFF",
  fontWeight: 600,
});

const StyledContainer = styled(Box)({
  display: "flex",
  gap: "16px",
  padding: "24px",
  background: "#FFF",
  border: "1px solid #DCC1B1",
});

const StyledInput = styled(Input)({
  flexGrow: 1,
  border: "1px solid #DCC1B1",
  background: "#F8F9FA",
  padding: "12px 20px",
});
