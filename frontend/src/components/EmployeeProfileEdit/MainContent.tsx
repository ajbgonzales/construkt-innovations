import api from "@/api/base";
import { type Employee } from "@/api/employees";
import {
  PERSONAL_INFO_ITEMS,
  PROJECT_INFO_ITEMS,
  RATE_AND_BENEFITS_ITEMS,
} from "@/components/AddNewEmployee/constants";
import {
  addNewEmployeeSchema,
  type AddNewEmployeeFormInput,
  type AddNewEmployeeFormValues,
} from "@/components/AddNewEmployee/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  FormHelperText,
  Grid,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { type FC } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";

interface MainContentProps {
  employee: Employee;
}

const MainContent: FC<MainContentProps> = ({ employee }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<AddNewEmployeeFormInput, unknown, AddNewEmployeeFormValues>({
    resolver: zodResolver(addNewEmployeeSchema),
    defaultValues: {
      fullName: employee.fullName,
      emailAddress: employee.emailAddress || "",
      contactNumber: employee.contactNumber || "",
      employeeId: employee.employeeId,
      project: employee.project,
      position: employee.position,
      rate: employee.rate.toString(),
      allowance: employee.allowance.toString(),
      sss: employee.sss.toString(),
      hdmf: employee.hdmf.toString(),
      phic: employee.phic.toString(),
    },
  });

  const onSubmit: SubmitHandler<AddNewEmployeeFormValues> = async (data) => {
    try {
      await api.put(`/employees/${employee.id}`, data);
      await queryClient.invalidateQueries({
        queryKey: ["employee", employee.id],
      });
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      navigate(`/employees/${employee.id}`);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setError("employeeId", {
          message:
            error.response.data?.detail ??
            "An employee with this Employee ID already exists",
        });
        return;
      }
      setError("root", {
        message: "Failed to save changes. Please try again.",
      });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <HeaderRow>
        <Typography sx={{ fontSize: "1.5rem" }}>
          Edit Employee Profile
        </Typography>
        <Button
          type="submit"
          disabled={isSubmitting}
          variant="contained"
          sx={{ background: "#E67E22" }}
        >
          Save Changes
        </Button>
      </HeaderRow>
      <Container>
        <SectionContainer>
          <SectionHeaderText>Personal Information</SectionHeaderText>
          <StyledGridContainer container spacing={2}>
            {PERSONAL_INFO_ITEMS.map((item) => (
              <Grid
                key={item.id}
                size={6}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <Label>
                  {item.label} {item.isRequired && "(required)"}
                </Label>
                <Controller
                  name={item.name as keyof AddNewEmployeeFormInput}
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <OutlinedInput
                        {...field}
                        id={item.id}
                        type={item.type}
                        error={!!fieldState.error}
                      />
                      {fieldState.error && (
                        <FormHelperText error>
                          {fieldState.error.message}
                        </FormHelperText>
                      )}
                    </>
                  )}
                />
              </Grid>
            ))}
          </StyledGridContainer>
        </SectionContainer>
        <SectionContainer>
          <SectionHeaderText>Project Information</SectionHeaderText>
          <StyledGridContainer container spacing={2}>
            {PROJECT_INFO_ITEMS.map((item) => (
              <Grid
                key={item.id}
                size={6}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <Label>
                  {item.label} {item.isRequired && "(required)"}
                </Label>
                <Controller
                  name={item.name as keyof AddNewEmployeeFormInput}
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <OutlinedInput
                        {...field}
                        id={item.id}
                        type={item.type}
                        error={!!fieldState.error}
                      />
                      {fieldState.error && (
                        <FormHelperText error>
                          {fieldState.error.message}
                        </FormHelperText>
                      )}
                    </>
                  )}
                />
              </Grid>
            ))}
          </StyledGridContainer>
        </SectionContainer>
        <SectionContainer>
          <SectionHeaderText>Rates and Benefits</SectionHeaderText>
          <StyledGridContainer container spacing={2}>
            {RATE_AND_BENEFITS_ITEMS.map((item) => (
              <Grid
                key={item.id}
                size={4}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <Label>
                  {item.label} {item.isRequired && "(required)"}
                </Label>
                <Controller
                  name={item.name as keyof AddNewEmployeeFormInput}
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <OutlinedInput
                        {...field}
                        id={item.id}
                        type={item.type}
                        error={!!fieldState.error}
                      />
                      {fieldState.error && (
                        <FormHelperText error>
                          {fieldState.error.message}
                        </FormHelperText>
                      )}
                    </>
                  )}
                />
              </Grid>
            ))}
          </StyledGridContainer>
        </SectionContainer>
        {errors.root && (
          <FormHelperText error>{errors.root.message}</FormHelperText>
        )}
      </Container>
    </Box>
  );
};

export default MainContent;

const HeaderRow = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "2rem",
});

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
