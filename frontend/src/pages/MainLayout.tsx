import { Box } from "@mui/material";
import { MainContent, MainHeader, SideNav } from "@/components";

const MainLayout = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <MainHeader />
      <SideNav />
      <MainContent />
    </Box>
  );
};

export default MainLayout;
