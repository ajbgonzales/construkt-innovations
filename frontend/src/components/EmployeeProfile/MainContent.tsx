import { type Employee } from "@/api/employees";
import { Box, Grid, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { type FC } from "react";

interface MainContentProps {
  employee: Employee;
}

const MainContent: FC<MainContentProps> = ({ employee }) => {
  return (
    <>
      {employee && (
        <Container>
          <SectionContainer>
            <SectionHeaderText>Personal Information</SectionHeaderText>
            <StyledGridContainer container rowSpacing={2}>
              <StyledGridItem size={6}>
                <Label>Full name</Label>
                <Value>{employee.fullName}</Value>
              </StyledGridItem>
              <StyledGridItem size={6}>
                <Label>Email address</Label>
                <Value>
                  {employee.emailAddress ? employee.emailAddress : "-"}
                </Value>
              </StyledGridItem>
              <StyledGridItem size={6}>
                <Label>Contact number</Label>
                <Value>
                  {employee.contactNumber ? employee.contactNumber : "-"}
                </Value>
              </StyledGridItem>
            </StyledGridContainer>
          </SectionContainer>
          <SectionContainer>
            <SectionHeaderText>Project Information</SectionHeaderText>
            <StyledGridContainer container rowSpacing={2}>
              <StyledGridItem size={6}>
                <Label>Employee ID</Label>
                <Value>{employee.employeeId}</Value>
              </StyledGridItem>
              <StyledGridItem size={6}>
                <Label>Project</Label>
                <Value>{employee.project}</Value>
              </StyledGridItem>
              <StyledGridItem size={6}>
                <Label>Position</Label>
                <Value>{employee.position}</Value>
              </StyledGridItem>
            </StyledGridContainer>
          </SectionContainer>
          <SectionContainer>
            <SectionHeaderText>Rates and Benefits</SectionHeaderText>
            <StyledGridContainer container rowSpacing={2}>
              <StyledGridItem size={4}>
                <Label>Rate</Label>
                <Value>&#8369; {employee.rate}</Value>
              </StyledGridItem>
              <StyledGridItem size={4}>
                <Label>Allowance</Label>
                <Value>&#8369; {employee.allowance}</Value>
              </StyledGridItem>
              <StyledGridItem size={4}>
                <Label>SSS</Label>
                <Value>&#8369; {employee.sss}</Value>
              </StyledGridItem>
              <StyledGridItem size={4}>
                <Label>HDMF</Label>
                <Value>&#8369; {employee.hdmf}</Value>
              </StyledGridItem>
              <StyledGridItem size={4}>
                <Label>PHIC</Label>
                <Value>&#8369; {employee.phic}</Value>
              </StyledGridItem>
              <StyledGridItem size={4}>
                <Label>Others</Label>
                <Value>&#8369; {employee.others}</Value>
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
});
