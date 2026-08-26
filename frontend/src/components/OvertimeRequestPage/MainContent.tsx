import { type OvertimeRequest } from "@/api/overtimeRequests";
import { Box, Grid, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import dayjs from "dayjs";
import { type FC } from "react";

interface MainContentProps {
  overtimeRequest: OvertimeRequest;
}

const MainContent: FC<MainContentProps> = ({ overtimeRequest }) => {
  const employeeNames = () => {
    const names: string[] = [];
    overtimeRequest.employees.forEach((e) => names.push(e.fullName));
    return names.join(", ");
  };

  console.log(`typeof overtimeRequest.date ${typeof overtimeRequest.date}`);
  console.log(
    `typeof overtimeRequest.startTime ${typeof overtimeRequest.startTime}`,
  );

  return (
    <>
      {overtimeRequest && (
        <Container>
          <SectionContainer>
            <SectionHeaderText>Request Details</SectionHeaderText>
            <StyledGridContainer container rowSpacing={2}>
              <StyledGridItem size={6}>
                <Label>Date of Overtime</Label>
                <Value>
                  {dayjs(overtimeRequest.date).format("MMM D, YYYY")}
                </Value>
              </StyledGridItem>
              <StyledGridItem size={6}>
                <Label>Project</Label>
                <Value>{overtimeRequest.projectName}</Value>
              </StyledGridItem>
              <StyledGridItem size={6}>
                <Label>Duration of Overtime</Label>
                <Value>
                  {dayjs(overtimeRequest.startTime, "HH:mm:ss").format(
                    "h:mm A",
                  )}{" "}
                  -{" "}
                  {dayjs(overtimeRequest.endTime, "HH:mm:ss").format("h:mm A")}
                </Value>
              </StyledGridItem>
              <StyledGridItem size={6}>
                <Label>Employees</Label>
                <Value>{employeeNames()}</Value>
              </StyledGridItem>
              <StyledGridItem size={12}>
                <Label>Activities</Label>
                <Value sx={{ textAlign: "start" }}>
                  {overtimeRequest.activities}
                </Value>
              </StyledGridItem>
            </StyledGridContainer>
          </SectionContainer>
        </Container>
      )}
    </>
  );
};

export default MainContent;

const Container = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
});

const Label = styled(Typography)({
  textTransform: "uppercase",
  fontWeight: 800,
  color: "#897365",
  fontSize: "0.625rem",
});

const SectionContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  border: "1px solid #DCC1B1",
  background: "#FFF",
});

const SectionHeaderText = styled(Typography)({
  color: "#564337",
  fontWeight: 800,
  textTransform: "uppercase",
  background: "#F3F4F5",
  borderBottom: "1px solid #DCC1B1",
  padding: "12px 24px",
  textAlign: "left",
});

const StyledGridContainer = styled(Grid)({
  display: "flex",
  padding: "1.5rem",
});

const StyledGridItem = styled(Grid)({
  justifyItems: "start",
});

const Value = styled(Typography)({
  fontSize: "1rem",
  color: "#191C1D",
  textAlign: "left",
});
