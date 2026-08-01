import { Box, Typography } from "@mui/material";

const Header = () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
      <Typography
        sx={{ fontFamily: "Work Sans", fontSize: "24px", fontWeight: 600 }}
      >
        Employee Directory
      </Typography>
      <Typography sx={{ fontFamily: "Work Sans" }}>
        Manage personnel data, site assignments, and contact information across
        all active projects.
      </Typography>
    </Box>
  );
};

export default Header;
