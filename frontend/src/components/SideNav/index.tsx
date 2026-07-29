import AppLogo from "@/assets/app-logo.svg?react";
import AppName from "@/assets/app-name.svg?react";
import PeopleIcon from "@mui/icons-material/People";
import PunchClockIcon from "@mui/icons-material/PunchClock";
import { Box, Drawer, Tabs } from "@mui/material";
import { useLocation, useNavigate } from "react-router";
import { StyledTab } from "./styles";

const DRAWER_WIDTH = 240;
const APP_BAR_HEIGHT = 65;

const SideNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = location.pathname.startsWith("/employees")
    ? "employees"
    : "attendance";

  const handleChange = (
    _event: React.SyntheticEvent,
    newValue: "attendance" | "employees",
  ) => {
    navigate(newValue === "attendance" ? "/" : "/employees");
  };

  return (
    <Drawer
      anchor="left"
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          padding: "24px 24px 16.5px",
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          top: APP_BAR_HEIGHT,
          height: `calc(100% - ${APP_BAR_HEIGHT}px)`,
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-around" }}>
        <AppLogo />
        <AppName />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          marginTop: "30px",
          alignItems: "flex-start",
        }}
      >
        <Tabs
          orientation="vertical"
          value={activeTab}
          onChange={handleChange}
          sx={{ width: "100%" }}
        >
          <StyledTab
            icon={<PunchClockIcon />}
            iconPosition="start"
            label="Attendance"
            value="attendance"
          />
          <StyledTab
            icon={<PeopleIcon />}
            iconPosition="start"
            label="Employees"
            value="employees"
          />
        </Tabs>
      </Box>
    </Drawer>
  );
};

export default SideNav;
