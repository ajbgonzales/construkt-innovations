import AppLogo from "@/assets/app-logo.svg?react";
import AppName from "@/assets/app-name.svg?react";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import MoreTimeIcon from "@mui/icons-material/MoreTime";
import PeopleIcon from "@mui/icons-material/People";
import PunchClockIcon from "@mui/icons-material/PunchClock";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { Box, Drawer, Tab, Tabs } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router";

const DRAWER_WIDTH = 240;
const APP_BAR_HEIGHT = 65;

const SideNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = location.pathname.startsWith("/employees")
    ? "employees"
    : location.pathname.startsWith("/overtime-requests")
      ? "overtimeRequest"
      : location.pathname.startsWith("/payslip-generator") ||
          location.pathname.startsWith("/payroll-periods")
        ? "payslipGenerator"
        : location.pathname.startsWith("/holidays")
          ? "holidays"
          : "attendance";

  const handleChange = (
    _event: React.SyntheticEvent,
    newValue:
      | "attendance"
      | "employees"
      | "overtimeRequest"
      | "payslipGenerator"
      | "holidays",
  ) => {
    navigate(
      newValue === "attendance"
        ? "/"
        : newValue === "employees"
          ? "/employees"
          : newValue === "payslipGenerator"
            ? "/payslip-generator"
            : newValue === "holidays"
              ? "/holidays"
              : "/overtime-requests",
    );
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
          <StyledTab
            icon={<MoreTimeIcon />}
            iconPosition="start"
            label="Overtime Request"
            value="overtimeRequest"
          />
          <StyledTab
            icon={<ReceiptIcon />}
            iconPosition="start"
            label="Payslip Generator"
            value="payslipGenerator"
          />
          <StyledTab
            icon={<BeachAccessIcon />}
            iconPosition="start"
            label="Holidays"
            value="holidays"
          />
        </Tabs>
      </Box>
    </Drawer>
  );
};

export default SideNav;

const StyledTab = styled(Tab)({
  color: "#64748b",
  textTransform: "uppercase",
  justifyContent: "left",
  textAlign: "left",
  "&.Mui-selected": {
    color: "#EA580C",
  },
});
