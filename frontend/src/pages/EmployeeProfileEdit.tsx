import { getEmployee } from "@/api/employees";
import { MainContent } from "@/components/EmployeeProfileEdit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";

const EmployeeProfileEdit = () => {
  const { id } = useParams();
  const { data } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => getEmployee(id),
  });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      <Link
        to={data ? `/employees/${id}` : "/employees"}
        style={{ alignSelf: "start" }}
      >
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
            Back to {data ? "Profile" : "Employees"}
          </Typography>
        </Button>
      </Link>
      {data ? (
        <MainContent employee={data} />
      ) : (
        "Employee not found."
      )}
    </Box>
  );
};

export default EmployeeProfileEdit;
