import { PageHeader } from "@/components";
import { OvertimeRequestForm } from "@/components/NewOvertimeRequest";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link } from "react-router";

const NewOvertimeRequest = () => {
  return (
    <Container>
      <Link to="/overtime-requests" style={{ alignSelf: "start" }}>
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
      <PageHeader
        headerText="New Overtime Request"
        caption="Submit employee overtime hours for project validation and payroll processing"
      />
      <OvertimeRequestForm />
    </Container>
  );
};

export default NewOvertimeRequest;

const Container = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
});
