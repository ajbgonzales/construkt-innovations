import { PageHeader } from "@/components";
import { OvertimeRequestsTable } from "@/components/OvertimeRequests";
import { Box, Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link } from "react-router";

const OvertimeRequests = () => {
  return (
    <Container>
      <PageHeader
        headerText="Overtime Requests"
        caption="Manage overtime requests across all projects."
      />
      <Link to="/overtime-requests/new" style={{ textAlign: "end" }}>
        <Button
          variant="outlined"
          sx={{
            width: "fit-content",
            background: "#E67E22",
            border: "1px solid #E67E22",
            padding: "12px 20px",
            textTransform: "uppercase",
            color: "#FFF",
            fontWeight: 600,
          }}
        >
          Create New Overtime Request
        </Button>
      </Link>
      <OvertimeRequestsTable />
    </Container>
  );
};

export default OvertimeRequests;

const Container = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
});
