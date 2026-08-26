import { getPayrollPeriod } from "@/api/payrollGenerator";
import { Header, MainContent } from "@/components/PayrollPeriodPage";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";

const PayrollPeriodPage = () => {
  const { id } = useParams();
  const { data } = useQuery({
    queryKey: ["payrollPeriod", id],
    queryFn: () => getPayrollPeriod(id),
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <Link to="/payslip-generator" style={{ alignSelf: "start" }}>
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
            Back To Payroll Periods
          </Typography>
        </Button>
      </Link>
      {data ? (
        <>
          <Header
            id={data.id}
            startDate={data.startDate}
            endDate={data.endDate}
            payrollRecords={data.payrollRecords}
          />
          <MainContent payrollPeriod={data} />
        </>
      ) : (
        "Payroll period not found."
      )}
    </Box>
  );
};

export default PayrollPeriodPage;
