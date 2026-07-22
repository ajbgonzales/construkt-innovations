import {
  Box,
  Button,
  Divider,
  FormHelperText,
  Grid,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import api from "@/api/base";
import {
  PERSONAL_INFO_ITEMS,
  PROJECT_INFO_ITEMS,
  RATE_AND_BENEFITS_ITEMS,
} from "./constants";
import {
  addNewEmployeeSchema,
  type AddNewEmployeeFormInput,
  type AddNewEmployeeFormValues,
} from "./schema";

const Form = () => {
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
      fullName: "",
      emailAddress: "",
      contactNumber: "",
      employeeId: "",
      project: "",
      position: "",
      rate: "0",
      allowance: "0",
      sss: "0",
      hdmf: "0",
      phic: "0",
    },
  });

  const onSubmit: SubmitHandler<AddNewEmployeeFormValues> = async (data) => {
    try {
      await api.post("/employees", data);
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      navigate("/employees");
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setError("employeeId", {
          message:
            error.response.data?.detail ??
            "An employee with this Employee ID already exists",
        });
        return;
      }
      setError("root", { message: "Failed to add employee. Please try again." });
    }
  };

  return (
    <Container component="form" onSubmit={handleSubmit(onSubmit)}>
      <SectionLabel textAlign="left">Personal Information</SectionLabel>
      <Grid
        container
        direction="row"
        columnSpacing={4}
        spacing={2}
        sx={{ justifyContent: "flex-start" }}
      >
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
            <InputLabel>
              {item.label} {item.isRequired && "(required)"}
            </InputLabel>
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
      </Grid>
      <SectionLabel textAlign="left">Project Information</SectionLabel>
      <Grid
        container
        direction="row"
        columnSpacing={4}
        spacing={2}
        sx={{ justifyContent: "flex-start" }}
      >
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
            <InputLabel>
              {item.label} {item.isRequired && "(required)"}
            </InputLabel>
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
      </Grid>
      <SectionLabel textAlign="left">Rate and Benefits</SectionLabel>
      <Grid
        container
        direction="row"
        columnSpacing={4}
        spacing={2}
        sx={{ justifyContent: "flex-start" }}
      >
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
            <InputLabel>
              {item.label} {item.isRequired && "(required)"}
            </InputLabel>
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
      </Grid>
      {errors.root && (
        <FormHelperText error>{errors.root.message}</FormHelperText>
      )}
      <ActionsContainer>
        <Button
          variant="outlined"
          disabled={isSubmitting}
          onClick={() => navigate("/employees")}
          sx={{
            background: "#FFF",
            border: "1px solid #E67E22",
            color: "#E67E22",
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          sx={{
            background: "#E67E22",
            border: "1px solid #E67E22",
            color: "#FFF",
          }}
        >
          Add Employee
        </Button>
      </ActionsContainer>
    </Container>
  );
};

export default Form;

const ActionsContainer = styled(Box)({
  display: "flex",
  gap: "1rem",
  justifyContent: "end",
});

const Container = styled(Box)({
  background: "#FFF",
  border: "1px solid #DCC1B1",
  padding: "2.5rem",
  display: "flex",
  flexDirection: "column",
  gap: "2rem",
}) as typeof Box;

const InputLabel = styled(Typography)({
  fontFamily: "Work Sans",
  width: "100%",
  textAlign: "start",
  fontWeight: 600,
  textTransform: "uppercase",
  fontSize: "0.75rem",
});

const SectionLabel = styled(Divider)({
  fontFamily: "Work Sans",
  textTransform: "uppercase",
  fontSize: "0.75rem",
  fontWeight: 800,
});
