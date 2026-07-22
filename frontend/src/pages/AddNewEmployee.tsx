import { Box } from "@mui/material";
import { Form, Header } from "@/components/AddNewEmployee";

const AddNewEmployee = () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <Header />
      <Form />
    </Box>
  );
};

export default AddNewEmployee;
