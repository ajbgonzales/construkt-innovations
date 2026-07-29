import { Box, Typography } from "@mui/material";
import ImportEmployeesButton from "./ImportEmployeesButton";

const Header = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
        <Typography
          sx={{ fontFamily: "Work Sans", fontSize: "24px", fontWeight: 600 }}
        >
          New Employee Registration
        </Typography>
        <Typography sx={{ fontFamily: "Work Sans" }}>
          Onboard a new employee to the active site management system.
        </Typography>
      </Box>
      <ImportEmployeesButton />
    </Box>
  );
};

export default Header;
