import HelpOutlinedIcon from "@mui/icons-material/HelpOutlined";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import { AppBar, Box, Toolbar } from "@mui/material";
import CompanyLogo from "@/assets/company-logo.svg?react";

const MainHeader = () => {
  return (
    <Box>
      <AppBar
        elevation={0}
        position="fixed"
        sx={{
          background: "#fff",
          borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            display: "flex",
            justifyContent: "space-between",
            paddingX: "24px",
          }}
        >
          <CompanyLogo width="210px" />
          <Box sx={{ display: "flex", gap: "16px" }}>
            <NotificationsOutlined />
            <HelpOutlinedIcon />
            <PersonOutlinedIcon />
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default MainHeader;
