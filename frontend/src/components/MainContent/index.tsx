import { Box } from "@mui/material";
import AppRoutes from "@/routes";

const DRAWER_WIDTH = 240;
const APP_BAR_HEIGHT = 65;

const MainContent = () => {
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
      <AppRoutes />
    </Box>
  );
};

export default MainContent;
