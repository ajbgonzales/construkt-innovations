import { PageHeader } from "@/components";
import { PayrollsTable } from "@/components/PayslipGenerator";
import { Box } from "@mui/material";

const PayslipGenerator = () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <PageHeader
        headerText="Payslip Generator"
        caption="Create and send payslips through email for each employee."
      />
      <PayrollsTable />
    </Box>
  );
};

export default PayslipGenerator;
