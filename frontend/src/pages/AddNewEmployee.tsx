import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button, Typography } from "@mui/material";
import { Form, Header } from "@/components/AddNewEmployee";
import { Link } from "react-router";

const AddNewEmployee = () => {
  return (
    <>
      <Box sx={{ display: "flex", marginBottom: "1rem" }}>
        <Link to="/employees" style={{ alignSelf: "start" }}>
          <Button
            variant="text"
            sx={{
              padding: 0,
              "&:hover": {
                background: "none",
              },
            }}
          >
            <ArrowBackIcon sx={{ color: "#944A00" }} />
            <Typography
              sx={{
                color: "#944A00",
                textTransform: "uppercase",
                marginLeft: "0.5rem",
                fontWeight: 600,
              }}
            >
              Back
            </Typography>
          </Button>
        </Link>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <Header />
        <Form />
      </Box>
    </>
  );
};

export default AddNewEmployee;
