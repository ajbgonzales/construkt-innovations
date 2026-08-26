import { getPayslips, type PayrollPeriodDetail } from "@/api/payrollGenerator";
import {
  countStalePayslips,
  getSendDisabledReason,
} from "@/utils/payslipStaleness";
import { Alert, Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useQuery } from "@tanstack/react-query";
import { type FC } from "react";
import PayrollRecordsTable from "./PayrollRecordsTable";
import PayslipsTable from "./PayslipsTable";

interface MainContentProps {
  payrollPeriod: PayrollPeriodDetail;
}

const MainContent: FC<MainContentProps> = ({ payrollPeriod }) => {
  const { data: payslips = [] } = useQuery({
    queryKey: ["payslips", payrollPeriod.id],
    queryFn: () => getPayslips(payrollPeriod.id),
  });

  const stalePayslipCount = countStalePayslips(
    payslips,
    payrollPeriod.payrollRecords,
  );
  const sendDisabledReason = getSendDisabledReason(
    payslips,
    payrollPeriod.payrollRecords,
  );

  return (
    <Container>
      {stalePayslipCount > 0 && (
        <Alert severity="warning">
          Payroll records for this period have been updated. Review the records
          and click Generate Payslips to refresh them with the latest numbers
          before sending.
        </Alert>
      )}
      <PayrollRecordsTable payrollRecords={payrollPeriod.payrollRecords} />
      <PayslipsTable
        payslips={payslips}
        sendDisabledReason={sendDisabledReason}
      />
    </Container>
  );
};

export default MainContent;

const Container = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
  textAlign: "left",
});
