import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: "Public Sans",
  },
  components: {
    MuiTabs: {
      styleOverrides: {
        indicator: {
          background: "#EA580C",
        },
      },
    },
  },
});

export default theme;
