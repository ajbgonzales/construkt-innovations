import useAppStore from "@/store/useAppStore";
import { Box } from "@mui/material";
import { Attendance } from "@/pages";
import { type ReactElement } from "react";

const DRAWER_WIDTH = 240;
const APP_BAR_HEIGHT = 65;

const MainContent = () => {
  const TAB_COMPONENTS: Record<string, ReactElement> = {
    attendance: <Attendance />,
  };

  const { activeTab } = useAppStore();

  return (
    <Box
      component="main"
      sx={{
        backgroundColor: "#F7F9FB",
        flexGrow: 1,
        mt: `${APP_BAR_HEIGHT}px`,
        ml: `${DRAWER_WIDTH}px`,
        p: 3,
      }}
    >
      {TAB_COMPONENTS[activeTab] ?? <Attendance />}
    </Box>
  );
};

export default MainContent;
