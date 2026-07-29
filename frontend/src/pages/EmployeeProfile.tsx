import { getEmployee } from "@/api/employees";
import { Header, MainContent } from "@/components/EmployeeProfile";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";

const EmployeeProfile = () => {
  const { id } = useParams();
  const { data } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => getEmployee(id),
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <Link to="/employees" style={{ alignSelf: "start" }}>
        <Button
          variant="text"
          sx={{
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
            Back To Employees
          </Typography>
        </Button>
      </Link>
      {data ? (
        <>
          <Header id={data.id} employeeName={data.fullName} />
          <MainContent employee={data} />{" "}
        </>
      ) : (
        "Employee not found."
      )}
    </Box>
  );
};

export default EmployeeProfile;
