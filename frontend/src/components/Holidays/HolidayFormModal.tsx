import {
  Box,
  Button,
  FormHelperText,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useEffect, type FC } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import {
  createHoliday,
  updateHoliday,
  HOLIDAY_TYPE_LABELS,
  type Holiday,
} from "@/api/holidays";
import {
  holidaySchema,
  type HolidayFormInput,
  type HolidayFormValues,
} from "./schema";

interface HolidayFormModalProps {
  isOpen: boolean;
  holiday: Holiday | null;
  onClose: () => void;
}

const defaultValues: HolidayFormInput = {
  date: null,
  name: "",
  type: "" as unknown as HolidayFormInput["type"],
};

const HolidayFormModal: FC<HolidayFormModalProps> = ({
  isOpen,
  holiday,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const isEditing = holiday !== null;

  const { control, handleSubmit, reset } = useForm<
    HolidayFormInput,
    unknown,
    HolidayFormValues
  >({
    resolver: zodResolver(holidaySchema),
    defaultValues,
  });

  useEffect(() => {
    if (!isOpen) return;
    reset(
      holiday
        ? { date: dayjs(holiday.date), name: holiday.name, type: holiday.type }
        : defaultValues,
    );
  }, [isOpen, holiday, reset]);

  const {
    mutate,
    isPending,
    error,
    reset: resetMutation,
  } = useMutation({
    mutationFn: (data: HolidayFormValues) => {
      const payload = {
        date: data.date.format("YYYY-MM-DD"),
        name: data.name,
        type: data.type,
      };
      return isEditing
        ? updateHoliday(holiday.id, payload)
        : createHoliday(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      onClose();
    },
  });

  const onSubmit: SubmitHandler<HolidayFormValues> = (data) => {
    mutate(data);
  };

  const handleClose = () => {
    resetMutation();
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <ModalContent component="form" onSubmit={handleSubmit(onSubmit)}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.125rem" }}>
          {isEditing ? "Edit Holiday" : "Add New Holiday"}
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <FieldContainer>
            <StyledLabel>Date</StyledLabel>
            <Controller
              name="date"
              control={control}
              render={({ field, fieldState }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  sx={{ width: "100%" }}
                  slotProps={{
                    textField: {
                      error: !!fieldState.error,
                      helperText: fieldState.error?.message ?? "",
                    },
                  }}
                />
              )}
            />
          </FieldContainer>
        </LocalizationProvider>
        <FieldContainer>
          <StyledLabel>Name</StyledLabel>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                variant="outlined"
                error={!!fieldState.error}
                helperText={fieldState.error?.message ?? ""}
              />
            )}
          />
        </FieldContainer>
        <FieldContainer>
          <StyledLabel>Type</StyledLabel>
          <Controller
            name="type"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  displayEmpty
                  error={!!fieldState.error}
                  sx={{ textAlign: "left" }}
                >
                  <MenuItem value="" disabled>
                    Select a type
                  </MenuItem>
                  {Object.entries(HOLIDAY_TYPE_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
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
        </FieldContainer>
        {error && (
          <FormHelperText error>
            A holiday already exists for this date.
          </FormHelperText>
        )}
        <Box sx={{ display: "flex", justifyContent: "end", gap: "0.5rem" }}>
          <Button
            variant="outlined"
            disabled={isPending}
            sx={{ border: "1px solid #E67E22", color: "#E67E22" }}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isPending}
            sx={{ background: "#E67E22", color: "#FFF" }}
          >
            {isEditing ? "Save Changes" : "Add Holiday"}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default HolidayFormModal;

const ModalContent = styled(Box)({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  boxShadow: "1.5rem",
  background: "#FFF",
  padding: "1.5rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
  width: "400px",
}) as typeof Box;

const FieldContainer = styled(Box)({
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
