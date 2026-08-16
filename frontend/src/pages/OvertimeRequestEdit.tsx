import { getOvertimeRequest } from "@/api/overtimeRequests";
import { MainContent } from "@/components/OvertimeRequestEdit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";

const OvertimeRequestEdit = () => {
  const { id } = useParams();
  const { data } = useQuery({
    queryKey: ["overtimeRequest", id],
    queryFn: () => getOvertimeRequest(id),
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
        to={data ? `/overtime-requests/${id}` : "/overtime-requests"}
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
            Back to {data ? "Overtime Request" : "Overtime Requests"}
          </Typography>
        </Button>
      </Link>
      {data ? (
        <MainContent overtimeRequest={data} />
      ) : (
        "Overtime Request not found."
      )}
    </Box>
  );
};

export default OvertimeRequestEdit;
