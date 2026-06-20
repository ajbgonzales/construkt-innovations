import AppLogo from "@/assets/app-logo.svg?react";
import AppName from "@/assets/app-name.svg?react";
import useAppStore from "@/store/useAppStore";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import PunchClockIcon from "@mui/icons-material/PunchClock";
import { Box, Drawer, Tabs } from "@mui/material";
import { StyledTab } from "./styles";

const DRAWER_WIDTH = 240;
const APP_BAR_HEIGHT = 65;

const SideNav = () => {
  const { activeTab, setActiveTab } = useAppStore();

  const handleChange = (
    _event: React.SyntheticEvent,
    newValue: "dashboard" | "employees" | "attendance" | "reports",
  ) => {
    setActiveTab(newValue);
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
        <Tabs orientation="vertical" value={activeTab} onChange={handleChange}>
          <StyledTab
            icon={<DashboardIcon />}
            iconPosition="start"
            label="Dashboard"
            value="dashboard"
          />
          <StyledTab
            icon={<PeopleAltIcon />}
            iconPosition="start"
            label="Employees"
            value="employees"
          />
          <StyledTab
            icon={<PunchClockIcon />}
            iconPosition="start"
            label="Attendance"
            value="attendance"
          />
          <StyledTab
            icon={<AssessmentIcon />}
            iconPosition="start"
            label="Reports"
            value="reports"
          />
        </Tabs>
      </Box>
    </Drawer>
  );
};

export default SideNav;
