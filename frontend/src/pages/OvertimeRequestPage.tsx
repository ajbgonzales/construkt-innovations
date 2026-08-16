import { getOvertimeRequest } from "@/api/overtimeRequests";
import { Header, MainContent } from "@/components/OvertimeRequestPage";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";

const OvertimeRequestPage = () => {
  const { id } = useParams();
  const { data } = useQuery({
    queryKey: ["overtimeRequest", id],
    queryFn: () => getOvertimeRequest(id),
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <Link to="/overtime-requests" style={{ alignSelf: "start" }}>
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
            Back To Overtime Requests
          </Typography>
        </Button>
      </Link>
      {data ? (
        <>
          <Header id={data.id} />
          <MainContent overtimeRequest={data} />
        </>
      ) : (
        "Overtime Request not found."
      )}
    </Box>
  );
};

export default OvertimeRequestPage;
