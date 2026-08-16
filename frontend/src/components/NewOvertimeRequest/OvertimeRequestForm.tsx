import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Divider,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Controller,
  useForm,
  useWatch,
  type SubmitHandler,
} from "react-hook-form";
import { useNavigate } from "react-router";
import { getEmployees } from "@/api/employees";
import {
  createOvertimeRequest,
  getOvertimeRequests,
} from "@/api/overtimeRequests";
import { getProjects } from "@/api/projects";
import {
  overtimeRequestSchema,
  type OvertimeRequestFormInput,
  type OvertimeRequestFormValues,
} from "./schema";

const defaultValues: OvertimeRequestFormInput = {
  date: null,
  projectId: "",
  startTime: null,
  endTime: null,
  employees: [],
  activities: "",
};

const OvertimeRequestForm = () => {
  const navigate = useNavigate();

  const { control, handleSubmit, setValue, setError, reset } = useForm<
    OvertimeRequestFormInput,
    unknown,
    OvertimeRequestFormValues
  >({
    resolver: zodResolver(overtimeRequestSchema),
    defaultValues,
  });

  const projectId = useWatch({ control, name: "projectId" });
  const startTime = useWatch({ control, name: "startTime" });
  const endTime = useWatch({ control, name: "endTime" });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });
  const { data: overtimeRequests = [] } = useQuery({
    queryKey: ["overtimeRequests"],
    queryFn: getOvertimeRequests,
  });

  const selectedProject = projects.find(
    (projectOption) => projectOption.id === projectId,
  );
  const projectEmployees = employees
    .filter((employee) => employee.project === selectedProject?.name)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  const {
    mutate,
    isPending,
    isSuccess,
    isError,
    reset: resetMutation,
  } = useMutation({
    mutationFn: createOvertimeRequest,
    onSuccess: () => reset(defaultValues),
  });

  const onSubmit: SubmitHandler<OvertimeRequestFormValues> = (data) => {
    const dateStr = data.date.format("YYYY-MM-DD");
    const hasExistingRequest = overtimeRequests.some(
      (request) =>
        request.date === dateStr && request.projectId === data.projectId,
    );

    if (hasExistingRequest) {
      setError("date", {
        message:
          "An overtime request already exists for this date and project.",
      });
      return;
    }

    mutate({
      date: data.date.format("YYYY-MM-DD"),
      projectId: data.projectId,
      startTime: data.startTime.format("HH:mm:ss"),
      endTime: data.endTime.format("HH:mm:ss"),
      activities: data.activities,
      employeeIds: data.employees.map((employee) => employee.id),
    });
  };

  return (
    <Container component="form" onSubmit={handleSubmit(onSubmit)}>
      <SectionLabel textAlign="left" sx={{ marginBottom: "2rem" }}>
        Request Details
      </SectionLabel>
      <Grid container spacing={2}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <StyledGridItem size={6}>
            <StyledLabel>Date of Overtime</StyledLabel>
            <Controller
              name="date"
              control={control}
              render={({ field, fieldState }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  slotProps={{
                    textField: {
                      error: !!fieldState.error,
                      helperText: fieldState.error?.message ?? "",
                    },
                  }}
                />
              )}
            />
          </StyledGridItem>
          <StyledGridItem size={6}>
            <StyledLabel>Project</StyledLabel>
            <Controller
              name="projectId"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Select
                    value={field.value}
                    onChange={(event) => {
                      field.onChange(event.target.value);
                      setValue("employees", []);
                    }}
                    displayEmpty
                    error={!!fieldState.error}
                    sx={{ textAlign: "left" }}
                  >
                    <MenuItem value="" disabled>
                      Select a project
                    </MenuItem>
                    {projects.map((projectOption) => (
                      <MenuItem key={projectOption.id} value={projectOption.id}>
                        {projectOption.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldState.error && (
                    <FormHelperText error>
                      {fieldState.error.message}
                    </FormHelperText>
                  )}
                </>
              )}
            />
          </StyledGridItem>
          <StyledGridItem size={12}>
            <StyledLabel>Duration of Overtime</StyledLabel>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Controller
                name="startTime"
                control={control}
                render={({ field, fieldState }) => (
                  <TimePicker
                    label="Start Time"
                    value={field.value}
                    onChange={field.onChange}
                    maxTime={endTime ?? undefined}
                    sx={{ flexGrow: 1 }}
                    slotProps={{
                      textField: {
                        error: !!fieldState.error,
                        helperText: fieldState.error?.message ?? "",
                      },
                    }}
                  />
                )}
              />
              <Controller
                name="endTime"
                control={control}
                render={({ field, fieldState }) => (
                  <TimePicker
                    label="End Time"
                    value={field.value}
                    onChange={field.onChange}
                    minTime={startTime ?? undefined}
                    sx={{ flexGrow: 1 }}
                    slotProps={{
                      textField: {
                        error: !!fieldState.error,
                        helperText: fieldState.error?.message ?? "",
                      },
                    }}
                  />
                )}
              />
            </Box>
          </StyledGridItem>
          <StyledGridItem size={12}>
            <StyledLabel>Employees</StyledLabel>
            <Controller
              name="employees"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Autocomplete
                    disableCloseOnSelect
                    multiple
                    disabled={!projectId}
                    options={projectEmployees}
                    getOptionLabel={(employee) => employee.fullName}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    value={field.value}
                    onChange={(_event, newValue) => field.onChange(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        placeholder={projectId ? "Select employees" : ""}
                        error={!!fieldState.error}
                      />
                    )}
                  />
                  {!projectId && (
                    <FormHelperText>
                      Select a project to add employees
                    </FormHelperText>
                  )}
                  {projectId && fieldState.error && (
                    <FormHelperText error>
                      {fieldState.error.message}
                    </FormHelperText>
                  )}
                </>
              )}
            />
          </StyledGridItem>
          <StyledGridItem size={12}>
            <StyledLabel>Activities</StyledLabel>
            <Controller
              name="activities"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  variant="outlined"
                  multiline
                  rows={5}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message ?? ""}
                />
              )}
            />
          </StyledGridItem>
        </LocalizationProvider>
      </Grid>
      <ActionsContainer>
        <Button
          variant="outlined"
          disabled={isPending}
          onClick={() => navigate("/overtime-requests")}
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
          disabled={isPending}
          sx={{
            background: "#E67E22",
            border: "1px solid #E67E22",
            color: "#FFF",
          }}
        >
          Submit Request
        </Button>
      </ActionsContainer>
      <Snackbar
        open={isSuccess}
        autoHideDuration={6000}
        onClose={resetMutation}
      >
        <Alert severity="success" onClose={resetMutation}>
          Overtime request submitted.
        </Alert>
      </Snackbar>
      <Snackbar open={isError} autoHideDuration={6000} onClose={resetMutation}>
        <Alert severity="error" onClose={resetMutation}>
          Failed to submit overtime request. Please try again.
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default OvertimeRequestForm;

const Container = styled(Box)({
  border: "1px solid #DCC1B1",
  padding: "2rem",
  background: "#FFF",
}) as typeof Box;

const SectionLabel = styled(Divider)({
  textTransform: "uppercase",
  fontSize: "0.75rem",
  fontWeight: 800,
});

const StyledGridItem = styled(Grid)({
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
});

const StyledLabel = styled(Typography)({
  textTransform: "uppercase",
  fontWeight: 800,
  color: "#897365",
  fontSize: "0.625rem",
  textAlign: "start",
});

const ActionsContainer = styled(Box)({
  display: "flex",
  justifyContent: "end",
  marginTop: "2rem",
  gap: "1rem",
});
