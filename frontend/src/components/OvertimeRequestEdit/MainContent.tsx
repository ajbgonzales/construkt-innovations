import {
  updateOvertimeRequest,
  type OvertimeRequest,
} from "@/api/overtimeRequests";
import { getEmployees } from "@/api/employees";
import { getProjects } from "@/api/projects";
import {
  overtimeRequestSchema,
  type OvertimeRequestFormInput,
  type OvertimeRequestFormValues,
} from "@/components/NewOvertimeRequest/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Autocomplete,
  Box,
  Button,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { type FC } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type SubmitHandler,
} from "react-hook-form";
import { useNavigate } from "react-router";

interface MainContentProps {
  overtimeRequest: OvertimeRequest;
}

const MainContent: FC<MainContentProps> = ({ overtimeRequest }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<OvertimeRequestFormInput, unknown, OvertimeRequestFormValues>({
    resolver: zodResolver(overtimeRequestSchema),
    defaultValues: {
      date: dayjs(overtimeRequest.date),
      projectId: overtimeRequest.projectId,
      startTime: dayjs(overtimeRequest.startTime, "HH:mm:ss"),
      endTime: dayjs(overtimeRequest.endTime, "HH:mm:ss"),
      employees: overtimeRequest.employees,
      activities: overtimeRequest.activities,
    },
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

  const selectedProject = projects.find(
    (projectOption) => projectOption.id === projectId,
  );
  const projectEmployees = employees
    .filter((employee) => employee.project === selectedProject?.name)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  const { mutate, isPending } = useMutation({
    mutationFn: (data: OvertimeRequestFormValues) =>
      updateOvertimeRequest(overtimeRequest.id, {
        date: data.date.format("YYYY-MM-DD"),
        projectId: data.projectId,
        startTime: data.startTime.format("HH:mm:ss"),
        endTime: data.endTime.format("HH:mm:ss"),
        activities: data.activities,
        employeeIds: data.employees.map((employee) => employee.id),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["overtimeRequest", overtimeRequest.id],
      });
      await queryClient.invalidateQueries({ queryKey: ["overtimeRequests"] });
      navigate(`/overtime-requests/${overtimeRequest.id}`);
    },
    onError: () => {
      setError("root", {
        message: "Failed to save changes. Please try again.",
      });
    },
  });

  const onSubmit: SubmitHandler<OvertimeRequestFormValues> = (data) => {
    mutate(data);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <HeaderRow>
        <Typography sx={{ fontSize: "1.5rem" }}>
          Edit Overtime Request
        </Typography>
        <Button
          type="submit"
          disabled={isSubmitting || isPending}
          variant="contained"
          sx={{ background: "#E67E22" }}
        >
          Save Changes
        </Button>
      </HeaderRow>
      <Container>
        <SectionContainer>
          <SectionHeaderText>Request Details</SectionHeaderText>
          <StyledGridContainer container spacing={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid
                size={6}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <Label>Date of Overtime</Label>
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
              </Grid>
              <Grid
                size={6}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <Label>Project</Label>
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
                          <MenuItem
                            key={projectOption.id}
                            value={projectOption.id}
                          >
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
              </Grid>
              <Grid
                size={12}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <Label>Duration of Overtime</Label>
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
              </Grid>
              <Grid
                size={12}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <Label>Employees</Label>
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
                        onChange={(_event, newValue) =>
                          field.onChange(newValue)
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="outlined"
                            placeholder={projectId ? "Select employees" : ""}
                            error={!!fieldState.error}
                          />
                        )}
                      />
                      {projectId && fieldState.error && (
                        <FormHelperText error>
                          {fieldState.error.message}
                        </FormHelperText>
                      )}
                    </>
                  )}
                />
              </Grid>
              <Grid
                size={12}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <Label>Activities</Label>
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
              </Grid>
            </LocalizationProvider>
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
  textAlign: "start",
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
